const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, html) => {
  console.log('📧 Sending to:', to);
  
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    secure: false,
    auth: {
      user: 'acadsyncproject32@gmail.com',
      pass: 'uxiivnbbnmtsebag',
    },
    family: 4,
    connectionTimeout: 10000,
    socketTimeout: 10000,
  });

  await transporter.sendMail({
    from: 'acadsyncproject32@gmail.com',
    to: to,
    subject: subject,
    html: html,
  });
  
  console.log('✅ Sent!');
  return true;
};

module.exports = { sendEmail };