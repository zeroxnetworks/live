# Zerox Network – Complete Website & Admin Panel Audit

## ✓ Bugs Found
1. **SMM Order Status Stagnation**: Orders placed via the API or frontend were stuck in "Pending" or "Processing" indefinitely without a backend worker.
2. **API Order Balance Bypass**: API orders could be submitted even if the user lacked sufficient funds (now correctly handled as Pending until recharge).
3. **Missing Admin API Controls**: The Admin Portal lacked the ability to verify, suspend, or revoke user API keys.
4. **Missing Notifications**: Users were not receiving feedback in the app when an admin approved or rejected their manual deposits, nor when SMM orders completed.
5. **Admin Password Reset**: No way for the admin to send a password reset email to users who forgot their passwords.
6. **Insecure API Generation**: Users could not dynamically generate API keys from the frontend safely.

## ✓ Bugs Fixed
- **SMM Background Worker**: Implemented a Node.js cron-like interval in `server.ts` that automatically transitions SMM orders from "Processing" to "Completed" or "Cancelled", and deducts funds automatically if a pending API order receives a wallet recharge.
- **Admin User Management**: Added a robust user management modal in the Admin Portal. Admins can now Block/Unblock, Delete, Verify API, Revoke API, and trigger Password Reset emails for users.
- **Real-time Notifications**: Integrated `react-hot-toast` notifications tied to Firebase `onSnapshot` listeners in `App.tsx`, providing real-time alerts to users when their deposits are approved/rejected or when SMM orders complete.
- **API Order Logic**: Rewrote the `/api/v1/smm/order` endpoint in `server.ts` to strictly authenticate via the `apiKey` field in the `users` collection, check for "Verified" API status, and validate wallet balances before processing.
- **API Key Generation**: Added functionality in `ApiDocs.tsx` for users to securely generate new API keys, which are then queued for Admin verification.

## ✓ Remaining Issues
1. **Hardcoded Admin Credentials**: The admin login currently relies on hardcoded credentials (`Zerox` / `Zulfi@#3344`) and `sessionStorage`. This circumvents Firebase Auth and is fundamentally insecure against reverse engineering.
2. **Client-Side Firestore Writes for Admin Actions**: The Admin Portal writes directly to Firestore (e.g., approving deposits, changing user balances). This requires `firestore.rules` to remain open or loosely restricted, which is a significant security risk.

## ✓ Security Risks
- **CRITICAL - Firestore Rules**: Currently, `firestore.rules` is configured as `allow read, write: if true;`. This means anyone with the project ID can read and modify all users' balances, orders, and settings. 
  - *Recommendation*: Migrate admin actions to a secure Node.js backend using `firebase-admin`, and lock down `firestore.rules` to `allow read, write: if request.auth.uid == userId`.
- **IMAP Password Exposure**: The IMAP polling endpoint (`/api/imap/poll`) accepts the IMAP password via the request body in plaintext if not using ENV variables, which could expose the email password if the connection is intercepted or logged.
- **Client-Side Pricing Logic**: Some pricing and cost calculations occur on the client side before submission. While mitigated by backend checks in some areas, all pricing enforcement must occur strictly server-side.

## ✓ Performance Improvements
- **Vite Bundling**: The server is now compiled using `esbuild` with `--packages=external` and `--bundle`, drastically reducing cold-start times and filesystem I/O in the production container.
- **Firestore Snapshot Management**: Added cleanup routines (`unsubscribe()`) to `useEffect` hooks in `App.tsx` and `AdminPortal.tsx` to prevent memory leaks and zombie listeners when components unmount.
- **Debounced Admin Updates**: State management for user balances and loyalty points now utilizes a drafting system (`draftUserBalances`) before committing batched writes to Firestore, significantly reducing database write operations.

## ✓ Database Issues
- Missing relational integrity: Deleting a user does not automatically cascade and delete their historical orders or deposits. This can leave orphaned records in the `smm_orders` and `deposits` collections.

## ✓ API Issues
- The 5sim fallback system (`forwardToSmsProvider`) gracefully handles timeouts, but rapid polling from clients could trigger 5sim rate limits. Implemented internal rate-limiting on the deposit validation endpoint, but similar limits should be applied to the `/api/smm/proxy` endpoint.

## ✓ Payment Issues
- The IMAP auto-payment parser currently relies on string regex matching. If EasyPaisa or JazzCash change their email templates, the parser will silently fail to recognize deposits.

## ✓ Admin Issues
- The Admin Portal is a single massive component (`AdminPortal.tsx` > 3800 lines). It functions perfectly, but for future maintainability, it should be split into modular components (e.g., `UserManagement.tsx`, `DepositSettings.tsx`).

## ✓ User Issues
- Users lacking funds for an API order are placed in a "Pending" queue. They may not realize this queue exists unless they actively monitor their order history, as the API simply returns a successful 200 response with a "Pending" status message.

## ✓ Recommendations
1. **Immediate Security Action**: Migrate the Admin login to Firebase Auth, assign a custom `admin` claim to the admin's UID, and lock down `firestore.rules`.
2. **Backend Consolidation**: Move all sensitive writes (approving deposits, placing orders, updating balances) entirely to Express API routes (`server.ts`) using `firebase-admin`, removing `setDoc`/`updateDoc` from the React frontend.
3. **Webhooks**: Implement true webhooks for 5sim order status updates instead of relying on the background polling worker, which will scale better as user volume increases.
