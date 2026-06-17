export function buildPasswordResetEmail(name, resetLink) {
    const requestedAt = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
    });

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your CodeCode password</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ece5;font-family:Georgia,'Times New Roman',serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#f0ece5;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="580" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:580px;width:100%;">

          <!-- ── Logo / header ─────────────────────────────── -->
          <tr>
            <td style="padding-bottom:24px;text-align:left;">
              <span style="font-family:Georgia,serif;font-size:20px;font-weight:700;
                           color:#1e1c17;letter-spacing:-0.5px;">
                CodeCode
              </span>
            </td>
          </tr>

          <!-- ── Card ──────────────────────────────────────── -->
          <tr>
            <td style="background-color:#fefcf8;border:1px solid #ddd8cf;
                       border-radius:10px;overflow:hidden;">

              <!-- Green accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background-color:#3d6b4f;height:4px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>

              <!-- Card body -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="padding:40px 44px 36px;">

                    <p style="margin:0 0 6px;font-family:Georgia,serif;font-size:22px;
                               font-weight:600;color:#1e1c17;letter-spacing:-0.3px;line-height:1.2;">
                      Password reset
                    </p>
                    <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:14px;
                               color:#7a7570;line-height:1.5;">
                      Requested at ${requestedAt} IST
                    </p>

                    <p style="margin:0 0 20px;font-family:Arial,sans-serif;font-size:15px;
                               color:#3a3530;line-height:1.65;">
                      Hi <strong style="color:#1e1c17;">${name}</strong>,
                    </p>

                    <p style="margin:0 0 28px;font-family:Arial,sans-serif;font-size:15px;
                               color:#3a3530;line-height:1.65;">
                      Someone requested a password reset for your CodeCode account.
                      Click the button below to set a new password. If this wasn't you,
                      you can safely ignore this email.
                    </p>

                    <!-- CTA button -->
                    <table cellpadding="0" cellspacing="0" role="presentation"
                           style="margin-bottom:32px;">
                      <tr>
                        <td style="background-color:#3d6b4f;border-radius:7px;">
                          <a href="${resetLink}"
                             style="display:inline-block;padding:13px 30px;
                                    font-family:Arial,sans-serif;font-size:14px;
                                    font-weight:700;color:#ffffff;text-decoration:none;
                                    letter-spacing:0.2px;">
                            Reset my password &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                           style="margin-bottom:24px;">
                      <tr>
                        <td style="border-top:1px solid #e8e3da;font-size:0;line-height:0;">&nbsp;</td>
                      </tr>
                    </table>

                    <!-- Fallback link -->
                    <p style="margin:0 0 6px;font-family:Arial,sans-serif;font-size:12px;
                               color:#7a7570;line-height:1.5;">
                      If the button doesn't work, paste this URL into your browser:
                    </p>
                    <p style="margin:0 0 24px;word-break:break-all;">
                      <a href="${resetLink}"
                         style="font-family:Arial,sans-serif;font-size:12px;
                                color:#3d6b4f;text-decoration:underline;">
                        ${resetLink}
                      </a>
                    </p>

                    <!-- Expiry notice -->
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td style="background-color:#f4f1eb;border:1px solid #e0dbd2;
                                   border-radius:6px;padding:14px 18px;">
                          <p style="margin:0;font-family:Arial,sans-serif;font-size:13px;
                                     color:#5a5550;line-height:1.6;">
                            This link expires in <strong style="color:#1e1c17;">5 minutes</strong>.
                            After that you'll need to request a new one.
                          </p>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- ── Footer ─────────────────────────────────────── -->
          <tr>
            <td style="padding:24px 4px 0;">
              <p style="margin:0;font-family:Arial,sans-serif;font-size:12px;
                         color:#a09a93;line-height:1.6;">
                You're receiving this because a password reset was requested for your
                <strong style="color:#7a7570;">CodeCode</strong> account.
                If you didn't request this, no action is needed &mdash; your password remains unchanged.
              </p>
              <p style="margin:10px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#bdb7af;">
                &copy; ${new Date().getFullYear()} CodeCode &nbsp;&middot;&nbsp; Automated message, please do not reply.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}
