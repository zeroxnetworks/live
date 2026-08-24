import crypto from "crypto";
import { sendWhatsAppMessage } from "./whatsappEngine";
import { adminDb } from "./firebaseAdmin";

export type OtpType = "REGISTRATION" | "RECOVERY" | "ADMIN_2FA";

export interface OtpRecord {
  id: string;
  brandId: string;
  appId: string;
  authMethod: "WHATSAPP_OTP";
  otpType: OtpType;
  identifier: string; // email or phone/username
  recipientPhone: string;
  hashedOtp: string;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  expiresAt: number;
  resendCooldownUntil: number;
  verified: boolean;
  ip?: string;
  userAgent?: string;
  device?: string;
}

export interface SecurityAuditLog {
  id: string;
  brandId: string;
  appId: string;
  eventType:
    | "REGISTRATION_OTP_REQUESTED"
    | "REGISTRATION_OTP_VERIFIED"
    | "REGISTRATION_OTP_FAILED"
    | "RECOVERY_OTP_REQUESTED"
    | "RECOVERY_OTP_VERIFIED"
    | "RECOVERY_OTP_FAILED"
    | "ADMIN_2FA_OTP_REQUESTED"
    | "ADMIN_2FA_OTP_VERIFIED"
    | "ADMIN_2FA_OTP_FAILED"
    | "SUSPICIOUS_LOGIN_DETECTED"
    | "ADMIN_LOGIN_SUCCESS"
    | "RATE_LIMIT_BLOCKED";
  identifier: string;
  recipientPhone?: string;
  status: "SUCCESS" | "FAILED" | "BLOCKED" | "PENDING";
  ip?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  details?: string;
  timestamp: string;
  createdAtMs: number;
}

// In-memory fallback cache for high throughput or Firestore connection issues
const inMemoryOtpStore = new Map<string, OtpRecord>();

// Helper to Hash OTP
function hashOtp(otp: string): string {
  return crypto.createHash("sha256").update(`zerox_salt_2026_${otp}`).digest("hex");
}

/**
 * Log Security Event to Firestore `security_audit_logs`
 */
export async function logSecurityEvent(entry: Partial<SecurityAuditLog>): Promise<void> {
  try {
    const logId = `sec_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const fullLog: SecurityAuditLog = {
      id: logId,
      brandId: entry.brandId || "zerox_network",
      appId: entry.appId || "zerox_auth_v1",
      eventType: entry.eventType || "REGISTRATION_OTP_REQUESTED",
      identifier: entry.identifier || "unknown",
      recipientPhone: entry.recipientPhone || "",
      status: entry.status || "SUCCESS",
      ip: entry.ip || "127.0.0.1",
      userAgent: entry.userAgent || "Web Browser",
      device: entry.device || "Desktop",
      browser: entry.browser || "Chrome",
      os: entry.os || "Windows",
      location: entry.location || "Pakistan",
      details: entry.details || "",
      timestamp: new Date().toISOString(),
      createdAtMs: Date.now()
    };

    await adminDb.collection("security_audit_logs").doc(logId).set(fullLog);
  } catch (err) {
    console.warn("[Security Audit Log Error]:", err);
  }
}

/**
 * Check if a WhatsApp number is already registered to another user
 */
export async function isWhatsAppNumberRegistered(phone: string, excludeEmail?: string): Promise<boolean> {
  if (!phone) return false;
  const cleanPhone = phone.replace(/[^\d+]/g, "").trim();
  if (!cleanPhone) return false;

  try {
    const snap1 = await adminDb.collection("users").where("whatsappNumber", "==", cleanPhone).get();
    for (const doc of snap1.docs) {
      if (!excludeEmail || doc.data()?.email?.toLowerCase() !== excludeEmail.toLowerCase()) {
        return true;
      }
    }

    const snap2 = await adminDb.collection("users").where("phone", "==", cleanPhone).get();
    for (const doc of snap2.docs) {
      if (!excludeEmail || doc.data()?.email?.toLowerCase() !== excludeEmail.toLowerCase()) {
        return true;
      }
    }
  } catch (err) {
    console.warn("[WhatsApp Check Error]:", err);
  }
  return false;
}

/**
 * Format OTP WhatsApp Templates
 */
export function formatOtpMessage(otpType: OtpType, otp: string, extra?: { device?: string; time?: string }): string {
  switch (otpType) {
    case "REGISTRATION":
      return `Welcome to Zerox Network.

Your account verification code is:

${otp}

This code expires in 5 minutes.

Do not share this code with anyone.`;

    case "RECOVERY":
      return `Account Recovery Request

Your verification code is:

${otp}

If you did not request this, secure your account immediately.`;

    case "ADMIN_2FA":
      return `Admin Security Verification

Your admin portal login verification code:

${otp}

Device:
${extra?.device || "Web Browser (Chrome)"}

Time:
${extra?.time || new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}`;

    default:
      return `Your Zerox Network verification code is ${otp}. Valid for 5 minutes.`;
  }
}

/**
 * Generate and send WhatsApp OTP
 */
export async function sendWhatsAppOtp(params: {
  identifier: string; // Email or Username or Phone
  phone: string;
  otpType: OtpType;
  brandId?: string;
  appId?: string;
  ip?: string;
  userAgent?: string;
  device?: string;
}): Promise<{ success: boolean; message: string; cooldownSeconds?: number; otpId?: string }> {
  const { identifier, phone, otpType, brandId = "zerox_network", appId = "zerox_auth_v1", ip = "127.0.0.1", userAgent = "", device = "Web Browser" } = params;

  if (!identifier || !phone) {
    return { success: false, message: "Identifier and WhatsApp phone number are required." };
  }

  const cleanPhone = phone.trim();
  const cleanIdentifier = identifier.trim().toLowerCase();
  const docKey = `${brandId}_${otpType}_${cleanIdentifier}`;

  // 1. Check existing active OTP for resend cooldown (60s)
  let existing: OtpRecord | null = null;
  try {
    const docSnap = await adminDb.collection("whatsapp_otps").doc(docKey).get();
    if (docSnap.exists) {
      existing = docSnap.data() as OtpRecord;
    } else if (inMemoryOtpStore.has(docKey)) {
      existing = inMemoryOtpStore.get(docKey)!;
    }
  } catch (e) {
    if (inMemoryOtpStore.has(docKey)) existing = inMemoryOtpStore.get(docKey)!;
  }

  const now = Date.now();
  if (existing && existing.resendCooldownUntil > now) {
    const remainingSeconds = Math.ceil((existing.resendCooldownUntil - now) / 1000);
    await logSecurityEvent({
      brandId,
      appId,
      eventType: otpType === "REGISTRATION" ? "REGISTRATION_OTP_REQUESTED" : otpType === "RECOVERY" ? "RECOVERY_OTP_REQUESTED" : "ADMIN_2FA_OTP_REQUESTED",
      identifier: cleanIdentifier,
      recipientPhone: cleanPhone,
      status: "BLOCKED",
      details: `Rate limit hit. Resend cooldown active for ${remainingSeconds}s`,
      ip,
      userAgent
    });
    return {
      success: false,
      message: `Please wait ${remainingSeconds} seconds before requesting a new OTP code.`,
      cooldownSeconds: remainingSeconds
    };
  }

  // 2. Generate new 6-digit OTP code using cryptographically secure random numbers
  const rawOtp = crypto.randomInt(100000, 999999).toString();
  const hashed = hashOtp(rawOtp);
  const expiresAt = now + 5 * 60 * 1000; // 5 minutes expiry
  const resendCooldownUntil = now + 60 * 1000; // 60 seconds cooldown

  const newRecord: OtpRecord = {
    id: docKey,
    brandId,
    appId,
    authMethod: "WHATSAPP_OTP",
    otpType,
    identifier: cleanIdentifier,
    recipientPhone: cleanPhone,
    hashedOtp: hashed,
    attempts: 0,
    maxAttempts: 5,
    createdAt: now,
    expiresAt,
    resendCooldownUntil,
    verified: false,
    ip,
    userAgent,
    device
  };

  // Invalidate old OTP & store new record in Firestore & memory
  inMemoryOtpStore.set(docKey, newRecord);
  try {
    await adminDb.collection("whatsapp_otps").doc(docKey).set(newRecord);
  } catch (e) {
    console.warn("[WhatsApp OTP Engine] Firestore write fallback to memory:", e);
  }

  // 3. Format and Dispatch WhatsApp Message
  const formattedTime = new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" });
  const waMessage = formatOtpMessage(otpType, rawOtp, { device, time: formattedTime });

  let sentStatus = false;
  try {
    const res = await sendWhatsAppMessage(cleanPhone, waMessage);
    sentStatus = res.success;
  } catch (waErr: any) {
    console.error("[WhatsApp OTP Engine] Dispatch Failed:", waErr);
  }

  // 4. Log Security Audit
  await logSecurityEvent({
    brandId,
    appId,
    eventType: otpType === "REGISTRATION" ? "REGISTRATION_OTP_REQUESTED" : otpType === "RECOVERY" ? "RECOVERY_OTP_REQUESTED" : "ADMIN_2FA_OTP_REQUESTED",
    identifier: cleanIdentifier,
    recipientPhone: cleanPhone,
    status: sentStatus ? "SUCCESS" : "FAILED",
    ip,
    userAgent,
    device,
    details: sentStatus ? `OTP code dispatched via WhatsApp` : `Failed to dispatch WhatsApp OTP`
  });

  if (!sentStatus) {
    return {
      success: false,
      message: "Unable to send WhatsApp OTP message. Please check the WhatsApp number or try again later.",
      otpId: docKey
    };
  }

  return {
    success: true,
    message: "6-digit verification code sent via WhatsApp!",
    cooldownSeconds: 60,
    otpId: docKey
  };
}

/**
 * Verify WhatsApp OTP Code
 */
export async function verifyWhatsAppOtp(params: {
  identifier: string;
  otp: string;
  otpType: OtpType;
  brandId?: string;
  appId?: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ success: boolean; message: string; remainingAttempts?: number }> {
  const { identifier, otp, otpType, brandId = "zerox_network", appId = "zerox_auth_v1", ip = "127.0.0.1", userAgent = "" } = params;

  if (!identifier || !otp) {
    return { success: false, message: "Identifier and OTP code are required." };
  }

  const cleanIdentifier = identifier.trim().toLowerCase();
  const cleanOtp = otp.trim();
  const docKey = `${brandId}_${otpType}_${cleanIdentifier}`;

  let record: OtpRecord | null = null;
  try {
    const docSnap = await adminDb.collection("whatsapp_otps").doc(docKey).get();
    if (docSnap.exists) {
      record = docSnap.data() as OtpRecord;
    } else if (inMemoryOtpStore.has(docKey)) {
      record = inMemoryOtpStore.get(docKey)!;
    }
  } catch (e) {
    if (inMemoryOtpStore.has(docKey)) record = inMemoryOtpStore.get(docKey)!;
  }

  if (!record) {
    await logSecurityEvent({
      brandId,
      appId,
      eventType: otpType === "REGISTRATION" ? "REGISTRATION_OTP_FAILED" : otpType === "RECOVERY" ? "RECOVERY_OTP_FAILED" : "ADMIN_2FA_OTP_FAILED",
      identifier: cleanIdentifier,
      status: "FAILED",
      details: "No active OTP request found. Request a new OTP.",
      ip,
      userAgent
    });
    return { success: false, message: "No active OTP found or code expired. Please request a new verification code." };
  }

  const now = Date.now();

  // Check Expiration (5 minutes)
  if (now > record.expiresAt) {
    await logSecurityEvent({
      brandId,
      appId,
      eventType: otpType === "REGISTRATION" ? "REGISTRATION_OTP_FAILED" : otpType === "RECOVERY" ? "RECOVERY_OTP_FAILED" : "ADMIN_2FA_OTP_FAILED",
      identifier: cleanIdentifier,
      recipientPhone: record.recipientPhone,
      status: "FAILED",
      details: "OTP code has expired (exceeded 5 minutes window)",
      ip,
      userAgent
    });
    return { success: false, message: "OTP code has expired. Please request a new verification code." };
  }

  // Check Max Failed Attempts (5 attempts)
  if (record.attempts >= record.maxAttempts) {
    await logSecurityEvent({
      brandId,
      appId,
      eventType: otpType === "REGISTRATION" ? "REGISTRATION_OTP_FAILED" : otpType === "RECOVERY" ? "RECOVERY_OTP_FAILED" : "ADMIN_2FA_OTP_FAILED",
      identifier: cleanIdentifier,
      recipientPhone: record.recipientPhone,
      status: "BLOCKED",
      details: "Maximum failed attempts exceeded (5/5). Request locked.",
      ip,
      userAgent
    });
    return { success: false, message: "Too many failed attempts (5/5). Please request a new verification code." };
  }

  // Compare Hashed OTP
  const inputHashed = hashOtp(cleanOtp);
  if (inputHashed !== record.hashedOtp) {
    const updatedAttempts = record.attempts + 1;
    const remaining = record.maxAttempts - updatedAttempts;

    record.attempts = updatedAttempts;
    inMemoryOtpStore.set(docKey, record);

    try {
      await adminDb.collection("whatsapp_otps").doc(docKey).update({ attempts: updatedAttempts });
    } catch (e) {
      // fallback
    }

    await logSecurityEvent({
      brandId,
      appId,
      eventType: otpType === "REGISTRATION" ? "REGISTRATION_OTP_FAILED" : otpType === "RECOVERY" ? "RECOVERY_OTP_FAILED" : "ADMIN_2FA_OTP_FAILED",
      identifier: cleanIdentifier,
      recipientPhone: record.recipientPhone,
      status: "FAILED",
      details: `Incorrect OTP code entered (${updatedAttempts}/${record.maxAttempts} attempts used)`,
      ip,
      userAgent
    });

    return {
      success: false,
      message: `Incorrect verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : "Please request a new code."}`,
      remainingAttempts: remaining
    };
  }

  // OTP Verified Successfully!
  record.verified = true;
  inMemoryOtpStore.delete(docKey);

  try {
    await adminDb.collection("whatsapp_otps").doc(docKey).update({ verified: true, verifiedAt: now });
  } catch (e) {
    // fallback
  }

  await logSecurityEvent({
    brandId,
    appId,
    eventType: otpType === "REGISTRATION" ? "REGISTRATION_OTP_VERIFIED" : otpType === "RECOVERY" ? "RECOVERY_OTP_VERIFIED" : "ADMIN_2FA_OTP_VERIFIED",
    identifier: cleanIdentifier,
    recipientPhone: record.recipientPhone,
    status: "SUCCESS",
    details: "WhatsApp OTP code verified successfully!",
    ip,
    userAgent
  });

  return {
    success: true,
    message: "WhatsApp OTP verified successfully!"
  };
}

/**
 * Dispatch Admin Security Alert Notification
 */
export async function sendAdminLoginSecurityAlert(params: {
  adminPhone: string;
  adminName: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  time: string;
}): Promise<void> {
  const { adminPhone, device, browser, os, ip, location, time } = params;

  const alertMessage = `Security Alert

A new admin login was detected.

Device: ${device}
Browser: ${browser}
Operating System: ${os}
IP Address: ${ip}
Location: ${location}
Time: ${time}

Verification completed successfully.`;

  try {
    await sendWhatsAppMessage(adminPhone, alertMessage);
    await logSecurityEvent({
      brandId: "zerox_network",
      appId: "zerox_admin_2fa",
      eventType: "ADMIN_LOGIN_SUCCESS",
      identifier: params.adminName || "Admin",
      recipientPhone: adminPhone,
      status: "SUCCESS",
      ip,
      device,
      browser,
      os,
      location,
      details: "Admin login security alert dispatched via WhatsApp"
    });
  } catch (err) {
    console.warn("[Admin Security Alert Error]:", err);
  }
}

/**
 * Get Security Dashboard Statistics & Recent Audit Logs
 */
export async function getSecurityDashboardStats(): Promise<{
  activeOtpCount: number;
  totalVerifications: number;
  failedAttempts: number;
  blockedRequests: number;
  admin2faEnabled: boolean;
  logs: SecurityAuditLog[];
}> {
  let logs: SecurityAuditLog[] = [];
  try {
    const snap = await adminDb.collection("security_audit_logs").orderBy("createdAtMs", "desc").limit(100).get();
    logs = snap.docs.map(doc => doc.data() as SecurityAuditLog);
  } catch (err) {
    console.warn("[Get Security Stats Error]:", err);
  }

  let totalVerifications = 0;
  let failedAttempts = 0;
  let blockedRequests = 0;

  logs.forEach(log => {
    if (log.status === "SUCCESS" && log.eventType.includes("VERIFIED")) totalVerifications++;
    if (log.status === "FAILED") failedAttempts++;
    if (log.status === "BLOCKED") blockedRequests++;
  });

  return {
    activeOtpCount: inMemoryOtpStore.size,
    totalVerifications,
    failedAttempts,
    blockedRequests,
    admin2faEnabled: true,
    logs
  };
}
