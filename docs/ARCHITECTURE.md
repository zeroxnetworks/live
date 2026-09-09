# Zerox Network Platform Architecture

This repository is organized as a production web platform with a clear separation of responsibilities.

## Frontend

`src/` contains the React/Vite client application. UI components, hooks, client-side Firebase services, data models, utilities, and application state belong here.

## Backend

`server.ts` is the HTTP/application entry point. Backend domain engines live under `server/` and should remain server-only. They handle authentication, orders, payments, financial ledger operations, provider synchronization, WhatsApp, notifications, backups, email, and other privileged integrations.

## Firebase

The browser Firebase client lives in `src/lib/firebase.ts`. The public Firebase Web SDK configuration targets the `zerox-network` project. Firebase Admin credentials must remain server-side and must never be committed to Git.

## Rules

- Never import backend-only modules into browser components.
- Never expose service-account private keys or provider secrets to Vite client code.
- Keep payment, balance, wallet, order, admin, and security decisions server-authoritative.
- Prefer domain-specific backend modules over adding more business logic to the HTTP entry point.
- Preserve existing API contracts when reorganizing modules.
- Run type-check/build validation after structural changes.

## Deployment

The frontend build is produced by Vite. The Express backend is bundled separately with esbuild by the existing production build pipeline. Environment variables are supplied by the deployment platform; `.env.example` documents the required names without storing production secrets.
