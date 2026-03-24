const brevo = require('@getbrevo/brevo');

const sendEmail = async (to, subject, html) => {
  console.log('📧 Sending via Brevo...');
  console.log('📧 To:', to);
  
  try {
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;
    
    const sendSmtpEmail = {
      // Use Brevo's official sender - always works, no verification needed!
      sender: { name: 'AcadSync', email: 'noreply@brevo.com' },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    };
    
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent! Message ID:', data.messageId);
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