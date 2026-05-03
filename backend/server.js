const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://mongo:27017/brainbytes', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
});

const messageSchema = new mongoose.Schema({
  text: String,
  response: String,
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Simple AI logic - keyword-based responses
function generateAIResponse(message) {
  const lower = message.toLowerCase();

  // Math
  if (lower.includes('math') || lower.includes('algebra') || lower.includes('equation')) {
    return "Math is a fascinating subject! It's the language of patterns and logic. What specific topic would you like to explore - algebra, geometry, calculus, or statistics?";
  }
  if (lower.includes('what is') && (lower.includes('+') || lower.includes('-') || lower.includes('*') || lower.includes('/'))) {
    try {
      const expr = message.replace(/[^0-9+\-*/().]/g, '');
      const result = eval(expr);
      return `The answer is ${result}.`;
    } catch (e) {
      return "I couldn't solve that math problem. Could you rephrase it?";
    }
  }

  // Science
  if (lower.includes('science') || lower.includes('physics') || lower.includes('chemistry') || lower.includes('biology')) {
    return "Science helps us understand the natural world! Are you interested in physics, chemistry, biology, or earth science?";
  }
  if (lower.includes('photosynthesis')) {
    return "Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen. It happens in the chloroplasts of plant cells.";
  }
  if (lower.includes('gravity')) {
    return "Gravity is a fundamental force that attracts objects with mass toward each other. On Earth, it gives weight to physical objects and pulls them toward the planet's center at 9.8 m/s².";
  }

  // History
  if (lower.includes('history')) {
    return "History helps us understand how the past shapes the present. What era or topic interests you - ancient civilizations, world wars, or Philippine history?";
  }
  if (lower.includes('rizal') || lower.includes('jose rizal')) {
    return "Dr. Jose Rizal (1861-1896) was a Filipino nationalist, writer, and polymath. He's the national hero of the Philippines, known for his novels 'Noli Me Tangere' and 'El Filibusterismo'.";
  }

  // English
  if (lower.includes('english') || lower.includes('grammar') || lower.includes('writing')) {
    return "English is a great subject for developing communication skills! Would you like help with grammar, writing, reading comprehension, or literature?";
  }

  // Greetings
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! I'm BrainBytes, your AI tutor. I can help you learn about Math, Science, History, English, and more. What would you like to study today?";
  }

  // Help
  if (lower.includes('help') || lower.includes('how are you')) {
    return "I'm here to help you learn! You can ask me about Math, Science, History, English, or any school subject. Just type your question!";
  }

  // Thanks
  if (lower.includes('thank') || lower.includes('thanks')) {
    return "You're welcome! Feel free to ask me anything else you'd like to learn about.";
  }

  // Default
  return `That's an interesting question about "${message}". I'm a learning assistant focused on academic subjects. Could you tell me more about what subject this relates to - Math, Science, History, or English?`;
}

app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the BrainBytes API' });
});

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const message = new Message({ text: req.body.text });
    const savedMessage = await message.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const aiResponse = generateAIResponse(message);

    const saved = new Message({
      text: message,
      response: aiResponse
    });
    await saved.save();

    res.json({
      userMessage: message,
      aiResponse: aiResponse
    });
  } catch (err) {
    console.error('AI endpoint error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});