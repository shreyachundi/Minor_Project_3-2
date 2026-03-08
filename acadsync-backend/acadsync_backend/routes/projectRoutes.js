const express = require('express');
const router = express.Router();
const {
  getGuideProjects,
  getStudentProjects,
  getProjects,
  createProject,
  getProjectById,
  updateProject
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Debug middleware
router.use((req, res, next) => {
  console.log(`🔥 Project route accessed: ${req.method} ${req.url}`);
  console.log('📦 Body:', req.body);
  next();
});

// Unified route for getting projects
router.get('/', protect, getProjects);

// Guide-only routes
router.get('/guide', protect, authorize('guide'), getGuideProjects);
router.post('/', protect, authorize('guide'), createProject);
router.put('/:id', protect, authorize('guide'), updateProject);

// Student-only routes
router.get('/student', protect, authorize('student'), getStudentProjects);

// Routes accessible by both
router.get('/:id', protect, getProjectById);

module.exports = router;