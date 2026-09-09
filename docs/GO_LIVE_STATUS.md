# ZeroX Network — Go-Live Status

Date: 2026-09-09
Branch: `refactor/platform-architecture`

## Latest repository state

The production-hardening branch has passed the two core compile gates in GitHub Actions:

- Typecheck: PASS
- Production build: PASS

The previous CI run failed only at the private-key scanner because the scanner incorrectly matched the documented `FIREBASE_PRIVATE_KEY` placeholder in `.env.example` and the environment-variable reference in `server/firebaseAdmin.ts`. The scanner has now been corrected to detect actual PEM key headers while allowing the documented template.

## Security maintenance

`@whiskeysockets/baileys` was upgraded from `6.7.18` to `6.7.22` to address the security advisory reported during CI dependency installation.

## Architecture

Production deployment remains:

`Vercel frontend -> persistent Node API -> Firebase`

with a separate persistent worker for order polling, provider synchronization, WhatsApp/Baileys and scheduled backups.

## Remaining real-world acceptance gates

These require the actual production environment and cannot be fabricated by source changes:

1. Configure production Firebase web variables and server-only Firebase Admin credentials.
2. Rotate/revoke any credentials that were previously exposed in public Git history.
3. Configure and test NOWPayments production API/IPN credentials.
4. Configure and test SMM and SMS provider credentials server-side.
5. Configure SMTP/IMAP credentials server-side and remove legacy browser-side IMAP credential storage before sensitive production use.
6. Connect Vercel `/api/*` traffic to the persistent API host.
7. Deploy and monitor the persistent worker.
8. Move backup archives/session material to durable protected storage and perform a restore drill.
9. Complete controlled financial idempotency tests for deposits, debits, refunds and affiliate payouts.
10. Exercise all direct browser Firestore operations against the hardened rules.

## Acceptance target

The platform should be labelled LIVE/100% only after the above production checks pass and the exact production commit has a green CI run.
