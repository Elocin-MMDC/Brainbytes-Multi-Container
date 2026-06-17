const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  text: { type: String, required: true },
  response: { type: String },
  subject: { type: String, default: 'General' },
  questionType: { type: String, default: 'general' },
  sentiment: { type: String, default: 'neutral' },
  userId: { type: String, default: 'guest' },
  userName: { type: String, default: 'Guest' },
  sessionId: { type: String, default: null },      // ← NEW
  sessionTitle: { type: String, default: null },   // ← NEW
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);