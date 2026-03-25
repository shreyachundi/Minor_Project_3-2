const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, html) => {
  console.log('📧 Sending via SendGrid API...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  
  try {
    const msg = {
      to: to,
      from: 'acadsyncproject32@gmail.com',
      subject: subject,
      html: html,
    };
    
    await sgMail.send(msg);
    console.log('✅ Email sent!');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Details:', error.response.body);
    }
    return false;
  }
};

module.exports = { sendEmail };