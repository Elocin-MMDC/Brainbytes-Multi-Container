const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { initializeAI } = require('./services/aiService');

// Routes
const userRoutes = require('./routes/userRoutes');
const messageRoutes = require('./routes/messageRoutes');
const materialRoutes = require('./routes/materialRoutes');
const authRoutes = require('./routes/authRoutes');

// Connect to MongoDB
connectDB();
initializeAI();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api', messageRoutes);           // ← fixed: was /api/messages
app.use('/api/materials', materialRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'BrainBytes API is running' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});