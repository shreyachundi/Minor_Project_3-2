const User = require('../models/User');
const Project = require('../models/Project');
const Otp = require('../models/Otp'); // Add this import
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    console.log('📤 Forgot password request for:', email);
    
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this email address' 
      });
    }
    
    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Save OTP to database (delete any existing OTP for this email)
    await Otp.findOneAndDelete({ email });
    await Otp.create({ email, otp });
    
    console.log('✅ OTP generated for:', email);
    
    // Configure email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'AcadSync - Password Reset OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b141a; padding: 30px; border-radius: 16px; border: 2px solid #feca57;">
          <h2 style="color: #feca57; text-align: center; font-size: 28px; margin-bottom: 20px;">AcadSync</h2>
          <h3 style="color: white; text-align: center;">Password Reset Request</h3>
          <p style="color: rgba(255,255,255,0.8); text-align: center; margin: 20px 0;">Hello ${user.name},</p>
          <p style="color: rgba(255,255,255,0.8); text-align: center;">You requested to reset your password. Use the following OTP to proceed:</p>
          <div style="background: #1f2c33; padding: 20px; text-align: center; border-radius: 12px; margin: 25px 0; border: 1px solid #feca57;">
            <h1 style="color: #feca57; font-size: 48px; letter-spacing: 10px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: rgba(255,255,255,0.6); text-align: center; font-size: 14px;">This OTP is valid for 10 minutes.</p>
          <p style="color: rgba(255,255,255,0.6); text-align: center; font-size: 14px; margin-top: 25px;">If you didn't request this, please ignore this email.</p>
          <p style="color: rgba(255,255,255,0.8); text-align: center; margin-top: 30px;">Best regards,<br><span style="color: #feca57;">AcadSync Team</span></p>
        </div>
      `
    };
    
    // Send email
    await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent to:', email);
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully' 
    });
    
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP. Please try again.' 
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    console.log('📤 Verifying OTP for:', email);
    
    // Find OTP in database
    const otpRecord = await Otp.findOne({ email, otp });
    
    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }
    
    console.log('✅ OTP verified for:', email);
    
    res.json({ 
      success: true, 
      message: 'OTP verified successfully' 
    });
    
  } catch (error) {
    console.error('❌ Verify OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify OTP' 
    });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    console.log('📤 Resetting password for:', email);
    
    // Verify OTP again
    const otpRecord = await Otp.findOne({ email, otp });
    
    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      });
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    // Delete used OTP
    await Otp.deleteOne({ _id: otpRecord._id });
    
    console.log('✅ Password reset for:', email);
    
    res.json({ 
      success: true, 
      message: 'Password reset successful' 
    });
    
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password' 
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  forgotPassword,
  verifyOtp,
  resetPassword,
};