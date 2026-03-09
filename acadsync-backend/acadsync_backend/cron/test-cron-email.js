// cron/test-cron-email.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const { checkDeadlines } = require('./deadlineReminder');

console.log('🧪 TESTING CRON EMAIL WITH FRESH ENV LOAD');
console.log('==========================================');
console.log('Current directory:', __dirname);
console.log('Env file path:', require('path').join(__dirname, '../.env'));
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length);
console.log('MONGO_URI:', process.env.MONGO_URI ? '✅ Set' : '❌ Missing');
console.log('==========================================\n');

// Connect to MongoDB before running
async function runTest() {
  try {
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
    
    // Run the deadline check
    await checkDeadlines();
    
    console.log('✅ Test completed');
    await mongoose.disconnect();
    console.log('📡 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

runTest();