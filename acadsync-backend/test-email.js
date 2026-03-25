// test-email.js
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load .env from the root directory
dotenv.config({ path: path.join(__dirname, '.env') });

// Debug: Print loaded variables
console.log('🔍 Checking environment variables:');
console.log('EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT LOADED');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ Loaded (length: ' + process.env.EMAIL_PASS.length + ')' : '❌ NOT LOADED');
console.log('PORT:', process.env.PORT || '❌ NOT LOADED');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const { sendEmail } = require('./config/emailConfig');

async function testZohoEmail() {
  console.log('🧪 Testing Zoho Mail Configuration');
  console.log('📧 Sending from:', process.env.EMAIL_USER);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Check if credentials exist
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('❌ ERROR: Email credentials are missing in .env file!');
    console.log('Please check that your .env file contains:');
    console.log('EMAIL_USER=acadsync@zohomail.in');
    console.log('EMAIL_PASS=project@011');
    return;
  }
  
  const result = await sendEmail(
    'your-email@gmail.com', // 🔴 CHANGE THIS to your personal email
    '✅ AcadSync - Zoho Mail Test Successful!',
    `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .container { 
          max-width: 500px; 
          margin: 0 auto; 
          padding: 20px; 
          border: 1px solid #ddd; 
          border-radius: 10px;
        }
        .header { 
          background-color: #4CAF50; 
          color: white; 
          padding: 10px; 
          text-align: center; 
          border-radius: 5px;
        }
        .content { padding: 20px; }
        .footer { 
          font-size: 12px; 
          color: gray; 
          text-align: center; 
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h2>🎉 AcadSync Email System</h2>
        </div>
        <div class="content">
          <h3>Zoho Mail is Working!</h3>
          <p>Your AcadSync backend is now successfully configured to send emails using Zoho Mail.</p>
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Time: ${new Date().toLocaleString()}</li>
            <li>From: acadsync@zohomail.in</li>
            <li>SMTP Server: smtp.zoho.com</li>
          </ul>
          <p>This email confirms that your email system is ready to send:</p>
          <ul>
            <li>🔐 OTP verification codes</li>
            <li>📧 Password reset emails</li>
            <li>📢 Notifications to users</li>
          </ul>
        </div>
        <div class="footer">
          <p>AcadSync - Your Academic Project Management Tool</p>
        </div>
      </div>
    </body>
    </html>
    `
  );
  
  if (result) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 SUCCESS! Test email sent!');
    console.log('📬 Check your inbox (and spam folder)');
  } else {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('❌ FAILED! Test email could not be sent.');
    console.log('📋 Check the error messages above');
  }
}

testZohoEmail();