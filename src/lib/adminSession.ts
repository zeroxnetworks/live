import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { adminFetch, readAdminJson } from "./adminAuthClient";

export type AdminSession = {
  uid: string;
  email: string;
  role: string;
  isSupreme: boolean;
};

/**
 * Ask the trusted backend to authorize the current Firebase identity.
 * Client-side flags/roles are deliberately not accepted as proof of access.
 */
export async function verifyAdminSession(): Promise<AdminSession> {
  if (!auth.currentUser) throw new Error("Authentication required");

  const response = await adminFetch("/api/admin/me", { method: "GET" });
  return readAdminJson<AdminSession>(response);
}

/** Resolve Firebase auth state once without persisting authorization flags. */
export function waitForFirebaseUser(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}
