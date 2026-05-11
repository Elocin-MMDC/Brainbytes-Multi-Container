const express = require('express');
const router = express.Router();
const { getMessages, aiChat, getDashboard } = require('../controllers/messageController');

router.get('/messages', getMessages);
router.post('/ai/chat', aiChat);
router.get('/dashboard/recent', getDashboard);

module.exports = router;
