// Test route for email - USING RESEND (keep this for testing)
app.get('/api/test/email', async (req, res) => {
  console.log('🧪 Email test endpoint called!');
  console.log('📧 This is a TEST endpoint - sending to shreyachundi@gmail.com only');
  try {
    const { sendEmail } = require('./config/resendService');
    
    const result = await sendEmail(
      'shreyachundi@gmail.com', // This is hardcoded for TESTING only
      '🧪 Test Email from AcadSync (Resend)',
      '<h1>Test Email</h1><p>If you receive this, Resend is working!</p>'
    );
    
    if (result) {
      console.log('✅ Test email sent successfully via Resend');
      res.json({ success: true, message: 'Test email sent successfully via Resend!' });
    } else {
      console.log('❌ Test email failed');
      res.status(500).json({ success: false, message: 'Failed to send email' });
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});