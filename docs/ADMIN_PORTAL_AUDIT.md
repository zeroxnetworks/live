# Zerox Network Admin Portal Audit

Audit target: `refactor/platform-architecture`

## Verified functional paths

- Global configuration: Admin Portal drafts call `onUpdateGlobalSettings`; settings are persisted through the global settings flow.
- NOWPayments Crypto Gateway: API key/IPN secret and gateway configuration are persisted in `settings/crypto_gateway`; the backend cache is refreshed after save; connection-test and webhook-health paths use the persisted configuration.
- SMM engine: backend reads `smm_providers` from Firestore and performs live balance/service synchronization from configured providers.
- OTP/SMS provider engine: backend provider sync reads the active SMS provider from Firestore and uses its API URL/key to construct the provider adapter.
- SMTP alerts: Admin Alerts has read/save/health/test API calls for SMTP settings.
- Backup/Recovery: a server-side backup engine exists with retention and ZIP integrity verification.
- WhatsApp security: the Admin Portal exposes live OTP/security statistics and test-dispatch controls.

## Critical issues found

### P0 — Admin authentication is client-side and contains bypasses
`src/components/AdminPortal.tsx` currently contains hard-coded administrator credentials, stores the logged-in state/role in `localStorage`, and permits a session unlock when the entered password is merely length >= 4. This is not production-grade authentication.

The frontend also treats a trusted-device flag in `localStorage` as sufficient to bypass 2FA.

### P0 — Admin backend auth middleware does not verify Firebase ID tokens
`server/adminAuth.ts` accepts a root-admin email/header/body value without proving possession of an authenticated Firebase identity. Its Bearer-token path checks a supplied user ID against Firestore but does not call Firebase Admin `verifyIdToken`.

### P0 — Provider/API secrets are handled in browser code
SMM and OTP provider keys are stored/read through Firestore from React components and are sent from the browser for provider tests. This exposes provider secrets to the client runtime and makes secret protection dependent on Firestore client rules.

### P0 — SMTP/IMAP credentials have hard-coded fallback secrets
`server/emailAlertEngine.ts`, `src/components/admin/tabs/admin-alerts.tsx`, and `src/components/ImapPaymentManager.tsx` contain credential-like hard-coded fallback values. These must be removed and supplied only through server-side environment variables or an authenticated server-side secrets/settings API.

### P1 — IMAP configuration is localStorage-backed
The IMAP manager saves mailbox credentials and parsing configuration to browser `localStorage`. Production credentials must not be persisted there.

### P1 — Backup engine uses local filesystem storage
`server/backupEngine.ts` writes backups under the process working directory. This is not durable storage on ephemeral/serverless deployment environments and needs durable object storage for production recovery guarantees.

### P1 — Admin audit metadata contains a hard-coded IP
The client-side audit logger currently writes a fixed IP value rather than deriving the request IP server-side. Audit records should use server-observed request metadata.

### P1 — SMM/OTP admin CRUD is directly coupled to Firestore client writes
Provider create/update/delete and balance sync operations in the Admin Portal write directly to Firestore. These operations should be moved behind authenticated backend endpoints so authorization, validation, secret handling, and audit logging are server-authoritative.

## Recommended production target

`Admin UI -> Firebase Auth ID token -> authenticated backend route -> server-side validation/RBAC -> Firestore/Admin SDK -> provider adapter`

Secrets should never be returned in plaintext to the browser. Admin UI should receive masked status only and submit a new secret only when replacing it.
