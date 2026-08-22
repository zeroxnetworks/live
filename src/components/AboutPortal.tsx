import React, { useState } from "react";
import { 
  Code2, 
  MessageCircle, 
  Briefcase, 
  Globe, 
  Smartphone, 
  Cpu, 
  Palette, 
  Sparkles, 
  ExternalLink, 
  ArrowUpRight, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Terminal, 
  ChevronRight,
  Server,
  Lock,
  Wallet,
  Crown,
  Share2,
  CheckCircle2,
  Activity,
  Award,
  Users,
  Clock,
  Mail,
  Building2,
  ChevronDown,
  RefreshCw
} from "lucide-react";
import { motion } from "motion/react";

interface PillarItem {
  id: string;
  title: string;
  badge: string;
  desc: string;
  icon: React.ReactNode;
  accent: string;
  stats: string;
  features: string[];
}

const PLATFORM_PILLARS: PillarItem[] = [
  {
    id: "sms",
    title: "Virtual SMS & OTP Verification Gateway",
    badge: "180+ Countries • 500+ Apps",
    desc: "Carrier-grade global virtual number infrastructure engineered for instant OTP reception across WhatsApp, Telegram, Google, OpenAI, TikTok, Tinder, and banking platforms.",
    icon: <Smartphone className="w-6 h-6 text-[#00AEEF]" />,
    accent: "border-sky-500/20 bg-sky-500/5 text-sky-600",
    stats: "Sub-second OTP routing with 0% penalty auto-refund",
    features: [
      "Multi-Server Redundancy (Server 1 to Server 5 load balancing)",
      "Strict Ephemeral Non-Persistent OTP storage with auto-purge",
      "Instant 100% automated refund if no verification code arrives",
      "Developer REST API with webhooks for programmatic scaling"
    ]
  },
  {
    id: "smm",
    title: "Automated SMM Social Growth Engine",
    badge: "12+ Social Platforms • High Speed",
    desc: "Algorithmic social engagement booster providing organic-paced followers, views, likes, watch-hours, and comments across YouTube, Instagram, TikTok, Facebook, and Telegram.",
    icon: <Share2 className="w-6 h-6 text-indigo-500" />,
    accent: "border-indigo-500/20 bg-indigo-500/5 text-indigo-600",
    stats: "Over 500,000+ orders fulfilled with real-time tracking",
    features: [
      "Zero password requirement — only public links processed",
      "Live order progression counters and automated speed monitors",
      "Encrypted fulfillment API tunnels directly to provider nodes",
      "Automated balance protection and partial delivery refunds"
    ]
  },
  {
    id: "subscriptions",
    title: "Digital Subscriptions & Software Vault",
    badge: "Verified Licenses • Full Warranty",
    desc: "Instant digital marketplace for premium software licenses, AI subscriptions, and streaming accounts including Canva Pro, ChatGPT Plus, Claude, Midjourney, Netflix, and Adobe Creative Cloud.",
    icon: <Crown className="w-6 h-6 text-amber-500" />,
    accent: "border-amber-500/20 bg-amber-500/5 text-amber-600",
    stats: "100% genuine licenses with full term replacement guarantee",
    features: [
      "Encrypted credentials delivered directly to client account vault",
      "Full duration term replacement warranty with 24/7 support desk",
      "Automated renewal control and single-click cancellation",
      "Instant license generation and secure invite tokens"
    ]
  },
  {
    id: "wallet",
    title: "Multi-Currency Wallet & Developer APIs",
    badge: "Local & Crypto Gateways • 24/7",
    desc: "High-speed automated financial ledger supporting local Pakistan payment methods and global cryptocurrencies with real-time PKR to USD exchange rate conversion.",
    icon: <Wallet className="w-6 h-6 text-emerald-500" />,
    accent: "border-emerald-500/20 bg-emerald-500/5 text-emerald-600",
    stats: "Transparent fees: 2.0% Local Gateways • 0.5% Crypto",
    features: [
      "Instant top-ups via Easypaisa, JazzCash, NayaPay, SadaPay & Raast",
      "Automated crypto deposits (USDT, BTC, ETH, BNB, Binance Pay, RedotPay)",
      "Developer REST API keys with granular access and HMAC signatures",
      "Transparent fee breakdown and official PDF invoice receipts"
    ]
  }
];

const METRICS = [
  { value: "99.99%", label: "Platform Uptime SLA", icon: Activity },
  { value: "180+", label: "Countries Covered", icon: Globe },
  { value: "500+", label: "Supported Services", icon: Layers },
  { value: "<150ms", label: "Average API Latency", icon: Zap }
];

const ARCHITECT_SKILLS = [
  "Distributed Microservices",
  "High-Concurrency WebSockets",
  "Real-Time Carrier API Routing",
  "Cryptographic Security & TLS 1.3",
  "Tailwind & Responsive UI/UX",
  "Cloud Scalability & Load Balancing"
];

export default function AboutPortal() {
  const [activePillar, setActivePillar] = useState<string>("sms");

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-4 sm:py-8 space-y-8 sm:space-y-12 animate-in fade-in duration-300 pb-16 text-slate-800">
      
      {/* Hero Section: Enterprise Platform & Architect Identity */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 border border-slate-900 shadow-2xl text-slate-300">
        {/* Background futuristic vector glow */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#00AEEF]/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 p-6 sm:p-10 lg:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* Left Column: Hero Text & Identity (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#00AEEF]/10 border border-[#00AEEF]/30 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-[#00AEEF]">
                    <Sparkles className="w-3 h-3 text-[#00AEEF] animate-pulse" />
                    ZeroX Network Platform Overview
                  </span>
                  <a
                    href="https://www.injazify.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 hover:border-indigo-400/60 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase text-indigo-300 transition-colors"
                  >
                    <Building2 className="w-3 h-3 text-indigo-400" />
                    A project of Injazify
                    <ArrowUpRight className="w-3 h-3 opacity-80" />
                  </a>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black text-white leading-[1.15] tracking-tight">
                  High-Performance Digital Infrastructure &amp; Verification <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00AEEF] via-indigo-400 to-cyan-300">
                    Engineered by Rayan Mirza
                  </span>
                </h1>
              </div>

              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-2xl font-light">
                ZeroX Network is an all-in-one digital automation ecosystem delivering carrier-grade virtual SMS activations across 180+ countries, high-throughput social media growth services, verified premium software subscriptions, and secure multi-currency payment settlement.
              </p>

              {/* Verified Architect Callouts */}
              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 space-y-2 backdrop-blur-xs">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Lead Systems Architect &amp; Full-Stack Engineer</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Crafted by <strong className="text-slate-200">Rayan Mirza</strong> as a project of <strong className="text-slate-200">Injazify</strong> (<a href="https://www.injazify.com/" target="_blank" rel="noopener noreferrer" className="text-[#00AEEF] hover:underline">injazify.com</a>), focusing on zero-latency API pipelines, strict data privacy, and mathematical design precision.
                </p>
              </div>

              {/* Direct CTAs */}
              <div className="pt-2 flex flex-wrap gap-3">
                <a 
                  href="https://wa.me/447868713315?text=Hi%20Rayan,%20I%20would%20like%20to%20discuss%20a%20technical%20project/ZeroX%20Network." 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all text-xs shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Consult via WhatsApp</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
                </a>

                <a 
                  href="https://www.linkedin.com/in/rynmirza/" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 text-xs"
                >
                  <Briefcase className="w-4 h-4 text-indigo-200" />
                  <span>LinkedIn Profile</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-80" />
                </a>

                <a 
                  href="https://www.injazify.com/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-slate-700 text-xs"
                >
                  <Globe className="w-4 h-4 text-cyan-400" />
                  <span>A project of Injazify</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>
              </div>
            </div>

            {/* Right Column: Interactive Code Terminal (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md shadow-2xl overflow-hidden font-mono text-xs text-slate-400">
                <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold">zerox-network.config.ts</span>
                </div>
                
                <div className="p-5 space-y-2 overflow-x-auto text-[11px]">
                  <div>
                    <span className="text-purple-400">const</span> <span className="text-[#00AEEF]">ZeroXNetwork</span> = &#123;
                  </div>
                  <div className="pl-4">
                    <span className="text-slate-400">architect</span>: <span className="text-emerald-400">"Rayan Mirza"</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-slate-400">parentGroup</span>: <span className="text-emerald-400">"A project of Injazify (injazify.com)"</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-slate-400">countriesServed</span>: <span className="text-amber-400">180</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-slate-400">verificationServices</span>: <span className="text-amber-400">500</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-slate-400">depositFeeLocal</span>: <span className="text-cyan-300">"2.0%"</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-slate-400">depositFeeCrypto</span>: <span className="text-cyan-300">"0.5%"</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-slate-400">smsAutoRefund</span>: <span className="text-emerald-400">true</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-slate-400">encryption</span>: <span className="text-emerald-400">"TLS 1.3 / AES-256"</span>,
                  </div>
                  <div className="pl-4">
                    <span className="text-slate-400">status</span>: <span className="text-emerald-400">"99.99% ONLINE"</span>
                  </div>
                  <div>&#125;;</div>
                  <div className="pt-2 text-slate-400 italic text-[10px]">
                    // Automated sub-second carrier routing active.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Live System Performance Telemetry Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {METRICS.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div 
              key={idx}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">{m.label}</span>
                <Icon className="w-4 h-4 text-[#00AEEF]" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {m.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Core Platform Verticals & Capabilities Matrix */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-slate-200/80 pb-3">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold text-[#00AEEF] uppercase tracking-widest block">
              Core Capabilities
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              The 4 Pillars of ZeroX Network
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            Click any pillar below to inspect the dedicated microservices, security protocols, and operational workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PLATFORM_PILLARS.map((pillar) => (
            <div 
              key={pillar.id}
              className={`bg-white border rounded-3xl p-6 transition-all duration-200 shadow-2xs hover:shadow-sm space-y-4 ${
                activePillar === pillar.id ? "border-[#00AEEF] ring-2 ring-[#00AEEF]/20" : "border-slate-200/80 hover:border-slate-300"
              }`}
              onClick={() => setActivePillar(pillar.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 shrink-0">
                    {pillar.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      {pillar.title}
                    </h3>
                    <span className="text-[11px] font-bold text-slate-500 font-mono">
                      {pillar.badge}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {pillar.desc}
              </p>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Key Technical Guarantees:
                </span>
                <div className="space-y-1.5">
                  {pillar.features.map((f, fIdx) => (
                    <div key={fIdx} className="flex items-center gap-2 text-xs text-slate-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <span className="text-[11px] font-bold text-[#00AEEF] bg-blue-50/60 border border-blue-100/80 px-3 py-1.5 rounded-xl block text-center">
                  💡 {pillar.stats}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Engineering Philosophy & Technical Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left: Architect Philosophy (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 flex flex-col justify-between shadow-md">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              <Terminal className="w-3.5 h-3.5" />
              <span>Architectural Philosophy</span>
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white">
              Symmetry, Low Latency &amp; Uncompromised Privacy
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              "We believe digital utilities should operate invisibly and reliably. Every millisecond of latency eliminated in SMS routing and every cryptographic safeguard in our wallet directly empowers our users to scale without friction."
            </p>
            <div className="pt-2 text-xs font-semibold text-slate-400">
              — <strong className="text-white font-bold">Rayan Mirza</strong>, Founder &amp; Systems Architect
            </div>
          </div>

          <div className="pt-6 border-t border-slate-800 space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
              Core Technical Competencies:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {ARCHITECT_SKILLS.map((skill, sIdx) => (
                <span key={sIdx} className="text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-200 px-2.5 py-1 rounded-lg">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Security & Reliability Checkpoints (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xs flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-[#00AEEF] uppercase tracking-widest block">
              Infrastructure &amp; Compliance
            </span>
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Enterprise Trust &amp; Operational Standards
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              ZeroX Network operates with strict institutional guardrails to protect user funds, credential confidentiality, and communication privacy.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Zero-Knowledge SMS</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Verification codes are kept in temporary memory and permanently purged after session completion or expiration.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Transparent Fee Ledger</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Every deposit clearly displays the exact 2.0% local or 0.5% crypto fee before credit, with official downloadable receipts.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <RefreshCw className="w-4 h-4 text-cyan-600" />
                <span>Automated Refund Engine</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Unreceived SMS activations are 100% refunded with zero fees. Unfulfilled SMM orders automatically credit back to wallet.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>24/7/365 Direct Support</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Live assistance via WhatsApp hotline (+44 7868 713315), in-app ticket desk, and official email (zeroxnetworks@gmail.com).
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500">
              ZeroX Network is <a href="https://www.injazify.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-slate-800 hover:text-[#00AEEF] underline">a project of Injazify (https://www.injazify.com/)</a>
            </span>
            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
              NODE ID: ZX-PROD-APAC-01
            </span>
          </div>
        </div>

      </div>

      {/* Official Contact Channels Bar */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 sm:p-8 border border-slate-900 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold tracking-widest text-[#00AEEF] uppercase">
              Official Inquiries &amp; Consultations
            </span>
            <h4 className="text-lg sm:text-xl font-black text-white">
              Connect with Rayan Mirza &amp; the ZeroX Engineering Team
            </h4>
            <p className="text-xs text-slate-400">
              For high-volume custom API integrations, enterprise subscriptions, or custom platform development.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <a
              href="https://wa.me/447868713315?text=Hello%20Rayan,%20let's%20connect%20regarding%20ZeroX%20Network."
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp (+44 7868 713315)</span>
            </a>

            <a
              href="mailto:zeroxnetworks@gmail.com"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition"
            >
              <Mail className="w-4 h-4 text-[#00AEEF]" />
              <span>zeroxnetworks@gmail.com</span>
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}

