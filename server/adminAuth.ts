import { Request, Response, NextFunction } from "express";
import { adminDb, adminAuth } from "./firebaseAdmin";

export const ROOT_ADMIN_EMAIL = "zeroxnetworks@gmail.com";
const NORMALIZED_ROOT_ADMIN_EMAIL = ROOT_ADMIN_EMAIL.toLowerCase();

export type VerifiedAdminContext = {
  uid: string;
  email: string;
  role: string;
  isSupreme: boolean;
};

export async function isAuthorizedAdminToken(idToken: string): Promise<{ authorized: boolean; uid?: string; email?: string; role?: string }> {
  try {
    const decoded = await adminAuth.verifyIdToken(idToken, true);
    const uid = decoded.uid;
    const email = (decoded.email || "").toLowerCase().trim();
    const claimRole = String((decoded as any).role || (decoded as any).adminRole || "").trim();

    if (email === NORMALIZED_ROOT_ADMIN_EMAIL) {
      return { authorized: true, uid, email, role: "Supreme Super Admin" };
    }

    const adminClaim = (decoded as any).admin === true || (decoded as any).isAdmin === true;
    const claimRoleUpper = claimRole.toUpperCase();
    if (adminClaim || ["ADMIN", "SUPER ADMIN", "SUPREME_SUPER_ADMIN", "SUPER_ADMIN"].includes(claimRoleUpper)) {
      return { authorized: true, uid, email, role: claimRole || "Admin" };
    }

    const adminDoc = await adminDb.collection("admins").doc(uid).get();
    if (adminDoc.exists) {
      const data = adminDoc.data() || {};
      const status = String(data.status || "ACTIVE").toUpperCase();
      if (status === "ACTIVE") {
        return {
          authorized: true,
          uid,
          email: email || String(data.email || "").toLowerCase().trim(),
          role: String(data.role || claimRole || "Admin")
        };
      }
    }

    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (userDoc.exists) {
      const data = userDoc.data() || {};
      const status = String(data.status || "ACTIVE").toUpperCase();
      const role = String(data.role || "").trim();
      const roleUpper = role.toUpperCase();
      if (status !== "BANNED" && ["ADMIN", "SUPER ADMIN", "SUPREME_SUPER_ADMIN", "SUPER_ADMIN"].includes(roleUpper)) {
        return { authorized: true, uid, email: email || String(data.email || "").toLowerCase().trim(), role };
      }
    }

    return { authorized: false };
  } catch {
    return { authorized: false };
  }
}

export function isSupremeSuperAdmin(email?: string, role?: string): boolean {
  const cleanEmail = (email || "").toLowerCase().trim();
  const cleanRole = (role || "").toUpperCase().trim();
  return cleanEmail === NORMALIZED_ROOT_ADMIN_EMAIL || cleanRole === "SUPREME_SUPER_ADMIN" || cleanRole === "SUPREME SUPER ADMIN";
}

export async function getVerifiedAdminContext(req: Request): Promise<VerifiedAdminContext | null> {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) return null;

  const idToken = authHeader.slice("Bearer ".length).trim();
  if (!idToken) return null;

  const result = await isAuthorizedAdminToken(idToken);
  if (!result.authorized || !result.uid) return null;

  const email = result.email || "";
  const role = result.role || "Admin";
  return {
    uid: result.uid,
    email,
    role,
    isSupreme: isSupremeSuperAdmin(email, role)
  };
}

/**
 * Require a verified Firebase admin identity. Browser flags, usernames and
 * client-side OTP state are intentionally ignored for authorization.
 */
export async function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Legacy server-to-server integrations may use ADMIN_KEY, but only when an
    // explicit environment secret exists. No credential is embedded in source.
    const configuredAdminKey = process.env.ADMIN_KEY?.trim();
    const suppliedAdminKey = typeof req.headers["x-admin-key"] === "string" ? req.headers["x-admin-key"].trim() : "";
    if (configuredAdminKey && suppliedAdminKey && suppliedAdminKey === configuredAdminKey) {
      (req as any).adminAuth = {
        uid: "server-key",
        email: "",
        role: "Service Integration",
        isSupreme: false
      } satisfies VerifiedAdminContext;
      return next();
    }

    const context = await getVerifiedAdminContext(req);
    if (!context) {
      return res.status(401).json({ success: false, error: "Unauthorized: Firebase admin authentication required." });
    }

    (req as any).adminAuth = context;
    return next();
  } catch {
    return res.status(401).json({ success: false, error: "Authentication verification failed." });
  }
}

/** Require the immutable root authority for destructive/global operations. */
export async function requireSupremeSuperAdmin(req: Request, res: Response, next: NextFunction) {
  await requireAdminAuth(req, res, () => {
    const context = (req as any).adminAuth as VerifiedAdminContext | undefined;
    if (!context?.isSupreme) {
      return res.status(403).json({ success: false, error: "Forbidden: Supreme Super Admin authority required." });
    }
    return next();
  });
}
