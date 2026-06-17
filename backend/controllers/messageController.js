const Message = require('../models/Message');
const aiService = require('../services/aiService');

// Data Validation
function validateMessage(message) {
  if (!message.text || typeof message.text !== 'string') {
    throw new Error('Message text is required and must be a string');
  }
  if (message.text.trim().length === 0) {
    throw new Error('Message text cannot be empty');
  }
  return true;
}

// GET /api/messages (with pagination + per-user filtering)
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

    res.json({
      messages,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('Error retrieving messages:', err);
    res.status(500).json({ error: 'An error occurred retrieving messages' });
  }
};

// POST /api/ai/chat
const aiChat = async (req, res) => {
  try {
    const { message, subject, userId, userName } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    try {
      validateMessage({ text: message });
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 15000)
    );
    const aiResultPromise = aiService.generateResponse(message);

    const aiResult = await Promise.race([aiResultPromise, timeoutPromise])
      .catch(error => {
        console.error('AI response timed out or failed:', error.message);
        return {
          aiResponse: "I'm sorry, I couldn't process your request in time. Please try again.",
          subject: 'General',
          questionType: 'general',
          sentiment: 'neutral',
        };
      });

    const finalSubject = subject && subject !== 'All' ? subject : aiResult.subject;

    const saved = new Message({
      text: message,
      response: aiResult.aiResponse,   // ← fixed
      subject: finalSubject,
      questionType: aiResult.questionType,
      sentiment: aiResult.sentiment,
      userId: userId || 'guest',
      userName: userName || 'Guest'
    });
    await saved.save();

    res.json({
      userMessage: message,
      aiResponse: aiResult.aiResponse,  // ← fixed
      subject: finalSubject,
      questionType: aiResult.questionType,
      sentiment: aiResult.sentiment
    });
  } catch (err) {
    console.error('Error in chat endpoint:', err);
    res.status(500).json({ error: 'An error occurred processing your request' });
  }
};

// GET /api/dashboard/recent
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

module.exports = { getMessages, aiChat, getDashboard };