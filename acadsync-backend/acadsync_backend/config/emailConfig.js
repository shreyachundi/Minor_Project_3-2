const nodemailer = require('nodemailer');

// Create reusable transporter object using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Function to send emails
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"AcadSync" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Email failed:', error);
    return false;
  }
};

module.exports = { sendEmail };