const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  createDiscussion,
  getProjectDiscussions,
  addReply,
  uploadFile
} = require('../controllers/discussionController');
const { protect } = require('../middleware/authMiddleware');

// Create uploads directory if it doesn't exist
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('📁 Created uploads directory');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow all file types
    cb(null, true);
  }
});

// Debug middleware
router.use((req, res, next) => {
  console.log(`🔥 Discussion route accessed: ${req.method} ${req.url}`);
  console.log('📦 Body:', req.body);
  if (req.file) console.log('📎 File:', req.file.originalname);
  next();
});

// File upload endpoint - MUST come before other routes
router.post('/upload', protect, upload.single('file'), uploadFile);

// Create discussion (text only)
router.post('/', protect, createDiscussion);

// Get discussions for a project
router.get('/project/:projectId', protect, getProjectDiscussions);

// Add reply to discussion
router.post('/:id/replies', protect, addReply);

module.exports = router;