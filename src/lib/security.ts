import { db } from "./firebase";
import { collection, addDoc } from "firebase/firestore";

// Simple SHA-256 password hashing helper using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "_zx_salt_2026");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || hash.length < 10) {
    // If plain text (legacy users), compare directly
    return password === hash;
  }
  const hashedInput = await hashPassword(password);
  return hashedInput === hash || password === hash;
}

// Input Sanitization for SQL Injection & XSS Protection
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return input;
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/data:text\/html/gi, "")
    .replace(/['";=]/g, (m) => {
      switch (m) {
        case "'": return "&#39;";
        case '"': return "&quot;";
        case ";": return "";
        case "=": return "";
        default: return m;
      }
    })
    .trim();
}

/**
 * Validates if a URL is safe against XSS, script injection, and open redirect vulnerabilities.
 * Blocks dangerous protocols like javascript:, vbscript:, data:, file:, etc.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("vbscript:") ||
    trimmed.startsWith("data:text") ||
    trimmed.startsWith("file:") ||
    trimmed.startsWith("about:") ||
    trimmed.includes("<script") ||
    trimmed.includes("onerror=") ||
    trimmed.includes("onload=") ||
    trimmed.includes("onclick=") ||
    trimmed.includes("eval(")
  ) {
    return false;
  }
  
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith("/") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("blob:") ||
    /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/.*)?$/.test(trimmed)
  );
}

/**
 * Sanitizes any URL before it is rendered in an href or passed to navigation/window.open.
 * Neutralizes malicious protocols and returns a safe URL or fallback (#).
 */
export function sanitizeUrl(url: string, fallback: string = "#"): string {
  if (!url || typeof url !== "string") return fallback;
  const cleanUrl = url.trim();

  // Strip control characters, quotes, and HTML tags
  const sanitized = cleanUrl
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/["'<>]/g, "");

  const lower = sanitized.toLowerCase();

  // Block malicious protocols and script injections
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("vbscript:") ||
    lower.startsWith("data:text") ||
    lower.startsWith("file:") ||
    lower.startsWith("about:") ||
    lower.includes("onerror=") ||
    lower.includes("onload=") ||
    lower.includes("<script") ||
    lower.includes("javascript%3a")
  ) {
    return fallback;
  }

  // Prepend https:// if user entered plain domain like example.com
  if (
    !lower.startsWith("http://") &&
    !lower.startsWith("https://") &&
    !lower.startsWith("mailto:") &&
    !lower.startsWith("tel:") &&
    !lower.startsWith("/") &&
    !lower.startsWith("#") &&
    !lower.startsWith("data:image") &&
    !lower.startsWith("blob:")
  ) {
    return `https://${sanitized}`;
  }

  return sanitized;
}

// Anti-XSS String Cleaning
export function escapeHtml(str: string): string {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// CSRF Token Utilities
export function generateCsrfToken(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, "0")).join("");
}

// Login Attempt Lockout Store
interface LoginAttemptRecord {
  attempts: number;
  lockoutUntil: number;
}
const loginAttemptsMap = new Map<string, LoginAttemptRecord>();

export function recordFailedLogin(identifier: string): { locked: boolean; remainingAttempts: number; lockoutMinutes: number } {
  const now = Date.now();
  const record = loginAttemptsMap.get(identifier) || { attempts: 0, lockoutUntil: 0 };

  if (now < record.lockoutUntil) {
    const minutesLeft = Math.ceil((record.lockoutUntil - now) / 60000);
    return { locked: true, remainingAttempts: 0, lockoutMinutes: minutesLeft };
  }

  record.attempts += 1;
  if (record.attempts >= 5) {
    record.lockoutUntil = now + 15 * 60 * 1000; // 15 minute lockout
    loginAttemptsMap.set(identifier, record);
    return { locked: true, remainingAttempts: 0, lockoutMinutes: 15 };
  }

  loginAttemptsMap.set(identifier, record);
  return { locked: false, remainingAttempts: 5 - record.attempts, lockoutMinutes: 0 };
}

export function resetLoginAttempts(identifier: string): void {
  loginAttemptsMap.delete(identifier);
}

export function checkLoginLockout(identifier: string): { locked: boolean; lockoutMinutes: number } {
  const now = Date.now();
  const record = loginAttemptsMap.get(identifier);
  if (record && now < record.lockoutUntil) {
    const minutesLeft = Math.ceil((record.lockoutUntil - now) / 60000);
    return { locked: true, lockoutMinutes: minutesLeft };
  }
  return { locked: false, lockoutMinutes: 0 };
}

// Activity Logging
export async function logActivity(userId: string, username: string, action: string, details: string, ip: string = "127.0.0.1") {
  try {
    await addDoc(collection(db, "activity_logs"), {
      userId,
      username,
      action: sanitizeInput(action),
      details: sanitizeInput(details),
      ip,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to write activity log:", err);
  }
}

// API Call Logging
export async function logApiCall(apiKey: string, endpoint: string, method: string, status: number, responseMessage: string) {
  try {
    await addDoc(collection(db, "api_logs"), {
      apiKey: apiKey ? apiKey.substring(0, 8) + "..." : "NONE",
      endpoint,
      method,
      status,
      responseMessage: sanitizeInput(responseMessage),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Failed to write API log:", err);
  }
}
