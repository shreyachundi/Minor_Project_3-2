// Test route for email - USING RESEND
app.get('/api/test/email', async (req, res) => {
  console.log('🧪 Email test endpoint called!');
  
  const testEmail = req.query.email;
  
  if (!testEmail) {
    return res.status(400).json({
      success: false,
      message: 'Please provide an email: ?email=user@example.com'
    });
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(testEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }
  
  console.log(`📧 Sending test email to: ${testEmail}`);
  
  try {
    const { sendEmail } = require('./config/resendService');
    
    const result = await sendEmail(
      testEmail,
      '🧪 Test Email from AcadSync (Resend)',
      '<h1>Test Email</h1><p>If you receive this, Resend is working!</p>'
    );
    
    if (result) {
      console.log(`✅ Test email sent successfully to ${testEmail}`);
      res.json({ 
        success: true, 
        message: `Test email sent successfully to ${testEmail}!` 
      });
    } else {
      console.log(`❌ Test email failed for ${testEmail}`);
      res.status(500).json({ 
        success: false, 
        message: `Failed to send email to ${testEmail}` 
      });
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});