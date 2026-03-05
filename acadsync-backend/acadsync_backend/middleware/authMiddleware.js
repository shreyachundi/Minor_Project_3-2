const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify token and attach user to request
const protect = async (req, res, next) => {
  let token;

  console.log('🔒 Auth middleware - checking authorization');
  console.log('Headers:', req.headers);

  // Check if authorization header exists
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (remove "Bearer " prefix)
      token = req.headers.authorization.split(' ')[1];
      console.log('Token extracted:', token.substring(0, 20) + '...');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified. User ID:', decoded.id);

      // Find user and attach to request (exclude password)
      const user = await User.findById(decoded.id).select('-password');
      console.log('User found:', user ? 'Yes' : 'No');

      if (!user) {
        console.log('❌ User not found in database');
        return res.status(401).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      req.user = user;
      console.log('✅ User attached to request:', req.user.email);
      next();
      
    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized - invalid token' 
      });
    }
  }

  if (!token) {
    console.log('❌ No token provided');
    return res.status(401).json({ 
      success: false, 
      message: 'Not authorized - no token' 
    });
  }
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };