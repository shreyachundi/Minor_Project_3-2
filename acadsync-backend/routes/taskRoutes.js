const express = require('express');
const router = express.Router();
const {
  createTask,
  getProjectTasks,
  updateTaskStatus
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Debug middleware for task routes
router.use((req, res, next) => {
  console.log(`🔥 Task route accessed: ${req.method} ${req.url}`);
  console.log('📦 Body:', req.body);
  next();
});

// Create task (guide only)
router.post('/', protect, authorize('guide'), createTask);

// Get tasks for a project
router.get('/project/:projectId', protect, getProjectTasks);

// Update task status
router.put('/:id/status', protect, updateTaskStatus);  // THIS LINE IS CRITICAL

module.exports = router;