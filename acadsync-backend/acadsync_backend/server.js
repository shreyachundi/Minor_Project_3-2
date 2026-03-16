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

dotenv.config();
connectDB();

const app = express();

// CORS configuration - UPDATED for production
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

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
app.post('/api/test/check-deadlines', async (req, res) => {
  try {
    console.log('🧪 Manually checking deadlines...');
    await checkDeadlines();
    res.json({ success: true, message: 'Deadline check completed' });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Test route for email
app.get('/api/test/email', async (req, res) => {
  try {
    const { sendEmail } = require('./config/emailConfig');
    
    const result = await sendEmail(
      process.env.EMAIL_USER || 'acadsyncproject32@gmail.com',
      '🧪 Test Email from AcadSync',
      '<h1>Test Email</h1><p>If you receive this, email is working!</p>'
    );
    
    if (result) {
      res.json({ success: true, message: 'Test email sent successfully!' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start cron job
startDeadlineReminderJob();

// Error handler
app.use(errorHandler);

// ✅ FIXED: 404 handler with named wildcard parameter
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