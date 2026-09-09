# ZeroX Network Production Deployment

## Target architecture

```text
Browser
  -> Vercel (React/Vite frontend)
  -> HTTPS /api/*
  -> Persistent Node API + Worker
       -> Firebase Admin SDK
       -> Firebase Auth
       -> Firestore
       -> Firebase/Cloud Storage
       -> SMM providers
       -> SMS/5SIM providers
       -> NOWPayments
       -> SMTP
       -> IMAP
       -> WhatsApp/Baileys
```

## Why the worker is separate
The application contains long-running polling, IMAP and WhatsApp/Baileys state plus scheduled backup work. These are persistent-process workloads and should not be placed in a short-lived Vercel serverless execution environment.

`server/worker.ts` is the persistent entrypoint for those services.

## Vercel
Deploy the Vite frontend on Vercel. Configure all `VITE_FIREBASE_*` public variables there. If the API is hosted separately, route `/api/*` to the persistent API host using the deployment platform's rewrite/proxy configuration.

## Persistent API/worker host
Run the existing Express server and the worker on a long-lived Node host/VPS. Required server-only environment variables include Firebase Admin credentials, Gemini, NOWPayments, SMTP, provider credentials, IMAP and durable backup configuration as applicable.

Do not commit `.env`, Firebase service-account JSON, private keys, provider API keys, SMTP passwords or IMAP passwords.

## Firebase
1. Enable Firebase Authentication providers required by the application.
2. Deploy `firestore.rules`.
3. Ensure the root administrator Firebase Auth account uses `zeroxnetworks@gmail.com`.
4. Ensure additional administrators are represented by an active `admins/{uid}` record or approved custom claims.
5. Configure Firebase Storage/durable backup storage before enabling automated backup retention.

## Operational flows

### Customer registration
Registration request -> server validation -> email OTP -> OTP verification -> Firebase Auth user -> Firestore `users/{uid}` -> referral linkage -> welcome notification.

### Login
Firebase/approved application authentication -> authoritative Firestore profile -> customer session -> protected service actions.

### Virtual number
Catalog sync -> country/operator availability -> server price calculation -> allocation lock -> provider purchase -> ledger debit -> Firestore order -> SMS webhook/status polling -> completion/cancellation -> refund when applicable.

### SMM
Provider configuration -> service/category sync -> customer price calculation -> provider order -> ledger debit -> provider status polling -> completion/partial/cancel -> idempotent refund where applicable -> customer notification.

### Deposits
Local payment submission/IMAP matching or NOWPayments checkout -> transaction verification -> duplicate/idempotency check -> ledger credit -> wallet update -> notification/audit.

### Affiliate payout
Earned commission -> withdrawal eligibility check -> wallet escrow/debit -> admin review -> PAID or rejection/refund -> audit trail.

### Admin
Firebase Auth -> Firebase ID token -> server verification -> admin role/registry check -> privileged API -> server-side Firestore/Admin SDK -> audit log.

### WhatsApp
Persistent worker -> Baileys session -> notification/bot services -> Firestore-backed state/logging. Keep the worker on a long-lived runtime.

### Backup
Persistent worker scheduler -> full backup -> durable storage -> checksum/retention -> audited restore by authorized administrator.

## Go-live checks

- [ ] Rotate any credentials that were ever committed to a public repository.
- [ ] Populate production environment variables.
- [ ] Deploy Firestore rules.
- [ ] Verify Firebase Auth administrator account.
- [ ] Configure API base/rewrite between Vercel and persistent API host.
- [ ] Start API and worker processes.
- [ ] Configure SMM/SMS/NOWPayments/SMTP/IMAP provider credentials server-side.
- [ ] Test registration, login and password recovery.
- [ ] Test one controlled deposit and confirm exactly one ledger credit.
- [ ] Test one controlled virtual-number order and refund path.
- [ ] Test one controlled SMM order and provider status sync.
- [ ] Test admin access and denial for a normal user.
- [ ] Test backup creation and restore in a controlled environment.
- [ ] Monitor logs, provider balances, webhook delivery and Firestore errors for the first production window.
