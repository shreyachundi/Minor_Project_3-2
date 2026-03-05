const cron = require('node-cron');
const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
const { sendEmail } = require('../config/emailConfig');

// Function to check and send deadline reminders
const checkDeadlines = async () => {
  console.log('🔍 Checking for upcoming deadlines...');
  
  try {
    // Calculate tomorrow's date range
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    // Find tasks due tomorrow that aren't completed and haven't had reminder
    const tasksDueTomorrow = await Task.find({
      dueDate: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      status: { $ne: 'completed' },
      reminderSent: false
    });

    console.log(`📊 Found ${tasksDueTomorrow.length} tasks due tomorrow`);

    // Send reminder for each task
    for (const task of tasksDueTomorrow) {
      const student = await User.findById(task.assignedToId);
      const project = await Project.findById(task.projectId);
      
      if (student && project) {
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2 style="color: #ff6b6b;">⏰ Task Deadline Tomorrow!</h2>
            <p>Hello <strong>${student.name}</strong>,</p>
            <p>This is a friendly reminder that your task is due <strong>tomorrow</strong>.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 10px;">
              <h3>Task Details:</h3>
              <p><strong>Project:</strong> ${project.name}</p>
              <p><strong>Task:</strong> ${task.title}</p>
              <p><strong>Due Date:</strong> ${task.dueDate.toLocaleDateString()}</p>
              <p><strong>Current Status:</strong> ${task.status}</p>
            </div>
            
            <p>Please complete this task before the deadline.</p>
            
            <a href="${process.env.CLIENT_URL}/student/project/${project._id}" 
               style="display: inline-block; background: #4cc9f0; color: white; 
                      padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              View Task
            </a>
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
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Schedule the job to run every day at 8 AM
const startDeadlineReminderJob = () => {
  // Cron syntax: 'minute hour day-of-month month day-of-week'
  // '0 8 * * *' means: at 8:00 AM every day
  cron.schedule('0 8 * * *', checkDeadlines, {
    timezone: 'Asia/Kolkata' // Change to your timezone
  });

  console.log('⏰ Deadline reminder job scheduled (daily at 8 AM)');
};

module.exports = startDeadlineReminderJob;