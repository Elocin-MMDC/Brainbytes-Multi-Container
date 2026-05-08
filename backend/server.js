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

// ============================================
// SCHEMAS
// ============================================

// Message Schema (existing)
const messageSchema = new mongoose.Schema({
  text: String,
  response: String,
  subject: { type: String, default: 'General' },
  questionType: { type: String, default: 'general' },
  sentiment: { type: String, default: 'neutral' },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// User Profile Schema (NEW)
const userProfileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  preferredSubjects: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const UserProfile = mongoose.model('UserProfile', userProfileSchema);

// Learning Material Schema (NEW)
const learningMaterialSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  topic: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const LearningMaterial = mongoose.model('LearningMaterial', learningMaterialSchema);

// ============================================
// AI HELPER FUNCTIONS (Enhanced)
// ============================================

// Detect question type
function detectQuestionType(message) {
  const lower = message.toLowerCase();
  if (lower.startsWith('what is') || lower.startsWith('define') || lower.includes('definition of') || lower.includes('meaning of')) {
    return 'definition';
  }
  if (lower.startsWith('how') || lower.startsWith('why') || lower.includes('explain') || lower.includes('describe')) {
    return 'explanation';
  }
  if (lower.includes('example') || lower.includes('give me a sample') || lower.includes('show me')) {
    return 'example';
  }
  return 'general';
}

// Sentiment analysis (basic)
function detectSentiment(message) {
  const lower = message.toLowerCase();
  const frustrated = ['frustrated', 'angry', 'hate', 'stupid', 'annoying', 'useless', 'terrible', 'awful', 'wrong', 'bad', 'ugh'];
  const confused = ['confused', "don't understand", 'do not understand', 'lost', 'unclear', "doesn't make sense", 'does not make sense', 'stuck', 'idk', "don't get it", 'huh'];
  const positive = ['thank', 'thanks', 'great', 'awesome', 'love', 'helpful', 'good', 'amazing', 'cool', 'nice'];

  for (let word of frustrated) if (lower.includes(word)) return 'frustrated';
  for (let word of confused) if (lower.includes(word)) return 'confused';
  for (let word of positive) if (lower.includes(word)) return 'positive';
  return 'neutral';
}

// Detect subject
function detectSubject(message) {
  const lower = message.toLowerCase();
  if (lower.includes('math') || lower.includes('algebra') || lower.includes('geometry') || lower.includes('calculus') || lower.includes('equation')) return 'Math';
  if (lower.includes('science') || lower.includes('physics') || lower.includes('chemistry') || lower.includes('biology') || lower.includes('photosynthesis') || lower.includes('gravity') || lower.includes('atom')) return 'Science';
  if (lower.includes('history') || lower.includes('rizal') || lower.includes('war') || lower.includes('ancient') || lower.includes('revolution')) return 'History';
  if (lower.includes('english') || lower.includes('grammar') || lower.includes('writing') || lower.includes('literature') || lower.includes('essay') || lower.includes('noun') || lower.includes('verb')) return 'English';
  if (lower.includes('filipino') || lower.includes('tagalog') || lower.includes('panitikan')) return 'Filipino';
  return 'General';
}

// Expanded training data
const knowledgeBase = {
  'algebra': {
    definition: 'Algebra is a branch of mathematics dealing with symbols and the rules for manipulating those symbols. It uses letters (variables) to represent unknown numbers.',
    explanation: 'In algebra, we use letters like x or y to represent numbers we do not know yet. We solve equations to find the value of these unknowns. For example, if x + 5 = 10, we find that x = 5.',
    example: 'Example: If 2x + 3 = 11, subtract 3 from both sides: 2x = 8. Then divide by 2: x = 4.'
  },
  'geometry': {
    definition: 'Geometry is the branch of mathematics concerned with shapes, sizes, properties of space, and relative positions of figures.',
    explanation: 'Geometry helps us understand shapes like circles, triangles, and squares. It teaches us about angles, area, perimeter, and volume.',
    example: 'Example: The area of a rectangle is length times width. If length = 5 and width = 3, then area = 15 square units.'
  },
  'photosynthesis': {
    definition: 'Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into glucose (food) and oxygen.',
    explanation: 'Plants take in carbon dioxide from the air and water from the soil. Using sunlight as energy captured by chlorophyll, they convert these into glucose for food and release oxygen as a byproduct.',
    example: 'Example: A leaf absorbs sunlight, takes in CO2, and combines it with water from roots to produce glucose (C6H12O6) and oxygen (O2).'
  },
  'gravity': {
    definition: 'Gravity is the force that attracts objects with mass toward each other. On Earth, it pulls objects toward the planet center.',
    explanation: 'Gravity keeps us on the ground and makes objects fall. The strength depends on the mass of the objects and the distance between them. Earth gravity is 9.8 meters per second squared.',
    example: 'Example: When you drop a ball, gravity pulls it toward the ground at 9.8 m/s squared acceleration.'
  },
  'atom': {
    definition: 'An atom is the smallest unit of ordinary matter that retains the properties of a chemical element. It consists of a nucleus (protons and neutrons) and electrons.',
    explanation: 'Atoms are made of three main particles: protons (positive charge), neutrons (no charge), and electrons (negative charge). The protons and neutrons are in the nucleus, while electrons orbit around it.',
    example: 'Example: A hydrogen atom has 1 proton and 1 electron. A carbon atom has 6 protons, 6 neutrons, and 6 electrons.'
  },
  'rizal': {
    definition: 'Dr. Jose Rizal (1861-1896) was a Filipino nationalist, writer, ophthalmologist, and the national hero of the Philippines.',
    explanation: 'Rizal wrote two famous novels, Noli Me Tangere and El Filibusterismo, that exposed Spanish colonial abuses. He was executed by the Spanish on December 30, 1896, which inspired the Philippine Revolution.',
    example: 'Example: Rizal works inspired Filipinos to fight for independence. His novel Noli Me Tangere depicted the suffering of Filipinos under Spanish rule.'
  },
  'noun': {
    definition: 'A noun is a word that names a person, place, thing, or idea.',
    explanation: 'Nouns are one of the basic parts of speech. They can be common (like dog, city) or proper (like Rover, Manila). They can also be concrete (touchable) or abstract (ideas like love).',
    example: 'Examples: teacher (person), school (place), book (thing), happiness (idea).'
  },
  'verb': {
    definition: 'A verb is a word that expresses an action, occurrence, or state of being.',
    explanation: 'Verbs tell us what someone or something is doing. They show physical actions (run, jump), mental actions (think, believe), or states of being (is, are, was).',
    example: 'Examples: She runs every morning. He thinks deeply. They are happy.'
  }
};

// Main AI response generator (Enhanced)
function generateAIResponse(message) {
  const lower = message.toLowerCase();
  const sentiment = detectSentiment(message);
  const questionType = detectQuestionType(message);
  const subject = detectSubject(message);

  // Sentiment-based prefixes
  let prefix = '';
  if (sentiment === 'frustrated') {
    prefix = "I understand this can be frustrating. Take a deep breath - learning takes time, and I am here to help you. ";
  } else if (sentiment === 'confused') {
    prefix = "No worries, let me try to explain it more clearly. ";
  } else if (sentiment === 'positive') {
    prefix = "I am glad you are enjoying learning! ";
  }

  // Math expression solver
  if (lower.includes('what is') && (lower.includes('+') || lower.includes('-') || lower.includes('*') || lower.includes('/'))) {
    try {
      const expr = message.replace(/[^0-9+\-*/().]/g, '');
      const result = eval(expr);
      return prefix + 'The answer is ' + result + '.';
    } catch (e) {
      return prefix + "I could not solve that math problem. Could you rephrase it?";
    }
  }

  // Check knowledge base for specific topics
  for (const topic in knowledgeBase) {
    if (lower.includes(topic)) {
      const entry = knowledgeBase[topic];
      if (questionType === 'definition' && entry.definition) return prefix + entry.definition;
      if (questionType === 'explanation' && entry.explanation) return prefix + entry.explanation;
      if (questionType === 'example' && entry.example) return prefix + entry.example;
      return prefix + entry.definition;
    }
  }

  // Subject-based generic responses
  if (subject === 'Math') {
    return prefix + "Math is a fascinating subject! What specific topic would you like to explore - algebra, geometry, calculus, or statistics?";
  }
  if (subject === 'Science') {
    return prefix + "Science helps us understand the natural world! Are you interested in physics, chemistry, biology, or earth science?";
  }
  if (subject === 'History') {
    return prefix + "History helps us understand how the past shapes the present. What era or topic interests you - ancient civilizations, world wars, or Philippine history?";
  }
  if (subject === 'English') {
    return prefix + "English develops communication skills! Would you like help with grammar, writing, reading comprehension, or literature?";
  }
  if (subject === 'Filipino') {
    return prefix + "Magandang araw! Ang Filipino ay ang ating pambansang wika. Anong gusto mong matutunan - gramatika, panitikan, o pagsusulat?";
  }

  // Greetings
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return "Hello! I am BrainBytes, your AI tutor. I can help you learn about Math, Science, History, English, and more. What would you like to study today?";
  }

  // Help
  if (lower.includes('help') || lower.includes('how are you')) {
    return "I am here to help you learn! Try asking 'What is algebra?' or 'Explain photosynthesis' or 'Give me an example of a noun'.";
  }

  // Thanks
  if (lower.includes('thank')) {
    return "You are welcome! Feel free to ask me anything else.";
  }

  // Default
  return prefix + 'That is an interesting question. Try asking me about specific topics like algebra, photosynthesis, or Jose Rizal. You can ask for definitions, explanations, or examples!';
}

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

app.post('/api/messages', async (req, res) => {
  try {
    const message = new Message({ text: req.body.text });
    const savedMessage = await message.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ----- AI Chat (Enhanced) -----
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, subject } = req.body;
    const aiResponse = generateAIResponse(message);
    const detectedSubject = subject && subject !== 'All' ? subject : detectSubject(message);
    const questionType = detectQuestionType(message);
    const sentiment = detectSentiment(message);

    const saved = new Message({
      text: message,
      response: aiResponse,
      subject: detectedSubject,
      questionType: questionType,
      sentiment: sentiment
    });
    await saved.save();

    res.json({
      userMessage: message,
      aiResponse: aiResponse,
      subject: detectedSubject,
      questionType: questionType,
      sentiment: sentiment
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

// ----- Dashboard / Activity Stats -----
app.get('/api/dashboard/recent', async (req, res) => {
  try {
    const recentMessages = await Message.find().sort({ createdAt: -1 }).limit(10);
    const totalMessages = await Message.countDocuments();
    const subjectCounts = await Message.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } }
    ]);
    res.json({
      recentMessages,
      totalMessages,
      subjectCounts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
