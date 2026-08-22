# Zerox Network 🌐

> **Enterprise-Grade Digital Services Hub**: Instant SMS & Virtual Number Activations, Global SMM Panels, Premium Subscriptions, Automated Crypto & Fiat Gateway, and Real-Time Provider Synchronization.

---

## 🚀 Overview

**Zerox Network** is an all-in-one digital commerce and automation platform built for high-throughput digital services. It unites temporary virtual phone number provisioning, social media growth services (SMM), digital account subscriptions, automated multi-currency cryptocurrency and fiat payment handling, and enterprise analytics into a unified, responsive web application.

---

## ✨ Key Features

### 📱 1. Virtual Numbers & SMS Verification
- **Global SMS Activations**: Instant virtual phone numbers across 100+ countries for WhatsApp, Telegram, Google, Discord, OpenAI, and hundreds of other services.
- **Automated 5SIM Sync Engine**: Real-time background sync cycle (5-second latency tracking, 30-second catalog indexing) with auto-reconnection and inventory tracking across all service/country matrices.
- **Live OTP Stream & Countdown**: Auto-polling SMS arrival counter with instant code extraction and sound triggers.

### 📈 2. SMM Panel (Social Media Marketing)
- **Extensive Service Catalog**: Followers, likes, views, comments, and engagement across Instagram, TikTok, YouTube, Telegram, Twitter (X), and Facebook.
- **Real-Time Order Engine**: Status tracking, automatic price calculation with custom profit margins, and PDF/digital receipts.

### 💳 3. Subscriptions & Digital Products Store
- **Digital Account Marketplace**: Netflix, Spotify, Canva Pro, ChatGPT Plus, YouTube Premium, and VPN accounts.
- **Stock Management & Warranty Support**: Automated delivery of digital licenses and credentials with replacement guarantee handling.

### 💰 4. Multi-Gateway Payment System
- **NOWPayments Crypto Gateway**: Live non-custodial deposits for BTC, ETH, USDT (TRC20/ERC20/BEP20), SOL, LTC, TRX, and 150+ cryptocurrencies with automated IPN callbacks.
- **IMAP / RedotPay Email Automation**: Background worker scanning incoming payment confirmation emails with auto-balance crediting and cryptographic idempotency protection.
- **Manual Cash / Local Wallet Deposits**: Direct merchant payment proof submission with instant receipt verification and admin review.
- **Real-Time Currency Conversion**: Dynamic fiat currency switcher (USD, EUR, GBP, AED, PKR, INR, RUB, TRY, etc.).

### 👥 5. Affiliate & Loyalty Engine
- **Multi-Tier Referral Program**: Custom referral codes, live tracking of referred users, conversion rates, and lifetime earnings.
- **Withdrawal Management**: Seamless affiliate balance withdrawal to crypto or local payment methods with admin approvals.

### 🛠️ 6. Command & Control Admin Portal
- **Provider Sync Diagnostics**: Latency metrics, API health checks, force provider sync triggers, and comprehensive sync event logs.
- **Live Visitor Intelligence**: Real-time traffic map, active session tracking, location analytics, and telemetry stream.
- **Security & Alerts Engine**: Configurable email notifications via SMTP/Gmail for low provider balance, high deposits, and support tickets.
- **Full Ledger & Financial Reconciliations**: Complete audit trail of all wallet transactions and system operations.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Frontend UI** | React 18, Vite, TypeScript, Tailwind CSS, Motion |
| **Icons & Media** | Lucide React, Custom Vector Gateway Badges |
| **Backend API** | Express.js, TypeScript, Node.js, `tsx`, `esbuild` |
| **Database & Auth** | Google Firebase Firestore & Firebase Authentication |
| **Crypto Gateway** | NOWPayments API & Webhooks |
| **SMS Gateway** | 5SIM API Integration Adapter & Provider Sync Engine |
| **Email Processing** | IMAP (ImapFlow / Mailparser) & Nodemailer SMTP |
| **Document Engine** | jsPDF (Automated invoices and transaction receipts) |

---

## 📁 Project Structure

```
├── public/                 # Favicons, PWA manifests, and static assets
├── scripts/                # Utility scripts, schema, and background runners
├── server/                 # Express backend engines and adapters
│   ├── adminAuth.ts        # Admin authorization middleware & tokens
│   ├── auditDb.ts          # Audit logging subsystem
│   ├── emailAlertEngine.ts # Automated email & alert dispatcher
│   ├── financialLedgerEngine.ts # Financial reconciliation & ledger
│   ├── nowpaymentsEngine.ts     # Crypto payment & IPN verification
│   ├── orderEngine.ts      # Virtual numbers order processing
│   ├── providerSyncEngine.ts    # 5SIM automated background sync engine
│   ├── settingsEngine.ts   # System-wide dynamic settings manager
│   ├── smsProviderAdapter.ts    # SMS provider network clients
│   └── whatsappEngine.ts   # WhatsApp notification & OTP engine
├── src/                    # Frontend React application
│   ├── components/         # Core UI components, portals, and modals
│   │   ├── admin/          # Admin portal tabs, telemetry, and analytics
│   │   ├── CatalogSelector.tsx  # Interactive country & service browser
│   │   ├── FiveSimManagement.tsx# Provider sync & diagnostics UI
│   │   ├── CryptoDepositGateway.tsx # Crypto deposit modal & rates
│   │   └── ...
│   ├── data/               # Static country, service, currency, and language data
│   ├── hooks/              # Custom React hooks (timer, translations, etc.)
│   ├── lib/                # Client Firebase, PDF generator, and utilities
│   ├── App.tsx             # Main application orchestrator
│   └── main.tsx            # Application entry point
├── server.ts               # Full-stack Express server entry point
├── firestore.rules         # Firebase Firestore security rules
└── package.json            # Project dependencies and build scripts
```

---

## ⚙️ Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or bun

### 1. Clone the repository
```bash
git clone https://github.com/rynmirza/Zerox-Network-.git
cd Zerox-Network-
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory based on `.env.example`:
```env
# Server Configuration
PORT=3000

# 5SIM / SMS Gateway
FIVESIM_API_KEY=your_5sim_token_here

# NOWPayments Gateway
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_key

# Admin Security Key
ADMIN_SECRET_KEY=your_admin_secret_key

# SMTP Alert Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🔒 Security & Data Integrity

- **Idempotent Webhooks**: Crypto IPN and automated IMAP deposits check transaction signatures and hashes to eliminate double-crediting.
- **Provider Connection Guard**: In-flight allocation locks prevent race conditions during rapid SMS activations.
- **Role-Based Access Control**: Sensitive administrative endpoints are secured with strict authentication tokens.

---

## 📄 License

This project is proprietary software developed for the **Zerox Network** ecosystem. All rights reserved.
