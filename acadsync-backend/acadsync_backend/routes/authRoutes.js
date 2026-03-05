const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Add this BEFORE your routes
router.use((req, res, next) => {
  console.log('🔥 Auth route accessed:', req.method, req.url);
  console.log('📦 Body:', req.body);
  next();
});

// Public routes (no login required)
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected route (must be logged in)
router.get('/profile', protect, getUserProfile);

module.exports = router;