const brevo = require('@getbrevo/brevo');

const sendEmail = async (to, subject, html) => {
  console.log('📧 Preparing to send email via Brevo...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  console.log('📧 BREVO_API_KEY set:', !!process.env.BREVO_API_KEY1);
  
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
    console.log('✅ Email sent successfully via Brevo!');
    console.log('📧 Message ID:', data.messageId);
    return true;
  } catch (error) {
    console.error('❌ Brevo error:', error);
    console.error('Error details:', error.response?.body || error.message);
    return false;
  }
};

module.exports = { sendEmail };