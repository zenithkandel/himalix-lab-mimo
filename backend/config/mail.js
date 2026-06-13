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
  const secure = config.smtp_secure === '1';

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
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false
    }
  });
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

    const mailOptions = {
      from: `"Himalix System" <${fromAddress}>`,
      to: recipientList,
      subject: `[Himalix] ${subject}`,
      html: htmlBody
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Notification email sent for ${eventType} to ${recipientList}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error(`Error sending notification email for ${eventType}:`, error);
  }
}

module.exports = {
  sendNotificationEmail
};
