const jwt = require('jsonwebtoken');
const logger = require('../utils/logger'); // <-- 引入 Winston logger

const verifyToken = (req, res, next) => {
    // 从 HttpOnly Cookie 中获取 token
    const token = req.cookies.token;
    // console.log('Cookies:', req.cookies); // Debug: 打印所有 cookie
    // console.log('Token from cookie:', token); // Debug: 打印获取到的 token

    if (!token) {
        logger.warn('Auth middleware: No token found in cookies.'); // 更新日志
        return res.status(401).json({ message: '需要认证喵，请先登录！(Cookie 中未找到 Token)' }); // 更新错误信息
    }

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            logger.error('JWT_SECRET 未设置！无法验证 Token 喵！');
            // 抛出错误由全局错误处理器处理
            throw new Error('服务器内部错误喵');
        }
        // 验证 token
        const decoded = jwt.verify(token, secret);

        // 将解码后的用户信息附加到 req 对象，供后续路由或控制器使用
        req.user = decoded;
        logger.debug('[authMiddleware] verifyToken successful, req.user:', { user: decoded }); // 修改为使用logger
        // logger.info(`Auth middleware: Token verified successfully for user ID: ${decoded.id}`); // 可选：成功日志
        next(); // token 有效，继续处理请求
    } catch (error) {
        logger.warn(`Auth middleware: Token verification failed. Error: ${error.name}`, { // 记录具体 JWT 错误类型
            message: error.message,
            tokenReceived: token ? 'Yes' : 'No' // 记录是否收到了 token
        });
        if (error.name === 'TokenExpiredError') {
            // 清除可能已过期的 cookie (可选, 但有助于避免客户端一直发送过期 cookie)
            res.clearCookie('token', {
                 httpOnly: true,
                 secure: process.env.NODE_ENV === 'production',
                 sameSite: 'Strict'
             });
            return res.status(401).json({ message: 'Token 已过期喵，请重新登录！' });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: '无效的 Token 喵！' });
        } else {
            // 对于其他未知错误，也返回 401 或交给全局处理器
            // return res.status(401).json({ message: '认证失败喵！' });
            next(new Error('认证过程中发生错误喵')); // 交给全局错误处理器
        }
    }
};

// Export using module.exports
module.exports = { 
    verifyToken,
    isAuthenticated: verifyToken  // Add alias for backward compatibility
}; 