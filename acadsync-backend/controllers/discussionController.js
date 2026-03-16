const asyncHandler = require('express-async-handler');
const Discussion = require('../models/Discussion');

// @desc    Create a new discussion
// @route   POST /api/discussions
// @access  Private
const createDiscussion = asyncHandler(async (req, res) => {
  try {
    console.log('📝 Creating new discussion');
    console.log('Request body:', req.body);
    console.log('User:', req.user.email);

    const { message, projectId } = req.body;

    // Validate required fields
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide projectId'
      });
    }

    // Create discussion (message can be empty if file is present)
    const discussion = new Discussion({
      author: req.user.name,
      authorId: req.user._id,
      message: message || '',
      projectId,
      replies: []
    });

    await discussion.save();
    console.log('✅ Discussion created:', discussion._id);

    res.status(201).json({
      success: true,
      discussion
    });
  } catch (error) {
    console.error('❌ Error creating discussion:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Upload file as discussion
// @route   POST /api/discussions/upload
// @access  Private
const uploadFile = asyncHandler(async (req, res) => {
  try {
    console.log('📝 Uploading file as discussion');
    console.log('Request body:', req.body);
    console.log('File:', req.file);
    console.log('User:', req.user.email);

    const { projectId, message } = req.body;
    const file = req.file;

    // Validate required fields
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide projectId'
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Create file URL
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    // Create discussion with file
    const discussion = new Discussion({
      author: req.user.name,
      authorId: req.user._id,
      message: message || '',
      projectId,
      file: {
        name: file.originalname,
        url: fileUrl,
        size: file.size,
        type: file.mimetype
      },
      replies: []
    });

    await discussion.save();
    console.log('✅ File discussion created:', discussion._id);

    res.status(201).json({
      success: true,
      discussion,
      fileUrl
    });
  } catch (error) {
    console.error('❌ Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Get all discussions for a project
// @route   GET /api/discussions/project/:projectId
// @access  Private
const getProjectDiscussions = asyncHandler(async (req, res) => {
  try {
    const { projectId } = req.params;
    
    console.log('📋 Fetching discussions for project:', projectId);
    
    const discussions = await Discussion.find({ projectId }).sort({ createdAt: 1 }); // Oldest first for chat flow
    
    res.json({
      success: true,
      discussions
    });
  } catch (error) {
    console.error('❌ Error fetching discussions:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Add reply to discussion
// @route   POST /api/discussions/:id/replies
// @access  Private
const addReply = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    
    console.log('📝 Adding reply to discussion:', id);
    
    const discussion = await Discussion.findById(id);
    
    if (!discussion) {
      return res.status(404).json({
        success: false,
        message: 'Discussion not found'
      });
    }
    
    const reply = {
      author: req.user.name,
      authorId: req.user._id,
      message,
      timestamp: new Date()
    };
    
    discussion.replies.push(reply);
    await discussion.save();
    
    console.log('✅ Reply added');
    
    res.json({
      success: true,
      reply
    });
  } catch (error) {
    console.error('❌ Error adding reply:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  createDiscussion,
  getProjectDiscussions,
  addReply,
  uploadFile
};