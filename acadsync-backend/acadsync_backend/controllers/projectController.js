const asyncHandler = require('express-async-handler');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Discussion = require('../models/Discussion');

// @desc    Get all projects for a guide
// @route   GET /api/projects/guide
// @access  Private/Guide
const getGuideProjects = asyncHandler(async (req, res) => {
  console.log('📋 Fetching guide projects for user:', req.user.email);
  console.log('User ID:', req.user._id);
  
  const projects = await Project.find({ guideId: req.user._id });
  console.log(`✅ Found ${projects.length} projects for guide`);
  
  res.json({
    success: true,
    projects: projects || []
  });
});

// @desc    Get all projects for a student
// @route   GET /api/projects/student
// @access  Private/Student
const getStudentProjects = asyncHandler(async (req, res) => {
  console.log('📋 Fetching student projects for user:', req.user.email);
  
  const projects = await Project.find({ studentIds: req.user._id });
  console.log(`✅ Found ${projects.length} projects for student`);
  
  res.json({
    success: true,
    projects: projects || []
  });
});

// @desc    Get all projects (unified endpoint)
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  console.log('📋 Fetching projects for user:', req.user.email);
  console.log('User ID:', req.user._id);
  console.log('User role:', req.user.role);
  
  let projects = [];
  
  if (req.user.role === 'guide') {
    // Guides see projects they created
    projects = await Project.find({ guideId: req.user._id });
    console.log(`✅ Found ${projects.length} projects for guide`);
  } else {
    // Students see projects they're part of
    projects = await Project.find({ studentIds: req.user._id });
    console.log(`✅ Found ${projects.length} projects for student`);
  }

  res.json({
    success: true,
    projects: projects || []
  });
});

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private/Guide
const createProject = asyncHandler(async (req, res) => {
  console.log('📝 Creating new project');
  console.log('Request body:', req.body);
  console.log('User:', req.user.email, 'Role:', req.user.role);

  const { name, students } = req.body;

  // Check if user is a guide
  if (req.user.role !== 'guide') {
    res.status(403);
    throw new Error('Only guides can create projects');
  }

  // Validate required fields
  if (!name) {
    res.status(400);
    throw new Error('Please provide project name');
  }

  // Create project
  const project = await Project.create({
    name,
    guide: req.user.name,
    guideId: req.user._id,
    students: students || [],
    studentIds: []
  });

  console.log('✅ Project created and saved to DB:', project._id);

  res.status(201).json({
    success: true,
    project
  });
});
// @desc    Get single project with all details
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = asyncHandler(async (req, res) => {
  try {
    console.log('🔍 Fetching project by ID:', req.params.id);
    
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Fetch tasks for this project
    const tasks = await Task.find({ projectId: project._id });
    console.log(`📋 Found ${tasks.length} tasks for project`);
    
    // Fetch discussions for this project
    const discussions = await Discussion.find({ projectId: project._id });

    res.json({
      success: true,
      project: {
        ...project.toObject(),
        tasks: tasks || [],
        discussions: discussions || []
      }
    });
  } catch (error) {
    console.error('❌ Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});
// @desc    Update project (add students, etc.)
// @route   PUT /api/projects/:id
// @access  Private (Guide only)
const updateProject = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    console.log('📝 Updating project:', id);
    console.log('Updates:', updates);
    
    const project = await Project.findById(id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Check if user is the guide of this project
    if (project.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }
    
    // Update fields
    if (updates.name) project.name = updates.name;
    if (updates.students) project.students = updates.students;
    
    await project.save();
    
    console.log('✅ Project updated:', project._id);
    
    res.json({
      success: true,
      project
    });
  } catch (error) {
    console.error('❌ Error updating project:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Make sure it's in the module.exports at the bottom
module.exports = {
  getGuideProjects,
  getStudentProjects,
  getProjects,
  createProject,
  getProjectById,
  updateProject,  // ← THIS MUST BE HERE!
};