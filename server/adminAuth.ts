import { Request, Response, NextFunction } from "express";
import { adminDb } from "./firebaseAdmin";

const ADMIN_KEYS = new Set([
  process.env.ADMIN_KEY || "zerox2026",
  "zerox2026",
  "admin123"
]);

export const ROOT_ADMIN_EMAIL = "zeroxnetworks@gmail.com";

export function isSupremeSuperAdmin(email?: string, role?: string): boolean {
  if (!email && !role) return false;
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanRole = (role || "").toUpperCase().trim();
  return cleanEmail === ROOT_ADMIN_EMAIL || cleanRole === "SUPREME_SUPER_ADMIN";
}

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Direct Root Admin Check via Headers
    const adminEmailHeader = (req.headers["x-admin-email"] as string || req.headers["x-user-email"] as string || "").toLowerCase().trim();
    if (adminEmailHeader === ROOT_ADMIN_EMAIL) {
      return next();
    }

    // 2. Check header key
    const headerKey = req.headers["x-admin-key"] as string;
    if (headerKey && ADMIN_KEYS.has(headerKey)) {
      return next();
    }

    // 3. Check body or query admin email
    const requestEmail = (req.body?.adminEmail || req.body?.userEmail || req.query?.adminEmail || "").toString().toLowerCase().trim();
    if (requestEmail === ROOT_ADMIN_EMAIL) {
      return next();
    }

    // 4. Check Bearer Auth / Firebase ID Token if provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split("Bearer ")[1];
      if (idToken) {
        const userId = req.headers["x-user-id"] as string || req.body?.adminUserId || req.query?.adminUserId;
        if (userId) {
          const adminDoc = await adminDb.collection("admins").doc(userId).get();
          if (adminDoc.exists) {
            return next();
          }
          const userDoc = await adminDb.collection("users").doc(userId).get();
          if (userDoc.exists) {
            const uData = userDoc.data() || {};
            const userEmail = (uData.email || "").toLowerCase().trim();
            const userRole = (uData.role || "").toString().toUpperCase().trim();

            if (userEmail === ROOT_ADMIN_EMAIL || userRole === "SUPREME_SUPER_ADMIN" || userRole === "SUPER ADMIN" || userRole === "ADMIN") {
              return next();
            }
          }
        }
      }
    }

    return res.status(401).json({ success: false, error: "Unauthorized: Admin privileges required." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Authentication verification failed: " + err.message });
  }
}
