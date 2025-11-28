const SibApiV3Sdk = require('@sendinblue/client');

// Brevo API configuration from environment variables
const BREVO_API_KEY = process.env.BREVO_API_KEY || 'YOUR_API_KEY';
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@dc34memorial.com';
const BCC_EMAIL = process.env.BCC_EMAIL; // Optional BCC recipient

/**
 * Send a registration confirmation email via Brevo
 * @param {string} recipientEmail - The email address of the recipient
 * @param {string} recipientName - The name of the recipient (optional)
 * @returns {Promise<Object>} - The response from Brevo API
 */
async function sendRegistrationEmail(recipientEmail, recipientName = '') {
  try {
    // Initialize Brevo API
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
    
    // Set API key
    apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);
    
    // Create email object
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    
    // Set sender
    sendSmtpEmail.sender = {
      name: 'DC34 Memorial Invitational',
      email: SENDER_EMAIL
    };
    
    // Set recipient
    sendSmtpEmail.to = [
      {
        email: recipientEmail,
        name: recipientName
      }
    ];
    
    // Set BCC if configured
    if (BCC_EMAIL) {
      sendSmtpEmail.bcc = [
        {
          email: BCC_EMAIL
        }
      ];
    }
    
    // Set subject
    sendSmtpEmail.subject = 'Registration Confirmation - DC34 Memorial Invitational';
    
    // Set HTML content
    sendSmtpEmail.htmlContent = `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c3e50;">Thank You for Registering!</h2>
            <p>Thank you for registering for the <strong>DC34 Memorial Invitational</strong> on <strong>May 30-31, 2026</strong>.</p>
            <p>Tournament details will be sent out as we get closer to the tournament date.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">
              If you have any questions, please don't hesitate to contact us.
            </p>
          </div>
        </body>
      </html>
    `;
    
    // Set plain text content
    sendSmtpEmail.textContent = 'Thank you for registering for the DC34 Memorial Invitational on May 30-31, 2026. Tournament details will be sent out as we get closer to the tournament date.';
    
    // Send email
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log(`Email sent successfully to ${recipientEmail}:`, data);
    return {
      success: true,
      messageId: data.messageId,
      email: recipientEmail
    };
  } catch (error) {
    console.error(`Failed to send email to ${recipientEmail}:`, error);
    return {
      success: false,
      error: error.message || error.toString(),
      email: recipientEmail
    };
  }
}

module.exports = {
  sendRegistrationEmail
};
