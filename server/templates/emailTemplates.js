const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const verificationStatusEmailTemplate = ({ name, verificationStatus }) => {
  const safeName = escapeHtml(name);
  const isVerified = verificationStatus === 'verified';
  const heading = isVerified
    ? 'Your volunteer account is verified'
    : 'Update on your volunteer account';
  const message = isVerified
    ? 'Your account has been approved. You can now access verified-volunteer features.'
    : 'Your account verification was not approved. Please contact the SevaSahayog team if you need more information.';

  return `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#25313c;">
        <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
          <div style="background:#ffffff;border-radius:10px;padding:28px;border:1px solid #e5e7eb;">
            <h2 style="margin:0 0 16px;color:#1f5f52;">${heading}</h2>
            <p style="line-height:1.6;">Hello ${safeName},</p>
            <p style="line-height:1.6;">${message}</p>
            <p style="margin-top:24px;line-height:1.6;">Regards,<br>SevaSahayog Foundation</p>
          </div>
          <p style="text-align:center;font-size:12px;color:#6b7280;">
            This is an automated account-status notification.
          </p>
        </div>
      </body>
    </html>
  `;
};

const adminVerificationRequestEmailTemplate = ({
  volunteerName,
  volunteerEmail,
}) => {
  const safeName = escapeHtml(volunteerName);
  const safeEmail = escapeHtml(volunteerEmail);

  return `
    <!doctype html>
    <html lang="en">
      <body style="margin:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#25313c;">
        <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
          <div style="background:#ffffff;border-radius:10px;padding:28px;border:1px solid #e5e7eb;">
            <h2 style="margin:0 0 16px;color:#1f5f52;">Volunteer verification required</h2>
            <p style="line-height:1.6;">A new volunteer has registered and is waiting for verification.</p>
            <p style="line-height:1.6;"><strong>Name:</strong> ${safeName}</p>
            <p style="line-height:1.6;"><strong>Email:</strong> ${safeEmail}</p>
            <p style="line-height:1.6;">Please review this account from the Admin dashboard.</p>
          </div>
          <p style="text-align:center;font-size:12px;color:#6b7280;">
            This notification contains no password or authentication token.
          </p>
        </div>
      </body>
    </html>
  `;
};

module.exports = {
  verificationStatusEmailTemplate,
  adminVerificationRequestEmailTemplate,
};
