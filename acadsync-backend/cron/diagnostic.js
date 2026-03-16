// cron/diagnostic.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Task = require('../models/Task');
const User = require('../models/User');
const Project = require('../models/Project');
const { sendEmail } = require('../config/emailConfig');

async function runDiagnostic() {
  console.log('🔍 RUNNING DIAGNOSTIC');
  console.log('=====================');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');
    
    // 1. Check all tasks
    console.log('\n1. ALL TASKS IN DATABASE:');
    const allTasks = await Task.find({});
    console.log(`   Total tasks: ${allTasks.length}`);
    
    if (allTasks.length === 0) {
      console.log('   ❌ No tasks found in database!');
    } else {
      allTasks.forEach((task, i) => {
        console.log(`   Task ${i+1}:`);
        console.log(`      - Title: ${task.title}`);
        console.log(`      - Due Date: ${task.dueDate}`);
        console.log(`      - Status: ${task.status}`);
        console.log(`      - Reminder Sent: ${task.reminderSent}`);
        console.log(`      - Assigned To ID: ${task.assignedToId}`);
      });
    }
    
    // 2. Calculate tomorrow's date
    console.log('\n2. DATE CALCULATION:');
    const now = new Date();
    console.log(`   Current time: ${now}`);
    console.log(`   Current time (locale): ${now.toLocaleString()}`);
    
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    
    console.log(`   Tomorrow start: ${tomorrow}`);
    console.log(`   Tomorrow start (locale): ${tomorrow.toLocaleString()}`);
    console.log(`   Tomorrow end: ${dayAfterTomorrow}`);
    
    // 3. Check tasks due tomorrow
    console.log('\n3. TASKS DUE TOMORROW:');
    const tasksDueTomorrow = await Task.find({
      dueDate: {
        $gte: tomorrow,
        $lt: dayAfterTomorrow
      },
      status: { $ne: 'completed' },
      reminderSent: false
    });
    
    console.log(`   Found: ${tasksDueTomorrow.length} tasks`);
    
    if (tasksDueTomorrow.length > 0) {
      tasksDueTomorrow.forEach((task, i) => {
        console.log(`   Task ${i+1}: ${task.title} - Due: ${task.dueDate}`);
        
        // 4. Check student
        console.log(`\n4. CHECKING STUDENT FOR TASK: ${task.title}`);
        (async () => {
          const student = await User.findById(task.assignedToId);
          if (student) {
            console.log(`   ✅ Student found: ${student.name}`);
            console.log(`   📧 Student email: ${student.email}`);
            
            // 5. Check project
            const project = await Project.findById(task.projectId);
            if (project) {
              console.log(`   ✅ Project found: ${project.name}`);
              
              // 6. Send test email
              console.log(`\n5. SENDING TEST EMAIL...`);
              const testResult = await sendEmail(
                student.email,
                `🧪 TEST: Task "${task.title}" Due Tomorrow`,
                '<h1>Test Email</h1><p>This is a test from diagnostic script.</p>'
              );
              
              if (testResult) {
                console.log(`   ✅ Test email sent to ${student.email}`);
              } else {
                console.log(`   ❌ Failed to send test email`);
              }
            } else {
              console.log(`   ❌ Project not found for ID: ${task.projectId}`);
            }
          } else {
            console.log(`   ❌ Student not found for ID: ${task.assignedToId}`);
          }
        })();
      });
    } else {
      console.log('   ❌ No tasks due tomorrow found');
    }
    
  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }
}

runDiagnostic();