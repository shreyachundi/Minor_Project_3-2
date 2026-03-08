const express = require('express');
const router = express.Router();
const {
  createDiscussion,
  getProjectDiscussions,
  addReply
} = require('../controllers/discussionController');
const { protect } = require('../middleware/authMiddleware');

// Debug middleware
router.use((req, res, next) => {
  console.log(`🔥 Discussion route accessed: ${req.method} ${req.url}`);
  console.log('📦 Body:', req.body);
  next();
});

// Create discussion
router.post('/', protect, createDiscussion);

// Get discussions for a project
router.get('/project/:projectId', protect, getProjectDiscussions);

// Add reply to discussion
router.post('/:id/replies', protect, addReply);

module.exports = router;