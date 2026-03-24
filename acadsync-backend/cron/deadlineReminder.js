console.log('='.repeat(50));
console.log('📁 DEADLINE REMINDER MODULE LOADING...');
console.log('='.repeat(50));

const cron = require('node-cron');  // ← ONLY ONCE at the top
console.log('✅ node-cron loaded');

const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
console.log('✅ Models loaded');

require('dotenv').config();
console.log('✅ dotenv configured');

const { sendEmail } = require('../config/resendService');
console.log('✅ resendService loaded');

console.log('✅ All dependencies loaded, defining functions...');

// Function to check and send deadline reminders
const checkDeadlines = async () => {
  console.log('🔍 Checking for upcoming deadlines...');
  console.log('📧 Using email:', process.env.EMAIL_USER);
  
  try {
    // Get tomorrow's date using a more reliable method
    const now = new Date();
    
    // Create date objects for start and end of tomorrow
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    console.log('📅 Current time:', now.toLocaleString());
    console.log('📅 Tomorrow start:', tomorrow.toLocaleString());
    console.log('📅 Tomorrow end:', dayAfterTomorrow.toLocaleString());

    // Find ALL tasks first (for debugging)
    const allTasks = await Task.find({});
    console.log(`📊 Total tasks in database: ${allTasks.length}`);
    
    if (allTasks.length > 0) {
      console.log('📋 All tasks due dates:');
      allTasks.forEach((task, index) => {
        console.log(`   Task ${index + 1}: ${task.title} - Due: ${task.dueDate?.toLocaleString()} - Status: ${task.status} - Reminder Sent: ${task.reminderSent}`);
      });
    }

    // Find tasks due tomorrow - using a more flexible date range
    const tasksDueTomorrow = await Task.find({
      $and: [
        { dueDate: { $gte: tomorrow } },
        { dueDate: { $lt: dayAfterTomorrow } },
        { status: { $ne: 'completed' } },
        { reminderSent: false }
      ]
    });

    console.log(`📊 Found ${tasksDueTomorrow.length} tasks due tomorrow`);

    if (tasksDueTomorrow.length === 0) {
      console.log('❌ No tasks due tomorrow. Check your tasks:');
      console.log('1. Make sure task dueDate is set to tomorrow');
      console.log('2. Task status is not "completed"');
      console.log('3. reminderSent is false');
      return;
    }

    for (const task of tasksDueTomorrow) {
      console.log(`\n📋 Processing task: ${task.title}`);
      console.log(`📋 Task dueDate: ${task.dueDate?.toLocaleString()}`);
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
    
    // Run once immediately on startup for testing (after 10 seconds to ensure DB connection)
    setTimeout(() => {
      console.log('🧪 Running initial deadline check on startup...');
      checkDeadlines();
    }, 10000); // Wait 10 seconds after startup
    
    // Schedule daily at 9:00 AM
    cron.schedule('0 9 * * *', checkDeadlines, {
      timezone: 'Asia/Kolkata'
    });
    
    console.log('⏰ Deadline reminder job scheduled (daily at 9:00 AM IST)');
    console.log('⏰ Also running once on startup after 10 seconds');
  }
};