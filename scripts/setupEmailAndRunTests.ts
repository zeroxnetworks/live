import { adminDb as db } from "../server/firebaseAdmin";
import { buildEnhancedEmailHtml } from "../server/emailAlertEngine";
import nodemailer from "nodemailer";

const SENDER_EMAIL = "zeroxnetworks@gmail.com";
const SENDER_PASS = "bhae qdwc nzas cucy";
const ADMIN_EMAIL = "info.rynmirza@gmail.com";

async function main() {
  console.log("==================================================");
  console.log("STEP 1: UPDATING PERMANENT SMTP SETTINGS IN FIRESTORE");
  console.log("==================================================");

  const smtpDoc = {
    host: "smtp.gmail.com",
    port: "465",
    user: SENDER_EMAIL,
    pass: SENDER_PASS,
    receiver: ADMIN_EMAIL,
    receiverDeposit: ADMIN_EMAIL,
    receiverSubscription: ADMIN_EMAIL,
    receiverSmm: ADMIN_EMAIL,
    receiverSms: ADMIN_EMAIL,
    receiverTicket: ADMIN_EMAIL,
    receiverUser: ADMIN_EMAIL,
    toggles: {
      newOrder: true,
      lowBalance: true,
      newUser: true
    },
    updatedAt: new Date().toISOString()
  };

  await db.collection("settings").doc("smtp").set(smtpDoc, { merge: true });
  console.log("✅ Firestore 'settings/smtp' document successfully updated!");

  console.log("\n==================================================");
  console.log("STEP 2: TESTING ALL EMAIL TEMPLATES ONE BY ONE");
  console.log("Sender:", SENDER_EMAIL);
  console.log("Receiver:", ADMIN_EMAIL);
  console.log("==================================================");

  const mailer = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: SENDER_EMAIL,
      pass: SENDER_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify transporter connection
  try {
    await mailer.verify();
    console.log("✅ SMTP Connection Verified & Authenticated with Gmail!");
  } catch (err: any) {
    console.error("❌ Transporter verification failed:", err.message);
  }

  const templates = [
    {
      name: "Welcome Email",
      subject: "Welcome to Zerox Network - Official Professional Account",
      html: `
        <div style="font-family:sans-serif;padding:30px;max-width:600px;margin:0 auto;border:1px solid #e2e8f0;border-radius:24px;background-color:#fff;">
          <h1 style="color:#0f172a;text-align:center;">WELCOME TO <span style="color:#ef4444;">ZEROX</span> NETWORK</h1>
          <p style="color:#334155;font-size:15px;line-height:1.6;">Hello <strong>Test User</strong>,</p>
          <p style="color:#334155;font-size:15px;line-height:1.6;">Your account has been successfully verified and activated on ZeroX Network.</p>
          <div style="text-align:center;margin-top:20px;">
            <a href="https://zeroxnetwork.ai.studio" style="display:inline-block;padding:14px 30px;background-color:#0f172a;color:#fff;text-decoration:none;border-radius:12px;font-weight:bold;">Go to Dashboard</a>
          </div>
        </div>
      `
    },
    {
      name: "Order Confirmation",
      subject: "Order Confirmed - Zerox Network",
      html: `
        <div style="font-family:sans-serif;padding:25px;max-width:600px;margin:0 auto;border:1px solid #10b981;border-radius:20px;background-color:#fff;">
          <h2 style="color:#059669;margin-top:0;">Order Confirmed!</h2>
          <p>Your order #ORD-TEST-101 for <strong>Virtual Number (WhatsApp - USA)</strong> has been placed.</p>
          <p>Amount Paid: <strong>45 PKR</strong></p>
        </div>
      `
    },
    {
      name: "Review Thank You",
      subject: "Thank You for Your Feedback - Zerox Network",
      html: `
        <div style="font-family:sans-serif;padding:25px;max-width:600px;margin:0 auto;border:1px solid #f59e0b;border-radius:20px;background-color:#fff;">
          <h2 style="color:#d97706;margin-top:0;">Thank You for Your Review! ⭐⭐⭐⭐⭐</h2>
          <p>We appreciate your valuable feedback on ZeroX Network services.</p>
        </div>
      `
    },
    {
      name: "Payment Received / Deposit Alert",
      subject: "Payment Received - Zerox Network",
      html: `
        <div style="font-family:sans-serif;padding:25px;max-width:600px;margin:0 auto;border:1px solid #10b981;border-radius:20px;background-color:#fff;">
          <h2 style="color:#059669;margin-top:0;">Payment Confirmed</h2>
          <p>Your wallet deposit of <strong>1000 PKR</strong> via <strong>Easypaisa</strong> was credited successfully.</p>
          <p>Transaction ID: <strong>EP-88991122</strong></p>
        </div>
      `
    },
    {
      name: "Low Balance Warning",
      subject: "Low Balance Warning - Zerox Network",
      html: `
        <div style="font-family:sans-serif;padding:25px;max-width:600px;margin:0 auto;border:1px solid #ef4444;border-radius:20px;background-color:#fff;">
          <h2 style="color:#dc2626;margin-top:0;">Low Wallet Balance Alert</h2>
          <p>Your current wallet balance is running low: <strong>12.50 PKR</strong></p>
          <p>Please top up your account to ensure uninterrupted service.</p>
        </div>
      `
    },
    {
      name: "Support Ticket Reply",
      subject: "New Reply to Your Ticket - Zerox Network",
      html: `
        <div style="font-family:sans-serif;padding:25px;max-width:600px;margin:0 auto;border:1px solid #3b82f6;border-radius:20px;background-color:#fff;">
          <h2 style="color:#2563eb;margin-top:0;">Support Ticket Response</h2>
          <p>There is a new reply from support regarding Ticket #TKT-884.</p>
          <p><em>"Your cash deposit has been manually verified and approved."</em></p>
        </div>
      `
    },
    {
      name: "Password Changed / Security Alert",
      subject: "Security Alert: Password Changed - Zerox Network",
      html: `
        <div style="font-family:sans-serif;padding:25px;max-width:600px;margin:0 auto;border:1px solid #64748b;border-radius:20px;background-color:#fff;">
          <h2 style="color:#334155;margin-top:0;">Security Alert</h2>
          <p>Your ZeroX Network account password was updated from Chrome on macOS.</p>
          <p>Time: ${new Date().toLocaleString()}</p>
        </div>
      `
    },
    {
      name: "Admin Deposit Alert",
      subject: "[Admin Alert] New Deposit Received - User Test",
      html: `
        <div style="font-family:sans-serif;padding:25px;max-width:600px;margin:0 auto;border:1px solid #059669;border-radius:20px;background-color:#f0fdf4;">
          <h2 style="color:#166534;margin-top:0;">[ADMIN SYSTEM ALERT] New Deposit</h2>
          <p>User <strong>info.rynmirza@gmail.com</strong> deposited <strong>500 PKR</strong> via JazzCash.</p>
          <p>TxID: <strong>JZ-77889900</strong></p>
        </div>
      `
    }
  ];

  let sentCount = 0;
  for (const t of templates) {
    try {
      const formattedHtml = buildEnhancedEmailHtml(t.html, t.subject);
      const info = await mailer.sendMail({
        from: `ZeroX Networks <${SENDER_EMAIL}>`,
        to: ADMIN_EMAIL,
        subject: `[TEST BATCH] ${t.subject}`,
        html: formattedHtml
      });
      sentCount++;
      console.log(`  ✅ Sent template: "${t.name}" -> ${ADMIN_EMAIL} [MessageID: ${info.messageId}]`);
    } catch (err: any) {
      console.error(`  ❌ Failed sending template "${t.name}":`, err.message);
    }
  }

  console.log(`\n🎉 Template Test Batch complete! ${sentCount}/${templates.length} delivered to ${ADMIN_EMAIL}`);

  console.log("\n==================================================");
  console.log("STEP 3: SENDING 'GOOD MORNING & ALL SERVICES OPERATIONAL' EMAIL TO ALL USERS");
  console.log("==================================================");

  const usersSnap = await db.collection("users").get();
  const userEmailsSet = new Set<string>();
  userEmailsSet.add(ADMIN_EMAIL);

  usersSnap.forEach(doc => {
    const uData = doc.data();
    if (uData.email && uData.email.includes("@")) {
      userEmailsSet.add(uData.email.trim());
    }
  });

  const recipientList = Array.from(userEmailsSet);
  console.log(`Found ${recipientList.length} user email(s) in database to notify:`, recipientList);

  const gmSubject = "Good Morning from ZeroX Network - All Systems & Services Operational ⚡";
  const gmInnerHtml = `
    <div style="padding: 10px 0;">
      <h2 style="color: #0f172a; margin: 0 0 10px 0; font-size: 24px; font-weight: 800;">Good Morning! ☀️</h2>
      <p style="color: #334155; font-size: 15px; line-height: 1.7;">
        Good morning! We hope you have an incredible and productive day ahead.
      </p>
      <p style="color: #334155; font-size: 15px; line-height: 1.7;">
        We are pleased to confirm that <strong>all services on the ZeroX Network platform are working at 100% full performance</strong> with instant OTP delivery, automated cash deposit verification, and SMM processing.
      </p>
      
      <div style="margin: 20px 0; padding: 20px; background-color: #f0fdf4; border-radius: 16px; border: 1px solid #bbf7d0;">
        <h3 style="margin: 0 0 10px 0; color: #166534; font-size: 15px; font-weight: 800;">⚡ Live Operational Status:</h3>
        <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
          <li><strong>Virtual Phone Numbers & Instant OTP:</strong> 100% Operational</li>
          <li><strong>SMM Growth Panel & Order Processing:</strong> 100% Operational</li>
          <li><strong>Automated Cash Deposits (Easypaisa / JazzCash):</strong> Active & Automated</li>
          <li><strong>24/7 Priority Support Desk:</strong> Ready on WhatsApp (+44 7868 713315)</li>
        </ul>
      </div>

      <p style="color: #334155; font-size: 15px; line-height: 1.7; margin-bottom: 0;">
        Come on over to our platform <strong style="color: #ef4444;">zeroxnetwork.ai.studio</strong> to access your dashboard, place new orders, or manage your balance.
      </p>
    </div>
  `;
  const gmHtml = buildEnhancedEmailHtml(gmInnerHtml, "Good Morning from ZeroX Network ☀️");

  let gmCount = 0;
  for (const userEmail of recipientList) {
    try {
      const info = await mailer.sendMail({
        from: `ZeroX Networks <${SENDER_EMAIL}>`,
        to: userEmail,
        subject: gmSubject,
        html: gmHtml
      });
      gmCount++;
      console.log(`  ✅ Sent Good Morning email -> ${userEmail} [MessageID: ${info.messageId}]`);
    } catch (err: any) {
      console.error(`  ❌ Failed sending Good Morning email to ${userEmail}:`, err.message);
    }
  }

  console.log(`\n🎉 Good Morning Broadcast complete! Delivered to ${gmCount}/${recipientList.length} user inbox(es).`);
  console.log("\n==================================================");
  console.log("ALL EMAIL OPERATIONS EXECUTED SUCCESSFULLY!");
  console.log("==================================================");
  process.exit(0);
}

main().catch(err => {
  console.error("Fatal Error:", err);
  process.exit(1);
});
