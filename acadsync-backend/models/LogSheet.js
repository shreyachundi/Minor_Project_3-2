const mongoose = require('mongoose');

const logEntrySchema = new mongoose.Schema({
  week: {
    type: String,
    required: true
  },
  contents: {
    type: String,
    required: true
  },
  workCarried: {
    type: String,
    default: ''
  },
  sign: {
    type: String,
    default: ''
  },
  remarks: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const logSheetSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    unique: true
  },
  projectTitle: {
    type: String,
    required: true
  },
  class: {
    type: String,
    default: 'III-B.Tech, II-SEM'
  },
  academicYear: {
    type: String,
    default: '2025-2026'
  },
  batchNumber: {
    type: String,
    default: '23819'
  },
  internalGuide: {
    name: String,
    designation: String,
    department: String
  },
  students: [{
    hallTicketNumber: String,
    name: String
  }],
  entries: [logEntrySchema],
  hodSignature: {
    type: String,
    default: ''
  },
  hodRemarks: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('LogSheet', logSheetSchema);