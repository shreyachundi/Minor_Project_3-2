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
  console.log('User ID:', req.user._id);
  console.log('User Name:', req.user.name);
  
  const projects = await Project.find({
    $or: [
      { studentIds: req.user._id },
      { students: req.user.name }
    ]
  });
  
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
    projects = await Project.find({ guideId: req.user._id });
    console.log(`✅ Found ${projects.length} projects for guide`);
  } else {
    projects = await Project.find({
      $or: [
        { studentIds: req.user._id },
        { students: req.user.name }
      ]
    });
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

  if (req.user.role !== 'guide') {
    res.status(403);
    throw new Error('Only guides can create projects');
  }

  if (!name) {
    res.status(400);
    throw new Error('Please provide project name');
  }

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

    const hasAccess = 
      project.guideId.toString() === req.user._id.toString() ||
      (project.studentIds && project.studentIds.includes(req.user._id)) ||
      (project.students && project.students.includes(req.user.name));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this project'
      });
    }

    const tasks = await Task.find({ projectId: project._id });
    console.log(`📋 Found ${tasks.length} tasks for project`);
    
    const discussions = await Discussion.find({ projectId: project._id }).sort({ createdAt: -1 });

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
    
    if (project.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this project'
      });
    }
    
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

    // @desc    Add student to project and send email notification
// @route   POST /api/projects/notify-student
// @access  Private/Guide
const notifyStudent = asyncHandler(async (req, res) => {
  try {
    const { email, projectId, studentName } = req.body;
    
    console.log('📧 Adding student:', studentName || email, 'to project:', projectId);
    console.log('📧 Student email to send to:', email);

    if (!email || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and projectId'
      });
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this project'
      });
    }

    const displayName = studentName || email.split('@')[0];

    if (project.students.includes(displayName)) {
      return res.status(400).json({
        success: false,
        message: 'This student is already in the project'
      });
    }

    project.students.push(displayName);
    await project.save();

    console.log('✅ Student added to project:', displayName);

    // Send email notification using Gmail
    const { sendEmail } = require('../config/email');
    
    const emailSubject = `You've been added to a project: ${project.name}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b141a; padding: 30px; border-radius: 16px; border: 2px solid #feca57;">
        <h2 style="color: #feca57; text-align: center; font-size: 28px; margin-bottom: 20px;">AcadSync</h2>
        <h3 style="color: white; text-align: center;">Project Notification</h3>
        <p style="color: rgba(255,255,255,0.8); text-align: center; margin: 20px 0;">
          Hello ${displayName},
        </p>
        <p style="color: rgba(255,255,255,0.8); text-align: center;">
          You have been added to the project <strong style="color: #feca57;">${project.name}</strong> by <strong style="color: #feca57;">${req.user.name}</strong>.
        </p>
        <div style="background: #1f2c33; padding: 20px; text-align: center; border-radius: 12px; margin: 25px 0; border: 1px solid #feca57;">
          <h2 style="color: #feca57; margin: 0;">${project.name}</h2>
        </div>
        <p style="color: rgba(255,255,255,0.8); text-align: center;">
          Please log in to your AcadSync account using this email: <strong style="color: #feca57;">${email}</strong>
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="background: #feca57; color: #333; padding: 12px 30px; 
                    border-radius: 25px; text-decoration: none; font-weight: bold;
                    display: inline-block;">
            Go to AcadSync
          </a>
        </div>
      </div>
    `;

    console.log(`📧 Sending invitation email to: ${email}`);
    const emailSent = await sendEmail(email, emailSubject, emailHtml);
    
    if (emailSent) {
      console.log(`✅ Invitation email sent successfully to: ${email}`);
    } else {
      console.log(`❌ Failed to send invitation email to: ${email}`);
    }

    res.json({
      success: true,
      message: emailSent ? 'Student added and notification sent successfully' : 'Student added but notification failed',
      project: project,
      emailSent: emailSent
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Export all functions
module.exports = {
  getGuideProjects,
  getStudentProjects,
  getProjects,
  createProject,
  getProjectById,
  updateProject,
  notifyStudent,
};