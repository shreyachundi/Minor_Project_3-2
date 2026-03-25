const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  console.log('📧 Sending via Brevo SMTP...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      auth: {
        user: 'acadsyncproject32@gmail.com',
        pass: process.env.BREVO_API_KEY,
      },
    });

    const info = await transporter.sendMail({
      from: '"AcadSync" <acadsyncproject32@gmail.com>',
      to: to,
      subject: subject,
      html: html,
    });
    
    console.log('✅ Email sent via Brevo!');
    console.log('📧 Message ID:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Brevo error:', error.message);
    return false;
  }
};

module.exports = { sendEmail };