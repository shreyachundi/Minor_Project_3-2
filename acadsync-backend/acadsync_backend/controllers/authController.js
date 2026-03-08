const User = require('../models/User');
const Project = require('../models/Project'); // Add this import
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    console.log('📝 Register function started');
    console.log('Request body:', req.body);
    
    const { name, email, password, role, guideName } = req.body;
    
    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide all required fields' 
      });
    }
    
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    // 🔐 HASH PASSWORD MANUALLY
    console.log('Hashing password...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Password hashed successfully');
    
    // Create user with hashed password
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
    };
    
    // If registering as student, add guide information
    if (role === 'student' && guideName) {
      // Find guide by name to get guideId
      const guide = await User.findOne({ name: guideName, role: 'guide' });
      if (guide) {
        userData.guideId = guide._id;
        userData.guideName = guide.name;
      } else {
        // If guide not found, just store the provided guideName
        userData.guideName = guideName;
      }
    }
    
    const user = new User(userData);
    
    // Save to database
    await user.save();
    console.log('✅ User saved to database');
    
    // Generate token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      guideName: user.guideName,
      guideId: user.guideId,
      token,
    });
    
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration',
      error: error.message 
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔐 Login attempt for:', email);
    
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    console.log('Stored hash:', user.password);
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    let guideName = user.guideName;
    let guideId = user.guideId;
    
    // If user is a student and doesn't have guide info, try to find from projects
    if (user.role === 'student') {
      // Find a project where this student is a member
      const project = await Project.findOne({ 
        students: { $in: [user.name] } 
      });
      
      if (project && project.guideId) {
        // Update the student's guide info
        guideName = project.guide;
        guideId = project.guideId;
        
        // Save to user document for future logins
        await User.updateOne(
          { _id: user._id },
          { $set: { guideName, guideId } }
        );
        console.log(`✅ Updated guide info for student ${user.name} to ${guideName}`);
      }
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: process.env.JWT_EXPIRE }
    );
    
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      guideName: guideName || 'Not Assigned',
      guideId: guideId,
      token,
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    let guideName = user.guideName;
    let guideId = user.guideId;
    
    // If user is a student and doesn't have guide info, try to find from projects
    if (user.role === 'student' && !guideName) {
      // Find a project where this student is a member
      const project = await Project.findOne({ 
        students: { $in: [user.name] } 
      });
      
      if (project && project.guideId) {
        guideName = project.guide;
        guideId = project.guideId;
        
        // Update the user document
        await User.updateOne(
          { _id: user._id },
          { $set: { guideName, guideId } }
        );
        console.log(`✅ Updated guide info for student ${user.name} to ${guideName}`);
      }
    }
    
    res.json({
      success: true,
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      guideName: guideName || 'Not Assigned',
      guideId: guideId,
    });
    
  } catch (error) {
    console.error('❌ Profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};