const { getTransporter } = require('../config/mailer');

const sendEmail = async ({ to, subject, text, html }) => {
  if (!to || !subject || !text || !html) {
    throw new Error('Email recipient, subject, text, and HTML are required');
  }

  return getTransporter().sendMail({
    from: {
      name: process.env.EMAIL_FROM_NAME || 'SevaSahayog Foundation',
      address: process.env.EMAIL_FROM_ADDRESS || process.env.SMTP_USER,
    },
    to,
    subject,
    text,
    html,
  });
};

module.exports = { sendEmail };
