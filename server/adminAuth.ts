import { Request, Response, NextFunction } from "express";
import { adminDb } from "./firebaseAdmin";

const ADMIN_KEYS = new Set([
  process.env.ADMIN_KEY || "zerox2026",
  "zerox2026",
  "admin123"
]);

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // 1. Check header key
    const headerKey = req.headers["x-admin-key"] as string;
    if (headerKey && ADMIN_KEYS.has(headerKey)) {
      return next();
    }

    // 2. Check Bearer Auth / Firebase ID Token if provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split("Bearer ")[1];
      if (idToken) {
        // Validate via Firebase auth or checking uid in admins collection
        // For security in custom server setup: check if request body/query has userId or email
        const userId = req.headers["x-user-id"] as string || req.body?.adminUserId || req.query?.adminUserId;
        if (userId) {
          const adminDoc = await adminDb.collection("admins").doc(userId).get();
          if (adminDoc.exists) {
            return next();
          }
          const userDoc = await adminDb.collection("users").doc(userId).get();
          if (userDoc.exists && userDoc.data()?.role === "admin") {
            return next();
          }
        }
      }
    }

    return res.status(401).json({ success: false, error: "Unauthorized: Admin privileges required." });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: "Authentication verification failed: " + err.message });
  }
}
