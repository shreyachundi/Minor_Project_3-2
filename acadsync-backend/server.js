const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const { startDeadlineReminderJob, checkDeadlines } = require('./cron/deadlineReminder');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const discussionRoutes = require('./routes/discussionRoutes');
const logSheetRoutes = require('./routes/logSheetRoutes');

// Load environment variables FIRST
dotenv.config();

// Debug cron module
console.log('🔧 Cron module loaded, functions available:');
console.log('- startDeadlineReminderJob:', typeof startDeadlineReminderJob);
console.log('- checkDeadlines:', typeof checkDeadlines);

// Debug environment variables BEFORE connecting to DB
console.log('🔍 Environment variables check at startup:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Undefined');
console.log('- MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Undefined');
console.log('- SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? '✅ Set' : '❌ Undefined');
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL ? '✅ Set' : '❌ Undefined');

// Try to connect to MongoDB
console.log('📡 Attempting to connect to MongoDB...');
connectDB().catch(err => {
  console.error('❌ MongoDB connection failed:', err.message);
  process.exit(1);
});

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://minor-project-3-2.vercel.app',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean);

console.log('🌐 Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) {
      console.log('✅ Request with no origin allowed');
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`✅ Origin allowed: ${origin}`);
      return callback(null, true);
    } else {
      console.log(`❌ Origin blocked: ${origin}`);
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Handle preflight requests
app.options('/*splat', cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Debug middleware - only in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`\n📨 ${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    next();
  });
}

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug endpoint to check environment variables
app.get('/api/debug/env', (req, res) => {
  res.json({
    NODE_ENV: process.env.NODE_ENV,
    MONGODB_URI_EXISTS: !!process.env.MONGODB_URI,
    MONGODB_URI_LENGTH: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
    MONGODB_URI_PREVIEW: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'not set',
    JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
    SENDGRID_API_KEY_EXISTS: !!process.env.SENDGRID_API_KEY,
    FRONTEND_URL: process.env.FRONTEND_URL || 'not set',
    CLIENT_URL: process.env.CLIENT_URL || 'not set',
    ALL_ENV_KEYS: Object.keys(process.env).filter(key => 
      !key.includes('npm') && !key.includes('_') && !key.includes('PATH')
    ),
    PORT: process.env.PORT
  });
});

// Debug endpoint to check all tasks
app.get('/api/debug/tasks', async (req, res) => {
  try {
    const Task = require('./models/Task');
    const tasks = await Task.find({});
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    res.json({
      total: tasks.length,
      tasks: tasks.map(t => ({
        title: t.title,
        dueDate: t.dueDate,
        dueDateString: t.dueDate?.toLocaleString(),
        status: t.status,
        reminderSent: t.reminderSent,
        assignedToId: t.assignedToId,
        isDueTomorrow: t.dueDate ? new Date(t.dueDate).toDateString() === tomorrow.toDateString() : false
      })),
      tomorrowDate: tomorrow.toLocaleString()
    });
  } catch (error) {
    console.error('❌ Debug tasks error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/discussions', discussionRoutes);
app.use('/api/logsheet', logSheetRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: '🎉 AcadSync API is running!',
    environment: process.env.NODE_ENV || 'development',
    frontend: process.env.FRONTEND_URL || 'Not configured'
  });
});

// Test route for manual reminder trigger
app.get('/api/test/check-deadlines', async (req, res) => {
  console.log('🚨🚨🚨 TEST ENDPOINT CALLED - MANUAL DEADLINE CHECK 🚨🚨🚨');
  try {
    console.log('🧪 Executing checkDeadlines()...');
    await checkDeadlines();
    console.log('✅ Deadline check completed successfully');
    res.json({ success: true, message: 'Deadline check completed' });
  } catch (error) {
    console.error('❌ Deadline check failed:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test route for email - USING SENDGRID
app.get('/api/test/email', async (req, res) => {
  console.log('🧪 Email test endpoint called!');
  
  const testEmail = req.query.email;
  
  if (!testEmail) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email: ?email=user@example.com'
    });
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(testEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }
  
  console.log(`📧 Sending test email to: ${testEmail}`);
  
  try {
    const { sendEmail } = require('./config/brevoService');
    
    const result = await sendEmail(
      testEmail,
      '🧪 Test Email from AcadSync (SendGrid)',
      '<h1>Test Email</h1><p>If you receive this, SendGrid is working!</p>'
    );
    
    if (result) {
      console.log(`✅ Test email sent successfully to ${testEmail}`);
      res.json({ 
        success: true, 
        message: `Test email sent successfully to ${testEmail}!` 
      });
    } else {
      console.log(`❌ Test email failed for ${testEmail}`);
      res.status(500).json({ 
        success: false, 
        message: `Failed to send email to ${testEmail}` 
      });
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Start cron job
console.log('⏰ About to start deadline reminder job...');
startDeadlineReminderJob();
console.log('⏰ startDeadlineReminderJob() called');

// Error handler
app.use(errorHandler);

// 404 handler
app.use('/*splat', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📝 Allowed origins:`, allowedOrigins);
});