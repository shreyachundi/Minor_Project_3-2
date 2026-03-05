const mongoose = require('mongoose');

// This function connects to MongoDB
const connectDB = async () => {
  try {
    // Try to connect to MongoDB using the URL from .env
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // If connection fails, show error and exit
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

// Export the function so other files can use it
module.exports = connectDB;