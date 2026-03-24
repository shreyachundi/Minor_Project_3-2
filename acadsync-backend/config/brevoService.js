const brevo = require('@getbrevo/brevo');

const sendEmail = async (to, subject, html) => {
  console.log('📧 Preparing to send email via Brevo API...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  console.log('📧 BREVO_API_KEY set:', !!process.env.BREVO_API_KEY);
  
  try {
    const apiInstance = new brevo.TransactionalEmailsApi();
    const apiKey = apiInstance.authentications['apiKey'];
    apiKey.apiKey = process.env.BREVO_API_KEY;
    
    let sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = html;
    sendSmtpEmail.sender = { 
      name: 'AcadSync', 
      email: 'acadsyncproject32@gmail.com'
    };
    sendSmtpEmail.to = [{ email: to }];
    
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent via Brevo API!');
    console.log('📧 Message ID:', data.messageId);
    return true;
  } catch (error) {
    console.error('❌ Brevo API error:', error.message);
    if (error.response) {
      console.error('Error details:', error.response.body);
    }
    return false;
  }
};

module.exports = { sendEmail };