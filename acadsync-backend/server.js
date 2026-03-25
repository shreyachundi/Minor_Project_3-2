// Test route for email
app.get('/api/test/email', async (req, res) => {
  console.log('🧪 Email test endpoint called!');
  const { sendEmail } = require('./config/email');
  const testEmail = req.query.email || 'shreyachundi@gmail.com';
  
  console.log(`📧 Sending test email to: ${testEmail}`);
  
  try {
    await sendEmail(
      testEmail,
      '🧪 Test Email from AcadSync',
      '<h1>Test Email</h1><p>If you receive this, email is working!</p>'
    );
    console.log(`✅ Test email sent successfully to ${testEmail}`);
    res.json({ success: true, message: `Email sent to ${testEmail}` });
  } catch (error) {
    console.error('❌ Test email error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});