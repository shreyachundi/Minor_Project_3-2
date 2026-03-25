const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  console.log('📧 Sending email to:', to);
  
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'acadsyncproject32@gmail.com',
        pass: 'uxiivnbbnmtsebag',
      },
    });

    const info = await transporter.sendMail({
      from: 'acadsyncproject32@gmail.com',
      to: to,
      subject: subject,
      html: html,
    });
    
    console.log('✅ Email sent!', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
};

module.exports = { sendEmail };