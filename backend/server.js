const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const aiService = require('./aiService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize AI service
aiService.initializeAI();

// Connect to MongoDB
mongoose.connect('mongodb://mongo:27017/brainbytes', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});

// ============================================
// SCHEMAS
// ============================================

// Message Schema
const messageSchema = new mongoose.Schema({
  text: String,
  response: String,
  subject: { type: String, default: 'General' },
  questionType: { type: String, default: 'general' },
  sentiment: { type: String, default: 'neutral' },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// User Profile Schema
const userProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  preferredSubjects: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const UserProfile = mongoose.model('UserProfile', userProfileSchema);

// Learning Material Schema
const learningMaterialSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const LearningMaterial = mongoose.model('LearningMaterial', learningMaterialSchema);

// ============================================
// ROUTES
// ============================================

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the BrainBytes API' });
});

// ----- Messages -----
app.get('/api/messages', async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = subject && subject !== 'All' ? { subject } : {};
    const messages = await Message.find(filter).sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- AI Chat -----
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, subject } = req.body;

    // Use 15-second overall timeout
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

    // Override subject if user picked one
    const finalSubject = subject && subject !== 'All' ? subject : aiResult.subject;

    // Save to MongoDB
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
});

// ----- User Profiles CRUD -----
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, preferredSubjects } = req.body;
    const user = new UserProfile({ name, email, preferredSubjects });
    const saved = await user.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await UserProfile.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await UserProfile.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { name, email, preferredSubjects } = req.body;
    const updated = await UserProfile.findByIdAndUpdate(
      req.params.id,
      { name, email, preferredSubjects, updatedAt: Date.now() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const deleted = await UserProfile.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- Learning Materials -----
app.post('/api/materials', async (req, res) => {
  try {
    const { subject, topic, content } = req.body;
    const material = new LearningMaterial({ subject, topic, content });
    const saved = await material.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/materials', async (req, res) => {
  try {
    const { subject } = req.query;
    const filter = subject ? { subject } : {};
    const materials = await LearningMaterial.find(filter).sort({ createdAt: -1 });
    res.json(materials);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/materials/:id', async (req, res) => {
  try {
    const material = await LearningMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ error: 'Material not found' });
    res.json(material);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- Dashboard -----
app.get('/api/dashboard/recent', async (req, res) => {
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
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
