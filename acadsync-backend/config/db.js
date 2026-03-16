const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('📡 connectDB function called');
    console.log('- MONGODB_URI in connectDB:', process.env.MONGODB_URI ? '✅ Set' : '❌ Undefined');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('Full error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;