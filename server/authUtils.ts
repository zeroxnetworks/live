import crypto from "crypto";

/**
 * Generates a cryptographic salt and hashes the password using PBKDF2 (SHA-512, 100,000 iterations).
 */
export function hashPassword(password: string): { passwordHash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
  return { passwordHash, salt };
}

/**
 * Verifies a password against a stored PBKDF2 hash and salt using constant-time comparison.
 */
export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  if (!password || !storedHash || !salt) return false;
  try {
    const computedHash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    const storedBuf = Buffer.from(storedHash, "hex");
    const computedBuf = Buffer.from(computedHash, "hex");
    if (storedBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(storedBuf, computedBuf);
  } catch (err) {
    console.error("Password verification error:", err);
    return false;
  }
}

/**
 * Checks a user document against a provided password.
 * Supports:
 * 1. Standard secure PBKDF2 (passwordHash + salt)
 * 2. Legacy plaintext migration (password field)
 */
export function checkUserPassword(password: string, userDoc: any): { valid: boolean; needsMigration: boolean } {
  if (!password || !userDoc) {
    return { valid: false, needsMigration: false };
  }

  // 1. Check PBKDF2 passwordHash + salt
  if (userDoc.passwordHash && userDoc.salt) {
    const isValid = verifyPassword(password, userDoc.passwordHash, userDoc.salt);
    return { valid: isValid, needsMigration: false };
  }

  // 2. Check legacy plaintext password field
  if (userDoc.password) {
    const isValid = userDoc.password === password;
    return { valid: isValid, needsMigration: isValid };
  }

  return { valid: false, needsMigration: false };
}
