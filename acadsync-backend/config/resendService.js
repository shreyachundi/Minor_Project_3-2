const { Resend } = require('resend');

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (to, subject, html) => {
  console.log('📧 Preparing to send email via Resend...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  console.log('📧 RESEND_API_KEY set:', !!process.env.RESEND_API_KEY);
  
  try {
    // For testing, you can use the default Resend domain
    // Once verified, replace with your own domain
    const { data, error } = await resend.emails.send({
      from: 'AcadSync <onboarding@resend.dev>', // This works immediately for testing
      to: [to],
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return false;
    }

    console.log('✅ Email sent successfully via Resend!');
    console.log('📧 Message ID:', data?.id);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
};

module.exports = { sendEmail };