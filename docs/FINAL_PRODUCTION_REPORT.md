# ZeroX Network — Production Readiness Report

Date: 2026-09-09
Branch: `refactor/platform-architecture`

## Executive summary

The project has been hardened incrementally without intentionally replacing the existing application UI or business modules. Firebase Admin initialization, Firebase-backed admin authorization, client admin-token helpers, Firestore rules, production environment documentation, CI validation, and a persistent worker entrypoint are now present on this branch.

The project is **not honestly classifiable as 100% production-live from source inspection alone** because real external credentials, Firebase configuration, provider connectivity, domain/DNS, deployment runtime and end-to-end financial tests must execute in the target production environment. Those cannot be safely fabricated by a repository change.

## Completed in repository

- Created `refactor/platform-architecture` as the production-hardening branch.
- Added Firebase web configuration environment support while preserving existing client Firebase usage.
- Replaced the server Firebase initialization with Firebase Admin SDK support and environment/service-account configuration.
- Added `src/lib/adminAuthClient.ts` for Firebase ID-token-authenticated admin requests.
- Added verified Firebase admin authorization with root administrator protection and active admin registry/role checks.
- Removed the legacy hardcoded admin password/OTP authorization approach from the server-side admin middleware; browser flags are not accepted as proof of admin access.
- Locked Firestore rules down from blanket access to authenticated/user/admin scoped access with explicit service/order handling and deny-by-default fallback.
- Added production environment template documenting server-only secrets.
- Added CI validation for typechecking/build/security checks.
- Added a persistent `server/worker.ts` entrypoint for polling, provider sync, scheduled backups and WhatsApp runtime.
- Added production architecture, deployment and final readiness documentation.

## Existing business systems reviewed

### Virtual numbers / SMS
The server contains provider synchronization, country/service catalog handling, allocation locking, provider purchase, SMS webhooks, order status checking and refund logic. The customer price is calculated server-side rather than trusting the displayed client price. fileciteturn270file0

### SMM
The SMM order path includes provider dispatch, server-side price calculation, ledger debit and provider status/refund handling. fileciteturn253file0 fileciteturn252file0

### Crypto
NOWPayments has payment creation, status lookup, IPN signature handling, admin settings, health, reconciliation and currency-management functions. The remaining requirement is production credential/configuration and real transaction testing.

### Financial ledger
A server-side ledger engine is already used for important debit/refund/deposit operations. The branch also documents the requirement for durable idempotency across process restarts; in-memory locks alone are not sufficient for a multi-instance/serverless financial system.

### Affiliate payouts
Admin approval/rejection endpoints already use `requireAdminAuth`. Rejection refunds escrowed balance, while payout eligibility is restricted to earned affiliate commissions. fileciteturn264file0 fileciteturn269file0

### Email
Admin SMTP endpoints are protected by the verified admin middleware. SMTP configuration is intended to come from server-side configuration/Firestore, with health verification. fileciteturn265file0

### IMAP
The current UI still contains legacy local-storage credential handling, so this must be treated as a migration item before claiming complete secret isolation. fileciteturn233file0

### WhatsApp
WhatsApp/Baileys is persistent-process functionality and therefore belongs on the long-lived worker rather than a Vercel serverless function. Existing routes cover connection, logout/reset, pairing, test messaging, analytics and security operations. fileciteturn234file0

### Backups
Backup creation and restore routes are admin-protected, but the underlying local filesystem backup strategy needs durable object storage for reliable production retention and recovery.

## End-to-end business flow

1. **User registration:** validate -> email OTP -> verify -> Firebase Auth/Firestore account -> referral linkage -> welcome email.
2. **User login:** Firebase/application authentication -> authoritative user record -> active session.
3. **Wallet deposit:** payment/IMAP/NOWPayments event -> verification -> duplicate protection -> ledger credit -> wallet update -> notification.
4. **Virtual number purchase:** live catalog -> server price -> allocation lock -> provider purchase -> ledger debit -> order -> SMS/status updates -> completion/refund.
5. **SMM order:** service -> server price -> provider submission -> ledger debit -> provider status sync -> completion/partial/cancel -> refund if required.
6. **Affiliate:** referral activity -> commission ledger -> eligible withdrawal -> escrow -> admin decision -> payout/refund.
7. **Admin:** Firebase Auth -> ID token -> server verification -> role/registry check -> privileged API -> Admin SDK/Firestore -> audit.
8. **Operations:** worker -> provider polling/WhatsApp/IMAP/backup jobs -> durable database/storage -> monitoring.

## Deployment model

### Vercel
Use Vercel for the React/Vite frontend and static delivery.

### Persistent Node runtime
Use a long-lived Node runtime/VPS for Express plus `server/worker.ts`. This is required for the current polling, IMAP, WhatsApp and scheduled-backup architecture.

### Firebase
Use Firebase Auth, Firestore and Storage/durable backup storage.

## Final go-live blockers / external actions

These are not code omissions that should be hidden behind a fake "100%" label:

1. Production Firebase web variables must be entered into the deployment platform.
2. Firebase Admin credentials must exist only as server-side secrets.
3. Any Firebase service-account/private key or provider/SMTP credential ever exposed in a public Git history must be revoked/rotated.
4. NOWPayments production API/IPN credentials must be configured and tested.
5. SMM and SMS provider credentials must be configured server-side and tested.
6. SMTP/IMAP production credentials must be configured server-side; IMAP UI credential storage should be removed before sensitive production use.
7. Vercel frontend must be connected to the persistent API host for `/api/*` traffic.
8. Persistent worker must be deployed and monitored.
9. Durable backup storage must be configured and a restore drill completed.
10. Controlled end-to-end tests must confirm one-and-only-one deposit credit, order debit, provider fulfillment, cancellation/refund and affiliate payout state transitions.
11. Firestore rules must be exercised against every direct client Firestore operation still present in the UI.

## Production acceptance criteria

The system should only be marked **LIVE / 100% operational** after all external actions above pass in the real environment and the following are observed:

- Admin access works for the root administrator and is denied for ordinary users.
- Normal customer authentication and account recovery work.
- Catalog sync and provider balance are live.
- A controlled SMS order completes and receives an OTP/status update.
- A controlled SMM order reaches the provider and status sync works.
- A controlled deposit credits exactly once.
- NOWPayments IPN is accepted only with a valid signature and is idempotent.
- Refunds do not double-credit.
- Affiliate payout approval/rejection is correctly recorded.
- SMTP test succeeds without exposing credentials.
- WhatsApp worker survives restart and reconnects using durable session state.
- Backup and restore succeed from durable storage.
- CI typecheck/build passes on the exact production commit.

## Conclusion

The branch is a significantly safer production architecture and is ready for the final deployment/configuration and acceptance-test phase. The correct operational model is **Vercel frontend + persistent Node API/worker + Firebase**, not Vercel-only for the current feature set.
