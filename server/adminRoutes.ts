import { Router } from "express";
import { requireAdminAuth } from "./adminAuth";

/**
 * Stateless admin identity endpoint. The frontend can use this to replace
 * localStorage-based admin authorization with a server-verified Firebase token.
 */
export const adminRouter = Router();

adminRouter.get("/me", requireAdminAuth, (req, res) => {
  const context = (req as any).adminAuth || {};
  return res.json({
    uid: context.uid || "",
    email: context.email || "",
    role: context.role || "Admin",
    isSupreme: context.isSupreme === true
  });
});

export default adminRouter;
