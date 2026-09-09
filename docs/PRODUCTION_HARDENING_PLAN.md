# Zerox Network Production Hardening

## Security baseline
- Firebase Authentication is the source of browser identity.
- Privileged APIs must verify Firebase ID tokens server-side.
- LocalStorage/sessionStorage flags are never authorization.
- Service-account, SMTP, SMM, SMS, IMAP and payment secrets remain server-side.
- Firestore rules deny unauthenticated/default access and grant privileged access only to verified admin identities.

## Runtime topology
- Vercel: frontend and stateless HTTP where practical.
- Persistent Node runtime: WhatsApp/Baileys, IMAP listener, polling/sync engines and scheduled backup work.
- Firebase: Auth, Firestore and Storage/durable backup artifacts.

## Financial safety
- Every debit, credit, refund and payout must be idempotent.
- Ledger records are the source of truth; balance changes must be tied to ledger operations.
- Provider callbacks/webhooks must be authenticated and deduplicated.

## Remaining migration order
1. Replace AdminPortal browser login/OTP with Firebase Auth + `/api/admin/me`.
2. Route privileged provider/secret operations through authenticated backend APIs.
3. Remove hardcoded credentials and unsafe production fallbacks.
4. Make financial idempotency durable across restarts/instances.
5. Move backups to durable storage and schedule from a persistent worker.
6. Validate Firestore rules against every remaining direct client operation.
7. Run typecheck/build and production smoke tests.
