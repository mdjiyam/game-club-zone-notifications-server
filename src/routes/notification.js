const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { sendNotification } = require('../services/fcmService');

/**
 * POST /api/send-notification
 * Body:
 * {
 *   "title": "Test Notification",
 *   "message": "Hello User",
 *   "targetType": "all" | "user",
 *   "targetUserId": ""   // required only when targetType = "user"
 * }
 */
router.post('/send-notification', authenticate, async (req, res) => {
  try {
    const { title, message, targetType, targetUserId, data } = req.body;

    // Basic validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'title is required and must be a non-empty string',
      });
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'message is required and must be a non-empty string',
      });
    }

    if (!targetType || !['all', 'user'].includes(targetType)) {
      return res.status(400).json({
        success: false,
        message: 'targetType must be either "all" or "user"',
      });
    }

    if (targetType === 'user' && (!targetUserId || typeof targetUserId !== 'string')) {
      return res.status(400).json({
        success: false,
        message: 'targetUserId is required when targetType is "user"',
      });
    }

    const result = await sendNotification({
      title: title.trim(),
      message: message.trim(),
      targetType,
      targetUserId: targetUserId ? targetUserId.trim() : '',
      data: data || {},
    });

    // Even if some tokens failed, we still return success if at least the process completed
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (err) {
    console.error('Send notification error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/health
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Notification server is running',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
