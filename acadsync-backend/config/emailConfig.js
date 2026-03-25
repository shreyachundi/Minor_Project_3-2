const { Resend } = require('resend');

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

console.log('📧 Email configuration check:');
console.log('- RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ Set' : '❌ Missing');
console.log('- FROM_EMAIL:', process.env.FROM_EMAIL ? '✅ Set' : '❌ Missing');
console.log('- CLIENT_URL:', process.env.CLIENT_URL ? '✅ Set' : '❌ Missing');

const sendEmail = async (to, subject, html) => {
  try {
    console.log('📧 Preparing to send email...');
    console.log('📧 To:', to);
    console.log('📧 From:', process.env.FROM_EMAIL);
    console.log('📧 Subject:', subject);
    
    const { data, error } = await resend.emails.send({
      from: process.env.FROM_EMAIL,
      to: [to],
      subject: subject,
      html: html
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }

    console.log(`✅ Email sent successfully!`);
    console.log(`✅ Message ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    return false;
  }
};

module.exports = { sendEmail };