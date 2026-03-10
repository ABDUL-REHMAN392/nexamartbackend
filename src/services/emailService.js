import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Base Template ────────────────────────────────
const baseTemplate = ({ content, previewText = "Nexamart" }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Nexamart</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f0f4f8;
      margin: 0;
      padding: 0;
      -webkit-text-size-adjust: 100%;
    }

    .email-wrapper {
      width: 100%;
      background-color: #f0f4f8;
      padding: 40px 16px;
    }

    .container {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
    }

    /* ── Header ── */
    .header {
      background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
      padding: 36px 40px;
      text-align: center;
    }

    .logo-ring {
      width: 64px;
      height: 64px;
      background: rgba(255,255,255,0.15);
      border-radius: 50%;
      display: table;
      margin: 0 auto 14px;
      border: 2px solid rgba(255,255,255,0.3);
    }

    .logo-inner {
      display: table-cell;
      vertical-align: middle;
      text-align: center;
      font-size: 28px;
      font-weight: 900;
      color: #ffffff;
      letter-spacing: -1px;
    }

    .brand-name {
      color: #ffffff;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin: 0;
    }

    .brand-tagline {
      color: rgba(255,255,255,0.75);
      font-size: 12px;
      margin-top: 4px;
      letter-spacing: 1px;
    }

    /* ── Body ── */
    .body {
      padding: 40px 44px;
      color: #374151;
      font-size: 15px;
      line-height: 1.7;
    }

    .greeting {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 10px;
    }

    .message {
      color: #6b7280;
      font-size: 15px;
      margin-bottom: 28px;
    }

    /* ── OTP Card ── */
    .otp-wrapper {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border: 1px solid #bfdbfe;
      border-radius: 14px;
      padding: 28px 20px;
      text-align: center;
      margin: 24px 0;
      position: relative;
      overflow: hidden;
    }

    .otp-label {
      font-size: 11px;
      font-weight: 700;
      color: #3b82f6;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }

    .otp-code {
      font-size: 42px;
      font-weight: 900;
      color: #1d4ed8;
      letter-spacing: 14px;
      line-height: 1;
      font-variant-numeric: tabular-nums;
      margin-left: 14px; /* letter-spacing offset */
    }

    .otp-divider {
      width: 40px;
      height: 2px;
      background: #93c5fd;
      margin: 14px auto;
      border-radius: 2px;
    }

    .otp-expiry {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 12px;
      border-radius: 20px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ── CTA Button ── */
    .btn-wrapper {
      text-align: center;
      margin: 28px 0;
    }

    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #1a73e8 0%, #0d47a1 100%);
      color: #ffffff !important;
      padding: 14px 36px;
      border-radius: 50px;
      text-decoration: none;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 0.3px;
      box-shadow: 0 4px 14px rgba(26, 115, 232, 0.4);
    }

    /* ── Warning Box ── */
    .warning-box {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      background: #fff7ed;
      border: 1px solid #fed7aa;
      border-left: 4px solid #f97316;
      border-radius: 10px;
      padding: 14px 16px;
      margin: 20px 0 0;
      font-size: 13px;
      color: #9a3412;
      line-height: 1.6;
    }

    .warning-icon {
      font-size: 16px;
      flex-shrink: 0;
      margin-top: 1px;
    }

    /* ── Info Note ── */
    .note {
      font-size: 13px;
      color: #9ca3af;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #f3f4f6;
      line-height: 1.6;
    }

    /* ── Welcome Features ── */
    .features {
      display: table;
      width: 100%;
      margin: 24px 0;
      border-collapse: separate;
      border-spacing: 0 10px;
    }

    .feature-row {
      display: table-row;
    }

    .feature-icon {
      display: table-cell;
      width: 40px;
      vertical-align: middle;
      font-size: 20px;
      padding: 8px 0;
    }

    .feature-text {
      display: table-cell;
      vertical-align: middle;
      padding: 8px 0 8px 12px;
      font-size: 14px;
      color: #374151;
      border-bottom: 1px solid #f3f4f6;
    }

    .feature-text strong {
      display: block;
      color: #111827;
      font-weight: 600;
      margin-bottom: 2px;
    }

    /* ── Divider ── */
    .divider {
      height: 1px;
      background: #f3f4f6;
      margin: 24px 0;
    }

    /* ── Footer ── */
    .footer {
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      padding: 24px 40px;
      text-align: center;
    }

    .footer-logo {
      font-size: 13px;
      font-weight: 800;
      color: #1a73e8;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .footer-text {
      color: #9ca3af;
      font-size: 12px;
      line-height: 1.6;
    }

    .footer-links {
      margin-top: 12px;
      font-size: 12px;
    }

    .footer-links a {
      color: #6b7280;
      text-decoration: none;
      margin: 0 8px;
    }

    @media (max-width: 600px) {
      .body { padding: 28px 24px; }
      .footer { padding: 20px 24px; }
      .otp-code { font-size: 34px; letter-spacing: 10px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="container">

      <!-- Header -->
      <div class="header">
        <div class="logo-ring">
          <span class="logo-inner">N</span>
        </div>
        <div class="brand-name">Nexamart</div>
        <div class="brand-tagline">Quality you can trust</div>
      </div>

      <!-- Body -->
      <div class="body">
        ${content}
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-logo">NEXAMART</div>
        <div class="footer-text">
          &copy; ${new Date().getFullYear()} Nexamart Store. All rights reserved.<br>
          This is an automated email, please do not reply.
        </div>
        <div class="footer-links">
          <a href="${process.env.FRONTEND_URL}">Shop</a> &middot;
          <a href="${process.env.FRONTEND_URL}/help">Help</a> &middot;
          <a href="${process.env.FRONTEND_URL}/privacy">Privacy</a>
        </div>
      </div>

    </div>
  </div>
</body>
</html>`;

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: `"Nexamart" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("Nexamart Email Error:", error);
  }
};

// ─── 1. Registration Email Verification ──────────
export const sendVerificationOTP = async (user, otp) => {
  const html = baseTemplate({
    previewText: "Your Nexamart verification code",
    content: `
      <div class="greeting">Verify your email ✉️</div>
      <p class="message">
        Hi <strong>${user.name}</strong>, welcome to Nexamart!<br>
        Use the code below to complete your registration.
      </p>

      <div class="otp-wrapper">
        <div class="otp-label">Your Verification Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-divider"></div>
        <span class="otp-expiry">⏱ Expires in 10 minutes</span>
      </div>

      <div class="note">
        Enter this code on the Nexamart verification page to activate your account.
        If you did not create an account, you can safely ignore this email.
      </div>
    `,
  });
  await sendEmail({ to: user.email, subject: "Nexamart — Verify Your Email", html });
};

// ─── 2. Forgot Password OTP ───────────────────────
export const sendForgotPasswordOTP = async (user, otp) => {
  const html = baseTemplate({
    previewText: "Reset your Nexamart password",
    content: `
      <div class="greeting">Password reset 🔐</div>
      <p class="message">
        Hi <strong>${user.name}</strong>,<br>
        We received a request to reset your password. Use the code below to verify your identity.
      </p>

      <div class="otp-wrapper">
        <div class="otp-label">Password Reset Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-divider"></div>
        <span class="otp-expiry">⏱ Expires in 10 minutes</span>
      </div>

      <div class="warning-box">
        <span class="warning-icon">⚠️</span>
        <span>If you did not request a password reset, please ignore this email. Your account remains secure.</span>
      </div>
    `,
  });
  await sendEmail({ to: user.email, subject: "Nexamart — Password Reset Code", html });
};

// ─── 3. Email Update OTP ──────────────────────────
export const sendEmailUpdateOTP = async (newEmail, userName, otp) => {
  const html = baseTemplate({
    previewText: "Confirm your new email address",
    content: `
      <div class="greeting">Confirm new email 📬</div>
      <p class="message">
        Hi <strong>${userName}</strong>,<br>
        You requested to update your email address. Use the code below to confirm your new email.
      </p>

      <div class="otp-wrapper">
        <div class="otp-label">Email Confirmation Code</div>
        <div class="otp-code">${otp}</div>
        <div class="otp-divider"></div>
        <span class="otp-expiry">⏱ Expires in 10 minutes</span>
      </div>

      <div class="warning-box">
        <span class="warning-icon">⚠️</span>
        <span>If you did not request this change, please ignore this email. No changes will be made.</span>
      </div>
    `,
  });
  await sendEmail({ to: newEmail, subject: "Nexamart — Confirm New Email", html });
};

// ─── 4. Welcome Email ─────────────────────────────
export const sendWelcomeEmail = async (user) => {
  const html = baseTemplate({
    previewText: "Welcome to Nexamart — start shopping!",
    content: `
      <div class="greeting">Welcome aboard, ${user.name}! 🎉</div>
      <p class="message">
        Your account is verified and ready to go.<br>
        Here's what you can do on Nexamart:
      </p>

      <div class="features">
        <div class="feature-row">
          <div class="feature-icon">🛍️</div>
          <div class="feature-text">
            <strong>Shop thousands of products</strong>
            Browse our curated collections at great prices
          </div>
        </div>
        <div class="feature-row">
          <div class="feature-icon">🚚</div>
          <div class="feature-text">
            <strong>Fast & reliable delivery</strong>
            Track your orders in real time
          </div>
        </div>
        <div class="feature-row">
          <div class="feature-icon">❤️</div>
          <div class="feature-text">
            <strong>Save your favorites</strong>
            Build your wishlist and never miss a deal
          </div>
        </div>
      </div>

      <div class="btn-wrapper">
        <a href="${process.env.FRONTEND_URL}" class="btn">Start Shopping Now →</a>
      </div>

      <div class="note">
        Need help? Visit our <a href="${process.env.FRONTEND_URL}/help" style="color: #1a73e8; text-decoration: none;">Help Center</a> anytime.<br>
        Happy shopping — <strong>Team Nexamart</strong>
      </div>
    `,
  });
  await sendEmail({ to: user.email, subject: "Welcome to Nexamart! 🎉", html });
};

// Backward compatibility
export const sendPasswordResetOTP = sendForgotPasswordOTP;