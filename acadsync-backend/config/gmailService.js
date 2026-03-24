const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  console.log('📧 Sending via Gmail...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'acadsyncproject32@gmail.com',
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const info = await transporter.sendMail({
      from: '"AcadSync" <acadsyncproject32@gmail.com>',
      to: to,
      subject: subject,
      html: html,
    });
    
    console.log('✅ Email sent!');
    console.log('📧 Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Gmail error:', error.message);
    return false;
  }
};

module.exports = { sendEmail };