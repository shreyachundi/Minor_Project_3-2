const mailtrap = require('mailtrap');

const sendEmail = async (to, subject, html) => {
  console.log('📧 Sending via Mailtrap...');
  console.log('📧 To:', to);
  console.log('📧 Subject:', subject);
  console.log('📧 MAILTRAP_API_KEY set:', !!process.env.MAILTRAP_API_KEY);
  
  try {
    const client = new mailtrap.MailtrapClient({
      token: process.env.MAILTRAP_API_KEY,
    });

    const sender = new mailtrap.Sender({
      name: "AcadSync",
      email: "acadsync@mailtrap.io",
    });

    const recipients = [new mailtrap.Address(to)];

    const response = await client.send({
      from: sender,
      to: recipients,
      subject: subject,
      html: html,
    });

    console.log('✅ Email sent via Mailtrap!');
    console.log('📧 Message ID:', response.message_ids);
    return true;
  } catch (error) {
    console.error('❌ Mailtrap error:', error.message);
    if (error.response) {
      console.error('Details:', error.response.body);
    }
    return false;
  }
};

module.exports = { sendEmail };