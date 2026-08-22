import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

// Interfaces
export interface PaymentReceived {
  id?: string;
  transaction_id: string;
  amount: number;
  sender_info: string;
  provider?: string;
  status: "pending" | "claimed";
  created_at: string;
}

export interface UserDeposit {
  id?: string;
  user_id: string;
  submitted_tid: string;
  submitted_amount: number;
  screenshot_path?: string;
  status: "auto-approved" | "manual-review";
  processed_at: string;
}

// In-Memory Rate Limiting Tracker: Max 3 attempts per minute per user
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxAttempts = 3;

  const record = rateLimitStore.get(userId);

  if (!record || now > record.resetTime) {
    rateLimitStore.set(userId, { count: 1, resetTime: now + windowMs });
    return { allowed: true };
  }

  if (record.count >= maxAttempts) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfterSeconds: retryAfter };
  }

  record.count += 1;
  return { allowed: true };
}

/**
 * REGEX CONFIGURATION FOR PAYMENT CONFIRMATION EMAILS
 * You can customize these regex patterns for Easypaisa, JazzCash, Meezan Bank, Sadapay, Nayapay, PayPal, Stripe, etc.
 */
export const PAYMENT_EMAIL_PATTERNS = [
  // 1. NayaPay Email Pattern (Support Cha-Ching, Money Received, 1Link, Raast, 6-digit & long TIDs)
  {
    provider: "NayaPay",
    tidRegex: /(?:Transaction ID|NayaPay ID|TID|Trx ID|Ref No|Reference ID|Tran ID|TXN ID|TxID|Reference|Ref|1Link Ref|Raast Ref|Txn)[\s:\-#=]+([A-Za-z0-9-]{8,35})/i,
    amountRegex: /(?:Amount Received|Total Amount|Amount|Credited|Received|Rs\.?|PKR|\$)[\s:\-#=]+(?:Rs\.?|PKR|\$)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  },
  // 2. EasyPaisa / JazzCash / SadaPay Pattern
  {
    provider: "EasyPaisa/JazzCash/SadaPay",
    tidRegex: /(?:Trx ID|TID|Transaction ID|Ref No|Reference|TXN|TxID)[\s:\-#=]+([A-Za-z0-9-]{8,35})/i,
    amountRegex: /(?:Amount|Rs\.?|PKR|USD|\$)[\s:\-#=]+(?:Rs\.?|PKR|\$)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  },
  // 3. Generic Bank Email / Raast Alert
  {
    provider: "Generic Bank / Raast",
    tidRegex: /(?:Reference|Ref|Transaction|ID|TID|Trx|Txn|Receipt)[\s:\-#=]+([A-Za-z0-9-]{8,35})/i,
    amountRegex: /(?:Received|Credited|Amount|Total|Paid)[\s:\-#=]+(?:Rs\.?|PKR|\$)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  },
  // 4. Loose fallback pattern for generic gateways or text notifications
  {
    provider: "Fallback",
    tidRegex: /(?:TID|TRX|TXN|ID|Receipt|Transaction|Ref)[\s:\-#=]+([A-Za-z0-9-]{8,35})/i,
    amountRegex: /(?:Amount|Total|Paid|Received|Rs\.?|PKR)[\s:\-#=]+(?:Rs\.?|PKR|USD|\$)?\s*([0-9,]+(?:\.[0-9]{1,2})?)/i,
  }
];

/**
 * IMAP EMAIL PARSER WORKER
 * Connects to Gmail / Outlook / Custom IMAP server, reads payment alert emails,
 * extracts TID and Amount using Regex, and pushes into database store.
 */
export async function parseUnreadPaymentEmails(
  config: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  },
  saveToDb: (payment: PaymentReceived) => Promise<boolean>
) {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 12000,
    socketTimeout: 25000,
    logger: false,
  });

  let clientError: any = null;
  // Prevent unhandled 'error' event crash on ImapFlow EventEmitter
  client.on("error", (err) => {
    clientError = err;
    const msg = err?.message || String(err);
    if (!msg.includes("Socket timeout") && !msg.includes("ETIMEDOUT") && !msg.includes("AUTHENTICATIONFAILED") && !msg.includes("Invalid credentials")) {
      console.warn("[IMAP Client Error Event]:", msg);
    }
  });

  const parsedPayments: PaymentReceived[] = [];

  try {
    await client.connect();
    // Open INBOX
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Fetch recent 50 messages in INBOX
      
            const fetchTarget = { seen: false };

      // Pass 1: Quick envelope scan to find payment candidate UIDs
      const candidateUids: number[] = [];
      const envelopeList = client.fetch(fetchTarget, { envelope: true, flags: true, uid: true });

      for await (const msg of envelopeList) {
        const from = (msg.envelope?.from?.[0]?.address || "").toLowerCase();
        const subject = (msg.envelope?.subject || "").toLowerCase();

        const isCandidate = from.includes("nayapay") || from.includes("easypaisa") || from.includes("jazzcash") || 
                            from.includes("sadapay") || from.includes("telenor") || from.includes("bank") ||
                            subject.includes("nayapay") || subject.includes("rs.") || subject.includes("pkr") || 
                            subject.includes("received") || subject.includes("got") || subject.includes("deposit") || 
                            subject.includes("alert") || subject.includes("credited");

        if (isCandidate && msg.uid) {
          candidateUids.push(msg.uid);
        }
      }

      // If no candidate filtered, fallback to recent uids
      if (candidateUids.length === 0) {
        const fallbackList = client.fetch(fetchTarget, { flags: true, uid: true });
        for await (const msg of fallbackList) {
          if (msg.uid) {
            candidateUids.push(msg.uid);
            if (candidateUids.length >= 20) break;
          }
        }
      }

      // Pass 2: Download raw source ONLY for filtered candidate UIDs
      if (candidateUids.length > 0) {
        const messages = client.fetch(candidateUids, { source: true, uid: true });

        for await (const message of messages) {
          if (!message.source) continue;

          // Parse email mime source
          const parsed = await simpleParser(message.source);
          const subject = parsed.subject || "";
          const rawText = parsed.text || "";
          const htmlText = (parsed.html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
          const emailBody = `${subject} ${rawText} ${htmlText}`;

      // Skip reversal emails
      if (emailBody.toLowerCase().includes("reversed") || emailBody.toLowerCase().includes("reversal") || emailBody.toLowerCase().includes("unsuccessful")) {
         console.log(`Skipping reversal email: ${message.uid}`);
         continue;
      }
          const sender = parsed.from?.text || "Unknown Sender";

          let extractedTid: string | null = null;
          let extractedAmount: number | null = null;
          let detectedProvider = "Bank / IMAP";

          const lowerBody = emailBody.toLowerCase();
          const lowerSender = sender.toLowerCase();
          if (lowerBody.includes("nayapay") || lowerSender.includes("nayapay")) {
            detectedProvider = "NayaPay";
          } else if (lowerBody.includes("easypaisa") || lowerSender.includes("easypaisa") || lowerSender.includes("telenor")) {
            detectedProvider = "EasyPaisa";
          } else if (lowerBody.includes("jazzcash") || lowerSender.includes("jazzcash") || lowerSender.includes("mobilink")) {
            detectedProvider = "JazzCash";
          } else if (lowerBody.includes("sadapay") || lowerSender.includes("sadapay")) {
            detectedProvider = "SadaPay";
          }

          // Run regex patterns
          for (const pattern of PAYMENT_EMAIL_PATTERNS) {
            const tidMatch = emailBody.match(pattern.tidRegex);
            const amountMatch = emailBody.match(pattern.amountRegex);

            if (tidMatch && tidMatch[1]) {
              const cleanTid = tidMatch[1].replace(/[^A-Za-z0-9]/g, "").trim();
              if (cleanTid.length >= 5) {
                extractedTid = cleanTid;
              }
            }

            if (amountMatch && amountMatch[1]) {
              const cleanAmount = amountMatch[1].replace(/,/g, "");
              const parsedNum = parseFloat(cleanAmount);
              if (!isNaN(parsedNum) && parsedNum > 0) {
                extractedAmount = parsedNum;
              }
            }

            if (extractedTid && extractedAmount) break;
          }

          // Fallback: If subject has amount e.g. "You've received Rs. 500" or "PKR 500 received"
          if (extractedTid && !extractedAmount) {
            const subjAmtMatch = subject.match(/(?:Rs\.?|PKR|\$)\s*([0-9,]+(?:\.[0-9]{1,2})?)/i);
            if (subjAmtMatch && subjAmtMatch[1]) {
              const parsedNum = parseFloat(subjAmtMatch[1].replace(/,/g, ""));
              if (!isNaN(parsedNum) && parsedNum > 0) extractedAmount = parsedNum;
            }
          }

          if (extractedTid) {
            const newPayment: PaymentReceived = {
              transaction_id: extractedTid,
              amount: extractedAmount || 0,
              sender_info: sender,
              provider: detectedProvider,
              status: "pending",
              created_at: new Date().toISOString(),
            };

            const saved = await saveToDb(newPayment);
            if (saved) {
              parsedPayments.push(newPayment);
              try {
                await client.messageFlagsAdd({ uid: message.uid }, ["\\Seen"]);
              } catch (_) {}
            }
          }
        }
      }
    } finally {
      lock.release();
    }
  } catch (err: any) {
    const rawMsg = err?.message || clientError?.message || String(err || "");
    let cleanMsg = rawMsg;
    let shouldLog = true;
    if (rawMsg.includes("AUTHENTICATIONFAILED") || rawMsg.includes("Invalid credentials")) {
      cleanMsg = "Invalid Gmail App Password or IMAP credentials. Please verify your Gmail address and 16-character App Password.";
      shouldLog = false;
    } else if (rawMsg.includes("Socket timeout") || rawMsg.includes("ETIMEDOUT") || rawMsg.includes("Connection not available")) {
      cleanMsg = "IMAP Connection timeout. Please check IMAP host (imap.gmail.com) and port (993).";
      shouldLog = false;
    }
    if (shouldLog) {
      console.warn("[IMAP Engine Error]:", cleanMsg);
    }
    throw new Error(cleanMsg);
  } finally {
    try {
      await client.logout();
    } catch (_) {
      try {
        client.close();
      } catch (__) {}
    }
  }

  return parsedPayments;
}


// --- NEW FULL IMAP ENGINE ---

import { adminDb, admin } from "./firebaseAdmin";
import { sendEmailAlert } from "./emailAlertEngine";

let isPollingActive = false;

function classifyError(err: any): { code: string; message: string } {
  const msg = (err?.message || String(err)).toLowerCase();
  
  if (err?.code === "CONFIG_ERROR" || msg.includes("config_error") || msg.includes("missing credentials") || msg.includes("required")) {
    return { code: "CONFIG_ERROR", message: err.message || "IMAP Configuration Error: Missing host, port, username, or App Password." };
  }
  if (err?.code === "IMAP_SERVICE_UNAVAILABLE" || msg.includes("imap_service_unavailable") || msg.includes("sync is already in progress")) {
    return { code: "IMAP_SERVICE_UNAVAILABLE", message: "IMAP Service Unavailable: Another IMAP sync pipeline is already executing." };
  }
  if (msg.includes("authenticate") || msg.includes("auth") || msg.includes("login") || msg.includes("credential") || msg.includes("password")) {
    return { code: "AUTH_FAILED", message: "Authentication Failed: Please check your IMAP username and App Password." };
  }
  if (msg.includes("timeout") || msg.includes("timed out")) {
    return { code: "CONNECTION_TIMEOUT", message: "Connection Timeout: The IMAP server took too long to respond." };
  }
  if (msg.includes("refused") || msg.includes("econnrefused")) {
    return { code: "CONNECTION_REFUSED", message: "Connection Refused: Could not connect to the IMAP server." };
  }
  if (msg.includes("mailbox") || msg.includes("inbox") || msg.includes("lock") || msg.includes("select")) {
    return { code: "MAILBOX_ERROR", message: "Mailbox Error: Failed to open or lock INBOX folder." };
  }
  if (msg.includes("firestore") || msg.includes("database") || msg.includes("collection") || msg.includes("document")) {
    return { code: "FIRESTORE_ERROR", message: "Firestore Error: Database operation failed." };
  }
  if (msg.includes("parse") || msg.includes("regex") || msg.includes("emailbody")) {
    return { code: "PARSE_ERROR", message: "Parse Error: Failed to process or parse email content." };
  }
  if (msg.includes("econnreset") || msg.includes("socket") || msg.includes("network") || msg.includes("disconnect")) {
    return { code: "NETWORK_ERROR", message: "Network Error: Connection was reset or disconnected unexpectedly." };
  }
  if (err?.code) {
    return { code: String(err.code).toUpperCase(), message: err.message || "IMAP error occurred." };
  }
  
  return { code: "CONNECTION_ERROR", message: err?.message || "An unexpected IMAP connection error occurred." };
}

export async function processImapPaymentsFull(config: any) {
  const logs: string[] = [];
  const log = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    logs.push(`[${ts}] ${msg}`);
    console.log(`[IMAP] ${msg}`);
  };

  log("poll started");

  const host = config?.host || "imap.gmail.com";
  const port = config?.port || 993;
  const user = config?.user || "info.rynmirza@gmail.com";
  const pass = config?.pass || "zmxe jydl hqzg udfm";
  const allowedSenders = config?.allowedSenders || "alerts@easypaisa.com.pk, no-reply@jazzcash.pk, alerts@sadapay.pk, service@nayapay.com, noreply@nayapay.com, meezan@meezanbank.com, no-reply@sadapay.pk";
  const tidRegex = config?.tidRegex || "(?:Transaction ID|NayaPay ID|TID|Trx ID|Ref No|Reference Number|Transaction Ref)[:\\s]*([A-Za-z0-9]+)";

  if (!host || !port || !user || !pass) {
    log("connection error: CONFIG_ERROR");
    const err = new Error("IMAP Host, Port, Username and App Password are required.");
    (err as any).code = "CONFIG_ERROR";
    const classified = classifyError(err);
    return {
      success: false,
      error: classified.message,
      errorCode: classified.code,
      logs
    };
  }

  if (isPollingActive) {
    log("connection error: IMAP_SERVICE_UNAVAILABLE");
    const err = new Error("Another IMAP sync pipeline is already executing.");
    (err as any).code = "IMAP_SERVICE_UNAVAILABLE";
    const classified = classifyError(err);
    return {
      success: false,
      error: classified.message,
      errorCode: classified.code,
      logs
    };
  }

  isPollingActive = false;

  let parsedCount = 0;
  let matchedCount = 0;
  let lock: any = null;
  let client: any = null;

  try {
    log("connecting");
    let retries = 3;
    let delay = 1000;
    while (retries > 0) {
      try {
        client = new ImapFlow({
          host,
          port,
          secure: Number(port) === 993,
          auth: { user, pass },
          connectionTimeout: 15000,
          greetingTimeout: 12000,
          socketTimeout: 25000,
          logger: false,
        });

        client.on("error", (err: any) => {
          const msg = err?.message || String(err);
          if (msg.includes("Socket timeout") || msg.includes("ETIMEDOUT") || msg.includes("ECONNRESET")) {
             // suppress noise for known network issues
             return;
          }
          console.warn("[IMAP Client Background Error]:", msg);
        });


        log(`Initiating connection attempt (${4 - retries}/3)...`);
        await client.connect();
        break; // Success!
      } catch (err: any) {
        retries--;
        const isAuthOrConfig = /auth|credential|login|password/i.test(err.message);
        if (isAuthOrConfig || retries === 0) {
          throw err; // Fail immediately for auth/config, or if we ran out of retries
        }
        log(`retry ${3 - retries}/3 due to error: ${err.message}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }

    log("connected");
    log("authenticated");

    log("INBOX selected");
    lock = await client.getMailboxLock("INBOX");

    log("Scanning mailbox...");
    
      const fetchTarget = { seen: false };
    const messages = client.fetch(fetchTarget, { source: true, uid: true, envelope: true });
    
    const allowedSendersList = String(allowedSenders || "")
      .split(",")
      .map((s: string) => s.trim().toLowerCase())
      .filter((s: string) => s.length > 0);
      
    if (allowedSendersList.length === 0) {
      allowedSendersList.push("service@nayapay.com", "noreply@nayapay.com", "alerts@easypaisa.com.pk", "no-reply@jazzcash.pk", "alerts@sadapay.pk");
    }
    
    let fetchedCount = 0;
    for await (const message of messages) {
      fetchedCount++;
      if (!message.source) continue;
      
      const parsed = await simpleParser(message.source);
      const subject = parsed.subject || "";
      const rawText = parsed.text || "";
      const htmlText = (parsed.html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      const emailBody = `${subject} ${rawText} ${htmlText}`;

      // Skip reversal emails
      if (emailBody.toLowerCase().includes("reversed") || emailBody.toLowerCase().includes("reversal") || emailBody.toLowerCase().includes("unsuccessful")) {
         console.log(`Skipping reversal email: ${message.uid}`);
         continue;
      }
      
      const senderObj = parsed.from?.value?.[0];
      const senderEmail = (senderObj?.address || "").toLowerCase();
              
      const isAuthorized = allowedSendersList.includes(senderEmail);
      if (!isAuthorized) {
        log(`Sender ${senderEmail} not in authorized list, skipping.`);
        continue;
      }
      
      log(`Found 1 new email`);
      log(`Sender authorized: ${senderEmail}`);
      log(`Banking email detected`);
      
      let extractedTid: string | null = null;
      let extractedAmount: number | null = null;
      
      // Ensure NayaPay gets priority matching
      const customPatterns = [
        ...PAYMENT_EMAIL_PATTERNS
      ];
      
      for (const pattern of customPatterns) {
        const tidMatch = emailBody.match(pattern.tidRegex);
        const amountMatch = emailBody.match(pattern.amountRegex);
        
        if (tidMatch && tidMatch[1]) {
          const cleanTid = tidMatch[1].replace(/[^A-Za-z0-9]/g, "").trim();
          if (cleanTid.length >= 5) {
            extractedTid = cleanTid;
          }
        }
        if (amountMatch && amountMatch[1]) {
          const cleanAmount = amountMatch[1].replace(/,/g, "");
          const parsedNum = parseFloat(cleanAmount);
          if (!isNaN(parsedNum) && parsedNum > 0) {
            extractedAmount = parsedNum;
          }
        }
        if (extractedTid && extractedAmount) break;
      }
      
      // Also support user-provided regex as a fallback
      if (!extractedTid && tidRegex) {
         try {
            const uRegex = new RegExp(tidRegex, 'i');
            const tMatch = emailBody.match(uRegex);
            if (tMatch && tMatch[1]) {
               extractedTid = tMatch[1].replace(/[^A-Za-z0-9]/g, "").trim();
            }
         } catch(e) {}
      }
      
      log(`Email Body: ${emailBody}`);
      if (!extractedTid || !extractedAmount) {
         log(`Could not extract Amount and/or TID from email (Amt: ${extractedAmount}, TID: ${extractedTid}).`);
         continue;
      }
      
      log(`--- Processing Email UID: ${message.uid} ---`);
      log(`1. Email/message ID: ${message.uid}`);
      log(`2. Extracted TID: ${extractedTid}`);
      log(`3. Extracted amount: ${extractedAmount}`);
      log(`4. Currency: PKR (implicit in platform)`);
      log(`Searching pending deposits...`);
      
      // Match with DB
      const depositsSnapshot = await adminDb.collection("deposits").where("status", "==", "PENDING").get();
      let matchedDeposit: any = null;
      let matchedDocId: string = "";
      
      let foundPendingTids: string[] = [];
      let foundPendingAmounts: number[] = [];
      let foundPendingIds: string[] = [];

      if (!depositsSnapshot.empty) {
        depositsSnapshot.forEach((doc: any) => {
          const data = doc.data();
          const txId = String(data.txId || data.trxId || "").replace(/[^A-Za-z0-9]/g, "").trim();
          const amount = parseFloat(data.amount !== undefined ? String(data.amount) : "0");
          
          foundPendingIds.push(doc.id);
          foundPendingTids.push(txId);
          foundPendingAmounts.push(amount);

          if (txId.toLowerCase() === String(extractedTid || "").toLowerCase() && amount === extractedAmount) {
            matchedDeposit = data;
            matchedDocId = doc.id;
          }
        });
      }
      
      log(`5. Pending deposit IDs found: ${foundPendingIds.join(", ") || "None"}`);
      log(`6. Pending deposit TIDs: ${foundPendingTids.join(", ") || "None"}`);
      log(`7. Pending deposit amounts: ${foundPendingAmounts.join(", ") || "None"}`);
      
      if (!matchedDeposit && !depositsSnapshot.empty) {
        let mismatchedDocId = "";
        let mismatchedData: any = null;
        let mismatchedAmount = 0;
        
        depositsSnapshot.forEach((doc: any) => {
          const data = doc.data();
          const txId = String(data.txId || data.trxId || "").replace(/[^A-Za-z0-9]/g, "").trim();
          const amount = parseFloat(data.amount !== undefined ? String(data.amount) : "0");
          
          if (txId.toLowerCase() === String(extractedTid || "").toLowerCase() && amount !== extractedAmount) {
            mismatchedDocId = doc.id;
            mismatchedData = data;
            mismatchedAmount = amount;
          }
        });
        
        if (mismatchedData) {
          log(`8. Exact reason if matching fails: TID matched but Amount MISMATCH (Expected ${extractedAmount}, Found ${mismatchedAmount} in DB).`);
          log(`Transitioning status to VERIFICATION_FAILED`);
          
          await adminDb.collection("deposits").doc(mismatchedDocId).update({
            status: "VERIFICATION_FAILED",
            adminNotes: `Verification Failed: Amount mismatch. Verified email amount is Rs. ${extractedAmount}, but user claimed Rs. ${mismatchedAmount}.`,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          try {
            await client.messageFlagsAdd({ uid: message.uid }, ["\\Seen"]);
          } catch (e) {}
          
          continue;
        } else {
          log(`8. Exact reason if matching fails: No pending deposit found with TID ${extractedTid} and Amount ${extractedAmount}`);
        }
      } else if (!matchedDeposit) {
          log(`8. Exact reason if matching fails: No pending deposits exist in the database.`);
      }
      
      if (matchedDeposit) {
        log(`Matching deposit found: #${matchedDocId}`);
        log(`Amount MATCH`);
        log(`Transaction ID MATCH`);
        
        // Check for duplicate TID usage
        let isDuplicate = false;
        
        const usedTidCheck = await adminDb.collection("deposits")
          .where("txId", "==", matchedDeposit.txId)
          .where("status", "==", "APPROVED")
          .get();
          
        const usedTidCheck2 = await adminDb.collection("deposits")
          .where("trxId", "==", matchedDeposit.txId)
          .where("status", "==", "APPROVED")
          .get();
          
        if (!usedTidCheck.empty || !usedTidCheck2.empty) {
           isDuplicate = true;
        }
        
        log(`9. Duplicate-check result: ${isDuplicate ? "FAILED (Already Processed)" : "PASSED"}`);

        if (isDuplicate) {
           log(`Transaction ID already USED/PROCESSED. Rejecting.`);
           await adminDb.collection("deposits").doc(matchedDocId).update({
              status: "ALREADY_PROCESSED",
              adminNotes: "Duplicate TID. Already used.",
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
           });

           if (matchedDeposit.userEmail) {
             try {
               await sendEmailAlert(
                 matchedDeposit.userEmail,
                 `Deposit Rejected — Zerox Network Deposit #${matchedDocId}`,
                 `<p>Your recent deposit request could not be processed.</p>
                  <p><strong>Deposit Request ID:</strong> ${matchedDocId}</p>
                  <p><strong>Transaction/Reference ID:</strong> ${matchedDeposit.txId}</p>
                  <p><strong>Amount:</strong> PKR ${matchedDeposit.amount}</p>
                  <p><strong>Date/Time:</strong> ${new Date().toISOString()}</p>
                  <p><strong>Rejection Reason:</strong> Transaction ID has already been successfully processed and credited previously.</p>
                  <p>If you believe this is an error, please contact our support team.</p>`
               );
             } catch(e) {}
           }
           continue;
        }
        
        log(`AUTO APPROVING`);
        
        // Atomic-like update: update deposit then update user
        const userRef = adminDb.collection("users").doc(matchedDeposit.userId);
        const depositRef = adminDb.collection("deposits").doc(matchedDocId);
        
        let prevBalance = 0;
        let newBalance = 0;
        let transactionId = "";
        let approvalSuccess = false;
        let appliedCryptoRate = 278;

        try {
          await adminDb.runTransaction(async (t: any) => {
             const userDoc = await t.get(userRef);
             if (!userDoc.exists) {
                throw new Error("User document does not exist!");
             }
             const settingsDoc = await t.get(adminDb.collection("settings").doc("zerox_config"));
             appliedCryptoRate = settingsDoc.data()?.cryptoRate || 278;
             const usdTopup = Number(((extractedAmount as number) / appliedCryptoRate).toFixed(2));
             prevBalance = parseFloat(userDoc.data()?.balance || "0");
             newBalance = prevBalance + usdTopup;
             
             t.update(userRef, {
                balance: newBalance
             });
             
             t.update(depositRef, {
                status: "APPROVED",
                adminNotes: `Auto-Approved via IMAP. Amount verified: PKR ${extractedAmount}`,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
             });
             
             // Create transaction history
             transactionId = "TXN" + Math.random().toString(36).substr(2, 9).toUpperCase();
             const newTxRef = adminDb.collection("transactions").doc();
             t.set(newTxRef, {
                id: newTxRef.id,
                userId: matchedDeposit.userId,
                type: "DEPOSIT",
                amount: usdTopup,
                method: matchedDeposit.method || "bank",
                status: "COMPLETED",
                description: `Wallet Deposit (Auto-Verified: ${matchedDeposit.method})`,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                txId: matchedDeposit.txId
             });
          });
          approvalSuccess = true;
          log(`10. Database transaction: SUCCESS`);
        } catch (e: any) {
          log(`10. Database transaction: FAILED - ${e.message}`);
        }
        
        if (!approvalSuccess) {
           continue;
        }

        log(`11. Existing wallet balance before credit: PKR ${prevBalance * appliedCryptoRate}`);
        log(`12. PKR amount credited: PKR ${extractedAmount}`);
        log(`13. Existing wallet balance after credit: PKR ${newBalance * appliedCryptoRate}`);

        try {
          await client.messageFlagsAdd({ uid: message.uid }, ["\\Seen"]);
        } catch (e) {}

        if (matchedDeposit.userEmail) {
           try {
             await sendEmailAlert(
               matchedDeposit.userEmail,
               `Payment Approved — Zerox Network #${matchedDocId}`,
               `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h2 style="color: #0f172a;">ZER0X NETWORK</h2>
  
  <p>Hello <strong>${matchedDeposit.username || matchedDeposit.userEmail}</strong>,</p>
  <p>Your payment has been successfully verified and your Zerox Network wallet has been credited.</p>
  
  <h4 style="color: #0f172a; margin-top: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Transaction Details:</h4>
  <ul style="list-style: none; padding: 0;">
    <li><strong>User Name:</strong> ${matchedDeposit.username || matchedDeposit.userEmail}</li>
    <li><strong>User ID:</strong> ${matchedDeposit.userId}</li>
    <li><strong>User Email:</strong> ${matchedDeposit.userEmail}</li>
    <li><strong>Deposit Request ID:</strong> ${matchedDocId}</li>
    <li><strong>Transaction / Reference ID:</strong> ${extractedTid}</li>
    <li><strong>Payment Method:</strong> ${matchedDeposit.method || 'NayaPay'}</li>
    <li><strong>Exact Amount:</strong> PKR ${(extractedAmount as number).toLocaleString()}</li>
    <li><strong>Exact Currency:</strong> PKR</li>
    <li><strong>Payment Date:</strong> ${new Date().toISOString()}</li>
    <li><strong>Verification Date/Time:</strong> ${new Date().toISOString()}</li>
    <li><strong>Wallet Credit Amount:</strong> PKR ${(extractedAmount as number).toLocaleString()}</li>
    <li><strong>Final Status:</strong> <span style="color: #10b981; font-weight: bold;">APPROVED</span></li>
    <li><strong>Verification Method:</strong> IMAP Verification Engine</li>
  </ul>
  
  <div style="margin-top: 30px;">
    <a href="https://zeroxnetwork.com/wallet" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Wallet Balance</a>
  </div>
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
    <p>Thank you for using Zerox Network.</p>
  </div>
</div>`
             );
             log(`14. Customer email result: SUCCESS`);
           } catch (e: any) {
             log(`14. Customer email result: FAILED - ${e.message}`);
           }
        } else {
           log(`14. Customer email result: SKIPPED (No customer email)`);
        }

        try {
          const smtpDoc = await adminDb.collection('settings').doc('smtp').get();
          let adminEmail = "info.rynmirza@gmail.com";
          if (smtpDoc.exists) {
             adminEmail = smtpDoc.data()?.receiverDeposit || smtpDoc.data()?.user || "info.rynmirza@gmail.com";
          }
          await sendEmailAlert(
            adminEmail,
            `Deposit Automatically Approved — Zerox Network #${matchedDocId}`,
            `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
  <h2 style="color: #0f172a;">ZER0X NETWORK</h2>
  <h3 style="color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">Deposit Verification Notification</h3>
  
  <p><strong style="color: #10b981;">Status: APPROVED — WALLET CREDITED</strong></p>
  <p>Payment successfully verified through the configured IMAP verification engine and credited to the user's wallet.</p>
  
  <h4 style="color: #0f172a; margin-top: 20px;">Transaction Details:</h4>
  <ul style="list-style: none; padding: 0;">
    <li><strong>User Name:</strong> ${matchedDeposit.username || matchedDeposit.userEmail}</li>
    <li><strong>User ID:</strong> ${matchedDeposit.userId}</li>
    <li><strong>User Email:</strong> ${matchedDeposit.userEmail || 'N/A'}</li>
    <li><strong>Deposit Request ID:</strong> ${matchedDocId}</li>
    <li><strong>Transaction / Reference ID:</strong> ${extractedTid}</li>
    <li><strong>Payment Method:</strong> ${matchedDeposit.method || 'NayaPay'}</li>
    <li><strong>Exact Amount:</strong> PKR ${(extractedAmount as number).toLocaleString()}</li>
    <li><strong>Exact Currency:</strong> PKR</li>
    <li><strong>Payment Date:</strong> ${new Date().toISOString()}</li>
    <li><strong>Verification Date/Time:</strong> ${new Date().toISOString()}</li>
    <li><strong>Wallet Credit Amount:</strong> PKR ${(extractedAmount as number).toLocaleString()}</li>
    <li><strong>Final Status:</strong> APPROVED</li>
    <li><strong>Verification Method:</strong> IMAP Verification Engine</li>
  </ul>
  
  <div style="margin-top: 30px;">
    <a href="https://admin.zeroxnetwork.com/deposits/${matchedDocId}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View in Admin Panel</a>
  </div>
  
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
    <p>Zerox Network Automated System</p>
  </div>
</div>`
          );
          log(`15. Admin email result: SUCCESS`);
        } catch (e: any) {
          log(`15. Admin email result: FAILED - ${e.message}`);
        }
        
        log(`COMPLETE`);
        
      } else {
        log(`No matching pending deposit found for amount ${extractedAmount} and TID ${extractedTid}`);
      }
    }
    
    log(`messages fetched: ${fetchedCount}`);
    log(`messages parsed: ${parsedCount}`);
    log("poll completed");

    return { success: true, parsedCount, matchedCount, logs };
  } catch (err: any) {
    const classified = classifyError(err);
    log(`connection error: ${classified.code}`);
    return {
      success: false,
      error: classified.message,
      errorCode: classified.code,
      logs
    };
  } finally {
    if (lock) {
      try {
        await lock.release();
      } catch (_) {}
    }
    try {
      if (client) await client.logout();
    } catch (_) {
      try {
        if (client) client.close();
      } catch (__) {}
    }
    isPollingActive = false;
    log("poll finished");
  }
}
