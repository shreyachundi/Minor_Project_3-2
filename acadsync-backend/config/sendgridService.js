const sgMail = require('@sendgrid/mail');

// Set API key from environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html) => {
  console.log('📧 Preparing to send email via SendGrid...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  console.log('📧 SENDGRID_API_KEY set:', !!process.env.SENDGRID_API_KEY);
  
  try {
    const msg = {
      to: to,
      from: 'acadsyncproject32@gmail.com',
      subject: subject,
      html: html,
    };
    
    const response = await sgMail.send(msg);
    console.log('✅ Email sent via SendGrid!');
    console.log('📧 Status Code:', response[0].statusCode);
    return true;
  } catch (error) {
    console.error('❌ SendGrid error:', error.response?.body || error.message);
    return false;
  }
};

module.exports = { sendEmail };