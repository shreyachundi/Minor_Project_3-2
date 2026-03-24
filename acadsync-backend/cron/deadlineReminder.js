console.log('='.repeat(50));
console.log('📁 DEADLINE REMINDER MODULE LOADING...');
console.log('='.repeat(50));

const cron = require('node-cron');
console.log('✅ node-cron loaded');

const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
console.log('✅ Models loaded');

require('dotenv').config();
console.log('✅ dotenv configured');

const { sendEmail } = require('../config/brevoService');
console.log('✅ BervoService loaded');

console.log('✅ All dependencies loaded, defining functions...');

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
    console.log('📅 Tomorrow end:', dayAfterTomorrow.toLocaleString());

    // Find ALL tasks first (for debugging)
    const allTasks = await Task.find({});
    console.log(`📊 Total tasks in database: ${allTasks.length}`);
    
    if (allTasks.length > 0) {
      console.log('📋 All tasks due dates:');
      allTasks.forEach((task, index) => {
        console.log(`   Task ${index + 1}: ${task.title} - Due: ${task.dueDate?.toLocaleString()} - Status: ${task.status} - Reminder Sent: ${task.reminderSent} - Assigned To: ${task.assignedToId}`);
      });
    }

    // Find tasks due tomorrow
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
      console.log('❌ No tasks due tomorrow');
      return;
    }

    for (const task of tasksDueTomorrow) {
      console.log(`\n📋 Processing task: ${task.title}`);
      console.log(`📋 Task assignedToId: ${task.assignedToId}`);
      
      const student = await User.findById(task.assignedToId);
      const project = await Project.findById(task.projectId);
      
      console.log(`📧 Student found:`, student ? student.email : 'NOT FOUND');
      
      if (student && project) {
        console.log(`📧 Attempting to send email to: ${student.email}`);
        
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
  
  console.log('🚨🚨🚨 DEADLINE CHECK COMPLETED 🚨🚨🚨');
};

// Export both the function and the job starter
module.exports = {
  checkDeadlines,
  startDeadlineReminderJob: () => {
    console.log('⏰ Scheduling deadline reminder job...');
    
    // Run once immediately on startup for testing (after 10 seconds)
    setTimeout(() => {
      console.log('🧪 Running initial deadline check on startup...');
      checkDeadlines();
    }, 10000);
    
    // FOR TESTING: Runs every minute (remove this after testing)
    // For production, change back to: cron.schedule('0 9 * * *', checkDeadlines, { timezone: 'Asia/Kolkata' });
    cron.schedule('* * * * *', checkDeadlines, {
      timezone: 'Asia/Kolkata'
    });
    
    console.log('⏰ Deadline reminder job scheduled (currently running every minute for testing)');
    console.log('⏰ Also running once on startup after 10 seconds');
    console.log('⚠️ REMEMBER: Change back to daily schedule after testing!');
  }
};