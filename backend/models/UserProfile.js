const mongoose = require('mongoose');

const userProfileSchema = new mongoose.Schema({
name: { type: String, required: true },
email: { type: String, required: true, unique: true },
preferredSubjects: { type: [String], default: [] },
createdAt: { type: Date, default: Date.now },
updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserProfile', userProfileSchema);