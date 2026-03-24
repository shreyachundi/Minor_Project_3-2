// @desc    Add student to project and send email notification
// @route   POST /api/projects/notify-student
// @access  Private/Guide
const notifyStudent = asyncHandler(async (req, res) => {
  try {
    const { email, projectId, studentName } = req.body;
    
    console.log('📧 Adding student:', studentName || email, 'to project:', projectId);
    console.log('📧 Student email to send to:', email);

    if (!email || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and projectId'
      });
    }

    const project = await Project.findById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.guideId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this project'
      });
    }

    const displayName = studentName || email.split('@')[0];

    if (project.students.includes(displayName)) {
      return res.status(400).json({
        success: false,
        message: 'This student is already in the project'
      });
    }

    project.students.push(displayName);
    await project.save();

    console.log('✅ Student added to project:', displayName);

    // Send email notification using Resend
    const { sendEmail } = require('../config/resendService');
    
    const emailSubject = `You've been added to a project: ${project.name}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b141a; padding: 30px; border-radius: 16px; border: 2px solid #feca57;">
        <h2 style="color: #feca57; text-align: center; font-size: 28px; margin-bottom: 20px;">AcadSync</h2>
        <h3 style="color: white; text-align: center;">Project Notification</h3>
        <p style="color: rgba(255,255,255,0.8); text-align: center; margin: 20px 0;">
          Hello ${displayName},
        </p>
        <p style="color: rgba(255,255,255,0.8); text-align: center;">
          You have been added to the project <strong style="color: #feca57;">${project.name}</strong> by <strong style="color: #feca57;">${req.user.name}</strong>.
        </p>
        <div style="background: #1f2c33; padding: 20px; text-align: center; border-radius: 12px; margin: 25px 0; border: 1px solid #feca57;">
          <h2 style="color: #feca57; margin: 0;">${project.name}</h2>
        </div>
        <p style="color: rgba(255,255,255,0.8); text-align: center;">
          Please log in to your AcadSync account using this email: <strong style="color: #feca57;">${email}</strong>
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
             style="background: #feca57; color: #333; padding: 12px 30px; 
                    border-radius: 25px; text-decoration: none; font-weight: bold;
                    display: inline-block;">
            Go to AcadSync
          </a>
        </div>
      </div>
    `;

    console.log(`📧 Sending invitation email to: ${email}`);
    const emailSent = await sendEmail(email, emailSubject, emailHtml);
    
    if (emailSent) {
      console.log(`✅ Invitation email sent successfully to: ${email}`);
    } else {
      console.log(`❌ Failed to send invitation email to: ${email}`);
    }

    res.json({
      success: true,
      message: emailSent ? 'Student added and notification sent successfully' : 'Student added but notification failed',
      project: project,
      emailSent: emailSent
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});