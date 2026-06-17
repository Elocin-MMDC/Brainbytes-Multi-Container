const express = require('express');
const router = express.Router();
const {
  getMessages,
  aiChat,
  getDashboard,
  getSessions,
  getSessionMessages,
  renameSession,
} = require('../controllers/messageController');

// Chat
router.get('/messages', getMessages);
router.post('/ai/chat', aiChat);
router.get('/dashboard/recent', getDashboard);

// Sessions
router.get('/sessions', getSessions);
router.get('/sessions/:sessionId/messages', getSessionMessages);
router.put('/sessions/:sessionId/title', renameSession);

module.exports = router;