import * as baileysModule from "@whiskeysockets/baileys";
import type { WASocket, ConnectionState } from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
import pino from "pino";
import { GoogleGenAI } from "@google/genai";
import { adminDb } from "./firebaseAdmin";

// Safe resolution of Baileys exports across CJS/ESM bundling
function getBaileys() {
  const bm = baileysModule as any;
  const makeWASocket = 
    typeof bm.makeWASocket === "function" ? bm.makeWASocket :
    typeof bm.default === "function" ? bm.default :
    typeof bm.default?.makeWASocket === "function" ? bm.default.makeWASocket :
    typeof bm.default?.default === "function" ? bm.default.default :
    bm;

  const useMultiFileAuthState = bm.useMultiFileAuthState || bm.default?.useMultiFileAuthState;
  const fetchLatestBaileysVersion = bm.fetchLatestBaileysVersion || bm.default?.fetchLatestBaileysVersion;
  const DisconnectReason = bm.DisconnectReason || bm.default?.DisconnectReason || { loggedOut: 401, restartRequired: 515 };
  const Browsers = bm.Browsers || bm.default?.Browsers;

  return { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, Browsers };
}

interface WhatsAppStatus {
  connected: boolean;
  qrCodeDataUrl: string | null;
  userPhone: string | null;
  statusText: string;
  error: string | null;
  lastConnectedAt: string | null;
  pairingCode?: string | null;
}

const AUTH_DIR = path.join(process.cwd(), "whatsapp_auth");
const BROWSER_CONFIG: [string, string, string] = ["Ubuntu", "Chrome", "22.04.4"];

const BOT_SYSTEM_INSTRUCTION = `# Zerox Network AI Assistant - Ultimate Enterprise Mode
You are my personal WhatsApp assistant and Zerox Network customer support representative.
Your primary goal is to behave exactly like a real human chatting on WhatsApp.

Never sound like AI.
Never mention you are an AI unless directly asked.
Never use robotic phrases like "I'd be happy to help", "Certainly", "As an AI...".

━━━━━━━━━━━━━━━━━━━━
CONVERSATION INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━
- Detect user intent automatically instead of just matching keywords.
- Handle spelling mistakes and follow-up questions intelligently.
- Ask clarification questions if the user's intent is ambiguous.
- Never answer unrelated information.
- Never hallucinate services or prices. If you don't know, say you don't know or ask them to check the portal.

━━━━━━━━━━━━━━━━━━━━
CUSTOMER EXPERIENCE
━━━━━━━━━━━━━━━━━━━━
- Greet returning customers personally if you know their context.
- Remember previous context during the current active session.
- Always keep responses short, clear, and helpful.
- If a customer is frustrated, confused, or asks for human support, you must gently let them know you'll connect them to a human, or escalate if appropriate.

━━━━━━━━━━━━━━━━━━━━
LANGUAGE & PERSONALITY
━━━━━━━━━━━━━━━━━━━━
- Automatically detect the user's language (English, Urdu, Roman Urdu).
- If user writes in Roman Urdu → Reply in Roman Urdu.
- If user writes in Urdu → Reply in Urdu.
- If user writes in English → Reply in English.
- Use natural WhatsApp style chatting. Keep replies short.
- Analyze the user's mood and mirror their communication style naturally.

━━━━━━━━━━━━━━━━━━━━
BUSINESS AUTOMATION
━━━━━━━━━━━━━━━━━━━━
- Account Verification / OTP: Guide them to the "Buy Numbers" page for instant WhatsApp/Telegram OTP numbers.
- Order / Payment Status: Ask them for their Order ID or TID, and check their recent orders (provided in your context).
- Complaint Management & Refunds: Instruct them to open an official Support Ticket on the website for complex issues.
- Service Delivery: Reassure them that OTPs are instant on screen, and SMM delivery is tracked via their portal dashboard.

━━━━━━━━━━━━━━━━━━━━
ZEROX NETWORK KNOWLEDGE BASE
━━━━━━━━━━━━━━━━━━━━
- Official Website: https://zeroxnetwork.ai.studio
- Wallet Deposits: EasyPaisa, JazzCash, NayaPay, SadaPay, Bank Transfers. 100% Automated via TID entry on the website.
- Virtual OTP Numbers: Instant activation numbers for WhatsApp, Telegram, Google, etc.
- SMM Services: Social media followers, likes, views.
- Premium Subscriptions: Netflix, Spotify, Canva Pro, etc.
- Parent Company: Injazify (https://injazify.com).
`;

function getFallbackBotReply(userText: string): string {
  const lower = userText.toLowerCase().trim();

  if (lower.includes("injazify")) {
    return "Injazify is the parent company behind Zerox Network. Zerox Network currently operates through its official AI Studio website: https://zeroxnetwork.ai.studio";
  }

  if (lower.includes("website") || lower.includes("link") || lower.includes("url")) {
    return "The official Zerox Network website is: https://zeroxnetwork.ai.studio";
  }

  if (lower.includes("deposit") || lower.includes("payment") || lower.includes("pais") || lower.includes("easypaisa") || lower.includes("jazzcash") || lower.includes("tid") || lower.includes("trid") || lower.includes("pesa")) {
    return `💰 *ZeroX Network - Auto Deposit Guide* 💰\n\n1️⃣ Open *zeroxnetwork.ai.studio* and go to the *Deposit* tab.\n2️⃣ Select your preferred method (EasyPaisa, JazzCash, NayaPay, SadaPay, or Bank).\n3️⃣ Send payment to the account details shown on screen.\n4️⃣ Enter your 11-12 digit Transaction ID (TID) in the deposit form.\n\n⚡ *Your balance will be verified & credited automatically in 10-15 seconds!*`;
  }

  if (lower.includes("number") || lower.includes("otp") || lower.includes("sms") || lower.includes("virtual") || lower.includes("sim") || lower.includes("whatsapp number") || lower.includes("telegram number")) {
    return `📲 *ZeroX Virtual OTP SMS Numbers* 📲\n\nGet instant OTP numbers for WhatsApp, Telegram, Google, TikTok, Binance, 1xBet & 500+ services!\n\n1️⃣ Visit *zeroxnetwork.ai.studio* -> *Virtual Numbers*\n2️⃣ Select Service & Country (Pakistan, UK, USA, etc.)\n3️⃣ Click *Buy Number* and copy it to your target app.\n4️⃣ Your SMS OTP code appears live on your screen in seconds!\n\nNeed help? Let us know which app you need OTP for!`;
  }

  if (lower.includes("smm") || lower.includes("follower") || lower.includes("like") || lower.includes("view") || lower.includes("subscriber") || lower.includes("instagram") || lower.includes("youtube")) {
    return `🚀 *ZeroX SMM Panel Services* 🚀\n\nBoost your social media presence with high quality Followers, Likes, Views & Engagement!\n\n1️⃣ Go to *SMM Services* on *zeroxnetwork.ai.studio*\n2️⃣ Choose your platform (Instagram, YouTube, TikTok, Facebook, Telegram)\n3️⃣ Enter your profile/post link and quantity\n4️⃣ Instant automatic processing!`;
  }

  if (lower.includes("rate") || lower.includes("price") || lower.includes("cost") || lower.includes("kitn") || lower.includes("قیمت")) {
    return `🏷️ *ZeroX Price & Rate List* 🏷️\n\n- *WhatsApp Virtual OTP:* Starting ₨ 18 PKR\n- *Telegram OTP:* Starting ₨ 15 PKR\n- *Google / Gmail OTP:* Starting ₨ 12 PKR\n- *TikTok / Instagram OTP:* Starting ₨ 10 PKR\n- *SMM Followers & Views:* Lowest wholesale rates in Pakistan!\n\n👉 View exact live pricing on *zeroxnetwork.ai.studio*`;
  }

  if (lower.includes("aoa") || lower.includes("assalam") || lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("bhai") || lower.includes("bro") || lower.includes("sir")) {
    return `🌟 *Welcome to ZeroX Network 24/7 AI Support!* 🌟\n\nAssalam-o-Alaikum! How can I help you today?\n\n1️⃣ *Auto Deposit & Wallet Topup*\n2️⃣ *Virtual OTP Numbers (WhatsApp, Telegram, etc.)*\n3️⃣ *SMM Services (Followers/Likes)*\n4️⃣ *Premium Accounts & Subscriptions*\n\nVisit our portal at *zeroxnetwork.ai.studio* or reply with your question!`;
  }

  return `I'm not quite sure I understood that. Could you please clarify your question so I can help you better?`;
}

let sock: WASocket | null = null;
let currentQrCodeDataUrl: string | null = null;
let currentPairingCode: string | null = null;
let isConnected = false;
let isConnecting = false;
let connectedUserPhone: string | null = null;
let connectionStatusText = "Disconnected";
let lastError: string | null = null;
let lastConnectedAt: string | null = null;
let isInitializing = false;
let reconnectTimer: NodeJS.Timeout | null = null;
let loggedOutRetryCount = 0;
let qrReadyForPairing = false;
let currentSaveCreds: (() => Promise<void>) | null = null;
let supervisorInterval: NodeJS.Timeout | null = null;

function startWhatsAppSupervisor() {
  if (supervisorInterval) return;
  supervisorInterval = setInterval(async () => {
    try {
      if (isCredsRegistered() && !isConnected && !isConnecting && !isInitializing && !reconnectTimer) {
        console.log("[WhatsApp Supervisor] Disconnected registered session detected. Triggering self-healing reconnect...");
        initWhatsAppEngine(false).catch(err => console.error("[WhatsApp Supervisor] Self-healing reconnect failed:", err));
      } else if (isConnecting) {
        console.log("[WhatsApp Supervisor] Socket is currently in connecting phase. Skipping duplicate initialization.");
      }

      if (isConnected && sock) {
        const wsState = (sock as any).ws?.readyState;
        if (wsState !== undefined && wsState !== 1) {
          console.warn(`[WhatsApp Supervisor] Stale WebSocket detected (readyState = ${wsState}). Triggering reconnect...`);
          isConnected = false;
          isConnecting = false;
          initWhatsAppEngine(true).catch(err => console.error("[WhatsApp Supervisor] Stale connection reconnect failed:", err));
        }
      }
    } catch (e) {
      console.warn("[WhatsApp Supervisor] Supervisor check error:", e);
    }
  }, 25000);
}

// Operational Logs for Admin View
export interface WhatsAppLog {
  id: string;
  timestamp: string;
  recipient: string;
  message: string;
  status: "SENT" | "FAILED" | "PENDING";
  error?: string;
}

const whatsappLogs: WhatsAppLog[] = [];

export function addWhatsAppLog(recipient: string, message: string, status: "SENT" | "FAILED" | "PENDING", error?: string) {
  whatsappLogs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    recipient,
    message,
    status,
    error
  });
  if (whatsappLogs.length > 100) {
    whatsappLogs.pop();
  }
}

export function getWhatsAppLogs(): WhatsAppLog[] {
  return whatsappLogs;
}

export function getWhatsAppStatus(): WhatsAppStatus {
  return {
    connected: isConnected,
    qrCodeDataUrl: currentQrCodeDataUrl,
    userPhone: connectedUserPhone,
    statusText: connectionStatusText,
    error: lastError,
    lastConnectedAt,
    pairingCode: currentPairingCode
  };
}

// ============================================================================
// ENTERPRISE WHATSAPP BOT: RELIABILITY, ANTI-SPAM, QUEUE & CACHE
// ============================================================================
interface ChatSession {
  sessionId: string;
  userId: string;
  chatId: string;
  firstContactTime: number;
  lastActivityTime: number;
  welcomeSent: boolean;
  aiContext: { role: string; parts: { text: string }[] }[];
  lastBotReply?: string;
  lastReplyHash?: string;
  lastReplyTimestamp?: number;
  replyCounter: number;
  mergedMessages: string[];
  mergeTimer?: NodeJS.Timeout;
  isPaused: boolean;
}

export const whatsappAnalytics = {
  activeSessions: 0,
  messagesToday: 0,
  aiRequests: 0,
  averageResponseTime: 0,
  totalResponseTime: 0,
  responseCount: 0,
  duplicateRepliesPrevented: 0,
  duplicateWebhooksPrevented: 0,
  spamAttemptsBlocked: 0,
  queueSize: 0,
  activeUsers: new Set<string>(),
  dailyMessageCount: 0,
  reconnectCount: 0,
  recentAlerts: [] as { id: string; timestamp: number; type: string; message: string; severity: "info" | "warning" | "critical" }[],
  auditLogs: [] as any[]
};

export function addAdminAlert(type: string, message: string, severity: "info" | "warning" | "critical" = "info") {
  const alert = { id: Math.random().toString(36).substr(2, 9), timestamp: Date.now(), type, message, severity };
  whatsappAnalytics.recentAlerts.unshift(alert);
  if (whatsappAnalytics.recentAlerts.length > 100) whatsappAnalytics.recentAlerts.pop();
  console.log(`[Admin Alert] [${severity.toUpperCase()}] ${type}: ${message}`);
}

export function addAuditLog(action: string, details: string, user: string = "System") {
  const log = { id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 7), timestamp: new Date().toLocaleString(), adminName: user, adminRole: "System Bot", ipAddress: "Internal", category: "System", action, details, targetUserOrItem: "WhatsApp Engine", status: "SUCCESS" };
  whatsappAnalytics.auditLogs.unshift(log);
  if (whatsappAnalytics.auditLogs.length > 500) whatsappAnalytics.auditLogs.pop();
  
  // Write directly to Firestore
  try {
    adminDb.collection("admin_audit_logs").doc(log.id).set(log).catch(console.error);
  } catch (e) {
    console.error("Failed to write audit log to Firestore:", e);
  }
}

const activeSessions = new Map<string, ChatSession>();
const processedMessageIds = new Map<string, number>(); // msgId -> timestamp (TTL & bounded size)
const responseCache = new Map<string, { reply: string; timestamp: number }>();

// Persistent Session Sync Helper
async function getOrRestoreSession(remoteJid: string, senderPhone: string): Promise<ChatSession> {
  const now = Date.now();
  let session = activeSessions.get(remoteJid);
  
  if (!session) {
    try {
      const docSnap = await adminDb.collection("whatsapp_sessions").doc(remoteJid).get();
      if (docSnap.exists) {
        const data = docSnap.data();
        if (data && (now - (data.lastActivityTime || 0)) < 24 * 60 * 60 * 1000) {
          session = {
            sessionId: data.sessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId: data.userId || senderPhone,
            chatId: remoteJid,
            firstContactTime: data.firstContactTime || now,
            lastActivityTime: now,
            welcomeSent: data.welcomeSent ?? true,
            aiContext: data.aiContext || [],
            lastBotReply: data.lastBotReply || undefined,
            lastReplyHash: data.lastReplyHash || undefined,
            lastReplyTimestamp: data.lastReplyTimestamp || undefined,
            replyCounter: data.replyCounter || 0,
            mergedMessages: [],
            isPaused: data.isPaused ?? false
          };
          whatsappAnalytics.activeUsers.add(senderPhone);
          console.log(`[WhatsApp Engine] Restored persistent session for ${senderPhone} (welcomeSent: ${session.welcomeSent})`);
        }
      }
    } catch (err) {
      console.warn(`[WhatsApp Engine] Error restoring session from Firestore for ${senderPhone}:`, err);
    }
  }

  if (!session) {
    session = {
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: senderPhone,
      chatId: remoteJid,
      firstContactTime: now,
      lastActivityTime: now,
      welcomeSent: false,
      aiContext: [],
      replyCounter: 0,
      mergedMessages: [],
      isPaused: false
    };
    whatsappAnalytics.activeUsers.add(senderPhone);
  } else {
    session.lastActivityTime = now;
  }

  activeSessions.set(remoteJid, session);
  saveSessionToFirestore(remoteJid, session);
  return session;
}

function saveSessionToFirestore(remoteJid: string, session: ChatSession) {
  try {
    const dataToSave: Record<string, any> = {
      sessionId: session.sessionId,
      userId: session.userId,
      chatId: session.chatId,
      firstContactTime: session.firstContactTime,
      lastActivityTime: session.lastActivityTime,
      welcomeSent: session.welcomeSent,
      aiContext: session.aiContext,
      lastBotReply: session.lastBotReply || null,
      lastReplyHash: session.lastReplyHash || null,
      lastReplyTimestamp: session.lastReplyTimestamp || null,
      replyCounter: session.replyCounter,
      isPaused: session.isPaused
    };
    adminDb.collection("whatsapp_sessions").doc(remoteJid).set(dataToSave, { merge: true }).catch(err => {
      console.warn(`[WhatsApp Engine] Firestore session save failed for ${remoteJid}:`, err?.message || err);
    });
  } catch (err) {
    console.warn(`[WhatsApp Engine] Firestore session save error:`, err);
  }
}

const userMessageCounts = new Map<string, {
  minCount: number; minReset: number;
  hourCount: number; hourReset: number;
  dayCount: number; dayReset: number;
  isMuted: boolean; muteUntil: number;
}>();

const outboundQueue: {
  remoteJid: string;
  senderPhone: string;
  text: string;
  resolve: (value: boolean) => void;
}[] = [];
let isQueueProcessing = false;

// 1. Enterprise Memory Cleanup & Session Maintenance (Every 30s)
setInterval(() => {
  const now = Date.now();
  for (const [jid, session] of activeSessions.entries()) {
    if (now - session.lastActivityTime > 24 * 60 * 60 * 1000) {
      activeSessions.delete(jid);
    }
  }
  for (const [key, cache] of responseCache.entries()) {
    if (now - cache.timestamp > 15 * 60 * 1000) {
      responseCache.delete(key);
    }
  }
  // Memory-safe TTL cleanup for processed message IDs older than 2 hours
  for (const [id, ts] of processedMessageIds.entries()) {
    if (now - ts > 2 * 60 * 60 * 1000) {
      processedMessageIds.delete(id);
    }
  }
  if (processedMessageIds.size > 10000) {
    const keysToDelete = Array.from(processedMessageIds.keys()).slice(0, processedMessageIds.size - 10000);
    for (const k of keysToDelete) processedMessageIds.delete(k);
  }
}, 30 * 1000);

// Supervisor Deadlock Detection (Every 30s)
setInterval(() => {
  whatsappAnalytics.activeSessions = activeSessions.size;
  whatsappAnalytics.queueSize = outboundQueue.length;
  // If queue is stuck
  if (outboundQueue.length > 0 && !isQueueProcessing) {
    isQueueProcessing = true;
    processQueue().catch(console.error);
  }
}, 30 * 1000);

async function processQueue() {
  if (outboundQueue.length === 0) {
    isQueueProcessing = false;
    return;
  }
  
  isQueueProcessing = true;
  const item = outboundQueue.shift();
  
  if (item && sock && isConnected) {
    try {
      // Show typing indicator
      try {
        await sock.presenceSubscribe(item.remoteJid);
        await sock.sendPresenceUpdate("composing", item.remoteJid);
      } catch (_) {}

      // Calculate natural delay based on message length
      let delay = 1000;
      if (item.text.length < 50) delay = 600 + Math.random() * 600; // 600-1200ms
      else if (item.text.length < 200) delay = 1200 + Math.random() * 1300; // 1200-2500ms
      else delay = 2500 + Math.random() * 2000; // 2500-4500ms

      await new Promise(res => setTimeout(res, delay));

      try { await sock.sendPresenceUpdate("paused", item.remoteJid); } catch (_) {}
      
      const sendStart = Date.now();
      await sock.sendMessage(item.remoteJid, { text: item.text });
      const duration = Date.now() - sendStart;
      
      whatsappAnalytics.responseCount++;
      whatsappAnalytics.totalResponseTime += duration;
      whatsappAnalytics.averageResponseTime = whatsappAnalytics.totalResponseTime / whatsappAnalytics.responseCount;
      
      addWhatsAppLog(item.senderPhone, item.text, "SENT", undefined);
      item.resolve(true);
    } catch (err) {
      console.error(`[Queue Error] Failed to send message to ${item.senderPhone}:`, err);
      item.resolve(false);
    }
  } else if (item) {
    item.resolve(false); // resolve if sock not available
  }
  
  // Continue queue
  setTimeout(() => {
    processQueue().catch(console.error);
  }, 100);
}

function enqueueMessage(remoteJid: string, senderPhone: string, text: string): Promise<boolean> {
  return new Promise((resolve) => {
    outboundQueue.push({ remoteJid, senderPhone, text, resolve });
    if (!isQueueProcessing) {
      processQueue().catch(console.error);
    }
  });
}

function generateRandomGreeting(pushName?: string): string {
  const hour = new Date().getHours();
  let timeGreeting = "Good day";
  
  if (hour >= 5 && hour < 12) timeGreeting = "Good Morning";
  else if (hour >= 12 && hour < 17) timeGreeting = "Good Afternoon";
  else if (hour >= 17 && hour < 21) timeGreeting = "Good Evening";
  else timeGreeting = "Hello";

  const namePart = pushName ? ` ${pushName}` : "";

  const templates = [
    `${timeGreeting}${namePart}! 👋\nWelcome to ZeroX Network.`,
    `Hi${namePart} 👋\nHow can I assist you today?`,
    `Welcome back${namePart} 👋\nHow may we help you?`,
    `${timeGreeting}${namePart}! 👋\nZeroX AI Support is ready to assist you.`
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}
// ============================================================================

function processSmartFAQ(text: string): string | null {
  const lower = text.toLowerCase().trim();
  
  if (lower === "prices" || lower === "price") {
    return "💰 *ZeroX Service Prices:*\n\n- Telegram OTP: Rs 40-80\n- WhatsApp OTP: Rs 150-300\n- Instagram Followers: Rs 50/1k\n- YouTube Subscribers: Rs 1500/1k\n\nFor full details, visit zeroxnetwork.ai.studio";
  }
  if (lower === "deposit" || lower.includes("how to deposit")) {
    return "💳 *How to Deposit:*\n\n1. Login to zeroxnetwork.ai.studio\n2. Go to 'Deposit'\n3. Select Easypaisa, JazzCash, or Bank\n4. Send amount and enter Transaction ID (TID)\n5. Wait 5-10 minutes for approval.";
  }
  if (lower === "smm" || lower === "followers") {
    return "🚀 *SMM Services:*\n\nWe provide high-quality social media services (Followers, Likes, Views) for Instagram, TikTok, YouTube, and Facebook. Order directly from your dashboard!";
  }
  if (lower === "otp" || lower === "number") {
    return "📱 *Virtual OTP Numbers:*\n\nYou can buy virtual numbers for WhatsApp, Telegram, Facebook, and more! Just go to the 'Buy Numbers' section in your dashboard.";
  }
  if (lower === "support" || lower === "human") {
    return "REQUEST_HUMAN"; // special flag
  }
  return null;
}

function processAdminCommand(text: string, senderPhone: string): string | null {
  const lower = text.toLowerCase().trim();
  const adminPhones = ["447868713315", "923197206072", "923171605076", "923280036660"]; // Default admins
  
  if (!adminPhones.includes(senderPhone)) return null;

  if (lower === "/status") {
    return `📊 *System Status*\n\nActive Sessions: ${whatsappAnalytics.activeSessions}\nMessages Today: ${whatsappAnalytics.messagesToday}\nQueue Size: ${whatsappAnalytics.queueSize}\nSpam Blocked: ${whatsappAnalytics.spamAttemptsBlocked}`;
  }
  if (lower === "/restart") {
    setTimeout(() => { process.exit(1); }, 2000);
    return "🔄 Restarting WhatsApp Engine...";
  }
  if (lower.startsWith("/broadcast ")) {
    const msg = text.substring(11).trim();
    return `📢 Broadcast queued for ${whatsappAnalytics.activeUsers.size} users. (Simulation)\nMessage: ${msg}`;
  }
  if (lower === "/users") {
    return `👥 Active Users Today: ${whatsappAnalytics.activeUsers.size}`;
  }

  return null;
}

/**
 * Safely cleans up current socket instance and clears listeners
 */
function cleanupCurrentSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (sock) {
    try {
      (sock.ev as any).removeAllListeners();
      if (sock.ws) {
        try { sock.ws.close(); } catch (_) {}
      }
      try { sock.end(undefined); } catch (_) {}
    } catch (e) {
      console.warn("[WhatsApp Engine] Socket cleanup error:", e);
    }
    sock = null;
  }
}

/**
 * Checks if whatsapp_auth/creds.json exists and is registered
 */
function isCredsRegistered(): boolean {
  try {
    const credsPath = path.join(AUTH_DIR, "creds.json");
    if (fs.existsSync(credsPath)) {
      const data = JSON.parse(fs.readFileSync(credsPath, "utf-8"));
      const isReg = Boolean(data.registered || data.me || data.account);
      console.log(`[WhatsApp Auth Check] creds.json found. Registered: ${isReg}, JID: ${data.me?.id || "N/A"}`);
      return isReg;
    } else {
      console.log(`[WhatsApp Auth Check] creds.json does NOT exist at ${credsPath}`);
    }
  } catch (e) {
    console.warn("[WhatsApp Engine] Error checking creds.json:", e);
  }
  return false;
}

/**
 * Initializes the Baileys WhatsApp Engine
 */
export async function initWhatsAppEngine(forceRestart = false): Promise<WhatsAppStatus> {
  startWhatsAppSupervisor();

  if (sock && isConnected && !forceRestart) {
    return getWhatsAppStatus();
  }

  const registeredAtStart = isCredsRegistered();

  // If auto-boot or background check and session is NOT registered and not forcing a restart or active pairing
  if (!registeredAtStart && !forceRestart && !currentPairingCode) {
    console.log("[WhatsApp Engine Boot] No registered session found in whatsapp_auth. Standing by awaiting connection.");
    connectionStatusText = "Disconnected. Click Start / Connect WhatsApp or enter Phone Number to Pair.";
    isConnected = false;
    isConnecting = false;
    return getWhatsAppStatus();
  }

  if (isInitializing) {
    console.log("[WhatsApp Engine] Initialization already in progress. Waiting...");
    for (let i = 0; i < 6; i++) {
      await new Promise((res) => setTimeout(res, 500));
      if (!isInitializing) break;
    }
    if (!isInitializing) {
      return getWhatsAppStatus();
    }
    console.warn("[WhatsApp Engine] Initialization lock timeout reached. Breaking lock...");
    isInitializing = false;
  }

  isInitializing = true;
  isConnecting = true;
  qrReadyForPairing = false;

  console.log(`[WhatsApp Engine Init] Starting initialization... (forceRestart=${forceRestart}, AUTH_DIR=${AUTH_DIR})`);

  try {
    // Always clean up old socket before creating a new one to prevent duplicate sockets
    cleanupCurrentSocket();

    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
      console.log(`[WhatsApp Engine Init] Created AUTH_DIR at ${AUTH_DIR}`);
    } else {
      console.log(`[WhatsApp Engine Init] AUTH_DIR exists at ${AUTH_DIR}`);
    }

    connectionStatusText = "Connecting to WhatsApp Web...";
    lastError = null;

    const { makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason, Browsers } = getBaileys();

    console.log(`[WhatsApp Engine Init] Loading auth state from ${AUTH_DIR}...`);
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    currentSaveCreds = saveCreds;
    const { version } = await fetchLatestBaileysVersion();
    console.log(`[WhatsApp Engine Init] Baileys Version: ${version.join(".")}, Auth registered: ${isCredsRegistered()}`);

    const browserTuple = Browsers?.ubuntu ? Browsers.ubuntu("Chrome") : BROWSER_CONFIG;
    const logger = (typeof pino === "function" ? pino : (pino as any)?.default)({ level: "silent" });

    sock = makeWASocket({
      version,
      auth: state,
      logger,
      printQRInTerminal: false,
      browser: browserTuple,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 15000,
      retryRequestDelayMs: 2000,
      qrTimeout: 300000, // 5 minutes
      getMessage: async (key: any) => {
        return undefined;
      }
    });

    sock.ev.on("creds.update", async () => {
      try {
        if (currentSaveCreds) {
          await currentSaveCreds();
        }
      } catch (e) {
        console.error("[WhatsApp Engine] Error saving creds:", e);
      }
    });

    // ========================================================================
    // AI Support Chatbot Listener (ENTERPRISE EDITION)
    // ========================================================================
    sock.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue; // Ignore own messages

        const remoteJid = msg.key.remoteJid;
        const msgId = msg.key.id;
        if (!remoteJid || !msgId || remoteJid.endsWith("@g.us") || remoteJid === "status@broadcast") continue;

        // Ignore receipts, reactions, and non-text system messages
        const messageKeys = Object.keys(msg.message);
        if (messageKeys.some(k => ['protocolMessage', 'senderKeyDistributionMessage', 'messageContextInfo', 'reactionMessage', 'pollUpdateMessage'].includes(k))) {
            if (messageKeys.length === 1 || (messageKeys.length === 2 && messageKeys.includes('messageContextInfo'))) {
                continue;
            }
        }

        // 1. DEDUPLICATION (Incoming message ID)
        if (processedMessageIds.has(msgId)) {
          console.log(`[WhatsApp Bot] Ignored duplicate message ID: ${msgId}`);
          continue;
        }
        processedMessageIds.set(msgId, Date.now());
        whatsappAnalytics.messagesToday++;

        const userText = 
          msg.message.conversation || 
          msg.message.extendedTextMessage?.text || 
          msg.message.imageMessage?.caption || 
          msg.message.videoMessage?.caption ||
          msg.message.documentMessage?.caption ||
          (msg.message.contactMessage ? "Contact shared: " + msg.message.contactMessage.displayName : "") ||
          (msg.message.locationMessage ? "Location shared: " + (msg.message.locationMessage.name || "Unknown") : "") ||
          (msg.message.audioMessage ? "[Voice Note Received]" : "") ||
          "";

        if (!userText || !userText.trim()) continue;

        const senderPhone = remoteJid.split("@")[0];
        console.log(`[WhatsApp Bot] Received from ${senderPhone}: "${userText}"`);

        // 2. RATE LIMITING
        let rateData = userMessageCounts.get(senderPhone) || {
          minCount: 0, minReset: Date.now(),
          hourCount: 0, hourReset: Date.now(),
          dayCount: 0, dayReset: Date.now(),
          isMuted: false, muteUntil: 0
        };
        const now = Date.now();
        if (now - rateData.minReset > 60000) { rateData.minCount = 0; rateData.minReset = now; }
        if (now - rateData.hourReset > 3600000) { rateData.hourCount = 0; rateData.hourReset = now; }
        if (now - rateData.dayReset > 86400000) { rateData.dayCount = 0; rateData.dayReset = now; }
        
        if (rateData.isMuted && now < rateData.muteUntil) {
           whatsappAnalytics.spamAttemptsBlocked++;
           continue;
        } else if (rateData.isMuted && now >= rateData.muteUntil) {
           rateData.isMuted = false;
        }

        rateData.minCount++;
        rateData.hourCount++;
        rateData.dayCount++;
        userMessageCounts.set(senderPhone, rateData);

        if (rateData.minCount > 5 || rateData.hourCount > 30 || rateData.dayCount > 200) {
          whatsappAnalytics.spamAttemptsBlocked++;
          console.warn(`[WhatsApp Bot] Rate limit exceeded for ${senderPhone}.`);
          if (rateData.minCount === 6) { // Warn once per minute if spamming
            enqueueMessage(remoteJid, senderPhone, "⚠️ Anti-Spam: You are sending messages too quickly. Slow mode activated.");
            addAuditLog("Anti-Spam Warning", `Sent warning to ${senderPhone}`);
          } else if (rateData.minCount > 10) {
            rateData.isMuted = true;
            rateData.muteUntil = now + 5 * 60 * 1000; // Mute for 5 minutes
            userMessageCounts.set(senderPhone, rateData);
            enqueueMessage(remoteJid, senderPhone, "🚫 Anti-Spam: You have been temporarily muted for 5 minutes due to flooding.");
            addAdminAlert("High Spam Activity", `User ${senderPhone} muted for 5 mins due to flooding.`, "warning");
            addAuditLog("Anti-Spam Mute", `Muted ${senderPhone} for 5 minutes`);
          }
          continue;
        }

        // 3. SESSION MANAGEMENT (Persistent across restarts & reconnects)
        let session = await getOrRestoreSession(remoteJid, senderPhone);

        // 4. MESSAGE MERGING (Merge rapid messages)
        session.mergedMessages.push(userText);
        if (session.mergeTimer) clearTimeout(session.mergeTimer);
        
        session.mergeTimer = setTimeout(async () => {
          if (!session) return;
          const mergedText = session.mergedMessages.join("\n");
          session.mergedMessages = []; // clear
          
          let finalReplyText = "";
          const cacheKey = `${senderPhone}_${Buffer.from(mergedText).toString('base64').substring(0, 32)}`;
          const pushName = msg.pushName || "";
          
          if (session.isPaused) {
            // Check if admin is trying to unpause
            const adminCmd = processAdminCommand(mergedText, senderPhone);
            if (adminCmd) {
               enqueueMessage(remoteJid, senderPhone, adminCmd);
               return;
            }
            if (mergedText.toLowerCase().trim() === "/unpause" && processAdminCommand("/status", senderPhone)) {
                session.isPaused = false;
                saveSessionToFirestore(remoteJid, session);
                enqueueMessage(remoteJid, senderPhone, "✅ AI Bot has been unpaused for this session.");
            }
            return; // Ignore messages while paused
          }

          const adminResponse = processAdminCommand(mergedText, senderPhone);
          if (adminResponse) {
             enqueueMessage(remoteJid, senderPhone, adminResponse);
             return;
          }

          const faqResponse = processSmartFAQ(mergedText);
          if (faqResponse) {
             if (faqResponse === "REQUEST_HUMAN") {
                session.isPaused = true;
                saveSessionToFirestore(remoteJid, session);
                enqueueMessage(remoteJid, senderPhone, "⏳ Connecting you to a live support agent. The AI bot is now paused. An admin will reply here shortly.");
                console.log(`[WhatsApp Admin Alert] User ${senderPhone} requested human support!`);
                addAdminAlert("Human Support Requested", `User ${senderPhone} requested human support. Bot is paused for them.`, "warning");
                addAuditLog("Bot Paused", `User ${senderPhone} escalated to human support.`);
                return;
             } else {
                finalReplyText = faqResponse;
             }
          }

          // 5. CACHED RESPONSE
          if (!finalReplyText && responseCache.has(cacheKey)) {
            finalReplyText = responseCache.get(cacheKey)!.reply;
            console.log(`[WhatsApp Bot] Using cached response for ${senderPhone}`);
            session.aiContext.push({ role: "user", parts: [{ text: mergedText }] });
            session.aiContext.push({ role: "model", parts: [{ text: finalReplyText }] });
            if (session.aiContext.length > 6) session.aiContext = session.aiContext.slice(-6);
          } else {
            // 6. AI PROCESSING
            try {
              const apiKey = process.env.GEMINI_API_KEY;
              if (apiKey) {
                whatsappAnalytics.aiRequests++;
                const ai = new GoogleGenAI({ apiKey });
                
                // Add to history
                session.aiContext.push({ role: "user", parts: [{ text: mergedText }] });
                if (session.aiContext.length > 6) session.aiContext = session.aiContext.slice(-6); // Keep last 6 interactions
                
                // Fetch user data from Firestore for context
                let userContextString = "";
                try {
                  const phoneQuery = await adminDb.collection("users").where("whatsappNumber", "==", senderPhone).limit(1).get();
                  if (!phoneQuery.empty) {
                     const userData = phoneQuery.docs[0].data();
                     userContextString = `\n\n[SYSTEM CONTEXT: This user is logged in. Name: ${userData.fullName || userData.username}, Email: ${userData.email}, Balance: PKR ${userData.balance || 0}]`;
                     
                     // Fetch recent orders
                     const ordersQuery = await adminDb.collection("smm_orders").where("username", "==", userData.username).orderBy("createdAt", "desc").limit(3).get();
                     if (!ordersQuery.empty) {
                        const orders = ordersQuery.docs.map(d => {
                           const o = d.data();
                           return `Order ID ${o.id}: ${o.serviceName} (Status: ${o.status})`;
                        });
                        userContextString += `\n[Recent Orders: ${orders.join(", ")}]`;
                     }
                  } else {
                     userContextString = `\n\n[SYSTEM CONTEXT: Unregistered user. Phone: ${senderPhone}]`;
                  }
                } catch(e) {
                   console.error("Failed to fetch user context for AI:", e);
                }
                
                const response = await ai.models.generateContent({
                  model: "gemini-2.5-flash",
                  contents: session.aiContext,
                  config: {
                    systemInstruction: BOT_SYSTEM_INSTRUCTION + userContextString,
                    temperature: 0.7
                  }
                });
                
                finalReplyText = response.text?.trim() || "";
                
                if (finalReplyText) {
                  session.aiContext.push({ role: "model", parts: [{ text: finalReplyText }] });
                }
              }
            } catch (geminiErr: any) {
              console.warn(`[WhatsApp Bot Gemini Error for ${senderPhone}]:`, geminiErr?.message || geminiErr);
              addAdminAlert("AI Processing Failure", `Gemini API Error for ${senderPhone}: ${geminiErr?.message}`, "critical");
              addAuditLog("AI API Error", `Failed to generate response: ${geminiErr?.message}`);
            }
          }

          // Fallback
          if (!finalReplyText) {
            finalReplyText = getFallbackBotReply(mergedText);
          }

          // 7. WELCOME MESSAGE INJECTION
          if (!session.welcomeSent) {
            finalReplyText = generateRandomGreeting(pushName) + "\n\n" + finalReplyText;
            session.welcomeSent = true;
          }

          // 8. OUTGOING DEDUPLICATION
          if (session.lastBotReply === finalReplyText && session.lastReplyTimestamp && (now - session.lastReplyTimestamp < 60000)) {
            whatsappAnalytics.duplicateRepliesPrevented++;
            console.warn(`[WhatsApp Bot] Blocked duplicate outgoing reply to ${senderPhone}`);
            saveSessionToFirestore(remoteJid, session);
            return;
          }

          if (finalReplyText) {
            session.lastBotReply = finalReplyText;
            session.lastReplyTimestamp = Date.now();
            session.replyCounter++;
            responseCache.set(cacheKey, { reply: finalReplyText, timestamp: Date.now() });
            saveSessionToFirestore(remoteJid, session);
            
            // Push to enterprise queue
            enqueueMessage(remoteJid, senderPhone, finalReplyText);
          }
        }, 1200); // 1.2s merge window
      }
    });

    sock.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrReadyForPairing = true;
        try {
          currentQrCodeDataUrl = await QRCode.toDataURL(qr, {
            margin: 2,
            width: 320,
            color: {
              dark: "#0f172a",
              light: "#ffffff"
            }
          });
          connectionStatusText = "QR Code Generated. Scan with WhatsApp on your phone!";
          isConnected = false;
        } catch (err) {
          console.error("[WhatsApp Engine] QR Generation error:", err);
        }
      }

      if (connection === "close") {
        const errorObj = lastDisconnect?.error as any;
        const errorMsg = errorObj?.message || String(errorObj || "");
        const statusCode = errorObj?.output?.statusCode;
        const isQrTimeout = errorMsg.includes("QR refs attempts ended") || statusCode === 408;

        isConnected = false;
        isConnecting = false;
        currentQrCodeDataUrl = null;

        console.log(`[WhatsApp Connection Event] Connection closed. StatusCode: ${statusCode}, Error: "${errorMsg}"`);

        if (currentSaveCreds) {
          try {
            await currentSaveCreds();
          } catch (_) {}
        }

        const registered = isCredsRegistered();
        const credsFileExists = fs.existsSync(path.join(AUTH_DIR, "creds.json"));

        if (statusCode === DisconnectReason.loggedOut) {
          if (registered && loggedOutRetryCount < 3) {
            loggedOutRetryCount++;
            console.log(`[WhatsApp Engine] 401/loggedOut received on registered session (attempt ${loggedOutRetryCount}/3). Reconnecting...`);
            connectionStatusText = "Re-establishing Session Sync...";
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
              initWhatsAppEngine(true);
            }, 3000);
          } else {
            loggedOutRetryCount = 0;
            connectionStatusText = "Session Logged Out or Pairing Expired. Please Link Phone again or Scan QR Code.";
            lastError = "Session invalidated by WhatsApp (Code 401). Please try linking again or use QR Code method.";
            addAdminAlert("WhatsApp Disconnected", "Session was logged out by WhatsApp (Code 401).", "critical");
            addAuditLog("WhatsApp Disconnect", "Session logged out by WhatsApp.");
            currentPairingCode = null;
            connectedUserPhone = null;
            try {
              if (fs.existsSync(AUTH_DIR)) {
                fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                fs.mkdirSync(AUTH_DIR, { recursive: true });
              }
            } catch (cleanErr) {
              console.warn("[WhatsApp Engine] Error cleaning auth dir on 401:", cleanErr);
            }
          }
        } else if (isQrTimeout) {
          console.log("[WhatsApp Engine] QR code attempts expired naturally. Waiting for user action.");
          console.log("[WhatsApp Engine] QR code attempts expired naturally. Waiting for user action.");
          connectionStatusText = "QR Code Expired. Click Start / Connect WhatsApp or Link Phone Number.";
          lastError = null;
          currentPairingCode = null;
        } else {
          loggedOutRetryCount = 0;
          const isRestartRequired = statusCode === DisconnectReason.restartRequired || statusCode === 515;

          if (registered) {
            whatsappAnalytics.reconnectCount++;
            let reconnectDelay = 5000;
            if (isRestartRequired) {
              reconnectDelay = 1500;
            } else {
              // Exponential Backoff based on reconnectCount (5s, 10s, 20s, 40s, 60s max)
              const count = Math.min(whatsappAnalytics.reconnectCount, 5);
              reconnectDelay = Math.min(5000 * Math.pow(2, count - 1), 60000);
            }

            connectionStatusText = isRestartRequired 
              ? "Pairing Handshake Complete! Connecting..." 
              : `Connection Closed (${statusCode || 'Disconnected'}). Reconnecting in ${reconnectDelay/1000}s...`;

            console.log(`[WhatsApp Engine] Registered session closed (Code ${statusCode}). Reconnecting in ${reconnectDelay}ms... (Attempt ${whatsappAnalytics.reconnectCount})`);

            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
              initWhatsAppEngine(true);
            }, reconnectDelay);
          } else if (isRestartRequired) {
            console.log(`[WhatsApp Engine] Handshake restart required during pairing flow (Code 515). Reconnecting in 1500ms...`);
            if (reconnectTimer) clearTimeout(reconnectTimer);
            reconnectTimer = setTimeout(() => {
              initWhatsAppEngine(true);
            }, 1500);
          } else {
            console.log(`[WhatsApp Engine] Unregistered session closed (StatusCode: ${statusCode || 'N/A'}). Standing by for admin connection action.`);
            connectionStatusText = "Disconnected. Click Start / Connect WhatsApp or enter Phone Number to Pair.";
            lastError = statusCode === 428 
              ? "Connection terminated by WhatsApp server (428). Click Connect to generate a new QR Code or Pairing Code."
              : `Connection closed (${statusCode || 'Disconnected'}).`;
            currentPairingCode = null;
            cleanupCurrentSocket();
          }
        }
      } else if (connection === "open") {
        loggedOutRetryCount = 0;
        whatsappAnalytics.reconnectCount = 0;
        isConnected = true;
        isConnecting = false;
        currentQrCodeDataUrl = null;
        currentPairingCode = null;
        connectionStatusText = "WhatsApp Web Connected & Active!";
        lastError = null;
        lastConnectedAt = new Date().toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });

        if (sock?.user) {
          connectedUserPhone = sock.user.id ? sock.user.id.split(":")[0] : null;
        }
        console.log("[WhatsApp Engine] Baileys connected successfully as:", connectedUserPhone);
      }
    });

    return getWhatsAppStatus();
  } catch (err: any) {
    console.error("[WhatsApp Engine Initialization Error]:", err);
    isConnected = false;
    connectionStatusText = "Initialization Failed";
    lastError = err?.message || String(err);
    return getWhatsAppStatus();
  } finally {
    isInitializing = false;
  }
}

/**
 * Clean phone number to WhatsApp JID format
 * e.g., "0319 7206072" or "+923197206072" -> "923197206072@s.whatsapp.net"
 */
export function formatWhatsAppJid(phone: string): string | null {
  if (!phone) return null;
  let digits = phone.replace(/[^0-9]/g, "");
  
  if (!digits) return null;

  // Handle local Pakistani numbers: e.g. 03197206072 -> 923197206072
  if (digits.startsWith("0") && digits.length === 11) {
    digits = "92" + digits.substring(1);
  } else if (!digits.startsWith("92") && digits.length === 10 && digits.startsWith("3")) {
    digits = "92" + digits;
  }

  if (digits.length < 8) return null;

  return `${digits}@s.whatsapp.net`;
}

/**
 * Send an automated WhatsApp message to any phone number
 */
export async function sendWhatsAppMessage(recipientPhone: string, textMessage: string): Promise<{ success: boolean; message: string }> {
  const jid = formatWhatsAppJid(recipientPhone);

  if (!jid) {
    const err = `Invalid phone number format: ${recipientPhone}`;
    addWhatsAppLog(recipientPhone, textMessage, "FAILED", err);
    return { success: false, message: err };
  }

  if (!sock || !isConnected) {
    const err = "WhatsApp Web is not connected. Link phone or scan QR code in Admin Panel.";
    addWhatsAppLog(recipientPhone, textMessage, "FAILED", err);
    return { success: false, message: err };
  }

  try {
    await sock.sendMessage(jid, { text: textMessage });
    addWhatsAppLog(recipientPhone, textMessage, "SENT");
    console.log(`[WhatsApp Engine] Message sent successfully to ${jid}`);
    return { success: true, message: `Message sent to ${recipientPhone}` };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error(`[WhatsApp Engine Send Error to ${recipientPhone}]:`, err);
    addWhatsAppLog(recipientPhone, textMessage, "FAILED", errorMsg);
    return { success: false, message: errorMsg };
  }
}

/**
 * Requests an 8-character Pairing Code directly for a phone number (e.g. 03197206072 or +923171605076)
 * allows linking WhatsApp without scanning a QR code!
 */
export async function requestWhatsAppPairingCode(phoneNumber: string): Promise<{ code: string }> {
  let cleanPhone = phoneNumber.replace(/[^0-9]/g, "");
  if (!cleanPhone) {
    throw new Error("Invalid phone number. Please enter full number with country code, e.g. 03197206072 or 923197206072");
  }
  if (cleanPhone.startsWith("03") && cleanPhone.length === 11) {
    cleanPhone = "92" + cleanPhone.substring(1);
  } else if (!cleanPhone.startsWith("92") && cleanPhone.length === 10 && cleanPhone.startsWith("3")) {
    cleanPhone = "92" + cleanPhone;
  }

  // If session is already active & registered, reject
  if (sock && isConnected && isCredsRegistered()) {
    throw new Error("WhatsApp session is already linked and connected! Disconnect first to pair a new number.");
  }

  // Safely cleanup current socket and wipe stale unregistered keys before pairing
  try {
    cleanupCurrentSocket();

    if (!isCredsRegistered()) {
      console.log("[WhatsApp Engine] Wiping stale unregistered auth keys before generating pairing code...");
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      }
    }

    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn("[WhatsApp Engine] Auth dir preparation before pairing code:", e);
  }

  let lastPairingError: any = null;

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      if (!sock) {
        await initWhatsAppEngine(true);
      }

      // Wait up to 5s for socket WebSocket connection to be fully OPEN (readyState === 1)
      for (let i = 0; i < 15; i++) {
        if (sock && (sock as any).ws && (sock as any).ws.readyState === 1) {
          break;
        }
        await new Promise(res => setTimeout(res, 300));
      }

      if (sock) {
        // Wait for the QR code to be generated (required before requesting pairing code)
        try {
          if (!qrReadyForPairing) {
            await sock.waitForConnectionUpdate(async (u: any) => !!u.qr, 20000); // 20 seconds timeout
          }
        } catch (waitErr) {
          console.warn("[WhatsApp Engine] waitForConnectionUpdate timeout/error:", waitErr);
        }

        // According to Baileys, wait for connection update "connecting" or just wait briefly
        await new Promise(res => setTimeout(res, 2000));
        
        const rawCode = await sock.requestPairingCode(cleanPhone);
        const formattedCode = rawCode?.includes("-") 
          ? rawCode 
          : (rawCode?.match(/.{1,4}/g)?.join("-") || rawCode);

        currentPairingCode = formattedCode;
        connectionStatusText = `Pairing Code for +${cleanPhone}: ${formattedCode}. Enter on phone!`;
        console.log(`[WhatsApp Engine] Generated Pairing Code on attempt ${attempt} for +${cleanPhone}: ${formattedCode}`);
        return { code: formattedCode };
      }
    } catch (err: any) {
      lastPairingError = err;
      console.warn(`[WhatsApp Engine Pairing Code Attempt ${attempt} Failed]:`, err?.message || err);
      cleanupCurrentSocket();
      await new Promise(res => setTimeout(res, 2500));
    }
  }

  throw new Error(lastPairingError?.message || "Failed to generate pairing code. Please use QR Code scan or click Reset Session.");
}

/**
 * Force resets the entire WhatsApp session (wipes auth directory & restarts engine)
 */
export async function resetWhatsAppSession(): Promise<WhatsAppStatus> {
  console.log("[WhatsApp Engine] Force resetting WhatsApp session...");
  cleanupCurrentSocket();

  isConnected = false;
  currentQrCodeDataUrl = null;
  currentPairingCode = null;
  connectedUserPhone = null;
  lastError = null;
  connectionStatusText = "Resetting Session Credentials...";

  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }
  } catch (e) {
    console.warn("[WhatsApp Engine] Error resetting auth dir:", e);
  }

  return await initWhatsAppEngine(true);
}

/**
 * Disconnects and logs out from WhatsApp Web
 */
export async function logoutWhatsApp(): Promise<WhatsAppStatus> {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch (e) {
    console.warn("[WhatsApp Engine] Logout warning:", e);
  }

  cleanupCurrentSocket();

  isConnected = false;
  currentQrCodeDataUrl = null;
  currentPairingCode = null;
  connectedUserPhone = null;
  connectionStatusText = "Disconnected / Logged Out";

  try {
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
    }
  } catch (e) {
    console.error("[WhatsApp Engine] Failed to delete auth dir:", e);
  }

  return getWhatsAppStatus();
}

