const express = require('express');
const axios = require('axios');
const { check, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const router = express.Router();
const { isAuthenticated } = require('../middleware/authMiddleware');

// 获取语音服务URL和API密钥
const VOICE_SERVICE_URL = process.env.VOICE_SERVICE_URL || 'http://localhost:8000';
const VOICE_API_KEY = process.env.VOICE_API_KEY || '';

// 代理中间件 - 添加API密钥
const addVoiceApiKey = (req, res, next) => {
  req.headers['x-api-key'] = VOICE_API_KEY;
  next();
};

/**
 * 代理转发到语音服务的TTS API
 * POST /api/voice/tts
 */
router.post('/tts', 
  isAuthenticated, 
  addVoiceApiKey,
  [
    check('text').notEmpty().withMessage('文本不能为空'),
    check('speaker_id').optional().isInt().withMessage('说话人ID必须是整数'),
    check('message_id').optional().isString().withMessage('消息ID必须是字符串'),
    check('bypass_cache').optional().isBoolean().withMessage('bypass_cache必须是布尔值')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const response = await axios.post(`${VOICE_SERVICE_URL}/api/v1/tts`, req.body, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': VOICE_API_KEY
        }
      });

      // 修改音频URL，使其指向我们的代理
      if (response.data.success && response.data.audio_url) {
        const originalUrl = response.data.audio_url;
        const filename = originalUrl.substring(originalUrl.lastIndexOf('/') + 1);
        response.data.audio_url = `/api/v1/voice/audio/${filename}`;
      }

      return res.json(response.data);
    } catch (error) {
      logger.error('TTS API调用失败:', error);
      return res.status(error.response?.status || 500).json({
        success: false,
        message: error.response?.data?.message || '语音服务请求失败'
      });
    }
  }
);

/**
 * 代理转发到语音服务的翻译API
 * POST /api/voice/translate
 */
router.post('/translate', 
  isAuthenticated, 
  addVoiceApiKey,
  [
    check('text').notEmpty().withMessage('文本不能为空'),
    check('message_id').optional().isString().withMessage('消息ID必须是字符串'),
    check('bypass_cache').optional().isBoolean().withMessage('bypass_cache必须是布尔值')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    try {
      const response = await axios.post(`${VOICE_SERVICE_URL}/api/v1/translate`, req.body, {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': VOICE_API_KEY
        }
      });

      return res.json(response.data);
    } catch (error) {
      logger.error('翻译API调用失败:', error);
      return res.status(error.response?.status || 500).json({
        success: false,
        message: error.response?.data?.message || '语音服务翻译请求失败'
      });
    }
  }
);

/**
 * 获取可用的语音说话人列表
 * GET /api/voice/speakers
 */
router.get('/speakers', 
  addVoiceApiKey,
  async (req, res) => {
    try {
      const response = await axios.get(`${VOICE_SERVICE_URL}/api/v1/speakers`, {
        headers: {
          'x-api-key': VOICE_API_KEY
        }
      });

      return res.json(response.data);
    } catch (error) {
      logger.error('获取说话人列表失败:', error);
      return res.status(error.response?.status || 500).json({
        success: false,
        message: error.response?.data?.message || '获取说话人列表失败'
      });
    }
  }
);

/**
 * 代理音频文件请求
 * GET /api/voice/audio/:filename
 */
router.get('/audio/:filename', 
  addVoiceApiKey,
  async (req, res) => {
    try {
      const filename = req.params.filename;
      // 使用流式传输，避免加载整个文件到内存
      const response = await axios.get(`${VOICE_SERVICE_URL}/api/v1/audio/${filename}`, {
        headers: {
          'x-api-key': VOICE_API_KEY
        },
        responseType: 'stream'
      });

      // 设置缓存和内容类型头
      res.set('Content-Type', 'audio/wav');
      res.set('Cache-Control', 'public, max-age=604800'); // 一周缓存
      
      // 管道响应流到客户端
      response.data.pipe(res);
    } catch (error) {
      logger.error(`获取音频文件失败: ${req.params.filename}`, error);
      return res.status(error.response?.status || 500).json({
        success: false,
        message: '音频文件不存在或无法访问'
      });
    }
  }
);

/**
 * 健康检查端点
 * GET /api/voice/health
 */
router.get('/health', 
  addVoiceApiKey,
  async (req, res) => {
    try {
      const response = await axios.get(`${VOICE_SERVICE_URL}/api/v1/health`, {
        headers: {
          'x-api-key': VOICE_API_KEY
        }
      });

      return res.json({
        ...response.data,
        proxy: {
          status: 'healthy',
          voice_service_url: VOICE_SERVICE_URL
        }
      });
    } catch (error) {
      logger.error('语音服务健康检查失败:', error);
      return res.status(500).json({
        success: false,
        message: '语音服务无法访问',
        proxy: {
          status: 'healthy',
          voice_service_url: VOICE_SERVICE_URL
        },
        voice_service: {
          status: 'unhealthy',
          error: error.message
        }
      });
    }
  }
);

module.exports = router; 