const brevo = require('@getbrevo/brevo');

let apiInstance = new brevo.TransactionalEmailsApi();
let apiKey = apiInstance.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const sendEmail = async (to, subject, html) => {
  console.log('📧 Preparing to send email via Brevo...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  console.log('📧 BREVO_API_KEY set:', !!process.env.BREVO_API_KEY);
  
  let sendSmtpEmail = new brevo.SendSmtpEmail();
  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = html;
  sendSmtpEmail.sender = { 
    name: 'AcadSync', 
    email: 'acadsyncproject32@gmail.com'
  };
  sendSmtpEmail.to = [{ email: to }];
  
  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent successfully via Brevo!');
    console.log('📧 Message ID:', data.messageId);
    return true;
  } catch (error) {
    console.error('❌ Brevo error:', error);
    return false;
  }
};

module.exports = { sendEmail };