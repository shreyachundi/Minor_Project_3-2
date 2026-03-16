const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Guide only)
const createTask = async (req, res) => {
  try {
    console.log('📝 Creating new task with data:', req.body);
    
    const { title, assignedTo, projectId, dueDate, status } = req.body;

    // Validate required fields
    if (!title || !assignedTo || !projectId || !dueDate) {
      console.log('❌ Missing required fields:', { title, assignedTo, projectId, dueDate });
      return res.status(400).json({
        success: false,
        message: 'Please provide title, assignedTo, projectId, and dueDate'
      });
    }

    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      console.log('❌ Project not found:', projectId);
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Find the student by name (case-insensitive)
    console.log('🔍 Looking for student with name:', assignedTo);
    const student = await User.findOne({ 
      name: { $regex: new RegExp(`^${assignedTo}$`, 'i') },
      role: 'student' 
    });
    
    if (!student) {
      console.log('❌ Student not found with name:', assignedTo);
      return res.status(404).json({
        success: false,
        message: `Student "${assignedTo}" not found`
      });
    }

    console.log('✅ Student found:', student.name, student._id);

    // Create task with dueDate
    const task = new Task({
      title,
      assignedTo: student.name, // Use the exact name from database
      assignedToId: student._id,
      projectId,
      status: status || 'pending',
      dueDate: new Date(dueDate),
      reminderSent: false
    });

    await task.save();
    console.log('✅ Task created successfully:', task._id);
    console.log('📅 Deadline:', task.dueDate);

    res.status(201).json({
      success: true,
      task
    });

  } catch (error) {
    console.error('❌ Error creating task:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Get all tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getProjectTasks = async (req, res) => {
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
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('📝 Backend: Updating task:', id, 'to status:', status);
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }
    
    // Validate status value
    const validStatuses = ['pending', 'in-progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }
    
    const task = await Task.findById(id);
    
    if (!task) {
      console.log('❌ Task not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    task.status = status;
    await task.save();
    
    console.log('✅ Task updated successfully:', task._id);
    
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
};

module.exports = {
  createTask,
  getProjectTasks,
  updateTaskStatus
};