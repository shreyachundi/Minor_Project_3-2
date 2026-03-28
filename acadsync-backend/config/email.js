const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load .env explicitly from parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('📧 EMAIL CONFIG - USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
console.log('📧 EMAIL CONFIG - PASS:', process.env.EMAIL_PASS ? '✅ Set' : '❌ Missing');

// Create transporter with Gmail settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter failed:', error.message);
  } else {
    console.log('✅ Email transporter ready (Gmail)');
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    console.log('📧 Sending email to:', to);
    
    const mailOptions = {
      from: `"AcadSync" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent! ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email failed:', error.message);
    return false;
  }
};

module.exports = { sendEmail };