import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";

export type NotificationType = 
  | "Deposit Approved"
  | "Deposit Rejected"
  | "Low Balance"
  | "Order Completed"
  | "API Verified"
  | "API Suspended"
  | "API Revoked"
  | "API Key Regenerated"
  | "Account Warning"
  | "Account Banned"
  | "Account Unbanned"
  | "Account Blocked"
  | "Account Unblocked"
  | "Spending Limit Set"
  | "Manual Credit"
  | string;

export interface SystemNotification {
  id?: string;
  userId: string;
  userEmail: string;
  username: string;
  type: NotificationType;
  title: string;
  message: string;
  emailSent: boolean;
  whatsappSent: boolean;
  phone?: string;
  createdAt: string;
}

function getModuleFromType(type: string): string {
  if (type.includes("Deposit") || type.includes("Credit")) return "PAYMENT_RECEIVED";
  if (type.includes("Low Balance")) return "SECURITY_ALERT";
  if (type.includes("Order")) return "ORDER_COMPLETED";
  if (type.includes("Account")) return "ACCOUNT_VERIFICATION";
  if (type.includes("API")) return "SECURITY_ALERT";
  return "CUSTOM_ALERT";
}

export async function sendNotification(
  userId: string,
  userEmail: string,
  username: string,
  type: NotificationType,
  messageDetails: string,
  userPhone?: string
) {
  const timestamp = new Date().toISOString();
  let title: string = type;
  let defaultMsg = messageDetails;

  switch (type) {
    case "Deposit Approved":
      title = "Deposit Approved";
      defaultMsg = `Your cash deposit has been verified & approved! ${messageDetails}`;
      break;
    case "Deposit Rejected":
      title = "Deposit Rejected";
      defaultMsg = `Your deposit request was rejected. Reason: ${messageDetails}`;
      break;
    case "Low Balance":
      title = "Low Wallet Balance Warning";
      defaultMsg = `Your balance is below minimum required limits: ${messageDetails}`;
      break;
    case "Order Completed":
      title = "Order Completed";
      defaultMsg = `Your order has been completed successfully. ${messageDetails}`;
      break;
    case "API Verified":
      title = "API Status: Verified";
      defaultMsg = `Your API key access has been verified and enabled by Admin. ${messageDetails}`;
      break;
    case "API Suspended":
      title = "API Status: Suspended";
      defaultMsg = `Your API access has been suspended by Admin. ${messageDetails}`;
      break;
    case "API Revoked":
      title = "API Access Revoked";
      defaultMsg = `Your API key has been revoked and disabled by Admin. ${messageDetails}`;
      break;
    case "API Key Regenerated":
      title = "API Key Regenerated";
      defaultMsg = `A new API key has been issued for your account by Admin. ${messageDetails}`;
      break;
    case "Account Warning":
      title = "⚠️ Account Warning Notice";
      defaultMsg = `Warning notice from Admin: ${messageDetails}`;
      break;
    case "Account Banned":
      title = "🚫 Account Banned";
      defaultMsg = `Your account has been temporarily banned by Admin. Reason: ${messageDetails}`;
      break;
    case "Account Unbanned":
      title = "✅ Account Ban Lifted";
      defaultMsg = `Your account ban has been lifted by Admin. ${messageDetails}`;
      break;
    case "Account Blocked":
      title = "🔒 Account Blocked";
      defaultMsg = `Your account has been blocked by Admin. ${messageDetails}`;
      break;
    case "Account Unblocked":
      title = "🔓 Account Unblocked";
      defaultMsg = `Your account block has been removed by Admin. ${messageDetails}`;
      break;
    case "Spending Limit Set":
      title = "💳 Daily Spending Limit Updated";
      defaultMsg = `Your daily spending limit has been set to ₨ ${messageDetails} PKR.`;
      break;
    case "Manual Credit":
      title = "💰 Manual Credit Alert";
      defaultMsg = `Your wallet balance has been manually credited by the admin: ${messageDetails}`;
      break;
    default:
      title = type;
      defaultMsg = messageDetails;
  }

  const payload: SystemNotification = {
    userId,
    userEmail,
    username,
    type,
    title,
    message: defaultMsg,
    emailSent: true,
    whatsappSent: true,
    phone: userPhone,
    createdAt: timestamp,
  };

  try {
    await addDoc(collection(db, "notifications"), payload);
    toast.success(`[Notification Sent - ${type}] Email & WhatsApp triggered for @${username}`);

    // Trigger WhatsApp notification for ALL notification events
    fetch("/api/whatsapp/trigger-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        module: getModuleFromType(type),
        title: title,
        userName: username,
        recipientPhone: userPhone,
        toEmail: userEmail,
        userId: userId,
        statusText: type,
        details: defaultMsg,
        notifyAdmin: true
      })
    }).catch(err => console.error(`Failed to trigger WhatsApp for ${type}:`, err));

    // Trigger professional email alerts for critical account events
    const criticalTypes = [
      "Account Warning", "Account Banned", "Account Unbanned", "Account Blocked", "Account Unblocked",
      "API Verified", "API Suspended", "API Revoked", "API Key Regenerated", "Manual Credit"
    ];

    if (criticalTypes.includes(type)) {
      let endpoint = type.startsWith("API") ? "/api/email/api-status" : "/api/email/account-status";
      
      let body: any = {
        toEmail: userEmail,
        username: username,
        status: type.replace("Account ", ""),
        apiStatus: type.replace("API ", ""),
        reason: messageDetails,
        title: title,
        icon: type.includes("Banned") || type.includes("Blocked") ? "🚫" : 
              type.includes("Warning") ? "⚠️" :
              type.includes("API") ? "⚙️" : "✅"
      };

      if (type === "Manual Credit") {
        endpoint = "/api/email/wallet-topup";
        body = {
          toEmail: userEmail,
          username: username,
          amount: messageDetails,
          newBalance: "Check Dashboard",
          method: "Manual Credit Alert"
        };
      }

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).catch(err => console.error(`Failed to send ${type} email:`, err));
    }
  } catch (err) {
    console.error("Failed to persist notification:", err);
  }

  return payload;
}
