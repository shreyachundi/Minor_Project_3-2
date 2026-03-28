const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use MONGO_URI instead of MONGODB_URI
    const mongoURI = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoURI) {
      console.error('❌ MONGODB_URI is not defined in environment variables');
      process.exit(1);
    }
    
    console.log('📡 Attempting to connect to MongoDB...');
    console.log('📡 Using URI:', mongoURI.substring(0, 50) + '...');
    
    const conn = await mongoose.connect(mongoURI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;