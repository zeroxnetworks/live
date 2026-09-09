# Zerox Network — Production Readiness

## Current verdict

The application has a substantial working frontend, Firebase client integration, Firebase Admin backend integration, payment/NOWPayments logic, SMM/SMS provider engines, email/OTP flows, WhatsApp tooling, and backup/recovery code.

It is **not yet safe to declare 100% production-ready**. The main blockers are security and deployment architecture, not the UI.

## Critical blockers before public launch

### P0 — Firestore rules are fully open

The current rules allow unrestricted read/write access to every Firestore document. This must be replaced with least-privilege rules before launch.

Do not deploy the current open rules to a production database.

### P0 — Admin authentication must be server-authoritative

Admin API authentication has been hardened to verify Firebase ID tokens and then authorize the verified identity using the root-admin identity, custom claims, the `admins` registry, or an approved admin role on the user document.

The client-side Admin Portal still contains legacy credential/trusted-device logic. That UI authentication must be migrated to Firebase Auth + server-verified sessions before production. A browser `localStorage` flag must never be treated as proof of admin access.

### P0 — Provider secrets must leave browser-controlled Firestore flows

SMM and SMS provider API keys are currently handled by React admin components. Production architecture must keep provider secrets server-side. The browser should receive only masked status and non-secret metadata.

### P0 — SMTP/IMAP credentials must be server-only

Remove hard-coded credential fallbacks and browser `localStorage` storage for mailbox credentials. Configure secrets through the hosting provider environment/secret store or a server-side authenticated secrets API.

### P0 — Secret rotation

The repository is public. If any real Firebase service-account private key, SMTP password, provider API key, NOWPayments secret, or similar credential has ever been committed, rotate/revoke it. Removing a secret from the latest commit does not remove it from Git history.

## Deployment architecture

### Recommended

```text
                        +----------------------+
                        |        Vercel        |
                        | React/Vite frontend  |
                        +----------+-----------+
                                   |
                                   | HTTPS API
                                   v
                    +----------------------------+
                    | Persistent Node/Express API |
                    | + worker processes          |
                    +-------------+--------------+
                                  |
             +--------------------+---------------------+
             |                    |                     |
             v                    v                     v
          Firebase           Provider APIs        Email/WhatsApp
       Auth/Firestore/        SMM/SMS/crypto       SMTP/IMAP
          Storage
```

Vercel is appropriate for the frontend. The existing backend is a persistent Node/Express application and starts long-running processes. It should not be treated as a Vercel-only serverless application without a larger refactor.

The following workloads need a persistent process or an equivalent external job system:

- order polling
- provider synchronization
- IMAP payment listener
- WhatsApp/Baileys session and reconnect supervisor
- automatic backup scheduling
- other long-running timers/workers

## Financial correctness requirements

Before accepting real money:

1. Wallet balance must be server-authoritative.
2. Every debit/credit/refund must have an idempotency key.
3. Idempotency must survive process restart and multiple instances; in-memory Maps are not sufficient.
4. Ledger entries must be immutable or tightly controlled.
5. Deposit approval and order settlement must be auditable.
6. Provider callbacks/webhooks must be signature-verified where supported.
7. Duplicate webhooks/emails must not double-credit a wallet.
8. Failed provider orders must reconcile to the ledger correctly.

## End-to-end launch test plan

### Authentication

- Firebase email/Google sign-in
- normal user session persistence
- admin Firebase identity
- admin role/RBAC
- expired/revoked token rejection
- logout/session invalidation
- admin API without token returns 401
- admin API with normal user token returns 403

### Wallet/deposits

- manual deposit request
- admin approve/reject
- auto-approval rules
- crypto deposit/IPN
- duplicate webhook protection
- wallet credit + ledger entry
- refund + ledger entry

### SMM

- add provider
- provider connection test
- balance retrieval
- service synchronization
- category synchronization
- markup calculation
- customer order creation
- provider order creation
- status polling
- completion/refund

### SMS/OTP

- provider activation
- balance synchronization
- country/service catalog
- number purchase
- OTP polling
- cancellation
- provider refund handling
- ledger debit/refund

### Email/IMAP

- registration OTP
- password reset OTP/link
- admin alert email
- SMTP health/test
- payment email parsing
- duplicate email protection
- malformed email handling

### WhatsApp

- persistent authentication state
- pairing/reconnect
- OTP dispatch
- admin notification
- restart/recovery without losing the session

### Backup/recovery

- backup creation
- durable storage upload
- checksum verification
- retention
- restore to a test environment
- restore audit log

## Safe rollout rule

Do not replace the application with a rewrite. Make isolated changes, preserve existing Firestore document shapes and public APIs where possible, run TypeScript/build validation after each change, and test the real Firebase project before switching DNS/production traffic.

## Launch gate

The project should be considered launch-ready only when:

- Firestore rules are least-privilege
- admin authentication is server-authoritative
- all production secrets are rotated and server-side
- persistent workers are hosted on a persistent runtime
- financial idempotency is durable
- backups use durable storage
- production environment variables are configured
- build succeeds
- smoke tests pass against the production Firebase project
- domain/HTTPS, CORS, OAuth domains, Firebase authorized domains, and webhook URLs are configured
- monitoring and error alerts are enabled
