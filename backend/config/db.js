const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    //Connection Pooling: Manage Database Connections Efficiently
    await mongoose.connect('mongodb://mongo:27017/brainbytes', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      maxPoolSize: 10,
      useFindAndModify: false  // Fix findOneAndUpdate deprecation
    });
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
  }
};

module.exports = connectDB;
