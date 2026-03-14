const express = require('express');
const router = express.Router();
const LogSheet = require('../models/LogSheet');
const Project = require('../models/Project');
const { protect, authorize } = require('../middleware/authMiddleware');

// Get log sheet for a project
router.get('/project/:projectId', protect, async (req, res) => {
  try {
    console.log('📤 Fetching log sheet for project:', req.params.projectId);
    
    let logSheet = await LogSheet.findOne({ projectId: req.params.projectId });
    
    if (!logSheet) {
      console.log('No log sheet found, creating default one...');
      // Get project details
      const project = await Project.findById(req.params.projectId);
      
      if (!project) {
        return res.status(404).json({ 
          success: false, 
          message: 'Project not found' 
        });
      }

      // Create default log sheet
      const defaultEntries = [
        { week: 'Week 1', contents: 'Project Title', workCarried: 'AcadSync - A Digital Work Coordination System' },
        { week: 'Week 1', contents: 'Feasibility Study of the Project', workCarried: 'Technical and operational Feasibility' },
        { week: 'Week 2-3', contents: 'Literature Survey', workCarried: 'Existing and Proposed System' },
        { week: 'Week 2-3', contents: 'Problem Analysis', workCarried: 'Problem Definition, Scope of the Project, Project Objectives' },
        { week: 'Week 4-5', contents: 'Requirements and Specifications', workCarried: 'Functional and Non-Functional Requirements, SRS Document, System Architecture' },
        { week: 'Week 6-7', contents: 'DB & Software Design', workCarried: 'Module Description, Software and Hardware requirements, Database Design/ Data Dictionary, Database Design- Relevant ER Diagram, Software Design- Use case Diagram, Class Diagrams- Functionality of a project, Interaction Diagrams- Behaviour of a project' },
        { week: 'Week 8-11', contents: 'Project Implementation', workCarried: 'Implementation' },
        { week: 'Week 12', contents: 'Test Cases', workCarried: 'Creation of test cases' },
        { week: 'Week 13-14', contents: 'Documentation', workCarried: 'Manuscript Preparation' }
      ];

      logSheet = new LogSheet({
        projectId: project._id,
        projectTitle: project.name,
        class: 'III-B.Tech, II-SEM',
        academicYear: '2025-2026',
        batchNumber: '23819',
        internalGuide: {
          name: project.guide || 'Not Assigned',
          designation: 'Assistant professor',
          department: 'IT'
        },
        students: project.students?.map(s => ({ 
          hallTicketNumber: '', 
          name: s 
        })) || [],
        entries: defaultEntries
      });

      await logSheet.save();
      console.log('✅ Default log sheet created');
    }

    res.json({ success: true, logSheet });
  } catch (error) {
    console.error('❌ Error fetching log sheet:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching log sheet',
      error: error.message 
    });
  }
});

// Update log entry (GUIDE only)
router.put('/entry/:entryId', protect, authorize('guide'), async (req, res) => {
  try {
    const { workCarried, remarks } = req.body;
    const entryId = req.params.entryId;

    const logSheet = await LogSheet.findOne({ 'entries._id': entryId });
    
    if (!logSheet) {
      return res.status(404).json({ success: false, message: 'Log sheet not found' });
    }

    const entry = logSheet.entries.id(entryId);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    if (workCarried !== undefined) entry.workCarried = workCarried;
    if (remarks !== undefined) entry.remarks = remarks;
    entry.updatedAt = new Date();
    if (req.user) entry.updatedBy = req.user._id;

    await logSheet.save();
    res.json({ success: true, entry });
  } catch (error) {
    console.error('Error updating log entry:', error);
    res.status(500).json({ success: false, message: 'Error updating log entry' });
  }
});

// Add signature to entry (GUIDE only)
router.post('/entry/:entryId/sign', protect, authorize('guide'), async (req, res) => {
  try {
    const entryId = req.params.entryId;
    const { signatureData } = req.body;

    const logSheet = await LogSheet.findOne({ 'entries._id': entryId });
    
    if (!logSheet) {
      return res.status(404).json({ success: false, message: 'Log sheet not found' });
    }

    const entry = logSheet.entries.id(entryId);
    if (!entry) {
      return res.status(404).json({ success: false, message: 'Entry not found' });
    }

    entry.sign = signatureData || `Signed on ${new Date().toLocaleDateString()}`;
    entry.updatedAt = new Date();
    if (req.user) entry.updatedBy = req.user._id;

    await logSheet.save();
    res.json({ success: true, entry });
  } catch (error) {
    console.error('Error signing entry:', error);
    res.status(500).json({ success: false, message: 'Error signing entry' });
  }
});

// HOD signature (GUIDE only)
router.post('/hod-signature/:projectId', protect, authorize('guide'), async (req, res) => {
  try {
    const { signatureData, remarks } = req.body;
    const projectId = req.params.projectId;

    const logSheet = await LogSheet.findOne({ projectId });
    
    if (!logSheet) {
      return res.status(404).json({ success: false, message: 'Log sheet not found' });
    }

    logSheet.hodSignature = signatureData || `Signed by HOD on ${new Date().toLocaleDateString()}`;
    if (remarks) logSheet.hodRemarks = remarks;
    logSheet.updatedAt = new Date();

    await logSheet.save();
    res.json({ success: true, logSheet });
  } catch (error) {
    console.error('Error adding HOD signature:', error);
    res.status(500).json({ success: false, message: 'Error adding HOD signature' });
  }
});

// Update student hall ticket number (GUIDE only)
router.put('/student/:projectId/:studentIndex', protect, authorize('guide'), async (req, res) => {
  try {
    const { projectId, studentIndex } = req.params;
    const { hallTicketNumber } = req.body;
    
    console.log('📤 Updating hall ticket for project:', projectId, 'student index:', studentIndex);
    
    const logSheet = await LogSheet.findOne({ projectId });
    
    if (!logSheet) {
      return res.status(404).json({ success: false, message: 'Log sheet not found' });
    }
    
    // Update the specific student's hall ticket number
    if (logSheet.students && logSheet.students[studentIndex]) {
      logSheet.students[studentIndex].hallTicketNumber = hallTicketNumber;
      await logSheet.save();
      
      console.log('✅ Hall ticket updated successfully');
      res.json({ 
        success: true, 
        message: 'Hall ticket updated successfully',
        student: logSheet.students[studentIndex]
      });
    } else {
      res.status(404).json({ success: false, message: 'Student not found' });
    }
    
  } catch (error) {
    console.error('Error updating hall ticket:', error);
    res.status(500).json({ success: false, message: 'Error updating hall ticket' });
  }
});

module.exports = router;