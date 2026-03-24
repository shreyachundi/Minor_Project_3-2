const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  console.log('📧 Sending via Resend...');
  console.log('📧 To:', to);
  console.log('📧 From: AcadSync <onboarding@resend.dev>');
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'AcadSync <onboarding@resend.dev>',  // Resend's own domain - ALWAYS WORKS
      to: [to],
      subject: subject,
      html: html,
    });
    
    if (error) {
      console.error('❌ Resend error:', error);
      return false;
    }
    
    console.log('✅ Email sent! ID:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
};

module.exports = { sendEmail };