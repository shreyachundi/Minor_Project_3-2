const nodemailer = require('nodemailer');

// Log credentials at startup (safely)
console.log('📧 Email configuration check:');
console.log('- EMAIL_USER:', process.env.EMAIL_USER ? '✅ Set' : '❌ Missing');
console.log('- EMAIL_PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : '❌ Missing');
console.log('- CLIENT_URL:', process.env.CLIENT_URL ? '✅ Set' : '❌ Missing');

// Create transporter with explicit settings
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  debug: true, // Enable debug logs
  logger: true // Log information
});

// Verify connection immediately
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email transporter verification failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  } else {
    console.log('✅ Email transporter is ready to send messages');
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    console.log('📧 Preparing to send email...');
    console.log('📧 To:', to);
    console.log('📧 From:', process.env.EMAIL_USER);
    console.log('📧 Subject:', subject);
    
    const mailOptions = {
      from: `"AcadSync" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully!`);
    console.log(`✅ Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
    return false;
  }
};

module.exports = { sendEmail };