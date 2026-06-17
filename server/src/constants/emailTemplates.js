/**
 * Email HTML templates used by the email worker.
 * All templates return a complete HTML string ready to be sent via nodemailer.
 */

/**
 * Builds the branded HTML email body for the password reset link.
 *
 * @param {string} name       - Recipient's display name
 * @param {string} resetLink  - Full reset URL with userid and token params
 * @returns {string} HTML string
 */
export function buildPasswordResetEmail(name, resetLink) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Reset your CodeCode password</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">CodeCode</h1>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:14px;">Competitive Programming Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#f5f5f5;font-size:22px;font-weight:700;">Reset your password</h2>
              <p style="margin:0 0 24px;color:#a0a0a0;font-size:15px;line-height:1.6;">
                Hi <strong style="color:#e0e0e0;">${name}</strong>,<br/>
                We received a request to reset the password for your CodeCode account.
                Click the button below to choose a new password.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetLink}"
                   style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;
                          text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;
                          border-radius:8px;letter-spacing:0.3px;">
                  Reset Password
                </a>
              </div>
              <p style="margin:0 0 8px;color:#a0a0a0;font-size:13px;line-height:1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;word-break:break-all;">
                <a href="${resetLink}" style="color:#818cf8;font-size:12px;">${resetLink}</a>
              </p>
              <hr style="border:none;border-top:1px solid #2a2a2a;margin:24px 0;"/>
              <p style="margin:0;color:#6b6b6b;font-size:12px;line-height:1.6;">
                ⏱ This link expires in <strong style="color:#a0a0a0;">5 minutes</strong>.<br/>
                🔒 If you did not request a password reset, you can safely ignore this email — your password will not change.<br/>
                This is an automated message; please do not reply.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#141414;padding:20px 40px;text-align:center;border-top:1px solid #2a2a2a;">
              <p style="margin:0;color:#4a4a4a;font-size:12px;">© 2025 CodeCode. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
