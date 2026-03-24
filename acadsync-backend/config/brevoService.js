const nodemailer = require('nodemailer');

// Create transporter with Brevo SMTP settings
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: 'acadsyncproject32@gmail.com',
    pass: process.env.BREVO_API_KEY,  // Changed from BREVO_API_KEY1
  },
});

const sendEmail = async (to, subject, html) => {
  console.log('📧 Preparing to send email via Brevo SMTP...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  console.log('📧 BREVO_API_KEY set:', !!process.env.BREVO_API_KEY);
  
  try {
    const info = await transporter.sendMail({
      from: '"AcadSync" <acadsyncproject32@gmail.com>',
      to: to,
      subject: subject,
      html: html,
    });
    
    console.log('✅ Email sent via Brevo SMTP!');
    console.log('📧 Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Brevo SMTP error:', error.message);
    console.error('Error details:', error);
    return false;
  }
};

module.exports = { sendEmail };