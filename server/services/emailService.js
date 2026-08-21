const { sendEmail } = require('../utils/sendEmail');
const {
  verificationStatusEmailTemplate,
  adminVerificationRequestEmailTemplate,
} = require('../templates/emailTemplates');

const sendVerificationStatusEmail = async ({
  email,
  name,
  verificationStatus,
}) => {
  const isVerified = verificationStatus === 'verified';
  const subject = isVerified
    ? 'Your volunteer account has been verified'
    : 'Update on your volunteer account verification';
  const message = isVerified
    ? `Hello ${name}, your volunteer account has been verified.`
    : `Hello ${name}, your volunteer account verification was not approved.`;

  return sendEmail({
    to: email,
    subject,
    text: `${message} This is an automated notification from SevaSahayog Foundation.`,
    html: verificationStatusEmailTemplate({ name, verificationStatus }),
  });
};

const sendAdminVerificationRequestEmail = async ({
  adminEmail,
  volunteerName,
  volunteerEmail,
}) => {
  return sendEmail({
    to: adminEmail,
    subject: 'New volunteer awaiting verification',
    text: `A new volunteer, ${volunteerName} (${volunteerEmail}), is waiting for verification.`,
    html: adminVerificationRequestEmailTemplate({
      volunteerName,
      volunteerEmail,
    }),
  });
};

module.exports = {
  sendVerificationStatusEmail,
  sendAdminVerificationRequestEmail,
};
