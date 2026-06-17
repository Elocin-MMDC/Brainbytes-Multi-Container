const express = require('express');
const router = express.Router();
const { register, login, verifyEmail } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', register);

// POST /api/auth/login
router.post('/login', login);

// GET /api/auth/verify/:token
router.get('/verify/:token', verifyEmail);

module.exports = router;