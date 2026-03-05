const express = require('express');
const router = express.Router();
const {
  createTask,
  getProjectTasks,
  updateTaskStatus
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Create task (guide only)
router.post('/', protect, authorize('guide'), createTask);

// Get tasks for a project
router.get('/project/:projectId', protect, getProjectTasks);

// Update task status
router.put('/:id/status', protect, updateTaskStatus);

module.exports = router;