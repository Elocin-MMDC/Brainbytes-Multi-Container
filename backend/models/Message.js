const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  text: String,
  response: String,
  subject: { type: String, default: 'General' },
  questionType: { type: String, default: 'general' },
  sentiment: { type: String, default: 'neutral' },
  userId: {type: String, default: 'guest'},
  userName: {type: String, default: 'Guest'},
  createdAt: { type: Date, default: Date.now }
});

// Indexing: Optimize Query Performance
messageSchema.index({ subject: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });
messageSchema.index({ questionType: 1 });
messageSchema.index({ sentiment: 1 });
messageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);