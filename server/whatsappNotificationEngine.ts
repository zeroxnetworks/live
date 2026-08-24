import { sendWhatsAppMessage, formatWhatsAppJid } from "./whatsappEngine";
import { adminDb } from "./firebaseAdmin";

export type NotificationModule =
  | "USER_REGISTRATION"
  | "LOGIN_ALERT"
  | "PASSWORD_RESET"
  | "OTP_VERIFICATION"
  | "NEW_ORDER"
  | "ORDER_ACCEPTED"
  | "ORDER_PROCESSING"
  | "ORDER_COMPLETED"
  | "ORDER_CANCELLED"
  | "PAYMENT_RECEIVED"
  | "PAYMENT_FAILED"
  | "REFUND_PROCESSED"
  | "SUPPORT_TICKET_CREATED"
  | "SUPPORT_TICKET_REPLY"
  | "SUBSCRIPTION_PURCHASED"
  | "SUBSCRIPTION_EXPIRED"
  | "ACCOUNT_VERIFICATION"
  | "SECURITY_ALERT"
  | "ADMIN_NOTIFICATION"
  | "BACKUP_COMPLETED"
  | "SYSTEM_ERROR"
  | "BROADCAST_MESSAGE"
  | "CUSTOM_ALERT";

export interface WhatsAppNotificationLog {
  id: string;
  eventId?: string;
  module: NotificationModule;
  recipientPhone: string;
  recipientType: "CUSTOMER" | "ADMIN";
  recipientName?: string;
  orderId?: string;
  amount?: string;
  status: "QUEUED" | "SENT" | "DELIVERED" | "FAILED";
  message: string;
  timestamp: string;
  retryCount: number;
  lastAttemptAt?: string;
  error?: string;
}

export interface WhatsAppNotificationSettings {
  adminWhatsAppNumber: string;
  customerWhatsAppEnabled: boolean;
  adminWhatsAppEnabled: boolean;
  moduleSettings: Record<NotificationModule, boolean>;
}

// Default settings if none in Firestore
const DEFAULT_SETTINGS: WhatsAppNotificationSettings = {
  adminWhatsAppNumber: "+447868713315",
  customerWhatsAppEnabled: true,
  adminWhatsAppEnabled: true,
  moduleSettings: {
    USER_REGISTRATION: true,
    LOGIN_ALERT: true,
    PASSWORD_RESET: true,
    OTP_VERIFICATION: true,
    NEW_ORDER: true,
    ORDER_ACCEPTED: true,
    ORDER_PROCESSING: true,
    ORDER_COMPLETED: true,
    ORDER_CANCELLED: true,
    PAYMENT_RECEIVED: true,
    PAYMENT_FAILED: true,
    REFUND_PROCESSED: true,
    SUPPORT_TICKET_CREATED: true,
    SUPPORT_TICKET_REPLY: true,
    SUBSCRIPTION_PURCHASED: true,
    SUBSCRIPTION_EXPIRED: true,
    ACCOUNT_VERIFICATION: true,
    SECURITY_ALERT: true,
    ADMIN_NOTIFICATION: true,
    BACKUP_COMPLETED: true,
    SYSTEM_ERROR: true,
    BROADCAST_MESSAGE: true,
    CUSTOM_ALERT: true
  }
};

let cachedSettings: WhatsAppNotificationSettings | null = null;
const recentEventHashes = new Set<string>();

/**
 * Load or initialize notification settings
 */
export async function getWhatsAppNotificationSettings(): Promise<WhatsAppNotificationSettings> {
  if (cachedSettings) return cachedSettings;
  try {
    const docSnap = await adminDb.collection("system_settings").doc("whatsapp_notifications").get();
    if (docSnap.exists) {
      cachedSettings = { ...DEFAULT_SETTINGS, ...docSnap.data() } as WhatsAppNotificationSettings;
    } else {
      cachedSettings = DEFAULT_SETTINGS;
      await adminDb.collection("system_settings").doc("whatsapp_notifications").set(DEFAULT_SETTINGS);
    }
  } catch (err) {
    console.warn("[WhatsApp Notification Settings] Firestore read fallback:", err);
    cachedSettings = DEFAULT_SETTINGS;
  }
  return cachedSettings;
}

/**
 * Save updated notification settings
 */
export async function updateWhatsAppNotificationSettings(newSettings: Partial<WhatsAppNotificationSettings>): Promise<WhatsAppNotificationSettings> {
  const current = await getWhatsAppNotificationSettings();
  const updated: WhatsAppNotificationSettings = {
    ...current,
    ...newSettings,
    moduleSettings: {
      ...current.moduleSettings,
      ...(newSettings.moduleSettings || {})
    }
  };

  cachedSettings = updated;
  try {
    await adminDb.collection("system_settings").doc("whatsapp_notifications").set(updated, { merge: true });
  } catch (err) {
    console.error("[WhatsApp Notification Settings] Failed to save settings:", err);
  }
  return updated;
}

/**
 * Clean & Format WhatsApp Markdown template for notifications
 */
export function buildWhatsAppMessage(payload: {
  module: NotificationModule;
  title: string;
  userName?: string;
  orderId?: string;
  amount?: string;
  statusText?: string;
  details?: string;
  actionUrl?: string;
}): string {
  const timeStr = new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi", dateStyle: "medium", timeStyle: "short" });
  const name = payload.userName || "Valued Customer";

  let headerEmoji = "🔔";
  switch (payload.module) {
    case "USER_REGISTRATION": headerEmoji = "🎉"; break;
    case "LOGIN_ALERT": headerEmoji = "🔐"; break;
    case "PASSWORD_RESET": headerEmoji = "🔑"; break;
    case "OTP_VERIFICATION": headerEmoji = "📲"; break;
    case "NEW_ORDER": headerEmoji = "🛒"; break;
    case "ORDER_ACCEPTED": headerEmoji = "✅"; break;
    case "ORDER_PROCESSING": headerEmoji = "⚙️"; break;
    case "ORDER_COMPLETED": headerEmoji = "🎉"; break;
    case "ORDER_CANCELLED": headerEmoji = "❌"; break;
    case "PAYMENT_RECEIVED": headerEmoji = "💰"; break;
    case "PAYMENT_FAILED": headerEmoji = "⚠️"; break;
    case "REFUND_PROCESSED": headerEmoji = "💸"; break;
    case "SUPPORT_TICKET_CREATED": headerEmoji = "🎫"; break;
    case "SUPPORT_TICKET_REPLY": headerEmoji = "💬"; break;
    case "SUBSCRIPTION_PURCHASED": headerEmoji = "⭐"; break;
    case "SUBSCRIPTION_EXPIRED": headerEmoji = "⏰"; break;
    case "ACCOUNT_VERIFICATION": headerEmoji = "🛡️"; break;
    case "SECURITY_ALERT": headerEmoji = "🚨"; break;
    case "ADMIN_NOTIFICATION": headerEmoji = "📢"; break;
    case "BACKUP_COMPLETED": headerEmoji = "💾"; break;
    case "SYSTEM_ERROR": headerEmoji = "🛠️"; break;
    case "BROADCAST_MESSAGE": headerEmoji = "📣"; break;
    case "CUSTOM_ALERT": headerEmoji = "🔔"; break;
  }

  let msg = `${headerEmoji} *ZEROX NETWORK ALERT* | ${payload.title}\n`;
  msg += `───────────────────────\n`;
  msg += `👤 *Customer:* ${name}\n`;

  if (payload.orderId) {
    msg += `🆔 *Reference ID:* \`#${payload.orderId}\`\n`;
  }
  if (payload.amount) {
    msg += `💳 *Amount:* ₨ ${payload.amount} PKR\n`;
  }
  if (payload.statusText) {
    msg += `📌 *Status:* ${payload.statusText}\n`;
  }
  if (payload.details) {
    msg += `📝 *Details:* ${payload.details}\n`;
  }

  msg += `🕒 *Time:* ${timeStr}\n`;
  msg += `───────────────────────\n`;
  msg += `🌐 *Portal:* zeroxnetwork.ai.studio\n`;
  msg += `⚡ _Official Automated Notification_`;

  return msg;
}

/**
 * Dispatch WhatsApp notification with retry & deduplication logic
 */
export async function triggerWhatsAppNotification(params: {
  module: NotificationModule;
  title: string;
  recipientPhone?: string;
  userName?: string;
  orderId?: string;
  amount?: string;
  statusText?: string;
  details?: string;
  notifyAdmin?: boolean;
  eventId?: string;
}): Promise<{ success: boolean; customerSent?: boolean; adminSent?: boolean; message?: string }> {
  const settings = await getWhatsAppNotificationSettings();

  // Check if module is enabled
  if (settings.moduleSettings && settings.moduleSettings[params.module] === false) {
    console.log(`[WhatsApp Alert] Module ${params.module} is disabled in settings. Skipping.`);
    return { success: false, message: `Module ${params.module} disabled` };
  }

  // Deduplication check
  const eventHash = `${params.module}_${params.orderId || ""}_${params.recipientPhone || ""}_${params.amount || ""}_${params.details || ""}`.slice(0, 100);
  if (recentEventHashes.has(eventHash)) {
    console.log(`[WhatsApp Alert] Duplicate event detected (${eventHash}). Skipping.`);
    return { success: true, message: "Duplicate event suppressed" };
  }
  recentEventHashes.add(eventHash);
  setTimeout(() => recentEventHashes.delete(eventHash), 30000); // 30s dedup window

  const messageText = buildWhatsAppMessage({
    module: params.module,
    title: params.title,
    userName: params.userName,
    orderId: params.orderId,
    amount: params.amount,
    statusText: params.statusText,
    details: params.details
  });

  let customerSent = false;
  let adminSent = false;

  // 1. Send to Customer if phone exists and enabled
  if (settings.customerWhatsAppEnabled && params.recipientPhone) {
    customerSent = await sendAndLogNotification({
      module: params.module,
      recipientPhone: params.recipientPhone,
      recipientType: "CUSTOMER",
      recipientName: params.userName,
      orderId: params.orderId,
      amount: params.amount,
      message: messageText,
      eventId: params.eventId
    });
  }

  // 2. Send to Admin if notifyAdmin is true and enabled
  if (settings.adminWhatsAppEnabled && (params.notifyAdmin || params.module.startsWith("ADMIN_") || params.module === "BACKUP_COMPLETED" || params.module === "SYSTEM_ERROR" || params.module === "NEW_ORDER" || params.module === "PAYMENT_RECEIVED" || params.module === "SUPPORT_TICKET_CREATED")) {
    const adminPhone = settings.adminWhatsAppNumber || "+447868713315";
    adminSent = await sendAndLogNotification({
      module: params.module,
      recipientPhone: adminPhone,
      recipientType: "ADMIN",
      recipientName: "System Admin",
      orderId: params.orderId,
      amount: params.amount,
      message: `🚨 *ADMIN ALERT* 🚨\n` + messageText,
      eventId: params.eventId ? `${params.eventId}_admin` : undefined
    });
  }

  return {
    success: customerSent || adminSent,
    customerSent,
    adminSent
  };
}

/**
 * Send WhatsApp message with auto retry and save log to Firestore
 */
async function sendAndLogNotification(data: {
  module: NotificationModule;
  recipientPhone: string;
  recipientType: "CUSTOMER" | "ADMIN";
  recipientName?: string;
  orderId?: string;
  amount?: string;
  message: string;
  eventId?: string;
}): Promise<boolean> {
  const logId = `wa_log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const timestamp = new Date().toISOString();

  let status: "SENT" | "FAILED" = "FAILED";
  let errorMsg: string | undefined = undefined;

  // Attempt send with up to 2 retries
  for (let attempt = 1; attempt <= 2; attempt++) {
    const result = await sendWhatsAppMessage(data.recipientPhone, data.message);
    if (result.success) {
      status = "SENT";
      errorMsg = undefined;
      break;
    } else {
      errorMsg = result.message;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 1000)); // 1s retry delay
      }
    }
  }

  const logRecord: WhatsAppNotificationLog = {
    id: logId,
    eventId: data.eventId,
    module: data.module,
    recipientPhone: data.recipientPhone,
    recipientType: data.recipientType,
    recipientName: data.recipientName || "User",
    orderId: data.orderId,
    amount: data.amount,
    status: status === "SENT" ? "DELIVERED" : "FAILED", // Mark SENT as DELIVERED upon socket dispatch
    message: data.message,
    timestamp,
    retryCount: status === "SENT" ? 1 : 2,
    lastAttemptAt: timestamp,
    error: errorMsg
  };

  // Save to Firestore
  try {
    await adminDb.collection("whatsapp_notification_logs").doc(logId).set(logRecord);
  } catch (err) {
    console.warn("[WhatsApp Notification Log] Error saving log to Firestore:", err);
  }

  return status === "SENT";
}

/**
 * Helper to auto-trigger WhatsApp notification from any server API endpoint or email route
 */
export async function triggerWhatsAppFromRoute(
  module: NotificationModule,
  title: string,
  body: any
) {
  try {
    let phone = body.whatsappNumber || body.phone || body.phoneNumber || body.toPhone;

    // If phone is missing, but toEmail or username or userId is provided, look up in Firestore
    if (!phone && (body.toEmail || body.username || body.userId)) {
      try {
        if (body.userId) {
          const uDoc = await adminDb.collection("users").doc(body.userId).get();
          if (uDoc.exists) {
            phone = uDoc.data()?.phone || uDoc.data()?.whatsappNumber;
          }
        }
        if (!phone && body.toEmail) {
          const uSnap = await adminDb.collection("users").where("email", "==", body.toEmail).limit(1).get();
          if (!uSnap.empty) {
            phone = uSnap.docs[0].data()?.phone || uSnap.docs[0].data()?.whatsappNumber;
          }
        }
        if (!phone && body.username) {
          const uSnap = await adminDb.collection("users").where("username", "==", body.username).limit(1).get();
          if (!uSnap.empty) {
            phone = uSnap.docs[0].data()?.phone || uSnap.docs[0].data()?.whatsappNumber;
          }
        }
      } catch (err) {
        // Fallback
      }
    }

    await triggerWhatsAppNotification({
      module,
      title,
      userName: body.username || body.fullName || body.toEmail || "Valued Customer",
      recipientPhone: phone,
      orderId: body.orderId || body.txId || body.ticketId || body.id,
      amount: body.amount?.toString() || body.price?.toString() || body.balance?.toString(),
      statusText: body.status || body.statusText || "PROCESSED",
      details: body.reason || body.subject || body.message || body.serviceName || body.description || body.reply,
      notifyAdmin: body.notifyAdmin !== undefined ? body.notifyAdmin : true
    });
  } catch (err) {
    console.warn("[WhatsApp Auto Trigger Error]:", err);
  }
}

export async function resendWhatsAppNotification(logId: string): Promise<{ success: boolean; message: string }> {
  try {
    const docRef = adminDb.collection("whatsapp_notification_logs").doc(logId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, message: "Notification log record not found" };
    }

    const log = docSnap.data() as WhatsAppNotificationLog;
    const result = await sendWhatsAppMessage(log.recipientPhone, log.message);

    const now = new Date().toISOString();
    if (result.success) {
      await docRef.update({
        status: "DELIVERED",
        retryCount: (log.retryCount || 0) + 1,
        lastAttemptAt: now,
        error: null
      });
      return { success: true, message: `Successfully resent WhatsApp alert to ${log.recipientPhone}` };
    } else {
      await docRef.update({
        status: "FAILED",
        retryCount: (log.retryCount || 0) + 1,
        lastAttemptAt: now,
        error: result.message
      });
      return { success: false, message: result.message };
    }
  } catch (err: any) {
    return { success: false, message: err.message || "Resend failed" };
  }
}
