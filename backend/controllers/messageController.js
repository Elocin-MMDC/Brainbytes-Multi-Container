const Message = require('../models/Message');
const aiService = require('../services/aiService');
const { v4: uuidv4 } = require('uuid');

// ─────────────────────────────────────────────
// GET /api/sessions?userId=xxx
// Returns all sessions (grouped) for a user
// ─────────────────────────────────────────────
const getSessions = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    // Get distinct sessionIds for this user
    const sessions = await Message.aggregate([
      { $match: { userId, sessionId: { $ne: null } } },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$sessionId',
          title: { $first: '$sessionTitle' },
          firstMessage: { $first: '$text' },
          messageCount: { $sum: 1 },
          lastActivity: { $last: '$createdAt' },
        }
      },
      { $sort: { lastActivity: -1 } }
    ]);

    res.json({ sessions });
  } catch (err) {
    console.error('Error getting sessions:', err);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
};

// ─────────────────────────────────────────────
// GET /api/sessions/:sessionId/messages?userId=xxx
// Returns all messages for a specific session
// ─────────────────────────────────────────────
const getSessionMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.query;

    const messages = await Message.find({ sessionId, userId })
      .sort({ createdAt: 1 });

    res.json({ messages });
  } catch (err) {
    console.error('Error getting session messages:', err);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/sessions/:sessionId/title
// Rename a session
// ─────────────────────────────────────────────
const renameSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { title, userId } = req.body;

    await Message.updateMany(
      { sessionId, userId },
      { $set: { sessionTitle: title } }
    );

    res.json({ message: 'Session renamed successfully', title });
  } catch (err) {
    console.error('Error renaming session:', err);
    res.status(500).json({ error: 'Failed to rename session' });
  }
};

// ─────────────────────────────────────────────
// GET /api/messages (with pagination + per-user filtering)
// ─────────────────────────────────────────────
const getMessages = async (req, res) => {
  try {
    const { subject, userId } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (subject && subject !== 'All') filter.subject = subject;
    if (userId) filter.userId = userId;

    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments(filter);
    res.json({ messages, pagination: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('Error retrieving messages:', err);
    res.status(500).json({ error: 'An error occurred retrieving messages' });
  }
};

// ─────────────────────────────────────────────
// POST /api/ai/chat
// ─────────────────────────────────────────────
const aiChat = async (req, res) => {
  try {
    const { message, subject, userId, userName, sessionId } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });
    if (message.trim().length === 0) return res.status(400).json({ error: 'Message cannot be empty' });

    // Generate sessionId if not provided (new chat)
    const currentSessionId = sessionId || uuidv4();

    // Determine session title (first message of session)
    let sessionTitle = message.slice(0, 30);
    const existingMsg = await Message.findOne({ sessionId: currentSessionId });
    if (existingMsg) sessionTitle = existingMsg.sessionTitle || sessionTitle;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 15000)
    );
    const aiResult = await Promise.race([
      aiService.generateResponse(message),
      timeoutPromise
    ]).catch(() => ({
      aiResponse: "Sorry, I couldn't process your request in time. Please try again.",
      subject: 'General', questionType: 'general', sentiment: 'neutral',
    }));

    const finalSubject = subject && subject !== 'All' ? subject : aiResult.subject;

    const saved = new Message({
      text: message,
      response: aiResult.aiResponse,
      subject: finalSubject,
      questionType: aiResult.questionType,
      sentiment: aiResult.sentiment,
      userId: userId || 'guest',
      userName: userName || 'Guest',
      sessionId: currentSessionId,
      sessionTitle,
    });
    await saved.save();

    res.json({
      userMessage: message,
      aiResponse: aiResult.aiResponse,
      subject: finalSubject,
      questionType: aiResult.questionType,
      sentiment: aiResult.sentiment,
      sessionId: currentSessionId,
      sessionTitle,
    });
  } catch (err) {
    console.error('Error in chat endpoint:', err);
    res.status(500).json({ error: 'An error occurred processing your request' });
  }
};

// ─────────────────────────────────────────────
// GET /api/dashboard/recent
// ─────────────────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};

    const recentMessages = await Message.find(filter).sort({ createdAt: -1 }).limit(10);
    const totalMessages = await Message.countDocuments(filter);
    const subjectCounts = await Message.aggregate([
      { $match: filter },
      { $group: { _id: '$subject', count: { $sum: 1 } } }
    ]);

    res.json({ recentMessages, totalMessages, subjectCounts });
  } catch (err) {
    console.error('Error retrieving dashboard:', err);
    res.status(500).json({ error: 'An error occurred retrieving dashboard data' });
  }
};

module.exports = { getMessages, aiChat, getDashboard, getSessions, getSessionMessages, renameSession };