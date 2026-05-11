const Message = require('../models/Message');
const aiService = require('../services/aiService');

// GET /api/messages
const getMessages = async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = subject && subject !== 'All' ? { subject } : {};
    const messages = await Message.find(filter).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/ai/chat
const aiChat = async (req, res) => {
  try {
    const { message, subject } = req.body;

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 15000)
    );
    const aiResultPromise = aiService.generateResponse(message);

    const aiResult = await Promise.race([aiResultPromise, timeoutPromise])
      .catch(error => {
        console.error('AI response timed out or failed:', error.message);
        return {
          subject: 'General',
          questionType: 'general',
          sentiment: 'neutral',
          response: "I am sorry, but I could not process your request in time. Please try again with a simpler question."
        };
      });

    const finalSubject = subject && subject !== 'All' ? subject : aiResult.subject;

    const saved = new Message({
      text: message,
      response: aiResult.response,
      subject: finalSubject,
      questionType: aiResult.questionType,
      sentiment: aiResult.sentiment
    });
    await saved.save();

    res.json({
      userMessage: message,
      aiResponse: aiResult.response,
      subject: finalSubject,
      questionType: aiResult.questionType,
      sentiment: aiResult.sentiment
    });
  } catch (err) {
    console.error('AI endpoint error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/dashboard/recent
const getDashboard = async (req, res) => {
  try {
    const recentMessages = await Message.find().sort({ createdAt: -1 }).limit(10);
    const totalMessages = await Message.countDocuments();
    const subjectCounts = await Message.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } }
    ]);
    res.json({ recentMessages, totalMessages, subjectCounts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMessages, aiChat, getDashboard };
