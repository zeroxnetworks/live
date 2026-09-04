import { adminDb } from "./firebaseAdmin";
import nodemailer from "nodemailer";

const APP_URL = (process.env.APP_URL || "https://zeroxnetwork.com").replace(/\/+$/, "");
const APP_HOSTNAME = (() => {
  try {
    return new URL(APP_URL).hostname;
  } catch (e) {
    return "zeroxnetwork.com";
  }
})();

export async function getAsyncEmailAlertsConfig() {
  let dbConfig: any = {};
  try {
    const doc = await adminDb.collection('settings').doc('smtp').get();
    dbConfig = doc.exists ? doc.data() : {};
  } catch (err) {
    console.warn("Failed to fetch SMTP settings from DB:", err);
  }

  const smtpHost = dbConfig.host || process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(dbConfig.port || process.env.SMTP_PORT || "465", 10) || 465;
  const smtpSecure = smtpPort === 465;
  const smtpUser = dbConfig.user || process.env.SMTP_USER || "zeroxnetworks@gmail.com";
  const smtpPassword = dbConfig.pass || process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.IMAP_PASS || "bhae qdwc nzas cucy";
  const fromEmail = dbConfig.user || process.env.EMAIL_ALERTS_FROM_EMAIL || "zeroxnetworks@gmail.com";
  
  return {
    fromEmail,
    smtpHost,
    smtpPort,
    smtpSecure,
    smtpUser,
    smtpPassword
  };
}

export function getEmailAlertsConfig() {
  const fromEmail = process.env.EMAIL_ALERTS_FROM_EMAIL || "zeroxnetworks@gmail.com";
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10) || 465;
  const smtpSecure = smtpPort === 465;
  const smtpUser = process.env.SMTP_USER || "zeroxnetworks@gmail.com";
  const smtpPassword = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.IMAP_PASS || "bhae qdwc nzas cucy";
  return { fromEmail, smtpHost, smtpPort, smtpSecure, smtpUser, smtpPassword };
}

export interface SendEmailOptions {
  host?: string;
  port?: number | string;
  user?: string;
  pass?: string;
}

export function buildEnhancedEmailHtml(contentHtml: string, title: string = "ZeroX Network Notification") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${title}</title>
  <!--[if mso]>
  <style type="text/css">
    table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style>
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      max-width: 100% !important;
      background-color: #030712 !important;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      overflow-x: hidden !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
    }
    body, table, td, p, a, li, blockquote, div, span, h1, h2, h3, h4, h5, h6 {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
      word-break: normal !important;
      overflow-wrap: break-word !important;
      box-sizing: border-box !important;
    }
    a[href^="mailto:"], a[href^="http"], .break-all, .monospace-id {
      word-break: break-all !important;
      overflow-wrap: anywhere !important;
    }
    * {
      box-sizing: border-box !important;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
      display: block;
    }
    table {
      border-collapse: collapse !important;
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
    td, th {
      box-sizing: border-box !important;
      overflow-wrap: break-word !important;
    }
    .outer-wrapper {
      width: 100% !important;
      max-width: 100% !important;
      padding: 4px 6px !important;
      box-sizing: border-box !important;
      margin: 0 auto !important;
    }
    .email-container {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 auto !important;
      box-sizing: border-box !important;
      border-radius: 10px !important;
    }
    a[style*="background"], a.btn-cta, .btn-cta, button {
      max-width: 100% !important;
      box-sizing: border-box !important;
      white-space: nowrap !important;
      display: inline-block !important;
      text-align: center !important;
      padding: 6px 14px !important;
      margin-top: 6px !important;
      margin-bottom: 6px !important;
      font-size: 11px !important;
      border-radius: 6px !important;
    }
    @media only screen and (max-width: 600px) {
      .outer-wrapper {
        padding: 4px 6px !important;
        width: 100% !important;
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        box-sizing: border-box !important;
        border-radius: 10px !important;
      }
      .inner-card {
        padding: 8px 10px !important;
        box-sizing: border-box !important;
        width: 100% !important;
        font-size: 11px !important;
        line-height: 1.35 !important;
      }
      .inner-card p, .inner-card div, .inner-card li {
        margin-top: 2px !important;
        margin-bottom: 4px !important;
        font-size: 11px !important;
        line-height: 1.35 !important;
      }
      .inner-card h1 {
        font-size: 14px !important;
        font-size: clamp(12px, 3.8vw, 15px) !important;
        margin-top: 4px !important;
        margin-bottom: 4px !important;
        line-height: 1.25 !important;
        word-break: normal !important;
      }
      .inner-card h2 {
        font-size: 13px !important;
        font-size: clamp(11.5px, 3.5vw, 14px) !important;
        margin-top: 4px !important;
        margin-bottom: 4px !important;
        line-height: 1.25 !important;
        word-break: normal !important;
      }
      .inner-card h3, .inner-card h4 {
        font-size: 12px !important;
        font-size: clamp(11px, 3.2vw, 13px) !important;
        margin-top: 3px !important;
        margin-bottom: 3px !important;
        line-height: 1.25 !important;
        word-break: normal !important;
      }
      .inner-card span[style*="font-size: 38px"],
      .inner-card span[style*="font-size:38px"],
      .inner-card span[style*="font-size: 36px"],
      .inner-card span[style*="font-size:36px"],
      .inner-card span[style*="font-size: 32px"],
      .inner-card span[style*="font-size:32px"],
      .inner-card span[style*="font-size: 24px"],
      .inner-card span[style*="font-size:24px"] {
        font-size: 20px !important;
        font-size: clamp(16px, 5.5vw, 22px) !important;
        line-height: 1.2 !important;
      }
      .inner-card hr {
        margin: 6px 0 !important;
      }
      .header-padding {
        padding: 10px 10px 6px !important;
        box-sizing: border-box !important;
        width: 100% !important;
      }
      .header-title {
        font-size: 13px !important;
        font-size: clamp(11px, 3.5vw, 13.5px) !important;
        margin-top: 4px !important;
        margin-bottom: 0 !important;
        line-height: 1.25 !important;
        word-break: normal !important;
      }
      .contact-block {
        margin: 0 6px 6px !important;
        padding: 6px 4px !important;
        box-sizing: border-box !important;
        width: auto !important;
        border-radius: 8px !important;
      }
      .contact-block p {
        margin-bottom: 3px !important;
        font-size: 8px !important;
      }
      .contact-grid-td {
        display: table-cell !important;
        width: 33.33% !important;
        padding: 2px 3px !important;
        box-sizing: border-box !important;
        font-size: 8px !important;
        vertical-align: top !important;
      }
      .contact-grid-td div {
        font-size: 8px !important;
        line-height: 1.2 !important;
        white-space: nowrap !important;
        overflow: hidden !important;
        text-overflow: ellipsis !important;
      }
      .contact-grid-td a {
        font-size: 8px !important;
        line-height: 1.2 !important;
        display: block !important;
        white-space: nowrap !important;
        word-break: normal !important;
      }
      .contact-grid-td-middle {
        border-left: 1px solid #1e293b !important;
        border-right: 1px solid #1e293b !important;
        border-top: none !important;
        border-bottom: none !important;
        padding: 2px 3px !important;
      }
      .btn-cta, a[style*="background"] {
        display: inline-block !important;
        text-align: center !important;
        box-sizing: border-box !important;
        padding: 6px 14px !important;
        font-size: 11px !important;
        margin-top: 6px !important;
        margin-bottom: 6px !important;
        border-radius: 6px !important;
        white-space: nowrap !important;
      }
      .data-table, table {
        margin-top: 4px !important;
        margin-bottom: 4px !important;
      }
      .data-table td, table td {
        padding: 3px 4px !important;
        font-size: 10px !important;
        font-size: clamp(9px, 2.8vw, 10.5px) !important;
        line-height: 1.25 !important;
      }
      .email-footer {
        padding: 6px 8px !important;
        font-size: 8px !important;
        line-height: 1.3 !important;
      }
      .email-footer p {
        margin-bottom: 2px !important;
        font-size: 7.5px !important;
      }
      ul, ol {
        padding-left: 14px !important;
        margin-top: 2px !important;
        margin-bottom: 4px !important;
      }
      li {
        margin-bottom: 2px !important;
      }
      div, table, td, p, img, a, span, h1, h2, h3, h4, h5, h6 {
        max-width: 100% !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #cbd5e1; width: 100% !important; max-width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <div class="outer-wrapper" style="background-color: #030712; padding: 4px 6px; width: 100%; max-width: 100%; box-sizing: border-box; margin: 0 auto;">
    
    <!-- Top Browser Link -->
    <div style="text-align: center; margin-bottom: 4px; width: 100%; box-sizing: border-box;">
      <a href="${APP_URL}" style="color: #64748b; font-size: 9.5px; text-decoration: underline; font-weight: 500;">View this email in your browser</a>
    </div>

    <!-- Central Wrapper Card -->
    <div class="email-container" style="width: 100%; max-width: 100%; margin: 0 auto; background-color: #0b0f19; border-radius: 10px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8); box-sizing: border-box;">
      
      <!-- Header Banner with Brand Glow Line -->
      <div class="header-padding" style="background: linear-gradient(180deg, #070b14 0%, #0f172a 100%); padding: 12px 14px 8px; text-align: center; border-bottom: 2px solid #00AEEF; box-sizing: border-box; width: 100%;">
        <a href="${APP_URL}" style="text-decoration: none; display: inline-block; max-width: 100%;">
          <div style="display: inline-block; max-width: 100%;">
            <span style="font-size: 17px; font-weight: 900; color: #ffffff; letter-spacing: 0.12em; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
              ZEROX <span style="color: #00AEEF;">NETWORK</span>
            </span>
          </div>
        </a>
        <div style="color: #38bdf8; font-size: 8.5px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 2px;">
          One Platform Endless Possibilities
        </div>
        ${title ? `<h1 class="header-title" style="color: #ffffff; margin: 6px 0 0 0; font-size: 13.5px; font-weight: 800; letter-spacing: -0.02em;">${title}</h1>` : ''}
      </div>

      <!-- Main Body Content -->
      <div class="inner-card" style="padding: 10px 12px; color: #cbd5e1; font-size: 11px; line-height: 1.4; background-color: #0b0f19; box-sizing: border-box; width: 100%;">
        ${contentHtml}
      </div>

      <!-- Assistance & Contact Section -->
      <div class="contact-block" style="margin: 0 8px 6px; background-color: #070b14; border: 1px solid #1e293b; border-radius: 8px; padding: 6px 4px; text-align: center; box-sizing: border-box; width: auto;">
        <p style="margin: 0 0 4px 0; color: #00AEEF; font-weight: 800; font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase;">
          NEED ASSISTANCE OR HAVE INQUIRIES?
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 0 auto; box-sizing: border-box; table-layout: fixed;">
          <tr>
            <td class="contact-grid-td" style="width: 33.33%; vertical-align: top; text-align: center; padding: 2px 3px; box-sizing: border-box;">
              <div style="color: #38bdf8; font-size: 8px; font-weight: 700; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">💬 WhatsApp</div>
              <a href="https://wa.me/447868713315" style="color: #ffffff; text-decoration: none; font-size: 8px; font-weight: 600; display: block; white-space: nowrap;">Send Message</a>
            </td>
            <td class="contact-grid-td contact-grid-td-middle" style="width: 33.33%; vertical-align: top; text-align: center; padding: 2px 3px; border-left: 1px solid #1e293b; border-right: 1px solid #1e293b; box-sizing: border-box;">
              <div style="color: #38bdf8; font-size: 8px; font-weight: 700; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">📧 Inquiry Email</div>
              <a href="mailto:zeroxnetworks@gmail.com" style="color: #ffffff; text-decoration: none; font-size: 8px; font-weight: 600; display: block; white-space: nowrap;">Send Mail</a>
            </td>
            <td class="contact-grid-td" style="width: 33.33%; vertical-align: top; text-align: center; padding: 2px 3px; box-sizing: border-box;">
              <div style="color: #38bdf8; font-size: 8px; font-weight: 700; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">🌐 Domain</div>
              <a href="${APP_URL}" style="color: #ffffff; text-decoration: none; font-size: 8px; font-weight: 600; display: block; white-space: nowrap;">Visit Website</a>
            </td>
          </tr>
        </table>
      </div>

      <!-- Footer -->
      <div class="email-footer" style="background-color: #030712; padding: 8px 10px; text-align: center; border-top: 1px solid #1e293b; color: #64748b; font-size: 8.5px; line-height: 1.35; box-sizing: border-box; width: 100%;">
        <div style="margin-bottom: 2px;">
          <span style="color: #ffffff; font-weight: 900; font-size: 10px; letter-spacing: 0.08em;">ZEROX <span style="color: #00AEEF;">NETWORK</span></span>
        </div>
        <p style="margin: 0 0 2px 0; color: #94a3b8;">© 2026 ZeroX Network. All Rights Reserved.</p>
        <p style="margin: 0 0 3px 0; color: #38bdf8; font-weight: 600; font-size: 7.5px;">
          🛡️ Encrypted &nbsp;|&nbsp; 🌐 Secure &nbsp;|&nbsp; ⚡ Trusted
        </p>
        <p style="margin: 0; color: #475569; font-size: 7.5px;">
          This is an automated system notification dispatched to your registered address.
        </p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

/**
 * Build Registration Email Verification OTP Template
 */
export function buildRegistrationOtpEmail(username: string, otpCode: string, email: string): string {
  const innerHtml = `
    <div style="background-color:#070b14;padding:16px 18px;border-radius:12px;border:1px solid #1e293b;margin-bottom:12px;">
      <div style="text-align:center;margin-bottom:14px;">
        <span style="background-color:rgba(0,174,239,0.15);color:#38bdf8;border:1px solid rgba(0,174,239,0.3);padding:4px 14px;border-radius:50px;font-size:9.5px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;display:inline-block;">
          ⚡ EMAIL VERIFICATION
        </span>
        <h2 style="color:#ffffff;font-size:16px;font-weight:800;margin:8px 0 2px 0;">Welcome to ZeroX Network</h2>
        <p style="color:#94a3b8;font-size:11px;margin:0;">Activate Your Account with One-Time Passcode</p>
      </div>

      <p style="color:#ffffff;font-size:12.5px;line-height:1.5;margin-top:0;margin-bottom:8px;">
        Hello <strong style="color:#38bdf8;">${username}</strong>,
      </p>
      <p style="color:#cbd5e1;font-size:11.5px;line-height:1.5;margin:0 0 14px 0;">
        Thank you for choosing <strong>ZeroX Network</strong>. To complete your account registration and verify your email address (<span style="color:#38bdf8;">${email}</span>), please enter the 6-digit verification code below:
      </p>

      <!-- OTP Box -->
      <div style="text-align:center;padding:18px 12px;background:linear-gradient(180deg, #09101d 0%, #060a12 100%);border-radius:12px;border:2px dashed #00AEEF;margin:16px 0;box-shadow:0 4px 20px rgba(0,174,239,0.15);">
        <div style="font-size:9px;color:#00AEEF;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">
          YOUR 6-DIGIT VERIFICATION CODE
        </div>
        <div style="font-size:32px;font-weight:900;letter-spacing:8px;color:#38bdf8;font-family:Consolas, Monaco, monospace;display:inline-block;padding:2px 0;">
          ${otpCode}
        </div>
        <div style="font-size:10px;color:#94a3b8;margin-top:8px;font-weight:600;">
          ⏱️ Valid for <strong style="color:#f8fafc;">10 minutes</strong> only
        </div>
      </div>

      <!-- Security Notice -->
      <div style="background-color:rgba(15,23,42,0.8);border-left:3px solid #00AEEF;padding:10px 12px;border-radius:6px;margin-top:14px;">
        <p style="color:#93c5fd;font-size:10.5px;margin:0;line-height:1.45;">
          🔒 <strong>Security Warning:</strong> Never share this OTP with anyone. ZeroX staff and administrators will never ask for your verification code.
        </p>
      </div>

      <!-- Summary Info -->
      <div style="background-color:#0b0f19;padding:10px 12px;border-radius:8px;border:1px solid #1e293b;margin-top:12px;font-size:10px;color:#94a3b8;line-height:1.6;">
        <div>Account: <strong style="color:#ffffff;">${username}</strong></div>
        <div>Target Email: <strong style="color:#ffffff;">${email}</strong></div>
        <div>Timestamp: <strong style="color:#ffffff;">${new Date().toUTCString()}</strong></div>
      </div>
    </div>

    <div style="text-align:center;margin-top:14px;margin-bottom:8px;">
      <a href="${APP_URL}/" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg, #00AEEF 0%, #0072ff 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:800;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;box-shadow:0 4px 15px rgba(0,174,239,0.35);">
        Verify &amp; Activate Account →
      </a>
    </div>
  `;
  return buildEnhancedEmailHtml(innerHtml, "Account Email Verification Code");
}

/**
 * Build Welcome & Account Activated Confirmation Email
 */
export function buildWelcomeActivatedEmail(username: string, email: string, fullName?: string): string {
  const innerHtml = `
    <div style="background-color:#070b14;padding:16px 18px;border-radius:12px;border:1px solid #1e293b;margin-bottom:12px;">
      <div style="text-align:center;margin-bottom:14px;">
        <span style="background-color:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);padding:4px 14px;border-radius:50px;font-size:9.5px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;display:inline-block;">
          ✅ ACCOUNT ACTIVATED &amp; VERIFIED
        </span>
        <h2 style="color:#ffffff;font-size:16px;font-weight:800;margin:8px 0 2px 0;">Welcome to ZeroX Network!</h2>
        <p style="color:#94a3b8;font-size:11px;margin:0;">Instant Digital &amp; Telecom Solutions Platform</p>
      </div>

      <p style="color:#ffffff;font-size:12.5px;line-height:1.5;margin-top:0;margin-bottom:8px;">
        Hello <strong style="color:#38bdf8;">${fullName || username}</strong>,
      </p>
      <p style="color:#cbd5e1;font-size:11.5px;line-height:1.5;margin:0 0 14px 0;">
        Your ZeroX Network account has been successfully verified and activated. You now have full access to our high-speed automated services:
      </p>

      <div style="display:grid;gap:8px;margin:12px 0;">
        <div style="background-color:#0b0f19;padding:10px 12px;border-radius:8px;border:1px solid #1e293b;">
          <div style="color:#38bdf8;font-weight:800;font-size:11px;margin-bottom:2px;">📱 Instant Virtual Numbers &amp; SMS OTPs</div>
          <div style="color:#94a3b8;font-size:10px;">Receive SMS codes for WhatsApp, Telegram, Google, TikTok, and 100+ services worldwide.</div>
        </div>
        <div style="background-color:#0b0f19;padding:10px 12px;border-radius:8px;border:1px solid #1e293b;">
          <div style="color:#38bdf8;font-weight:800;font-size:11px;margin-bottom:2px;">🚀 High-Speed SMM Social Campaigns</div>
          <div style="color:#94a3b8;font-size:10px;">Automated followers, views, likes, and engagement at wholesale direct server rates.</div>
        </div>
        <div style="background-color:#0b0f19;padding:10px 12px;border-radius:8px;border:1px solid #1e293b;">
          <div style="color:#38bdf8;font-weight:800;font-size:11px;margin-bottom:2px;">💳 Multi-Channel Instant Wallet Top-up</div>
          <div style="color:#94a3b8;font-size:10px;">Easypaisa, JazzCash, Nayapay, Sadapay, Bank Transfer, and 50+ Crypto tokens via NOWPayments.</div>
        </div>
      </div>

      <div style="background-color:#0b0f19;padding:10px 12px;border-radius:8px;border:1px solid #1e293b;margin-top:12px;font-size:10px;color:#94a3b8;line-height:1.6;">
        <div>Registered Username: <strong style="color:#ffffff;">${username}</strong></div>
        <div>Registered Email: <strong style="color:#ffffff;">${email}</strong></div>
        <div>Account Status: <strong style="color:#4ade80;">Active &amp; Verified</strong></div>
      </div>
    </div>

    <div style="text-align:center;margin-top:14px;margin-bottom:8px;">
      <a href="${APP_URL}/" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg, #00AEEF 0%, #0072ff 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:800;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;box-shadow:0 4px 15px rgba(0,174,239,0.35);">
        Open ZeroX Dashboard →
      </a>
    </div>
  `;
  return buildEnhancedEmailHtml(innerHtml, "Account Activated Successfully");
}

/**
 * Build Dedicated Password Reset Link Email Template (for Account Settings Reset Flow)
 */
export function buildPasswordResetLinkEmail(username: string, email: string, resetLink: string): string {
  const innerHtml = `
    <div style="background-color:#070b14;padding:18px 20px;border-radius:12px;border:1px solid #1e293b;margin-bottom:14px;">
      <div style="text-align:center;margin-bottom:16px;">
        <span style="background-color:rgba(0,174,239,0.15);color:#38bdf8;border:1px solid rgba(0,174,239,0.35);padding:4px 16px;border-radius:50px;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;display:inline-block;">
          🔑 PASSWORD RESET
        </span>
        <h2 style="color:#ffffff;font-size:18px;font-weight:900;margin:10px 0 3px 0;letter-spacing:-0.01em;">Reset Your Password</h2>
        <p style="color:#94a3b8;font-size:11.5px;margin:0;">Secure Account Recovery Request</p>
      </div>

      <p style="color:#ffffff;font-size:13px;line-height:1.5;margin-top:0;margin-bottom:10px;">
        Hello <strong style="color:#38bdf8;">${username}</strong>,
      </p>
      <p style="color:#cbd5e1;font-size:12px;line-height:1.6;margin:0 0 16px 0;">
        We received a request to reset the password for your ZeroX Network account (<span style="color:#38bdf8;font-weight:600;">${email}</span>).
      </p>
      <p style="color:#cbd5e1;font-size:12px;line-height:1.6;margin:0 0 18px 0;">
        Click the button below to securely create a new password. This link is time-limited and single-use.
      </p>

      <!-- Primary Action CTA Button -->
      <div style="text-align:center;padding:16px 12px;background:linear-gradient(180deg, #09101d 0%, #060a12 100%);border-radius:12px;border:1px solid #1e293b;margin:16px 0;">
        <a href="${resetLink}" class="btn-cta" style="display:inline-block;padding:12px 32px;background:linear-gradient(135deg, #00AEEF 0%, #0072ff 100%);color:#ffffff;text-decoration:none;border-radius:10px;font-weight:900;font-size:12.5px;letter-spacing:0.08em;text-transform:uppercase;box-shadow:0 4px 18px rgba(0,174,239,0.38);">
          RESET MY PASSWORD
        </a>
        <div style="font-size:10.5px;color:#94a3b8;margin-top:10px;font-weight:600;">
          ⏱️ Link expires in <strong style="color:#f8fafc;">1 hour</strong> &bull; Single-use only
        </div>
      </div>

      <!-- Security Notice -->
      <div style="background-color:rgba(59,130,246,0.08);border-left:3px solid #00AEEF;padding:10px 12px;border-radius:6px;margin-top:14px;">
        <p style="color:#93c5fd;font-size:10.5px;margin:0;line-height:1.45;">
          🔒 <strong>Security Notice:</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged. Never share or forward this link with anyone.
        </p>
      </div>

      <!-- Account Summary Info -->
      <div style="background-color:#0b0f19;padding:10px 12px;border-radius:8px;border:1px solid #1e293b;margin-top:12px;font-size:10px;color:#94a3b8;line-height:1.6;">
        <div>ZeroX Account: <strong style="color:#ffffff;">${username}</strong></div>
        <div>Account Email: <strong style="color:#ffffff;">${email}</strong></div>
        <div>Authorized Domain: <strong style="color:#38bdf8;">${APP_HOSTNAME}</strong></div>
        <div>Request Timestamp: <strong style="color:#ffffff;">${new Date().toUTCString()}</strong></div>
      </div>
    </div>
  `;
  return buildEnhancedEmailHtml(innerHtml, "Reset Your ZeroX Network Password");
}

/**
 * Build Password Reset Email Verification OTP Template
 */
export function buildPasswordResetOtpEmail(username: string, otpCode: string, email: string): string {
  const innerHtml = `
    <div style="background-color:#070b14;padding:16px 18px;border-radius:12px;border:1px solid #1e293b;margin-bottom:12px;">
      <div style="text-align:center;margin-bottom:14px;">
        <span style="background-color:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);padding:4px 14px;border-radius:50px;font-size:9.5px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;display:inline-block;">
          🔒 PASSWORD RECOVERY
        </span>
        <h2 style="color:#ffffff;font-size:16px;font-weight:800;margin:8px 0 2px 0;">Reset Your Password</h2>
        <p style="color:#94a3b8;font-size:11px;margin:0;">Authorization Verification Code</p>
      </div>

      <p style="color:#ffffff;font-size:12.5px;line-height:1.5;margin-top:0;margin-bottom:8px;">
        Hello <strong style="color:#38bdf8;">${username}</strong>,
      </p>
      <p style="color:#cbd5e1;font-size:11.5px;line-height:1.5;margin:0 0 14px 0;">
        We received a request to reset your password for your <strong>ZeroX Network</strong> account (<span style="color:#38bdf8;">${email}</span>). Use the 6-digit verification code below to authorize your password update:
      </p>

      <!-- OTP Box -->
      <div style="text-align:center;padding:18px 12px;background:linear-gradient(180deg, #09101d 0%, #060a12 100%);border-radius:12px;border:2px dashed #ef4444;margin:16px 0;box-shadow:0 4px 20px rgba(239,68,68,0.15);">
        <div style="font-size:9px;color:#f87171;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">
          PASSWORD RESET VERIFICATION CODE
        </div>
        <div style="font-size:32px;font-weight:900;letter-spacing:8px;color:#f87171;font-family:Consolas, Monaco, monospace;display:inline-block;padding:2px 0;">
          ${otpCode}
        </div>
        <div style="font-size:10px;color:#94a3b8;margin-top:8px;font-weight:600;">
          ⏱️ Valid for <strong style="color:#f8fafc;">10 minutes</strong> only
        </div>
      </div>

      <!-- Security Notice -->
      <div style="background-color:rgba(239,68,68,0.1);border-left:3px solid #ef4444;padding:10px 12px;border-radius:6px;margin-top:14px;">
        <p style="color:#fca5a5;font-size:10.5px;margin:0;line-height:1.45;">
          🔒 <strong>Security Warning:</strong> Never share this code with anyone. If you did not request a password reset, please secure your email and contact ZeroX support immediately.
        </p>
      </div>

      <!-- Summary Info -->
      <div style="background-color:#0b0f19;padding:10px 12px;border-radius:8px;border:1px solid #1e293b;margin-top:12px;font-size:10px;color:#94a3b8;line-height:1.6;">
        <div>Account: <strong style="color:#ffffff;">${username}</strong></div>
        <div>Target Email: <strong style="color:#ffffff;">${email}</strong></div>
        <div>Timestamp: <strong style="color:#ffffff;">${new Date().toUTCString()}</strong></div>
      </div>
    </div>

    <div style="text-align:center;margin-top:14px;margin-bottom:8px;">
      <a href="${APP_URL}/" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:800;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;box-shadow:0 4px 15px rgba(239,68,68,0.35);">
        Complete Password Reset →
      </a>
    </div>
  `;
  return buildEnhancedEmailHtml(innerHtml, "Password Reset Verification Code");
}

/**
 * Build Password Reset Success Confirmation Template
 */
export function buildPasswordResetSuccessEmail(username: string, email: string): string {
  const innerHtml = `
    <div style="background-color:#070b14;padding:16px 18px;border-radius:12px;border:1px solid #1e293b;margin-bottom:12px;">
      <div style="text-align:center;margin-bottom:14px;">
        <span style="background-color:rgba(34,197,94,0.15);color:#4ade80;border:1px solid rgba(34,197,94,0.3);padding:4px 14px;border-radius:50px;font-size:9.5px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;display:inline-block;">
          ✅ SECURITY UPDATE CONFIRMED
        </span>
        <h2 style="color:#ffffff;font-size:16px;font-weight:800;margin:8px 0 2px 0;">Password Updated Successfully</h2>
        <p style="color:#94a3b8;font-size:11px;margin:0;">Your ZeroX Network Account is Secure</p>
      </div>

      <p style="color:#ffffff;font-size:12.5px;line-height:1.5;margin-top:0;margin-bottom:8px;">
        Hello <strong style="color:#38bdf8;">${username}</strong>,
      </p>
      <p style="color:#cbd5e1;font-size:11.5px;line-height:1.5;margin:0 0 14px 0;">
        Your password for ZeroX Network (<span style="color:#38bdf8;">${email}</span>) has been updated successfully. You can now use your new password to sign in to all services.
      </p>

      <div style="background-color:#0b0f19;padding:10px 12px;border-radius:8px;border:1px solid #1e293b;margin:12px 0;font-size:10px;color:#94a3b8;line-height:1.6;">
        <div>Account: <strong style="color:#ffffff;">${username}</strong></div>
        <div>Updated At: <strong style="color:#ffffff;">${new Date().toUTCString()}</strong></div>
        <div>Security Formula: <strong style="color:#4ade80;">Strong (8-16 Chars, Uppercase, Lowercase, Number &amp; Symbol)</strong></div>
      </div>

      <div style="background-color:rgba(239,68,68,0.1);border-left:3px solid #ef4444;padding:10px 12px;border-radius:6px;margin-top:14px;">
        <p style="color:#fca5a5;font-size:10.5px;margin:0;line-height:1.45;">
          🔒 <strong>Did not make this change?</strong> If you did not update your password, please contact ZeroX support immediately via WhatsApp (+44 7868 713315) or email zeroxnetworks@gmail.com.
        </p>
      </div>
    </div>

    <div style="text-align:center;margin-top:14px;margin-bottom:8px;">
      <a href="${APP_URL}/" style="display:inline-block;padding:10px 24px;background:linear-gradient(135deg, #00AEEF 0%, #0072ff 100%);color:#ffffff;text-decoration:none;border-radius:8px;font-weight:800;font-size:11.5px;letter-spacing:0.06em;text-transform:uppercase;box-shadow:0 4px 15px rgba(0,174,239,0.35);">
        Login to ZeroX Dashboard →
      </a>
    </div>
  `;
  return buildEnhancedEmailHtml(innerHtml, "Password Updated Successfully");
}

export async function sendEmailAlert(
  to: string, 
  subject: string, 
  html: string, 
  optionsOverride?: SendEmailOptions
): Promise<{success: boolean, error?: string}> {
  try {
    const config = await getAsyncEmailAlertsConfig();
    const finalHost = optionsOverride?.host || config.smtpHost;
    const finalPort = optionsOverride?.port ? parseInt(String(optionsOverride.port), 10) : config.smtpPort;
    const finalUser = optionsOverride?.user || config.smtpUser;
    const finalPass = optionsOverride?.pass !== undefined ? optionsOverride.pass : config.smtpPassword;
    const finalFrom = finalUser || config.fromEmail;
    const finalSecure = finalPort === 465;

    if (!finalPass) {
      console.warn("EMAIL_ALERTS: SMTP password is not set.");
      return { 
        success: false, 
        error: "SMTP Password is missing. Please enter your Gmail App Password in Email Settings and click 'Save & Initialize Alerts'." 
      };
    }

    if (!to) {
      return { success: false, error: "Target receiver email address is missing." };
    }

    const mailer = nodemailer.createTransport({
      host: finalHost,
      port: finalPort,
      secure: finalSecure,
      auth: {
        user: finalUser,
        pass: finalPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await mailer.sendMail({
      from: `ZeroX Networks <${finalFrom}>`,
      to,
      subject,
      html
    });
    
    console.log(`Email alert sent to ${to} [${info.messageId}]`);
    
    try {
      await adminDb.collection("activity_logs").add({
        action: "EMAIL_ALERT_SENT",
        recipient: to,
        subject: subject,
        messageId: info.messageId,
        status: "success",
        timestamp: new Date().toISOString()
      });
    } catch(dbErr) {
      console.warn("Failed to log email alert to firestore", dbErr);
    }

    return { success: true };
  } catch (err: any) {
    console.error(`Failed to send email alert to ${to}:`, err.message, err);
    try {
      await adminDb.collection("email_queue").add({
        to, subject, html,
        status: "failed",
        error: err.message,
        retryCount: 0,
        createdAt: new Date().toISOString()
      });
    } catch(dbErr) {
      console.warn("Failed to queue email", dbErr);
    }
    return { success: false, error: err.message || "Failed to send email." };
  }
}
