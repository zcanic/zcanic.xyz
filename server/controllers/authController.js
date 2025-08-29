const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger'); // <-- 引入 Winston logger
// 不再需要从这里导入 pool
// const { pool } = require('../db/database'); 

const JWT_SECRET = process.env.JWT_SECRET; // 从环境变量获取 JWT 密钥

// 用户注册
exports.register = async (req, res, next) => {
  const pool = req.app.locals.pool;
  const { username, password } = req.body;
  logger.info(`注册请求喵: 用户名=${username}`);

  // 基本验证 (移除 - 由路由层 validator 处理)
  /*
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空喵！' });
  }
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
      return res.status(400).json({ message: '用户名格式不正确喵 (3-20位字母、数字或下划线)！' });
  }
  if (password.length < 6) {
      return res.status(400).json({ message: '密码长度至少需要 6 位喵！' });
  }
  */

  try {
    logger.info('[authController] register: 准备检查用户名是否存在', { username: username });
    // console.log('[authController] register: 准备检查用户名是否存在 (从 app.locals 获取 pool)...');
    // 检查用户名是否已存在
    const checkUserQuery = 'SELECT id FROM users WHERE username = ?';
    const [existingUsers] = await pool.query(checkUserQuery, [username]);

    if (existingUsers.length > 0) {
      logger.warn(`用户名 '${username}' 已被注册喵！`); // 使用 warn 级别
      // console.log(`用户名 '${username}' 已被注册喵！`);
      return res.status(409).json({ message: '用户名已被占用喵，换一个试试？' });
    }

    // 哈希密码
    const saltRounds = 10; // 推荐 bcrypt 加盐轮数
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    logger.debug(`密码已哈希处理喵 (用户: ${username})`); // debug 级别，可能包含敏感信息
    // console.log(`密码已哈希处理喵 (用户: ${username})`);

    // 插入新用户
    const insertUserQuery = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
    const [result] = await pool.query(insertUserQuery, [username, hashedPassword]);

    logger.info(`用户 '${username}' (ID: ${result.insertId}) 注册成功喵！`, { userId: result.insertId, username: username });
    // console.log(`用户 '${username}' (ID: ${result.insertId}) 注册成功喵！`);
    // 注册成功，可以只返回成功消息，或者新用户的信息（不含密码哈希）
    res.status(201).json({ 
      message: '注册成功喵！现在可以去登录啦！', 
      userId: result.insertId, 
      username: username 
    });

  } catch (error) {
    logger.error('注册过程中出错喵:', { username: username, error: error }); // 包含上下文和错误对象
    // console.error('注册过程中出错喵:', error);
    next(error); // 交给全局错误处理器
  }
};

// 用户登录
exports.login = async (req, res, next) => {
  const pool = req.app.locals.pool;
  const { username, password } = req.body;
  logger.info(`登录请求喵: 用户名=${username}`);

  // 基本验证 (移除 - 由路由层 validator 处理)
  /*
  if (!username || !password) {
    return res.status(400).json({ message: '用户名和密码不能为空喵！' });
  }
  */

  if (!JWT_SECRET) {
      logger.error('严重错误：JWT_SECRET 未配置！无法生成令牌喵！');
      // console.error('严重错误：JWT_SECRET 未配置！无法生成令牌喵！');
      return res.status(500).json({ message: '服务器内部错误，无法登录喵 T_T' });
  }

  try {
    logger.info('[authController] login: 准备查找用户', { username: username });
    // console.log('[authController] login: 准备查找用户 (从 app.locals 获取 pool)...');
    // 查询用户，包含角色和正确的密码哈希列名
    const query = 'SELECT id, username, password_hash, role FROM users WHERE username = ?';
    const [users] = await pool.query(query, [username]);

    if (users.length === 0) {
      logger.warn(`尝试登录失败：用户 '${username}' 不存在喵。`); // 使用 warn
      // console.log(`尝试登录失败：用户 '${username}' 不存在喵。`);
      return res.status(401).json({ message: '用户名或密码错误喵！' }); // 不要提示具体哪个错了
    }

    const userFromDb = users[0];

    // 比较密码时，使用正确的密码哈希列名
    const isMatch = await bcrypt.compare(password, userFromDb.password_hash);

    if (!isMatch) {
      logger.warn(`尝试登录失败：用户 '${username}' 密码错误喵。`); // 使用 warn
      // console.log(`尝试登录失败：用户 '${username}' 密码错误喵。`);
      return res.status(401).json({ message: '用户名或密码错误喵！' });
    }

    // 密码匹配，生成 JWT
    const userPayload = {
      id: userFromDb.id,
      username: userFromDb.username,
      role: userFromDb.role
    };
    const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' }); // 1 小时过期

    logger.info(`用户 '${username}' (ID: ${userFromDb.id}, Role: ${userFromDb.role}) 登录成功喵！准备设置 Cookie...`);

    // 将 Token 设置到 HttpOnly Cookie 中
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 60 * 60 * 1000
    });

    logger.info(`token Cookie 已设置喵！`);

    // 返回成功消息和用户信息 (不包含 Token)
    res.json({ 
      message: '登录成功喵！欢迎回来！', 
      user: { 
          id: userFromDb.id,
          username: userFromDb.username,
          role: userFromDb.role 
      }
    });

  } catch (error) {
    logger.error('登录过程中出错喵:', { username: username, error: error });
    // console.error('登录过程中出错喵:', error);
    next(error); // 交给全局错误处理器
  }
};

// 用户登出
exports.logout = (req, res) => {
  // 清除名为 'token' 的 Cookie
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax',
    // path: '/' // 确保 path 与设置时一致
  });
  logger.info('Logout successful: token cookie cleared.');
  res.status(200).json({ message: '成功登出喵！' });
};

// 获取当前用户信息 (需要认证后调用)
exports.getMe = (req, res) => {
  // 从 req.user (由 verifyToken 中间件填充) 获取用户信息
  const user = req.user;

  if (!user) {
    //理论上 verifyToken 应该已经处理了未认证的情况，但加个保险
    console.warn('[authController] getMe: req.user not found after verifyToken?');
    return res.status(401).json({ message: '无法获取用户信息，请重新登录喵！' });
  }

  // 返回用户信息 (不包括 JWT payload 中的 iat/exp 等)
  res.json({
    user: {
      id: user.id, // <--- 改成从 user.id 读取
      username: user.username,
      role: user.role
    }
  });
}; 