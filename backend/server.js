const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const aiService = require('./services/aiService');

const messageRoutes = require('./routes/messageRoutes');
const userRoutes = require('./routes/userRoutes');
const materialRoutes = require('./routes/materialRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB();

// Initialize AI service
aiService.initializeAI();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the BrainBytes API' });
});

app.use('/api', messageRoutes);
app.use('/api', userRoutes);
app.use('/api', materialRoutes);

// Start server
app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
