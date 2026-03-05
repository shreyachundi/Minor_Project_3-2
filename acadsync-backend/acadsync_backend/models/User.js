const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['student', 'guide'],
    default: 'student',
  },
  guideName: {
    type: String,
  }
}, {
  timestamps: true,
});

// NO PRE-SAVE HOOK - we'll hash in controller

module.exports = mongoose.model('User', userSchema);