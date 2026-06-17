const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const UserProfile = require('../models/UserProfile');
const { sendVerificationEmail } = require('../services/emailService');

// ──────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, preferredSubjects } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Check if email already exists
    const existing = await UserProfile.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered.' });
    }

    // Generate a secure verification token (valid 24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Create the user (password gets hashed by the model pre-save hook)
    const user = await UserProfile.create({
      name,
      email,
      password,
      preferredSubjects: preferredSubjects || [],
      isVerified: false,
      verificationToken,
      verificationTokenExpires,
    });

    // Send verification email
    await sendVerificationEmail(user.email, verificationToken);

    res.status(201).json({
      message: 'Account created! Please check your email to verify your account.',
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

// ──────────────────────────────────────────
// GET /api/auth/verify/:token
// ──────────────────────────────────────────
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await UserProfile.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }, // token must not be expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification link.' });
    }

    // Mark as verified and clear the token
    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
  } catch (err) {
    console.error('Verify error:', err);
    res.status(500).json({ message: 'Server error during verification.' });
  }
};

// ──────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await UserProfile.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in. Check your inbox.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Sign JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferredSubjects: user.preferredSubjects,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};

module.exports = { register, login, verifyEmail };