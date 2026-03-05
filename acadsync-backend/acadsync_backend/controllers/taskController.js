const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Guide only)
const createTask = asyncHandler(async (req, res) => {
  try {
    console.log('📝 Creating new task');
    console.log('Request body:', req.body);

    const { title, assignedTo, projectId, description } = req.body;

    // Validate required fields
    if (!title || !assignedTo || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, assignedTo, and projectId'
      });
    }

    // Create task
    const task = new Task({
      title,
      description: description || '',
      assignedTo,
      projectId,
      status: 'pending'
    });

    await task.save();
    console.log('✅ Task created:', task._id);

    res.status(201).json({
      success: true,
      task
    });
  } catch (error) {
    console.error('❌ Error creating task:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getProjectTasks = asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log('📋 Fetching tasks for project:', projectId);
    
    const tasks = await Task.find({ projectId });
    
    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('❌ Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('📝 Updating task:', id, 'to status:', status);
    
    const task = await Task.findById(id);
    
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    task.status = status;
    await task.save();
    
    console.log('✅ Task updated:', task._id);
    
    res.json({
      success: true,
      task
    });
  } catch (error) {
    console.error('❌ Error updating task:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  createTask,
  getProjectTasks,
  updateTaskStatus
};