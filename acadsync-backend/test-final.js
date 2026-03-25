const nodemailer = require('nodemailer');
require('dotenv').config();

console.log('🧪 Testing Zoho Mail with App Password');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📧 From:', process.env.EMAIL_USER);
console.log('📧 App Password length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : '❌ Missing');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Connection failed:', error.message);
    return;
  }
  console.log('✅ Connected to Zoho SMTP successfully!');
  
  // ⚠️ CHANGE THIS TO YOUR EMAIL ADDRESS ⚠️
  const YOUR_EMAIL = 'shreyachundi@gmail.com';
  
  const mailOptions = {
    from: `"AcadSync" <${process.env.EMAIL_USER}>`,
    to: YOUR_EMAIL,
    subject: '✅ AcadSync Email System is Working!',
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 2px solid #4CAF50; border-radius: 10px;">
        <h2 style="color: #4CAF50;">🎉 Success!</h2>
        <p>Your AcadSync backend is now successfully configured to send emails!</p>
        <p><strong>Configuration:</strong></p>
        <ul>
          <li>SMTP Server: smtp.zoho.in:465 (SSL)</li>
          <li>Email Account: ${process.env.EMAIL_USER}</li>
          <li>Authentication: App Password</li>
          <li>Time: ${new Date().toLocaleString()}</li>
        </ul>
        <p>Your website can now send:</p>
        <ul>
          <li>🔐 OTP verification codes</li>
          <li>📧 Password reset emails</li>
          <li>📢 User notifications</li>
        </ul>
        <hr>
        <p style="font-size: 12px; color: gray;">AcadSync - Academic Project Management Tool</p>
      </div>
    `
  };
  
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('❌ Failed to send email:', error.message);
    } else {
      console.log('✅ Email sent successfully!');
      console.log('📬 Message ID:', info.messageId);
      console.log('📬 Check your inbox/spam folder at:', YOUR_EMAIL);
    }
  });
});
