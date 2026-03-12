const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  file: {
    name: String,
    url: String,
    size: Number,
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  }
}, { _id: false });

const discussionSchema = new mongoose.Schema({
  author: {
    type: String,
    required: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    default: '',
  },
  file: fileSchema,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  replies: [replySchema],
}, {
  timestamps: true,
});

module.exports = mongoose.model('Discussion', discussionSchema);