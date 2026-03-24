const brevo = require('@getbrevo/brevo');

const sendEmail = async (to, subject, html) => {
  console.log('📧 Sending via Brevo...');
  console.log('📧 To:', to);
  
  // Check API key
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('❌ BREVO_API_KEY is not set!');
    return false;
  }
  console.log('📧 API Key exists (first 10 chars):', apiKey.substring(0, 10) + '...');
  
  try {
    const apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.authentications['apiKey'].apiKey = apiKey;
    
    const sendSmtpEmail = {
      sender: { name: 'AcadSync', email: 'noreply@brevo.com' },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html,
    };
    
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent! Message ID:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Brevo Error:', error.message);
    if (error.response) {
      console.error('Response body:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
};

module.exports = { sendEmail };