import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Database, 
  Smartphone, 
  Share2, 
  Crown, 
  Wallet, 
  Lock, 
  KeyRound, 
  UserCheck, 
  AlertOctagon, 
  FileText, 
  Search, 
  Printer, 
  HelpCircle,
  Clock,
  Mail,
  ChevronRight,
  Star,
  Sparkles,
  ChevronDown,
  MessageCircle,
  ExternalLink,
  Zap,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { PrivacyPolicyData, ReviewItem } from "../types";
import { DEFAULT_PRIVACY_POLICY, DEFAULT_REVIEWS } from "../lib/reviewsAndPolicyStore";
import { doc, onSnapshot, collection, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const iconMap: Record<string, React.FC<{ className?: string }>> = {
  ShieldCheck,
  Database,
  Smartphone,
  Share2,
  Crown,
  Wallet,
  Lock,
  KeyRound,
  UserCheck,
  AlertOctagon,
  Mail,
  FileText,
  Zap
};

interface PrivacyPolicyPortalProps {
  onNavigateToTab?: (tab: any) => void;
  coverUrl?: string;
}

export default function PrivacyPolicyPortal({ onNavigateToTab, coverUrl }: PrivacyPolicyPortalProps) {
  const [policyData, setPolicyData] = useState<PrivacyPolicyData>(DEFAULT_PRIVACY_POLICY);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeSectionId, setActiveSectionId] = useState<string>("sec-1");

  const handleSectionClick = (secId: string) => {
    setActiveSectionId(secId);
    const el = document.getElementById(secId);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  useEffect(() => {
    // Listen to Firestore settings/privacy_policy
    let unsubscribePolicy = () => {};
    try {
      const policyDocRef = doc(db, "settings", "privacy_policy");
      unsubscribePolicy = onSnapshot(policyDocRef, async (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data() as PrivacyPolicyData;
          if (!remoteData.contactEmail || remoteData.contactEmail !== "zeroxnetworks@gmail.com") {
            remoteData.contactEmail = "zeroxnetworks@gmail.com";
            try {
              await setDoc(policyDocRef, { contactEmail: "zeroxnetworks@gmail.com" }, { merge: true });
            } catch (e) {
              // Ignore if offline
            }
          }
          setPolicyData(remoteData);
        } else {
          try {
            await setDoc(policyDocRef, DEFAULT_PRIVACY_POLICY, { merge: true });
          } catch (e) {
            console.error("Error seeding default privacy policy:", e);
          }
          setPolicyData(DEFAULT_PRIVACY_POLICY);
        }
      }, (err) => {
        console.warn("Privacy policy sync warning:", err);
        setPolicyData(DEFAULT_PRIVACY_POLICY);
      });
    } catch (e) {
      setPolicyData(DEFAULT_PRIVACY_POLICY);
    }

    // Listen to Firestore reviews collection for PDF inclusion
    let unsubscribeReviews = () => {};
    try {
      const reviewsRef = collection(db, "reviews");
      unsubscribeReviews = onSnapshot(reviewsRef, (snap) => {
        if (!snap.empty) {
          const list: ReviewItem[] = [];
          snap.forEach(d => list.push({ id: d.id, ...d.data() } as ReviewItem));
          setReviews(list);
        } else {
          setReviews(DEFAULT_REVIEWS);
        }
      }, () => setReviews(DEFAULT_REVIEWS));
    } catch (e) {
      setReviews(DEFAULT_REVIEWS);
    }

    return () => {
      unsubscribePolicy();
      unsubscribeReviews();
    };
  }, []);

  // Filter sections by search
  const filteredSections = policyData.sections.filter(sec => 
    searchQuery.trim() === "" ||
    sec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sec.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-2.5 sm:px-6 py-4 sm:py-8 space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className={`bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-8 shadow-sm relative overflow-hidden ${coverUrl ? "text-white" : ""}`}>
        {coverUrl && (
          <>
            <img src={coverUrl} alt="Privacy Cover" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px]"></div>
          </>
        )}
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-extrabold uppercase tracking-wider ${coverUrl ? "bg-white/20 border border-white/30 text-white" : "bg-blue-50 border border-blue-200/60 text-[#00AEEF]"}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>ZeroX Network Legal Transparency</span>
              </div>
              <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-2.5 py-0.5 rounded-md text-[11px] font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                GDPR &amp; CCPA Ready
              </span>
            </div>
            
            <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${coverUrl ? "text-white" : "text-slate-900"}`}>
              {policyData.title}
            </h1>
            
            <p className={`text-xs sm:text-sm leading-relaxed ${coverUrl ? "text-slate-200" : "text-slate-600"}`}>
              {policyData.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs pt-1 font-semibold">
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${coverUrl ? "bg-white/10 border-white/20 text-white" : "bg-slate-50 border-slate-200/80 text-slate-700"}`}>
                <Clock className="w-3.5 h-3.5 text-[#00AEEF]" />
                <span>Last Revised: {policyData.lastUpdated}</span>
              </span>
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${coverUrl ? "bg-white/10 border-white/20 text-white" : "bg-slate-50 border-slate-200/80 text-slate-700"}`}>
                <Mail className="w-3.5 h-3.5 text-[#00AEEF]" />
                <span>Legal Desk: {policyData.contactEmail}</span>
              </span>
              <a 
                href="https://www.injazify.com/"
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-150 cursor-pointer ${
                  coverUrl 
                    ? "bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-[#00AEEF]" 
                    : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-blue-50/60 hover:text-[#00AEEF] hover:border-blue-300"
                }`}
                title="Visit Injazify (injazify.com)"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#00AEEF]" />
                <span>A project of Injazify</span>
              </a>
            </div>
          </div>

          {/* Minimal WhatsApp Contact Action Bar */}
          <div className="shrink-0 w-full sm:w-auto">
            <a
              id="privacy-whatsapp-contact-btn"
              href="https://wa.me/447868713315?text=Hello%20ZeroX%20Team,%20I%20have%20a%20legal/privacy%20question%20regarding%20the%20platform."
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center justify-center sm:justify-start gap-3 px-4 py-2.5 sm:py-3 rounded-2xl text-xs font-bold transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer border group w-full sm:w-auto ${
                coverUrl
                  ? "bg-emerald-600/90 hover:bg-emerald-500 text-white border-emerald-400/40 backdrop-blur-xs"
                  : "bg-emerald-50 hover:bg-emerald-100/90 text-emerald-950 border-emerald-200 hover:border-emerald-300"
              }`}
              title="Direct WhatsApp Support"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs shrink-0 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-4 h-4 fill-white" />
              </div>
              <div className="flex flex-col text-left pr-1">
                <span className="text-xs font-extrabold uppercase tracking-wider leading-tight">
                  Contact Us on WhatsApp
                </span>
                <span className={`text-[10px] font-semibold leading-tight mt-0.5 ${coverUrl ? "text-emerald-100" : "text-emerald-600"}`}>
                  Direct Legal &amp; Privacy Desk
                </span>
              </div>
            </a>
          </div>

        </div>
      </div>

      {/* Core Privacy & Operational Guarantees Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-indigo-600 font-extrabold text-xs">
            <Smartphone className="w-4 h-4 shrink-0" />
            <span>Ephemeral SMS</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            OTP codes auto-purged from memory upon completion. 0% penalty on unreceived SMS.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-amber-600 font-extrabold text-xs">
            <Wallet className="w-4 h-4 shrink-0" />
            <span>Transparent Fees</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            2.0% Local / 0.5% Crypto deposit fees. 5% standard order cancellation fee.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 font-extrabold text-xs">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Zero Password Request</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            We never ask for social media passwords or private bank account PINs.
          </p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs space-y-1">
          <div className="flex items-center gap-2 text-[#00AEEF] font-extrabold text-xs">
            <Crown className="w-4 h-4 shrink-0" />
            <span>Full Term Warranty</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Digital software licenses &amp; subscriptions covered with full-duration guarantees.
          </p>
        </div>
      </div>

      {/* Main Grid: Sidebar TOC + Sections Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Interactive Table of Contents & Search (4 cols) */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
          
          {/* Search Box */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-[#00AEEF]" />
                <span>Search Policy Sections</span>
              </span>
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => setSearchQuery("")}
                  className="text-[10px] text-rose-600 hover:underline font-bold"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Type keyword (e.g., fee, refund, API, OTP)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#00AEEF] transition"
              />
            </div>
          </div>

          {/* Quick Jump Navigation List */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Table of Contents ({policyData.sections.length})
              </span>
              <span className="text-[10px] text-slate-400 font-mono">v3.2</span>
            </div>

            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {policyData.sections.map((sec, idx) => {
                const IconComponent = (sec.icon && iconMap[sec.icon]) || FileText;
                const isActive = activeSectionId === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => handleSectionClick(sec.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 transition cursor-pointer ${
                      isActive 
                        ? "bg-blue-50 text-[#00AEEF] border border-blue-200/60 font-bold" 
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-[#00AEEF]" : "text-slate-400"}`} />
                      <span className="truncate">{sec.title}</span>
                    </div>
                    <ChevronRight className={`w-3 h-3 shrink-0 ${isActive ? "text-[#00AEEF]" : "opacity-30"}`} />
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Policy Section Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {filteredSections.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-xs">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No matching policy clauses found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No policy section matched the keyword "{searchQuery}". Try searching for terms like "fee", "deposit", "SMS", or "cancellation".
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="bg-slate-900 text-white font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-800 transition"
              >
                Reset Search Filter
              </button>
            </div>
          ) : (
            filteredSections.map((sec, idx) => {
              const IconComponent = (sec.icon && iconMap[sec.icon]) || FileText;
              return (
                <div 
                  key={sec.id}
                  id={sec.id}
                  className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-3xl p-5 sm:p-7 space-y-3.5 transition-all shadow-2xs scroll-mt-24 group"
                >
                  <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-50 text-[#00AEEF] rounded-2xl border border-blue-100 group-hover:scale-105 transition-transform shrink-0">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                        {sec.title}
                      </h2>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                      Clause {idx + 1}
                    </span>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line space-y-2 font-normal">
                    {sec.content}
                  </div>
                </div>
              );
            })
          )}

          {/* Bottom Legal Disclaimer Footer */}
          <div className="bg-slate-900 text-slate-300 rounded-3xl p-6 border border-slate-800 space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official Regulatory &amp; Compliance Statement</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-light">
              ZeroX Network is governed by international digital commerce protocols and strict user confidentiality agreements. A project of <a href="https://www.injazify.com/" target="_blank" rel="noopener noreferrer" className="text-[#00AEEF] hover:underline font-medium">Injazify</a>, Injazify reserves all intellectual property and operational rights for the underlying architecture. For expedited compliance audit requests or official notices, contact our legal escalation team at <strong className="text-white">zeroxnetworks@gmail.com</strong>.
            </p>
            <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-500 font-mono">
              <span>LEDGER HASH: ZX-COMPLIANCE-POLICY-V3.2</span>
              <span>© {new Date().getFullYear()} ZeroX Network • <a href="https://www.injazify.com/" target="_blank" rel="noopener noreferrer" className="hover:text-white underline underline-offset-2 text-slate-400">A project of Injazify</a></span>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
