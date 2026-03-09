const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
require('dotenv').config();
const { sendEmail } = require('../config/emailConfig');

// Function to check and send deadline reminders
const checkDeadlines = async () => {
  console.log('🔍 Checking for upcoming deadlines...');
  console.log('📧 Using email:', process.env.EMAIL_USER);
  
  try {
    // Get tomorrow's date at midnight in local time
    const today = new Date();
    console.log('📅 Today (local):', today.toString());
    console.log('📅 Today (ISO):', today.toISOString());
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    console.log('📅 Tomorrow range start:', tomorrow.toISOString());
    console.log('📅 Tomorrow range end:', dayAfterTomorrow.toISOString());

    // Find all tasks (for debugging)
    const allTasks = await Task.find({});
    console.log(`📊 Total tasks in database: ${allTasks.length}`);
    
    if (allTasks.length > 0) {
      console.log('📋 Sample task dueDate:', allTasks[0].dueDate);
    }

    // Find tasks due tomorrow
    const tasksDueTomorrow = await Task.find({
      dueDate: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      status: { $ne: 'completed' },
      reminderSent: false
    });

    console.log(`📊 Found ${tasksDueTomorrow.length} tasks due tomorrow`);

    if (tasksDueTomorrow.length === 0) {
      console.log('❌ No tasks due tomorrow. Check:');
      console.log('1. Task dueDate should be between:', tomorrow.toISOString(), 'and', dayAfterTomorrow.toISOString());
      console.log('2. Task status is not "completed"');
      console.log('3. reminderSent is false');
      return;
    }

    for (const task of tasksDueTomorrow) {
      console.log(`📋 Processing task: ${task.title}`);
      console.log(`📋 Task dueDate: ${task.dueDate}`);
      console.log(`📋 Task status: ${task.status}`);
      console.log(`📋 reminderSent: ${task.reminderSent}`);
      
      const student = await User.findById(task.assignedToId);
      const project = await Project.findById(task.projectId);
      
      if (student && project) {
        console.log(`📧 Attempting to send email to: ${student.email}`);
        
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 10px;">
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">⏰ Task Deadline Reminder</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; color: #333;">Hello <strong style="color: #667eea;">${student.name}</strong>,</p>
              
              <p style="font-size: 16px; color: #333;">This is a friendly reminder that your task is due <strong style="color: #ff6b6b;">tomorrow</strong>!</p>
              
              <div style="background: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="color: #333; margin-top: 0; font-size: 18px;">📋 Task Details:</h2>
                <p style="margin: 10px 0;"><strong>Project:</strong> ${project.name}</p>
                <p style="margin: 10px 0;"><strong>Task:</strong> ${task.title}</p>
                <p style="margin: 10px 0;"><strong>Due Date:</strong> ${task.dueDate.toLocaleDateString()}</p>
                <p style="margin: 10px 0;"><strong>Status:</strong> ${task.status}</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL}/student/project/${project._id}" 
                   style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                  View Task Details
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
                This is an automated reminder from AcadSync.
              </p>
            </div>
          </div>
        `;

        const emailSent = await sendEmail(
          student.email,
          `⏰ Reminder: Task "${task.title}" Due Tomorrow`,
          emailContent
        );

        if (emailSent) {
          task.reminderSent = true;
          await task.save();
          console.log(`✅ Reminder sent to ${student.email}`);
        } else {
          console.log(`❌ Failed to send email to ${student.email}`);
        }
      } else {
        console.log('❌ Student or project not found');
        if (!student) console.log('❌ Student missing for ID:', task.assignedToId);
        if (!project) console.log('❌ Project missing for ID:', task.projectId);
      }
    }
  } catch (error) {
    console.error('❌ Error in checkDeadlines:', error);
  }
};

// Export both the function and the job starter
module.exports = {
  checkDeadlines,
  startDeadlineReminderJob: () => {
    console.log('⏰ Scheduling deadline reminder job...');
    
    // Run once immediately on startup for testing
    setTimeout(() => {
      console.log('🧪 Running initial deadline check on startup...');
      checkDeadlines();
    }, 5000); // Wait 5 seconds after startup
    
    // Schedule daily at 8:00 AM
    cron.schedule('0 8 * * *', checkDeadlines, {
      timezone: 'Asia/Kolkata'
    });
    
    console.log('⏰ Deadline reminder job scheduled (daily at 8:00 AM)');
    console.log('⏰ Also running once on startup for testing');
  }
};