import { ReviewItem, PrivacyPolicyData } from "../types";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebase";

export const DEFAULT_REVIEWS: ReviewItem[] = [
  {
    id: "rev-saeed",
    userId: "usr_1787194279555_f1numf",
    username: "Saeed",
    userAvatar: "https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png",
    rating: 5,
    category: "SMS Activations",
    title: "Very Fast WhatsApp OTP Really very Good service",
    comment: "Super fast OTP. Very professional dealing. Cheap rates. Highly recommended service. Definitely will use again. Thanks",
    status: "APPROVED",
    isFeatured: true,
    isVerifiedBuyer: true,
    adminReply: "Thank you Saeed for your wonderful feedback! We take pride in delivering the fastest WhatsApp OTP verifications with 99.9% uptime.",
    helpfulCount: 15,
    createdAt: "2026-08-20T02:55:00.000Z",
  },
  {
    id: "rev-101",
    userId: "usr-1",
    username: "Rynmirza",
    userAvatar: "https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png",
    rating: 5,
    category: "SMS Activations",
    title: "Instant WhatsApp OTP Delivery!",
    comment: "Extremely fast service! Got my WhatsApp verification code in under 5 seconds. The virtual number was clean and worked on the first try. Highly recommended!",
    status: "APPROVED",
    isFeatured: true,
    isVerifiedBuyer: true,
    adminReply: "Thank you for your review! We strive to maintain the fastest OTP delivery nodes.",
    helpfulCount: 24,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "rev-102",
    userId: "usr-2",
    username: "Shahzaib_SMM",
    userAvatar: "https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png",
    rating: 5,
    category: "SMM Services",
    title: "Cheapest & Highest Quality SMM Panel",
    comment: "I have been using ZeroX Network SMM services for my client accounts. High speed, genuine quality, and cheap rates compared to other panels in Pakistan.",
    status: "APPROVED",
    isFeatured: true,
    isVerifiedBuyer: true,
    adminReply: "Glad to hear that, Shahzaib! Our API servers operate 24/7 with zero downtime.",
    helpfulCount: 18,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: "rev-103",
    userId: "usr-3",
    username: "Usman_Tech",
    userAvatar: "https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png",
    rating: 5,
    category: "Digital Subscriptions",
    title: "1-Year Spotify Premium Delivered Instantly",
    comment: "Bought Spotify Premium subscription from the Store tab. Got activation instructions immediately with zero issues. Saved a lot of money!",
    status: "APPROVED",
    isFeatured: false,
    isVerifiedBuyer: true,
    helpfulCount: 12,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8).toISOString(),
  },
  {
    id: "rev-104",
    userId: "usr-4",
    username: "Hamza_Trader",
    userAvatar: "https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png",
    rating: 5,
    category: "Wallet & Deposits",
    title: "Easypaisa Deposit Approved in 2 Minutes",
    comment: "Submitted my Easypaisa transaction ID and proof screenshot, wallet balance was credited automatically in under 2 minutes. Super smooth experience!",
    status: "APPROVED",
    isFeatured: true,
    isVerifiedBuyer: true,
    adminReply: "Thank you, Hamza! Auto-verification ensures instant top-ups round the clock.",
    helpfulCount: 31,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
  {
    id: "rev-105",
    userId: "usr-5",
    username: "Ayesha_K",
    userAvatar: "https://cdn.phototourl.com/free/2026-07-26-0157bb7a-eeca-402b-af8d-01c8a3f032d9.png",
    rating: 5,
    category: "Customer Support",
    title: "Support Team is Always Available",
    comment: "Had a small question regarding Telegram OTP code bypass. Contacted support via ticket and WhatsApp, got response within minutes. Best customer service!",
    status: "APPROVED",
    isFeatured: false,
    isVerifiedBuyer: true,
    helpfulCount: 9,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
  }
];

export const DEFAULT_PRIVACY_POLICY: PrivacyPolicyData = {
  title: "ZeroX Network Privacy Policy & Operational Terms",
  subtitle: "Official data protection, cryptographic privacy safeguards, and transparent operational terms for Virtual SMS Activations, SMM Panel, Digital Subscriptions, and Digital Wallet Services.",
  contactEmail: "zeroxnetworks@gmail.com",
  lastUpdated: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  sections: [
    {
      id: "sec-1",
      title: "1. Introduction, Corporate Structure & Scope",
      icon: "ShieldCheck",
      content: `Welcome to ZeroX Network (a project of Injazify, https://www.injazify.com/). We are committed to maintaining the highest standards of data integrity, privacy protection, and operational transparency when you access our official web platform (https://zeroxnetwork.ai.studio), subdomains, and developer REST APIs.

This Privacy Policy and Terms of Service govern your usage of ZeroX Network's core service verticals:
• Virtual Phone Numbers & Ephemeral SMS OTP Verification Gateway
• Automated Social Media Marketing (SMM) Engagement Panel
• Digital Subscriptions, Software Licenses & Premium Account Vaults
• Multi-Currency Digital Wallet, Automatic Deposit Gateways & Referral Engine
• Enterprise Developer REST APIs & Automated Webhook Infrastructure

By accessing, registering, or executing transactions on ZeroX Network, you acknowledge and agree to the data handling protocols, cryptographic security standards, and fee structures outlined herein.`
    },
    {
      id: "sec-2",
      title: "2. Information We Collect & Data Minimization Principles",
      icon: "Database",
      content: `ZeroX Network operates on a strict Data Minimization Philosophy. We only collect the minimal telemetry and metadata necessary to safely authenticate accounts, fulfill requested digital services, and ensure ledger integrity:

• Account Identifiers: Unique user UUID, username, encrypted password hash (bcrypt/Argon2 standard), email address, and optional voluntary WhatsApp contact number for priority customer service.
• Wallet & Payment Verification Metadata: Transaction reference IDs (e.g., Easypaisa/JazzCash TID, Raast reference number, blockchain transaction hash/TxHash for crypto deposits), gross deposit amounts, calculated processing fees, and uploaded receipt images for manual verification.
• Order Telemetry & Session Records: Active virtual phone number rental records, service type, incoming OTP message receipt timestamps, SMM target links, digital subscription activation logs, and customer support ticket dialogues.
• Ephemeral Technical Telemetry: Obfuscated IP addresses and user-agent strings stored strictly in temporary server cache logs for DDoS mitigation, brute-force security defenses, and rate-limiting enforcement.`
    },
    {
      id: "sec-3",
      title: "3. Virtual SMS Numbers, OTP Verification & Ephemeral Data Handling",
      icon: "Smartphone",
      content: `ZeroX Network provides virtual phone numbers across 180+ countries and 500+ digital applications (including WhatsApp, Telegram, Google, OpenAI/ChatGPT, Instagram, TikTok, Tinder, Discord, and financial services) with privacy-first infrastructure:

• Ephemeral Non-Persistent Storage: Inbound SMS verification codes (OTPs) received from telecommunication carriers are held in temporary memory solely for real-time delivery to the requesting customer's dashboard or API webhook.
• Automatic Data Purging: All OTP message payloads and associated ephemeral phone sessions are permanently purged from active operational memory upon order completion, cancellation, or timer expiration (standard 10–20 minute window).
• Automatic 0% Penalty Refund Policy: If a rented virtual number does not receive a valid SMS code within the active timeout period, the order automatically cancels and 100% of the funds are refunded instantly to your digital wallet with zero penalty.
• Non-Recycling Confidentiality: Virtual phone numbers rented for single-activation verification are never reassigned for the same service within the quarantine period, preventing cross-account verification conflicts.`
    },
    {
      id: "sec-4",
      title: "4. SMM Panel Operations & Social Media Confidentiality",
      icon: "Share2",
      content: `ZeroX Network's automated Social Media Marketing (SMM) Panel facilitates organic and algorithmic engagement delivery across YouTube, Instagram, TikTok, Facebook, Telegram, Twitter/X, Spotify, Discord, LinkedIn, Kick, Threads, and Twitch:

• Strict Credential Privacy: ZeroX Network will NEVER ask for, store, or require your social media passwords, administrative logins, or private API authorization tokens.
• Target URL Confidentiality: Public profile links, channel URLs, and post identifiers submitted for promotional campaigns are processed via private, encrypted API tunnels directly to fulfillment servers. We never publish or disclose client order links to third-party directories.
• Automated Delivery & Balance Safeguard: In the event of a platform server maintenance or partial delivery drop, unfulfilled order quantities are automatically calculated and refunded directly to the user's wallet balance in real time.`
    },
    {
      id: "sec-5",
      title: "5. Digital Subscriptions, Software Licenses & Vault Security",
      icon: "Crown",
      content: `Our Digital Store delivers verified premium software licenses, streaming subscriptions, and productivity memberships (including Canva Pro, Netflix, Spotify, ChatGPT Plus, Claude, Midjourney, Adobe Creative Cloud, Windows/Office Keys, and VPNs):

• Client-Side Vault Encryption: Assigned credentials, activation invite tokens, and software serial keys are delivered directly into your encrypted 'My Subscriptions' customer portal.
• Dedicated Warranty & Replacement Coverage: Every digital subscription is backed by our full-term duration warranty. In the rare event of account credential rotation or carrier disruption, customers receive instant warranty replacement or prorated wallet credit via our 24/7 support desk.
• Cancellation & Renewal Management: Customers retain full control to cancel upcoming subscription renewals at any time from their dashboard without recurring unauthorized billing.`
    },
    {
      id: "sec-6",
      title: "6. Digital Wallet, Deposit Gateways & Transparent Fee Policy",
      icon: "Wallet",
      content: `ZeroX Network maintains complete transparency across all financial transactions, wallet balances, and gateway processing structures:

• Local Deposit Processing Fee (2.0%): Deposits made via local Pakistan payment gateways (Easypaisa, JazzCash, NayaPay, SadaPay, and Raast Bank Transfers) incur a standard 2.0% gateway handling fee. The exact gross amount, deducted 2% fee, and net balance credited are displayed before submission and itemized on official PDF receipts.
• Crypto Deposit Processing Fee (0.5%): Automated cryptocurrency deposits (USDT TRC20/BEP20, BTC, ETH, BNB, Binance Pay, and RedotPay) incur an ultra-low 0.5% automated network processing fee with real-time exchange rate indexing.
• Cancellation Fee (5%): A standard 5% cancellation processing fee applies exclusively to voluntary manual order cancellations on virtual number orders and custom services to cover gateway routing fees, with remaining 95% credited instantly. (Unreceived SMS timeout refunds remain 100% free with 0% deduction).
• Zero Sensitive Banking Retention: ZeroX Network never processes or stores debit/credit card CVV codes, bank PINs, or banking passwords. All payments are verified via direct gateway validation or proof-of-transfer matching.`
    },
    {
      id: "sec-7",
      title: "7. Developer REST APIs, Rate Limiting & Enterprise Security",
      icon: "KeyRound",
      content: `ZeroX Network offers robust developer APIs allowing seamless programmatic integration for bulk SMS activations, SMM fulfillment, balance queries, and automated webhooks:

• API Key Cryptographic Storage: API Secret Keys generated on your profile are hashed using enterprise-grade algorithms. You are responsible for safeguarding your secret key. Keys can be instantly rotated or revoked at any time.
• TLS 1.3 Encryption: All API traffic and web interactions are enforced over modern TLS 1.3 / HTTPS encryption protocols to prevent man-in-the-middle attacks and packet inspection.
• Anti-Abuse & Rate-Limiting Defenses: Our microservices implement token-bucket rate limiters, DDoS firewalls, and anomaly detection engines to prevent service disruption and protect platform stability.`
    },
    {
      id: "sec-8",
      title: "8. Cookies, Local Storage & Session Integrity",
      icon: "Lock",
      content: `ZeroX Network utilizes minimal, privacy-respecting client-side storage technologies:

• Functional Local Storage: Browser localStorage and sessionStorage are utilized strictly to persist your authenticated session token, dark/light theme preference, active tab states, and shopping cart items.
• No Invasive Tracking: We do NOT use third-party behavioral advertising trackers, cross-site trackers, or data-broker cookies. Your activity on ZeroX Network remains strictly private.`
    },
    {
      id: "sec-9",
      title: "9. User Rights, Data Portability & Account Erasure (GDPR / CCPA)",
      icon: "UserCheck",
      content: `Regardless of your geographic location, ZeroX Network guarantees fundamental privacy rights:

• Right to Access & Portability: You may request a complete export of your account transaction history, subscription logs, and registered profile metadata at any time.
• Right to Rectification: You may update your contact email, password, and communication preferences directly in your Account Settings.
• Right to Erasure ('Right to Be Forgotten'): You may submit a formal request to permanently delete your account, order archives, and personal identifiers by opening a priority support ticket or emailing zeroxnetworks@gmail.com. Account data is safely purged within 7 business days following financial audit reconciliation.`
    },
    {
      id: "sec-10",
      title: "10. Fair Use Policy, Prohibited Activities & Compliance",
      icon: "AlertOctagon",
      content: `To ensure platform safety and regulatory compliance, ZeroX Network enforces a strict Anti-Abuse and Fair Use Policy:

• Prohibited Uses: You agree not to use virtual phone numbers or platform services for unlawful schemes, financial fraud, unauthorized spam broadcasting, impersonation, harassment, or attempts to breach third-party security systems.
• Immediate Account Sanctions: Accounts identified engaging in fraudulent payment chargebacks, unauthorized exploitation of platform APIs, or malicious bot activities will be immediately terminated with forfeiture of existing wallet balances.
• Platform Modifications: ZeroX Network reserves the right to update service catalogs, provider routes, and policy clauses to reflect technological updates and legal requirements.`
    },
    {
      id: "sec-11",
      title: "11. Official Support Channels, Contact & Escalation",
      icon: "Mail",
      content: `For any legal inquiries, data privacy requests, deposit verification assistance, or technical partnership questions, our official support channels are available 24/7/365:

• Primary Operational Email: zeroxnetworks@gmail.com
• Parent Organization: A project of Injazify (https://www.injazify.com/)
• Instant WhatsApp Support Hotline: +44 7868 713315
• In-App Support Ticket Desk: Available under the 'Support / Tickets' tab in your user dashboard
• Official Web Domain: https://zeroxnetwork.ai.studio`
    }
  ]
};

