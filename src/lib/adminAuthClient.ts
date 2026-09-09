import { auth } from "./firebase";

/**
 * Returns a Firebase ID token for the currently authenticated user.
 * Admin APIs must verify this token server-side; localStorage flags are never
 * treated as proof of administrator access.
 */
export async function getAdminIdToken(forceRefresh = false): Promise<string> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Authentication required");
  }

  return user.getIdToken(forceRefresh);
}

/**
 * Fetch wrapper for privileged admin endpoints.
 * The bearer token is attached at request time so sessions can expire/refresh
 * normally without persisting credentials in browser storage.
 */
export async function adminFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = await getAdminIdToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: "same-origin",
  });
}

/**
 * Parse an admin API response and surface a useful server error.
 */
export async function readAdminJson<T = unknown>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error?: unknown }).error)
        : `Admin request failed (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}
