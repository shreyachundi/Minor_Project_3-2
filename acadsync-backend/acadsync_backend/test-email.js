// test-email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 Testing email configuration...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length);
console.log('EMAIL_PASS first 4 chars:', process.env.EMAIL_PASS?.substring(0, 4));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function testEmail() {
  try {
    console.log('📧 Attempting to verify transporter...');
    await transporter.verify();
    console.log('✅ Transporter verified successfully!');
    
    console.log('📧 Attempting to send test email...');
    const info = await transporter.sendMail({
      from: `"Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'Test Email',
      text: 'If you receive this, email is working!'
    });
    
    console.log('✅ Email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmail();