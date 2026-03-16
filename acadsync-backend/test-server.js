// test-server.js - A minimal test server
const express = require('express');

const app = express();

// Middleware
app.use(express.json());

// Log all requests
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});

// Simple test route
app.post('/api/auth/register', (req, res) => {
  console.log('✅ Register route reached!');
  res.status(200).json({ 
    success: true, 
    message: 'Test server working!',
    data: req.body 
  });
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Test server is running' });
});

const PORT = 5001; // Use a different port
app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📝 Try: POST http://localhost:${PORT}/api/auth/register`);
});