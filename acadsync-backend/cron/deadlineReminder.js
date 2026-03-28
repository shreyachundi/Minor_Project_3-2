const cron = require('node-cron');
const Task = require('../models/Task');
const { sendEmail } = require('../config/email');

console.log('📁 DEADLINE REMINDER MODULE LOADING...');

// Function to check and send deadline reminders
const checkDeadlines = async () => {
  console.log('🚨🚨🚨 DEADLINE CHECK STARTED 🚨🚨🚨');
  console.log('🔍 Checking for upcoming deadlines...');
  
  try {
    // Get tomorrow's date
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    console.log('📅 Current time:', now.toLocaleString());
    console.log('📅 Tomorrow start:', tomorrow.toLocaleString());

    // Find tasks due tomorrow
    const tasksDueTomorrow = await Task.find({
      dueDate: { $gte: tomorrow, $lt: dayAfterTomorrow },
      status: { $ne: 'completed' },
      reminderSent: false
    }).populate('assignedToId').populate('projectId');

    console.log(`📊 Found ${tasksDueTomorrow.length} tasks due tomorrow`);

    if (tasksDueTomorrow.length === 0) {
      console.log('❌ No tasks due tomorrow');
      return;
    }

    for (const task of tasksDueTomorrow) {
      const student = task.assignedToId;
      const project = task.projectId;
      
      console.log(`\n📋 Task: ${task.title}`);
      console.log(`📧 Student: ${student?.email || 'No email'}`);
      
      if (student && student.email && project) {
        const emailContent = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0b141a; padding: 30px; border-radius: 16px; border: 2px solid #feca57;">
            <h2 style="color: #feca57; text-align: center;">⏰ Task Deadline Reminder</h2>
            <p>Hello ${student.name},</p>
            <p>Your task <strong>${task.title}</strong> in project <strong>${project.name}</strong> is due <strong style="color: #feca57;">tomorrow</strong>!</p>
            <div style="background: #1f2c33; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
              <p><strong>Status:</strong> ${task.status}</p>
            </div>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL}/student/project/${project._id}" 
                 style="background: #feca57; color: #333; padding: 10px 20px; text-decoration: none; border-radius: 25px;">
                View Task
              </a>
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
          console.log(`❌ Failed to send to ${student.email}`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('🚨🚨🚨 DEADLINE CHECK COMPLETED 🚨🚨🚨');
};

// Start the cron job
const startDeadlineReminderJob = () => {
  console.log('⏰ Scheduling deadline reminder job (every 20 minutes)...');
  
  setTimeout(() => {
    console.log('🧪 Running initial deadline check...');
    checkDeadlines();
  }, 5000);
  
  cron.schedule('*/20 * * * *', checkDeadlines, {
    timezone: 'Asia/Kolkata'
  });
  
  console.log('⏰ Job scheduled for every 20 minutes');
};

module.exports = {
  checkDeadlines,
  startDeadlineReminderJob
};