const brevo = require('@getbrevo/brevo');

const sendEmail = async (to, subject, html) => {
  console.log('📧 Sending via Brevo API...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  
  try {
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.authentications['apiKey'].apiKey = process.env.BREVO_API_KEY;

    // Use Brevo's default sender - NO VERIFICATION NEEDED!
    const sendSmtpEmail = {
      sender: { name: 'AcadSync', email: 'noreply@brevo.com' },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    };

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent via Brevo API!');
    console.log('📧 Message ID:', data.messageId);
    return true;
  } catch (error) {
    console.error('❌ Brevo API error:', error.message);
    if (error.response) {
      console.error('Details:', error.response.body);
    }
    return false;
  }
};

module.exports = { sendEmail };