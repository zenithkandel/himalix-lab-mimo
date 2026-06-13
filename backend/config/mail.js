const nodemailer = require('nodemailer');
const { pool } = require('./db');

async function getMailTransporter() {
  const [rows] = await pool.query(
    "SELECT key_name, key_value FROM himalix_store.settings WHERE key_name IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure')"
  );

  const config = {};
  rows.forEach(r => {
    config[r.key_name] = r.key_value;
  });

  const host = config.smtp_host || '';
  const port = parseInt(config.smtp_port, 10) || 587;
  const user = config.smtp_user || '';
  const pass = config.smtp_pass || '';
  const secure = config.smtp_secure === '1' || port === 465;

  if (!host || !user || !pass) {
    console.warn('SMTP configuration is incomplete. Emails will not be sent.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
    tls: {
      rejectUnauthorized: false
    }
  });
}

/**
 * Sends a generic styled HTML email to a user.
 */
async function sendEmail({ to, subject, title, htmlBody }) {
  try {
    const transporter = await getMailTransporter();
    if (!transporter) return;

    const [senderRows] = await pool.query("SELECT key_value FROM himalix_store.settings WHERE key_name = 'smtp_user'");
    const fromAddress = (senderRows.length > 0 && senderRows[0].key_value) || 'noreply@himalix.store';

    // Get emergency helpline details
    const [settingsRows] = await pool.query(
      "SELECT key_name, key_value FROM himalix_store.settings WHERE key_name IN ('emergency_contact_phone', 'emergency_contact_email')"
    );
    const settings = {};
    settingsRows.forEach(r => { settings[r.key_name] = r.key_value; });
    const footerPhone = settings.emergency_contact_phone || '+977-9800000000';
    const footerEmail = settings.emergency_contact_email || 'support@himalix.store';

    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #000000;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #0d0d0d;
      border: 1px solid #262626;
      padding: 40px;
    }
    .email-header {
      border-bottom: 1px solid #262626;
      padding-bottom: 20px;
      margin-bottom: 30px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #ffffff;
      text-transform: uppercase;
      text-decoration: none;
    }
    .logo-accent {
      color: #d4a017;
    }
    .email-title {
      font-size: 20px;
      font-weight: 400;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 0;
      margin-bottom: 20px;
      color: #ffffff;
      border-bottom: 1px solid #1f1f1f;
      padding-bottom: 10px;
    }
    .email-body {
      font-size: 15px;
      line-height: 1.6;
      color: #cccccc;
    }
    .email-body p {
      margin-top: 0;
      margin-bottom: 15px;
    }
    .email-body strong {
      color: #ffffff;
    }
    .highlight-box {
      background-color: #141414;
      border: 1px solid #262626;
      padding: 20px;
      margin-bottom: 25px;
    }
    .item-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .item-list li {
      padding: 10px 0;
      border-bottom: 1px solid #1f1f1f;
      color: #cccccc;
    }
    .item-list li:last-child {
      border-bottom: none;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #ffffff;
      color: #000000 !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 15px;
    }
    .email-footer {
      border-top: 1px solid #262626;
      padding-top: 20px;
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #666666;
      line-height: 1.5;
    }
    .email-footer a {
      color: #888888;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="logo">HX <span class="logo-accent">HIMALIX</span></div>
    </div>
    <div class="email-body">
      <h1 class="email-title">${title}</h1>
      ${htmlBody}
    </div>
    <div class="email-footer">
      &copy; 2026 Himalix Labs & Store. All rights reserved.<br/>
      Helpline: <a href="tel:${footerPhone}">${footerPhone}</a> | Email: <a href="mailto:${footerEmail}">${footerEmail}</a>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `"Himalix System" <${fromAddress}>`,
      to,
      subject: `[Himalix] ${subject}`,
      html: fullHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}. Subject: ${subject}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
  }
}

async function sendNotificationEmail(eventType, subject, htmlBody) {
  try {
    const transporter = await getMailTransporter();
    if (!transporter) return;

    // Get list of receiver emails subscribed to this event type
    let field = '';
    if (eventType === 'order_placed') field = 'notify_on_order_placed';
    else if (eventType === 'low_stock') field = 'notify_on_low_stock';
    else if (eventType === 'user_registered') field = 'notify_on_user_registered';

    if (!field) {
      console.error(`Invalid eventType: ${eventType}`);
      return;
    }

    const [receivers] = await pool.query(
      `SELECT email_address FROM himalix_store.email_notification_receivers WHERE ${field} = 1`
    );

    if (receivers.length === 0) {
      console.log(`No notification receivers found for event type: ${eventType}`);
      return;
    }

    const recipientList = receivers.map(r => r.email_address).join(', ');

    const [senderRows] = await pool.query("SELECT key_value FROM himalix_store.settings WHERE key_name = 'smtp_user'");
    const fromAddress = (senderRows.length > 0 && senderRows[0].key_value) || 'noreply@himalix.store';

    // Get emergency helpline details
    const [settingsRows] = await pool.query(
      "SELECT key_name, key_value FROM himalix_store.settings WHERE key_name IN ('emergency_contact_phone', 'emergency_contact_email')"
    );
    const settings = {};
    settingsRows.forEach(r => { settings[r.key_name] = r.key_value; });
    const footerPhone = settings.emergency_contact_phone || '+977-9800000000';
    const footerEmail = settings.emergency_contact_email || 'support@himalix.store';

    const titleMap = {
      order_placed: 'New Store Order Received',
      low_stock: 'Low Stock Alert',
      user_registered: 'New User Registered'
    };
    const title = titleMap[eventType] || 'System Notification';

    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #000000;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #0d0d0d;
      border: 1px solid #262626;
      padding: 40px;
    }
    .email-header {
      border-bottom: 1px solid #262626;
      padding-bottom: 20px;
      margin-bottom: 30px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #ffffff;
      text-transform: uppercase;
      text-decoration: none;
    }
    .logo-accent {
      color: #d4a017;
    }
    .email-title {
      font-size: 20px;
      font-weight: 400;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 0;
      margin-bottom: 20px;
      color: #ffffff;
      border-bottom: 1px solid #1f1f1f;
      padding-bottom: 10px;
    }
    .email-body {
      font-size: 15px;
      line-height: 1.6;
      color: #cccccc;
    }
    .email-body p {
      margin-top: 0;
      margin-bottom: 15px;
    }
    .email-body strong {
      color: #ffffff;
    }
    .highlight-box {
      background-color: #141414;
      border: 1px solid #262626;
      padding: 20px;
      margin-bottom: 25px;
    }
    .item-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .item-list li {
      padding: 10px 0;
      border-bottom: 1px solid #1f1f1f;
      color: #cccccc;
    }
    .item-list li:last-child {
      border-bottom: none;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #ffffff;
      color: #000000 !important;
      text-decoration: none;
      font-weight: 600;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 15px;
    }
    .email-footer {
      border-top: 1px solid #262626;
      padding-top: 20px;
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #666666;
      line-height: 1.5;
    }
    .email-footer a {
      color: #888888;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="logo">HX <span class="logo-accent">HIMALIX</span></div>
    </div>
    <div class="email-body">
      <h1 class="email-title">${title}</h1>
      ${htmlBody}
    </div>
    <div class="email-footer">
      &copy; 2026 Himalix Labs & Store. All rights reserved.<br/>
      Helpline: <a href="tel:${footerPhone}">${footerPhone}</a> | Email: <a href="mailto:${footerEmail}">${footerEmail}</a>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `"Himalix System" <${fromAddress}>`,
      to: recipientList,
      subject: `[Himalix] ${subject}`,
      html: fullHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Notification email sent for ${eventType} to ${recipientList}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending notification email for ${eventType}:`, error);
  }
}

/**
 * Sends a forwarded contact message to the configured portfolio admin emails.
 */
async function sendContactForwardEmail({ name, email, subject, message }) {
  try {
    const [rows] = await pool.query(
      "SELECT setting_key, setting_value FROM himalix_portfolio.labs_site_settings WHERE setting_key IN ('smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_secure', 'smtp_forward_enabled')"
    );

    const config = {};
    rows.forEach(r => {
      config[r.setting_key] = r.setting_value;
    });

    if (config.smtp_forward_enabled !== '1') {
      return; // Forwarding not enabled
    }

    const host = config.smtp_host || '';
    const port = parseInt(config.smtp_port, 10) || 587;
    const user = config.smtp_user || '';
    const pass = config.smtp_pass || '';
    const secure = config.smtp_secure === '1' || port === 465;

    // Fetch active email receivers from himalix_portfolio.email_forwarding_receivers
    const [receiversRows] = await pool.query(
      "SELECT email_address FROM himalix_portfolio.email_forwarding_receivers WHERE active = 1"
    );
    
    if (receiversRows.length === 0) {
      console.log('No active email forwarding receivers found.');
      return;
    }

    const receivers = receiversRows.map(r => r.email_address).join(', ');

    if (!host || !user || !pass) {
      console.warn('Portfolio SMTP forwarding configuration is incomplete.');
      return;
    }

    // Fetch emergency contact details for the footer
    const [emergencyRows] = await pool.query(
      "SELECT key_name, key_value FROM himalix_store.settings WHERE key_name IN ('emergency_contact_phone', 'emergency_contact_email')"
    );
    const emergencySettings = {};
    emergencyRows.forEach(r => { emergencySettings[r.key_name] = r.key_value; });
    const footerPhone = emergencySettings.emergency_contact_phone || '+977-9800000000';
    const footerEmail = emergencySettings.emergency_contact_email || 'support@himalix.store';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });

    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #000000;
      color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    .email-container {
      max-width: 600px;
      margin: 20px auto;
      background-color: #0d0d0d;
      border: 1px solid #262626;
      padding: 40px;
    }
    .email-header {
      border-bottom: 1px solid #262626;
      padding-bottom: 20px;
      margin-bottom: 30px;
      text-align: center;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #ffffff;
      text-transform: uppercase;
      text-decoration: none;
    }
    .logo-accent {
      color: #d4a017;
    }
    .email-title {
      font-size: 20px;
      font-weight: 400;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-top: 0;
      margin-bottom: 20px;
      color: #ffffff;
      border-bottom: 1px solid #1f1f1f;
      padding-bottom: 10px;
    }
    .email-body {
      font-size: 15px;
      line-height: 1.6;
      color: #cccccc;
    }
    .email-body p {
      margin-top: 0;
      margin-bottom: 15px;
    }
    .email-body strong {
      color: #ffffff;
    }
    .inquiry-details {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }
    .inquiry-details td {
      padding: 12px 10px;
      border-bottom: 1px solid #1f1f1f;
      font-size: 14px;
    }
    .inquiry-details td.label {
      width: 30%;
      color: #888888;
      font-weight: 600;
    }
    .inquiry-details td.value {
      color: #ffffff;
    }
    .message-box {
      background-color: #141414;
      border-left: 3px solid #d4a017;
      padding: 20px;
      font-size: 14px;
      line-height: 1.6;
      color: #dddddd;
      white-space: pre-line;
      margin-top: 15px;
      margin-bottom: 25px;
    }
    .email-footer {
      border-top: 1px solid #262626;
      padding-top: 20px;
      margin-top: 40px;
      text-align: center;
      font-size: 12px;
      color: #666666;
      line-height: 1.5;
    }
    .email-footer a {
      color: #888888;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div class="logo">HX <span class="logo-accent">HIMALIX</span></div>
    </div>
    <div class="email-body">
      <h1 class="email-title">New Contact Inquiry</h1>
      <p>A new message has been submitted via the Himalix landing page contact form. The details are as follows:</p>
      
      <table class="inquiry-details">
        <tr>
          <td class="label">Name</td>
          <td class="value">${name}</td>
        </tr>
        <tr>
          <td class="label">Email</td>
          <td class="value"><a href="mailto:${email}" style="color: #d4a017; text-decoration: none;">${email}</a></td>
        </tr>
        <tr>
          <td class="label">Subject</td>
          <td class="value">${subject || 'No Subject'}</td>
        </tr>
      </table>

      <strong>Inquiry Message:</strong>
      <div class="message-box">${message}</div>
    </div>
    <div class="email-footer">
      This is an automated system notification forwarded from your contact page.<br/>
      &copy; 2026 Himalix Labs & Store. All rights reserved.<br/>
      Helpline: <a href="tel:${footerPhone}">${footerPhone}</a> | Email: <a href="mailto:${footerEmail}">${footerEmail}</a>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: `"Himalix Contact Form" <${user}>`,
      to: receivers,
      subject: `[Himalix Inquiry] ${subject || 'New Contact Form Submission'}`,
      html: fullHtml
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Contact forward email sent to ${receivers}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('Error in sendContactForwardEmail:', error);
  }
}

module.exports = {
  sendEmail,
  sendNotificationEmail,
  sendContactForwardEmail
};
