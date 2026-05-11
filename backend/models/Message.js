const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: String,
  response: String,
  subject: { type: String, default: 'General' },
  questionType: { type: String, default: 'general' },
  sentiment: { type: String, default: 'neutral' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', messageSchema);
