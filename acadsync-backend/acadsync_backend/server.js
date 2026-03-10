const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const { startDeadlineReminderJob, checkDeadlines } = require('./cron/deadlineReminder');

// Import routes
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/taskRoutes');
const discussionRoutes = require('./routes/discussionRoutes');

dotenv.config();
connectDB();

const app = express();

// CORS configuration
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(helmet());

// Debug middleware
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/discussions', discussionRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: '🎉 AcadSync API is running!' });
});

// Test route for manual reminder trigger
app.post('/api/test/check-deadlines', async (req, res) => {
  try {
    console.log('🧪 Manually checking deadlines...'); // THIS SHOULD APPEAR
    console.log('📋 Calling checkDeadlines function...');
    await checkDeadlines();
    console.log('✅ Deadline check completed');
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
      'acadsyncproject32@gmail.com',
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

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 CORS enabled for: http://localhost:3000`);
});