import React, { useState, useEffect, useMemo } from "react";
import { UserAccount, AffiliateWithdrawalRequest } from "../types";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, doc } from "firebase/firestore";
import { 
  Users, Share2, Copy, Check, Gift, DollarSign, Award, ArrowUpRight, 
  Sparkles, ShieldCheck, Zap, HelpCircle, ExternalLink, QrCode, Mail, 
  MessageSquare, Send, Globe, TrendingUp, Wallet, CheckCircle2, RefreshCw, X,
  MessageCircle, Twitter, Facebook, Linkedin, Calculator, Crown, Trophy,
  Sliders, Download, Flame, ChevronRight, FileSpreadsheet, Search, Filter,
  ArrowRight, HeartHandshake, Shield, Sparkle, Banknote, FileText, AlertCircle,
  Building2, CreditCard, Clock, CheckCircle, XCircle, Info, Landmark, Smartphone
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import { getAffiliateTier, calculateAffiliateProjection, AffiliateTierInfo } from "../lib/referrals";
import InvoiceModal from "./InvoiceModal";
import { InvoiceData } from "../lib/invoiceGenerator";

interface ReferralAffiliateStoreProps {
  cryptoRate?: number;
  currentUser: UserAccount | null;
  onNavigateToTab?: (tab: string) => void;
  onUpdateUserBalance?: (userId: string, newBalance: number) => void;
  formatPrice: (usdles: number) => string;
}

interface ReferralCommissionLog {
  id: string;
  refereeUsername: string;
  depositAmountPkr: number;
  depositAmountUsd: number;
  commissionRatePercent: number;
  tierName?: string;
  commissionEarnedUsd: number;
  commissionEarnedPkr?: number;
  depositMethod: string;
  createdAt: string;
}

interface ReferredUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  status?: string;
  hasDeposited?: boolean;
}

interface LeaderboardItem {
  maskedUsername: string;
  referralCount: number;
  earningsUsd: number;
  volumeUsd: number;
  rankBadge: string;
  tier: string;
}

export default function ReferralAffiliateStore({
  cryptoRate = 278,
  currentUser,
  onNavigateToTab,
  onUpdateUserBalance,
  formatPrice
}: ReferralAffiliateStoreProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  
  const [baseCommissionRate, setBaseCommissionRate] = useState<number>(5);
  const [commissionLogs, setCommissionLogs] = useState<ReferralCommissionLog[]>([]);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [activeTab, setActiveTab] = useState<"overview" | "withdrawals" | "calculator" | "leaderboard" | "referrals" | "commissions" | "terms">("overview");
  const [activeTemplate, setActiveTemplate] = useState<"standard" | "urdu" | "tech" | "twitter">("standard");
  
  // Withdrawal State & Modals
  const [withdrawalRequests, setWithdrawalRequests] = useState<AffiliateWithdrawalRequest[]>([]);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmountPkr, setWithdrawAmountPkr] = useState<string>("");
  const [withdrawMethod, setWithdrawMethod] = useState<string>("easypaisa");
  const [withdrawAccountTitle, setWithdrawAccountTitle] = useState<string>("");
  const [withdrawAccountNumber, setWithdrawAccountNumber] = useState<string>("");
  const [withdrawBankName, setWithdrawBankName] = useState<string>("");
  const [withdrawNotes, setWithdrawNotes] = useState<string>("");
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawalFilterStatus, setWithdrawalFilterStatus] = useState<string>("all");
  const [withdrawalSearch, setWithdrawalSearch] = useState<string>("");

  // Invoice Modal State
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<InvoiceData | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Commission History search & filters
  const [commSearch, setCommSearch] = useState("");
  const [commMethodFilter, setCommMethodFilter] = useState("all");

  // Calculator State
  const [calcReferees, setCalcReferees] = useState<number>(10);
  const [calcAvgDepositPkr, setCalcAvgDepositPkr] = useState<number>(2500);

  // Referral code logic (User's username is their referral code)
  const myRefCode = (currentUser?.username || (currentUser as any)?.referralCode || currentUser?.id || "USER123").trim();
  
  // Official platform domain and 1-click referral URL
  const PLATFORM_DOMAIN = "https://zeroxnetwork.ai.studio";
  const referralUrl = `${PLATFORM_DOMAIN}/?ref=${encodeURIComponent(myRefCode)}`;

  // VIP Tier calculation for the current user
  const userRefCount = referredUsers.length || currentUser?.referralCount || 0;
  const userTier: AffiliateTierInfo = useMemo(() => {
    return getAffiliateTier(userRefCount, baseCommissionRate, (currentUser as any)?.customCommissionRate);
  }, [userRefCount, baseCommissionRate, currentUser]);

  // Projected passive income calculation
  const projections = useMemo(() => {
    return calculateAffiliateProjection(calcReferees, calcAvgDepositPkr, userTier.ratePercent, cryptoRate);
  }, [calcReferees, calcAvgDepositPkr, userTier.ratePercent, cryptoRate]);

  // Fetch Referral Config, Realtime Commissions, and Leaderboard
  useEffect(() => {
    // 1. Fetch Global Commission Rate Config
    const unsubConfig = onSnapshot(doc(db, "settings", "zerox_config"), (docSnap) => {
      if (docSnap.exists() && typeof docSnap.data().referralCommissionRate === "number") {
        setBaseCommissionRate(docSnap.data().referralCommissionRate);
      }
    });

    // 2. Fetch Leaderboard from backend
    fetch("/api/affiliate/leaderboard")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
        }
      })
      .catch(err => console.warn("Leaderboard fetch error:", err));

    if (!currentUser) {
      setLoading(false);
      return () => unsubConfig();
    }

    // 3. Fetch User's Referral Commissions History
    const qComms = query(
      collection(db, "referral_commissions"),
      where("referrerId", "==", currentUser.id)
    );

    const unsubComms = onSnapshot(qComms, (snapshot) => {
      const logs: ReferralCommissionLog[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as ReferralCommissionLog[];

      logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCommissionLogs(logs);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching referral commissions:", err);
      setLoading(false);
    });

    // 4. Fetch Referred Users
    const queryIdentifiers = Array.from(new Set([myRefCode, currentUser.username, currentUser.id].filter(Boolean)));
    const qUsers = query(
      collection(db, "users"),
      where("referredBy", "in", queryIdentifiers.slice(0, 10))
    );

    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      const users: ReferredUser[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          username: data.username || "User",
          email: data.email || "",
          createdAt: data.createdAt || new Date().toISOString(),
          status: data.status || "Active"
        };
      });
      setReferredUsers(users);
    }, (err) => {
      console.error("Error fetching referred users:", err);
    });

    // 5. Fetch User's Affiliate Withdrawals in Real-time
    const qWithdrawals = query(
      collection(db, "affiliate_withdrawals"),
      where("userId", "==", currentUser.id)
    );

    const unsubWithdrawals = onSnapshot(qWithdrawals, (snapshot) => {
      const wds: AffiliateWithdrawalRequest[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as AffiliateWithdrawalRequest[];

      wds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setWithdrawalRequests(wds);
    }, (err) => {
      console.error("Error fetching affiliate withdrawals:", err);
    });

    return () => {
      unsubConfig();
      unsubComms();
      unsubUsers();
      unsubWithdrawals();
    };
  }, [currentUser?.id, myRefCode]);

  // Affiliate Commission Calculations & Balance Restrictions
  const totalCommissionsEarnedUsd = Math.max(
    commissionLogs.reduce(
      (sum, log) => sum + (log.commissionEarnedUsd || (log as any).commissionEarnedRub || 0),
      0
    ),
    Number(currentUser?.referralEarnings || 0)
  );

  const totalCommissionsEarnedPkr = Math.max(
    commissionLogs.reduce(
      (sum, log) => sum + (log.commissionEarnedPkr || ((log.commissionEarnedUsd || 0) * cryptoRate) || 0),
      0
    ),
    Math.round(totalCommissionsEarnedUsd * cryptoRate)
  );

  const totalWithdrawnOrPendingPkr = withdrawalRequests
    .filter(w => w.status !== "REJECTED")
    .reduce((sum, w) => sum + (w.amountPkr || 0), 0);

  const totalWithdrawnOrPendingUsd = withdrawalRequests
    .filter(w => w.status !== "REJECTED")
    .reduce((sum, w) => sum + (w.amountUsd || 0), 0);

  // Available Withdrawable Commission strictly separated from main account balance
  const availableAffiliateCommissionPkr = Math.max(0, totalCommissionsEarnedPkr - totalWithdrawnOrPendingPkr);
  const availableAffiliateCommissionUsd = Math.max(0, Number((totalCommissionsEarnedUsd - totalWithdrawnOrPendingUsd).toFixed(2)));

  const totalReferredVolumeUsd = commissionLogs.reduce(
    (sum, log) => sum + (log.depositAmountUsd || 0),
    0
  );

  // Copy helpers
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    toast.success("1-Click Referral Link copied to clipboard! 🚀", { icon: "🔗" });
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(myRefCode);
    setCopiedCode(true);
    toast.success(`Referral code '${myRefCode}' copied!`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Preset Share Templates
  const templates = {
    standard: `🚀 Join Zerox Network today! Instant SMS activations, SMM services, and OTT subscriptions with automated deposits. Sign up using my VIP referral link: ${referralUrl}`,
    urdu: `Salam! 🌟 Zerox Network par instant SMS numbers, OTT subscriptions aur SMM panel services available hain. Mera referral link use karke account banayein: ${referralUrl}`,
    tech: `⚡ High-speed Virtual SMS OTP Gateway & Telecom API Platform. Instant JazzCash, EasyPaisa, and Crypto top-ups. Sign up with link: ${referralUrl}`,
    twitter: `Check out @ZeroxNetwork for instant virtual SMS numbers & digital accounts! 🚀 High deliverability and 24/7 automated deposits. Join here: ${referralUrl}`
  };

  const handleCopyTemplateText = (key: keyof typeof templates) => {
    navigator.clipboard.writeText(templates[key]);
    setCopiedTemplate(key);
    toast.success("Marketing pitch template copied! Ready to paste.");
    setTimeout(() => setCopiedTemplate(null), 2500);
  };

  // Social Share Handlers
  const shareText = templates[activeTemplate];

  const shareToWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const shareToTelegram = () => {
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const shareToTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}`, "_blank");
  };

  const shareToLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`, "_blank");
  };

  const shareToEmail = () => {
    const subject = encodeURIComponent("Join Zerox Network & Start Earning!");
    const body = encodeURIComponent(`Hi!\n\nI'm using Zerox Network for instant services and earning commissions. Use my referral link to join: ${referralUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Zerox Network VIP Partner",
          text: shareText,
          url: referralUrl,
        });
      } catch (err) {
        // user cancelled or share failed
      }
    } else {
      handleCopyLink();
    }
  };

  // Export CSV Statement
  const exportCommissionCsv = () => {
    if (commissionLogs.length === 0) {
      toast.error("No commission history to export.");
      return;
    }

    const headers = ["Transaction ID", "Friend Username", "Deposit (PKR)", "Deposit (USD)", "Commission Rate (%)", "Payout (USD)", "Payout (PKR)", "Deposit Method", "Date & Time"];
    const rows = commissionLogs.map(log => [
      log.id,
      `@${log.refereeUsername}`,
      log.depositAmountPkr,
      log.depositAmountUsd,
      `${log.commissionRatePercent}%`,
      log.commissionEarnedUsd,
      log.commissionEarnedPkr || Math.round(log.commissionEarnedUsd * cryptoRate),
      log.depositMethod,
      new Date(log.createdAt).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `zerox_affiliate_commissions_${myRefCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Affiliate commission statement exported to CSV! 📊");
  };

  // Filtered Commission Logs
  const filteredCommissions = useMemo(() => {
    return commissionLogs.filter(log => {
      const matchSearch = commSearch === "" || 
        log.refereeUsername.toLowerCase().includes(commSearch.toLowerCase()) ||
        log.depositMethod.toLowerCase().includes(commSearch.toLowerCase());
      const matchMethod = commMethodFilter === "all" || log.depositMethod.toLowerCase() === commMethodFilter.toLowerCase();
      return matchSearch && matchMethod;
    });
  }, [commissionLogs, commSearch, commMethodFilter]);

  // Filtered Withdrawal Requests
  const filteredWithdrawals = useMemo(() => {
    return withdrawalRequests.filter(wd => {
      const matchStatus = withdrawalFilterStatus === "all" || wd.status.toUpperCase() === withdrawalFilterStatus.toUpperCase();
      const matchSearch = !withdrawalSearch.trim() || (
        (wd.invoiceNumber || "").toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
        (wd.accountTitle || "").toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
        (wd.accountNumber || "").toLowerCase().includes(withdrawalSearch.toLowerCase()) ||
        (wd.payoutMethod || "").toLowerCase().includes(withdrawalSearch.toLowerCase())
      );
      return matchStatus && matchSearch;
    });
  }, [withdrawalRequests, withdrawalFilterStatus, withdrawalSearch]);

  const totalWithdrawnPkr = withdrawalRequests
    .filter(w => w.status === "PAID" || w.status === "APPROVED")
    .reduce((sum, w) => sum + (w.netPayoutPkr || (w.amountPkr * 0.98)), 0);
  const totalWithdrawnUsd = withdrawalRequests
    .filter(w => w.status === "PAID" || w.status === "APPROVED")
    .reduce((sum, w) => sum + (w.netPayoutUsd || (w.amountUsd * 0.98)), 0);
  const totalFeePaidPkr = withdrawalRequests
    .filter(w => w.status === "PAID" || w.status === "APPROVED")
    .reduce((sum, w) => sum + (w.feeAmountPkr || (w.amountPkr * 0.02)), 0);
  const pendingWithdrawalsCount = withdrawalRequests.filter(w => w.status === "PENDING").length;

  // Handle Withdrawal Request Submission
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      toast.error("Please log in to request payout.");
      return;
    }
    const amt = Number(withdrawAmountPkr);
    if (isNaN(amt) || amt < 100) {
      toast.error("Minimum withdrawal amount is ₨ 100 PKR.");
      return;
    }
    if (!withdrawAccountTitle.trim() || !withdrawAccountNumber.trim()) {
      toast.error("Please enter account title and account number / IBAN.");
      return;
    }

    // STRICT RESTRICTION: User can only withdraw affiliate commission earnings
    if (availableAffiliateCommissionPkr < 100) {
      toast.error(`Affiliate Payout Restriction: You have ₨ ${availableAffiliateCommissionPkr.toLocaleString()} PKR in affiliate commission. Minimum ₨ 100 PKR in commission is required. Main account wallet deposits cannot be withdrawn.`);
      return;
    }

    if (amt > availableAffiliateCommissionPkr) {
      toast.error(`Affiliate Payout Restriction: You can only withdraw earned affiliate commissions (Available: ₨ ${availableAffiliateCommissionPkr.toLocaleString()} PKR / $${availableAffiliateCommissionUsd.toFixed(2)} USD). Main account wallet deposits cannot be withdrawn.`);
      return;
    }

    const currentWalletBalPkr = Math.round((currentUser.balance || 0) * cryptoRate);
    if (amt > currentWalletBalPkr) {
      toast.error(`Insufficient wallet balance. Your current balance is ₨ ${currentWalletBalPkr.toLocaleString()} PKR.`);
      return;
    }

    setIsSubmittingWithdraw(true);
    toast.loading("Submitting affiliate payout request...", { id: "wd-toast" });
    try {
      const res = await fetch("/api/affiliate/withdraw/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username,
          userEmail: currentUser.email,
          amountPkr: amt,
          payoutMethod: withdrawMethod,
          accountTitle: withdrawAccountTitle.trim(),
          accountNumber: withdrawAccountNumber.trim(),
          bankName: withdrawBankName.trim(),
          notes: withdrawNotes.trim(),
          cryptoRate
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to submit withdrawal request.");
      }

      toast.success(`Withdrawal request submitted! Invoice Ref: ${data.withdrawal?.invoiceNumber || "Created"}`, { id: "wd-toast", duration: 5000 });
      if (typeof data.newBalance === "number" && onUpdateUserBalance) {
        onUpdateUserBalance(currentUser.id, data.newBalance);
      }
      setIsWithdrawModalOpen(false);
      setWithdrawAmountPkr("");
      setWithdrawNotes("");
      setActiveTab("withdrawals");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit withdrawal request.", { id: "wd-toast" });
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Open Official Printable Invoice for a Withdrawal
  const handleOpenWithdrawalInvoice = (wd: AffiliateWithdrawalRequest) => {
    const feePkr = wd.feeAmountPkr || Number((wd.amountPkr * 0.02).toFixed(2));
    const netPkr = wd.netPayoutPkr || Number((wd.amountPkr - feePkr).toFixed(2));
    const feeUsd = wd.feeAmountUsd || Number((wd.amountUsd * 0.02).toFixed(4));
    const netUsd = wd.netPayoutUsd || Number((wd.amountUsd - feeUsd).toFixed(4));

    const invoiceData: InvoiceData = {
      invoiceNumber: wd.invoiceNumber || `ZX-WD-${wd.id.slice(-6)}`,
      orderId: wd.id,
      date: wd.createdAt || new Date().toISOString(),
      customerName: wd.accountTitle || wd.username || currentUser?.username || "Valued Partner",
      customerEmail: wd.userEmail || currentUser?.email || "",
      customerPhone: wd.accountNumber || "",
      paymentMethod: `${(wd.payoutMethod || 'Local Bank').toUpperCase()} (${wd.accountTitle || 'Account'})`,
      status: wd.status === "PAID" || wd.status === "APPROVED" ? "COMPLETED" : wd.status === "REJECTED" ? "REJECTED" : "PENDING",
      items: [
        {
          id: wd.id,
          title: `Affiliate Commission Payout — ${wd.payoutMethod.toUpperCase()}`,
          category: "Affiliate Withdrawal",
          details: `Payout Account: ${wd.accountTitle}\nAccount / IBAN / Wallet: ${wd.accountNumber}${wd.bankName ? `\nBank: ${wd.bankName}` : ''}${wd.transactionRef ? `\nAdmin Transaction Ref: ${wd.transactionRef}` : ''}${wd.adminNotes ? `\nAdmin Notes: ${wd.adminNotes}` : ''}`,
          quantity: 1,
          unitPriceUsd: wd.amountUsd,
          unitPricePkr: wd.amountPkr,
          totalUsd: wd.amountUsd,
          totalPkr: wd.amountPkr
        }
      ],
      subtotalPkr: wd.amountPkr,
      subtotalUsd: wd.amountUsd,
      grandTotalPkr: netPkr,
      grandTotalUsd: netUsd,
      fees: {
        processingFeePkr: feePkr,
        processingFeeUsd: feeUsd
      }
    };

    setSelectedInvoiceData(invoiceData);
    setIsInvoiceModalOpen(true);
  };

  // Export Withdrawals Statement CSV
  const exportWithdrawalCsv = () => {
    if (withdrawalRequests.length === 0) {
      toast.error("No withdrawal requests to export.");
      return;
    }

    const headers = ["Invoice Ref", "Date Requested", "Gross Amount (PKR)", "Gross Amount (USD)", "Processing Fee 2% (PKR)", "Net Dispatched (PKR)", "Net Dispatched (USD)", "Payout Method", "Account Title", "Account Number", "Bank Name", "Status", "Admin Transaction Ref", "Admin Notes"];
    const rows = withdrawalRequests.map(w => [
      w.invoiceNumber || w.id,
      new Date(w.createdAt).toLocaleString(),
      w.amountPkr,
      w.amountUsd,
      w.feeAmountPkr || (w.amountPkr * 0.02),
      w.netPayoutPkr || (w.amountPkr * 0.98),
      w.netPayoutUsd || (w.amountUsd * 0.98),
      w.payoutMethod,
      `"${w.accountTitle || ''}"`,
      `"${w.accountNumber || ''}"`,
      `"${w.bankName || ''}"`,
      w.status,
      `"${w.transactionRef || ''}"`,
      `"${w.adminNotes || ''}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `zerox_affiliate_payouts_statement_${myRefCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Affiliate withdrawal statement exported to CSV! 📊");
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-5 space-y-6 animate-fade-in" id="affiliate-program-container">
      {/* 1. SLEEK HERO STATS CARD */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800/80 p-5 sm:p-6 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#00AEEF]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                  userTier.tierLevel === 4 
                    ? "bg-purple-500/20 text-purple-300 border-purple-400/30"
                    : userTier.tierLevel === 3
                    ? "bg-amber-500/20 text-amber-300 border-amber-400/30"
                    : userTier.tierLevel === 2
                    ? "bg-sky-500/20 text-sky-300 border-sky-400/30"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                }`}>
                  <Crown className="w-3 h-3" />
                  <span>{userTier.tierName} • {userTier.ratePercent}% Cash</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Lifetime Recurring</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Affiliate & Partner Program
              </h1>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-md shadow-emerald-500/20"
                id="hero-affiliate-withdraw-btn"
              >
                <Banknote className="w-4 h-4" />
                <span>Withdraw Earnings</span>
                <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-md font-mono">Min ₨100</span>
              </button>

              <button
                onClick={() => onNavigateToTab?.("wallet")}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                <span>Wallet: {formatPrice(currentUser?.balance || 0)}</span>
              </button>
            </div>
          </div>

          {/* Clean 4-Stat Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Earnings</span>
              <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono mt-0.5 block">
                {formatPrice(totalCommissionsEarnedUsd || currentUser?.referralEarnings || 0)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5 truncate">
                ₨ {totalCommissionsEarnedPkr.toLocaleString()} PKR
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Referred Users</span>
              <span className="text-lg sm:text-xl font-bold text-sky-400 font-mono mt-0.5 block">
                {userRefCount}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Active Partners</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Commission Rate</span>
              <span className="text-lg sm:text-xl font-bold text-amber-400 font-mono mt-0.5 block">
                {userTier.ratePercent}%
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Per Deposit</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Network Volume</span>
              <span className="text-lg sm:text-xl font-bold text-white font-mono mt-0.5 block">
                ${totalReferredVolumeUsd.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Total Deposits</span>
            </div>
          </div>

          {/* Sleek Progress Strip */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                Tier Progress: <strong className="text-slate-200">{userTier.tierName}</strong>
              </span>
              <span className="text-[11px] text-slate-400">
                {userTier.nextTierName ? (
                  <span className="text-sky-400 font-medium">
                    +{userTier.referralsNeededForNextTier} more to {userTier.nextTierName}
                  </span>
                ) : (
                  <span className="text-purple-300 font-medium">Top Rank Reached 🏆</span>
                )}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ 
                  width: userTier.tierLevel === 4 ? "100%" : `${Math.min(100, (userRefCount / (userTier.maxReferrals + 1)) * 100)}%` 
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-[#00AEEF] to-emerald-400 rounded-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. MODERN 1-CLICK REFERRAL LINK CARD */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        {/* Header & QR Action */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#00AEEF]" />
              Your Referral Link
            </h2>
            <p className="text-xs text-slate-500">
              Referral code is your username: <span className="font-semibold text-indigo-600">@{myRefCode}</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQrModal(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#00AEEF]" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* Clean Link Bar */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              readOnly
              value={referralUrl}
              className="w-full bg-slate-50 border border-slate-200 focus:border-[#00AEEF] rounded-xl py-2.5 pl-3.5 pr-20 text-xs font-mono text-slate-800 outline-none select-all transition shadow-inner"
            />
            <button
              onClick={handleCopyCode}
              title="Copy code only"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md border border-indigo-200/80 transition cursor-pointer"
            >
              {copiedCode ? "Copied" : "Copy Code"}
            </button>
          </div>

          <button
            onClick={handleCopyLink}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs text-white flex items-center justify-center gap-1.5 transition active:scale-95 shrink-0 cursor-pointer ${
              copiedLink 
                ? "bg-emerald-600 shadow-xs" 
                : "bg-[#00AEEF] hover:bg-sky-500 shadow-xs"
            }`}
          >
            {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied!" : "Copy Full Link"}</span>
          </button>
        </div>

        {/* Ready-to-Post Promotion Pitches */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
              <Sparkle className="w-3 h-3 text-[#00AEEF]" />
              Promo Pitch Templates
            </span>

            {/* Horizontal single-line tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: "standard", label: "Standard" },
                { id: "urdu", label: "Urdu" },
                { id: "tech", label: "Tech / API" },
                { id: "twitter", label: "X / Twitter" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTemplate(tab.id as any)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeTemplate === tab.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <p className="text-xs text-slate-700 bg-white border border-slate-200/80 rounded-lg p-2.5 font-normal leading-relaxed select-all">
              {templates[activeTemplate]}
            </p>
            <button
              onClick={() => handleCopyTemplateText(activeTemplate)}
              className="mt-1.5 sm:mt-0 sm:absolute sm:right-2 sm:bottom-2 inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md transition cursor-pointer"
            >
              {copiedTemplate === activeTemplate ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedTemplate === activeTemplate ? "Copied" : "Copy Pitch"}</span>
            </button>
          </div>
        </div>

        {/* Compact 1-Click Social Share Row */}
        <div className="pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Instant Share:</span>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            <button
              onClick={shareToWhatsApp}
              className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 text-[10px] font-semibold flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span className="truncate">WhatsApp</span>
            </button>

            <button
              onClick={shareToTelegram}
              className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200/60 text-[10px] font-semibold flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <Send className="w-4 h-4 text-sky-600" />
              <span className="truncate">Telegram</span>
            </button>

            <button
              onClick={shareToTwitter}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-[10px] font-semibold flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <Twitter className="w-4 h-4 text-slate-900" />
              <span className="truncate">X</span>
            </button>

            <button
              onClick={shareToFacebook}
              className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/60 text-[10px] font-semibold flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <Facebook className="w-4 h-4 text-blue-600" />
              <span className="truncate">Facebook</span>
            </button>

            <button
              onClick={shareToLinkedIn}
              className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200/60 text-[10px] font-semibold flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <Linkedin className="w-4 h-4 text-blue-700" />
              <span className="truncate">LinkedIn</span>
            </button>

            <button
              onClick={() => window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(referralUrl)}&title=${encodeURIComponent(shareText)}`, "_blank")}
              className="p-2 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200/60 text-[10px] font-semibold flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <Globe className="w-4 h-4 text-orange-600" />
              <span className="truncate">Reddit</span>
            </button>

            <button
              onClick={shareToEmail}
              className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 text-[10px] font-semibold flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <Mail className="w-4 h-4 text-rose-600" />
              <span className="truncate">Email</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#00AEEF] border border-sky-200/60 text-[10px] font-semibold flex flex-col items-center gap-1 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#00AEEF]" />
              <span className="truncate">Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. VIP TIER TIERS GRID (Bronze, Silver, Gold, Diamond) */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              Commission Tiers
            </h2>
            <p className="text-xs text-slate-500">
              Your rate increases automatically as more friends join through your link.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Bronze Tier */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            userTier.tierLevel === 1 
              ? "bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400/30" 
              : "bg-slate-50/70 border-slate-200/80 opacity-90"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Bronze</span>
              <span className="text-xs">🥉</span>
            </div>
            <p className="text-xl font-bold text-slate-900 font-mono">5.0%</p>
            <p className="text-[10px] text-slate-500">0 - 4 Referrals</p>
            <div className="mt-2 pt-2 border-t border-slate-200/70 text-[10px] text-slate-600 space-y-0.5">
              <p className="flex items-center gap-1 font-medium">
                <Check className="w-3 h-3 text-emerald-600" /> Auto-credit on deposit
              </p>
            </div>
          </div>

          {/* Silver Tier */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            userTier.tierLevel === 2 
              ? "bg-sky-50/50 border-sky-300 ring-1 ring-sky-400/30" 
              : "bg-slate-50/70 border-slate-200/80 opacity-90"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-sky-800 uppercase tracking-wider">Silver</span>
              <span className="text-xs">🥈</span>
            </div>
            <p className="text-xl font-bold text-slate-900 font-mono">7.5%</p>
            <p className="text-[10px] text-slate-500">5 - 19 Referrals</p>
            <div className="mt-2 pt-2 border-t border-slate-200/70 text-[10px] text-slate-600 space-y-0.5">
              <p className="flex items-center gap-1 font-medium">
                <Check className="w-3 h-3 text-sky-600" /> +2.5% rate bonus
              </p>
            </div>
          </div>

          {/* Gold Tier */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            userTier.tierLevel === 3 
              ? "bg-amber-50/50 border-amber-300 ring-1 ring-amber-400/30" 
              : "bg-slate-50/70 border-slate-200/80 opacity-90"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Gold</span>
              <span className="text-xs">🥇</span>
            </div>
            <p className="text-xl font-bold text-slate-900 font-mono">10.0%</p>
            <p className="text-[10px] text-slate-500">20 - 49 Referrals</p>
            <div className="mt-2 pt-2 border-t border-slate-200/70 text-[10px] text-slate-600 space-y-0.5">
              <p className="flex items-center gap-1 font-medium">
                <Check className="w-3 h-3 text-amber-600" /> +5.0% rate bonus
              </p>
            </div>
          </div>

          {/* Diamond Tier */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            userTier.tierLevel === 4 
              ? "bg-purple-50/50 border-purple-300 ring-1 ring-purple-400/30" 
              : "bg-slate-50/70 border-slate-200/80 opacity-90"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">Diamond</span>
              <span className="text-xs">💎</span>
            </div>
            <p className="text-xl font-bold text-slate-900 font-mono">12.5%</p>
            <p className="text-[10px] text-slate-500">50+ Referrals</p>
            <div className="mt-2 pt-2 border-t border-slate-200/70 text-[10px] text-slate-600 space-y-0.5">
              <p className="flex items-center gap-1 font-medium">
                <Check className="w-3 h-3 text-purple-600" /> Max commission rate
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. TABS NAVIGATION: CALCULATOR, LEADERBOARD, COMMISSIONS, REFERRALS, TERMS */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm space-y-5">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100 pb-2.5">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "overview" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Earnings Ledger ({commissionLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "withdrawals" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <Banknote className="w-3.5 h-3.5 text-emerald-500" />
            <span>Withdrawals & Invoices</span>
            {pendingWithdrawalsCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white text-[10px] font-black rounded-full animate-pulse">
                {pendingWithdrawalsCount}
              </span>
            )}
            {withdrawalRequests.length > 0 && pendingWithdrawalsCount === 0 && (
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-full">
                {withdrawalRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "calculator" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-[#00AEEF]" />
            <span>Calculator</span>
          </button>

          <button
            onClick={() => setActiveTab("leaderboard")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "leaderboard" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Leaderboard</span>
          </button>

          <button
            onClick={() => setActiveTab("referrals")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "referrals" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-500" />
            <span>Network ({referredUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("terms")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "terms" 
                ? "bg-slate-900 text-white shadow-xs" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span>FAQ & Rules</span>
          </button>
        </div>

        {/* TAB 1: COMMISSION HISTORY LEDGER */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={commSearch}
                    onChange={(e) => setCommSearch(e.target.value)}
                    placeholder="Search by referee username or payment..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-[#00AEEF]"
                  />
                </div>

                <select
                  value={commMethodFilter}
                  onChange={(e) => setCommMethodFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-[#00AEEF]"
                >
                  <option value="all">All Gateways</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="crypto">Crypto / USDT</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>

              <button
                onClick={exportCommissionCsv}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer border border-slate-200"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV Statement</span>
              </button>
            </div>

            {filteredCommissions.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto border border-indigo-100">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-800">No Commission Records Found</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {commSearch || commMethodFilter !== "all" 
                    ? "No records match your search filter."
                    : "Share your referral link with friends. When they complete a wallet top-up, your earnings will appear here instantly!"
                  }
                </p>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-[#00AEEF] hover:bg-[#0096ce] text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link & Invite Now</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Referee / Friend</th>
                      <th className="py-3 px-4">Top-Up Amount</th>
                      <th className="py-3 px-4">Commission Rate</th>
                      <th className="py-3 px-4">Your Earned Payout</th>
                      <th className="py-3 px-4">Payment Method</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCommissions.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">@{log.refereeUsername}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          ₨ {log.depositAmountPkr.toLocaleString()} PKR
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-black text-[10px] border border-indigo-200">
                            {log.commissionRatePercent}% {log.tierName ? `(${log.tierName})` : ''}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-emerald-600">
                          +{formatPrice(log.commissionEarnedUsd || 0)} 
                          <span className="text-[10px] text-slate-400 font-normal ml-1">
                            (₨ {log.commissionEarnedPkr || Math.round((log.commissionEarnedUsd || 0) * cryptoRate)})
                          </span>
                        </td>
                        <td className="py-3 px-4 font-extrabold text-slate-600 uppercase text-[10px]">{log.depositMethod}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Auto-Credited
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      {/* TAB: WITHDRAWALS & INVOICES */}
      {activeTab === "withdrawals" && (
        <div className="space-y-6">
          {/* Top Transparent Notice Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border border-emerald-500/30 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              <div className="space-y-2.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider border border-emerald-500/40 shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Official Payout & Settlement System</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/90 text-amber-300 text-[10px] sm:text-[11px] font-bold border border-amber-500/30 shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                    2.0% Processing Fee
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
                  Affiliate Earnings Withdrawal & Settlement
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
                  Submit your affiliate payout request anytime. Minimum withdrawal threshold is <strong className="text-emerald-400 font-bold">₨ 100 PKR</strong>. Each payout includes real-time escrow deduction, a standard <strong className="text-amber-300 font-bold">2.0% processing fee</strong>, and an official printable PDF invoice & settlement statement.
                </p>
              </div>

              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer shadow-lg shadow-emerald-500/25 shrink-0"
                id="tab-request-payout-btn"
              >
                <Banknote className="w-4 h-4" />
                <span>Request New Payout</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* Notice Quick Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 mt-4 border-t border-emerald-500/20 text-xs">
              <div className="flex items-center gap-2.5 bg-black/25 border border-emerald-500/15 rounded-xl px-3 py-2.5 text-slate-200">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[11px] sm:text-xs"><strong>Min Payout:</strong> ₨ 100 PKR ($0.36)</span>
              </div>
              <div className="flex items-center gap-2.5 bg-black/25 border border-emerald-500/15 rounded-xl px-3 py-2.5 text-slate-200">
                <CheckCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] sm:text-xs"><strong>Processing Fee:</strong> 2.0% Flat</span>
              </div>
              <div className="flex items-center gap-2.5 bg-black/25 border border-emerald-500/15 rounded-xl px-3 py-2.5 text-slate-200">
                <CheckCircle className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="text-[11px] sm:text-xs truncate"><strong>Channels:</strong> JazzCash, EasyPaisa, Bank, Crypto</span>
              </div>
            </div>
          </div>

          {/* Quick Stat Tiles - Cleanly Organized & Responsive */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Card 1: Available Commission (Withdrawable) */}
            <div className="bg-white border-2 border-emerald-400/80 rounded-2xl p-4 sm:p-4.5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 whitespace-nowrap">
                  Withdrawable
                </span>
              </div>
              
              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">
                  Available Commission
                </span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono tracking-tight block">
                  ₨ {availableAffiliateCommissionPkr.toLocaleString()}
                </span>
              </div>
              
              <div className="mt-2.5 pt-2 border-t border-emerald-100/70 flex items-center justify-between text-[11px]">
                <span className="text-emerald-700 font-bold font-mono">
                  ${availableAffiliateCommissionUsd.toFixed(2)} USD ready
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold">Min ₨100</span>
              </div>
            </div>

            {/* Card 2: Lifetime Commission */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-4.5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0 whitespace-nowrap">
                  Total Earned
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">
                  Lifetime Commission
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight block">
                  ₨ {totalCommissionsEarnedPkr.toLocaleString()}
                </span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-semibold font-mono">
                  ${totalCommissionsEarnedUsd.toFixed(2)} USD earned
                </span>
                <span className="text-[10px] text-slate-400 font-medium">All Time</span>
              </div>
            </div>

            {/* Card 3: Total Dispatched */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-4.5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 shrink-0 whitespace-nowrap">
                  Settled
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">
                  Total Dispatched
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tracking-tight block">
                  ₨ {totalWithdrawnPkr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-600 font-semibold font-mono">
                  ${totalWithdrawnUsd.toFixed(2)} USD settled
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Paid Out</span>
              </div>
            </div>

            {/* Card 4: Main Wallet (Services Only) */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-4.5 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0 whitespace-nowrap">
                  Services Only
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block leading-tight">
                  Main Balance
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-700 font-mono tracking-tight block">
                  ₨ {Math.round((currentUser?.balance || 0) * cryptoRate).toLocaleString()}
                </span>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium truncate">
                  For Orders & Top-ups
                </span>
                <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 shrink-0 whitespace-nowrap">
                  Locked
                </span>
              </div>
            </div>
          </div>

          {/* Filter, Search & Export Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={withdrawalSearch}
                  onChange={(e) => setWithdrawalSearch(e.target.value)}
                  placeholder="Search by invoice ref, account title, or number..."
                  className="w-full bg-slate-50 border border-slate-200/90 rounded-xl pl-9.5 pr-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition"
                />
              </div>

              <select
                value={withdrawalFilterStatus}
                onChange={(e) => setWithdrawalFilterStatus(e.target.value)}
                className="bg-slate-50 border border-slate-200/90 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:bg-white transition cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="PAID">Paid / Settled</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>

            <button
              onClick={exportWithdrawalCsv}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs inline-flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200 shrink-0 shadow-2xs active:scale-95"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Payouts CSV</span>
            </button>
          </div>

          {/* Withdrawal Ledger Table */}
          {filteredWithdrawals.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <Banknote className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-800">No Withdrawal Requests Found</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {withdrawalSearch || withdrawalFilterStatus !== "all" 
                  ? "No withdrawal requests match your search filter."
                  : "You haven't requested any payouts yet. Once you have at least ₨ 100 PKR in your earned affiliate commission pool, you can submit a payout request anytime!"
                }
              </p>
              <button
                onClick={() => setIsWithdrawModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                <span>Request Payout Now</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-2xs bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-600 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Invoice Ref</th>
                    <th className="py-3 px-4">Gross Amount</th>
                    <th className="py-3 px-4">Fee (2%)</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Destination Account</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Invoice & Statement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWithdrawals.map((wd) => {
                    const fee = wd.feeAmountPkr || (wd.amountPkr * 0.02);
                    const net = wd.netPayoutPkr || (wd.amountPkr - fee);
                    const isPaid = wd.status === "PAID" || wd.status === "APPROVED";
                    const isPending = wd.status === "PENDING";
                    const isRejected = wd.status === "REJECTED";

                    return (
                      <tr key={wd.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200">
                            {wd.invoiceNumber || `ZX-WD-${wd.id.slice(-6)}`}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          ₨ {wd.amountPkr.toLocaleString()} PKR
                          <span className="text-[10px] text-slate-400 block font-normal font-sans">${wd.amountUsd?.toFixed(2)} USD</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-amber-600 font-bold">
                          - ₨ {fee.toFixed(2)}
                          <span className="text-[9px] text-slate-400 block font-normal font-sans">2.0%</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-black text-emerald-600 text-sm">
                          ₨ {net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PKR
                          <span className="text-[10px] text-slate-400 block font-normal font-sans">
                            ${(wd.netPayoutUsd || (wd.amountUsd * 0.98)).toFixed(2)} USD
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5">
                            <span className="uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-extrabold border border-slate-200">
                              {wd.payoutMethod}
                            </span>
                            <span>{wd.accountTitle}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                            {wd.accountNumber} {wd.bankName ? `(${wd.bankName})` : ''}
                          </div>
                          {wd.transactionRef && (
                            <div className="text-[10px] text-emerald-700 font-mono mt-0.5 flex items-center gap-1 font-bold">
                              <span>Ref: {wd.transactionRef}</span>
                            </div>
                          )}
                          {wd.adminNotes && (
                            <div className="text-[10px] text-slate-500 mt-0.5 italic">
                              Note: {wd.adminNotes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {isPaid && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200 whitespace-nowrap">
                              <CheckCircle className="w-3 h-3 text-emerald-600" />
                              Paid / Settled
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-extrabold text-[10px] border border-amber-200 whitespace-nowrap">
                              <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                              Under Review
                            </span>
                          )}
                          {isRejected && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-extrabold text-[10px] border border-rose-200 whitespace-nowrap">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Rejected (Refunded)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                          {new Date(wd.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenWithdrawalInvoice(wd)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 font-bold text-xs inline-flex items-center gap-1 transition border border-slate-200 cursor-pointer shadow-2xs whitespace-nowrap"
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-600" />
                            <span>View Invoice</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

        {/* TAB 2: INTERACTIVE EARNINGS CALCULATOR */}
        {activeTab === "calculator" && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white space-y-6 shadow-md border border-slate-800">
              <div>
                <h3 className="text-base font-black flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-400" />
                  Passive Income Projection Simulator
                </h3>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  Estimate how much recurring income you can generate by referring active customers.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Slider 1: Active Referrals */}
                <div className="space-y-3 bg-white/5 border border-white/10 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                      Active Friends / Clients
                    </label>
                    <span className="text-base font-black text-[#00AEEF] font-mono">
                      {calcReferees} users
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    step="1"
                    value={calcReferees}
                    onChange={(e) => setCalcReferees(Number(e.target.value))}
                    className="w-full accent-[#00AEEF] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>1 user</span>
                    <span>50 users (Diamond)</span>
                    <span>100 users</span>
                  </div>
                </div>

                {/* Slider 2: Average Monthly Deposit */}
                <div className="space-y-3 bg-white/5 border border-white/10 p-4 rounded-xl">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                      Avg Monthly Top-up per User
                    </label>
                    <span className="text-base font-black text-emerald-400 font-mono">
                      ₨ {calcAvgDepositPkr.toLocaleString()} PKR
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="50000"
                    step="500"
                    value={calcAvgDepositPkr}
                    onChange={(e) => setCalcAvgDepositPkr(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>₨ 500</span>
                    <span>₨ 25,000</span>
                    <span>₨ 50,000</span>
                  </div>
                </div>
              </div>

              {/* Simulation Results Bento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white/10 border border-white/10 rounded-xl p-4 text-center space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Monthly Network Volume</p>
                  <p className="text-xl font-black text-white font-mono">
                    ₨ {projections.totalVolumePkr.toLocaleString()} PKR
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">~${projections.totalVolumeUsd.toFixed(2)} USD</p>
                </div>

                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 text-center space-y-1 shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Est. Monthly Earnings ({userTier.ratePercent}%)</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono">
                    ₨ {Math.round(projections.monthlyEarningsPkr).toLocaleString()} PKR
                  </p>
                  <p className="text-[11px] text-emerald-300 font-bold font-mono">+${projections.monthlyEarningsUsd.toFixed(2)} USD / mo</p>
                </div>

                <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 text-center space-y-1 shadow-inner">
                  <p className="text-[10px] font-black uppercase tracking-widest text-purple-300">Est. Annual Earnings (12 Months)</p>
                  <p className="text-2xl font-black text-purple-300 font-mono">
                    ₨ {Math.round(projections.yearlyEarningsPkr).toLocaleString()} PKR
                  </p>
                  <p className="text-[11px] text-purple-200 font-bold font-mono">+${projections.yearlyEarningsUsd.toFixed(2)} USD / yr</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TOP AFFILIATES LEADERBOARD */}
        {activeTab === "leaderboard" && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                Community Top Affiliates Leaderboard
              </h3>
              <p className="text-xs text-slate-500">
                Recognizing our highest-performing partners across the Zerox Network.
              </p>
            </div>

            {leaderboard.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <Award className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Leaderboard standings updating in real-time...</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Rank</th>
                      <th className="py-3 px-4">Partner Handle</th>
                      <th className="py-3 px-4">VIP Tier</th>
                      <th className="py-3 px-4">Total Referees</th>
                      <th className="py-3 px-4">Total Generated Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((item, index) => (
                      <tr key={index} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-4 font-black">
                          {index === 0 ? "🥇 #1" : index === 1 ? "🥈 #2" : index === 2 ? "🥉 #3" : `#${index + 1}`}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          @{item.maskedUsername}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-extrabold text-[10px]">
                            {item.rankBadge}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          {item.referralCount} users
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                          ${(item.volumeUsd || 0).toFixed(2)} USD
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: INVITED NETWORK */}
        {activeTab === "referrals" && (
          <div className="space-y-4">
            {referredUsers.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
                <Users className="w-10 h-10 text-slate-400 mx-auto" />
                <h3 className="text-sm font-black text-slate-800">No Invited Friends Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  When users register using your referral link or code, they will be listed here.
                </p>
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-[#00AEEF] hover:bg-[#0096ce] text-white font-extrabold text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Referral Link</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {referredUsers.map((user) => (
                  <div key={user.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 hover:border-slate-300 transition shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl font-black flex items-center justify-center text-sm border border-indigo-200">
                        {user.username.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">@{user.username}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Joined {new Date(user.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-extrabold text-[10px] border border-emerald-200">
                      Active Partner
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PROGRAM TERMS & RULES */}
        {activeTab === "terms" && (
          <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
              <h3 className="text-sm font-black text-indigo-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                Zerox Network Affiliate Guarantee
              </h3>
              <p className="text-indigo-800 font-medium">
                Our referral program is fully automated, transparent, and perpetual. Every qualified referral deposit automatically generates real-time cash credits with zero withdrawal hold periods or hidden requirements.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2 shadow-xs">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-indigo-600">
                  1. Automatic Wallet Payouts
                </h4>
                <p className="text-slate-600 text-xs">
                  Commissions are credited directly into your wallet balance in real-time as soon as the referee's deposit via JazzCash, EasyPaisa, or Crypto is completed.
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2 shadow-xs">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-indigo-600">
                  2. No Earning Limits or Caps
                </h4>
                <p className="text-slate-600 text-xs">
                  There is no ceiling on how much you can earn. Whether you invite 5 friends or 5,000 customers, you receive recurring commissions on every deposit they make.
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2 shadow-xs">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-indigo-600">
                  3. Fair Use & Anti-Fraud Policy
                </h4>
                <p className="text-slate-600 text-xs">
                  Self-referrals (registering duplicate accounts under your own link) are strictly prohibited and detected automatically by system security formulas.
                </p>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-2 shadow-xs">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider text-indigo-600">
                  4. Instant Usability
                </h4>
                <p className="text-slate-600 text-xs">
                  Referral earnings can immediately be used to purchase virtual SMS numbers, SMM orders, and OTT accounts, or kept as balance.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* QR CODE & DIGITAL CARD MODAL */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setShowQrModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-6 text-center space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-[#00AEEF]" />
                  Your Affiliate QR Code
                </h3>
                <button onClick={() => setShowQrModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full transition cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-3">
                <div className="w-48 h-48 bg-white p-3 rounded-2xl border border-slate-300 shadow-sm flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(referralUrl)}`}
                    alt="Referral QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <p className="text-xs font-mono font-black text-slate-900 select-all">@{myRefCode}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Zerox Network Official Partner</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium">
                Scan with any mobile camera to instantly register with your referral code attached.
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 py-2.5 rounded-xl bg-[#00AEEF] hover:bg-[#0096ce] text-white font-extrabold text-xs transition cursor-pointer shadow-md shadow-[#00AEEF]/20 flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
                <a
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(referralUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  download={`zerox_referral_qr_${myRefCode}.png`}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>HQ Image</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MINIMAL & PROFESSIONAL WITHDRAWAL REQUEST MODAL */}
      <AnimatePresence>
        {isWithdrawModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" 
              onClick={() => !isSubmittingWithdraw && setIsWithdrawModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto z-10"
              id="affiliate-withdrawal-modal"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black tracking-tight text-white">
                        Affiliate Earnings Payout Request
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase tracking-wider">
                        Commission Only
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Minimum ₨ 100 PKR • 2.0% Processing Fee
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => !isSubmittingWithdraw && setIsWithdrawModalOpen(false)} 
                  className="p-1.5 text-slate-400 hover:text-white rounded-full transition cursor-pointer hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Content */}
              <form onSubmit={handleWithdrawSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                {/* Available Balances Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Card 1: Available Affiliate Commission (Withdrawable) */}
                  <div className="bg-white border-2 border-emerald-400 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-900 truncate">
                          Withdrawable Commission
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0 whitespace-nowrap">
                        Eligible
                      </span>
                    </div>

                    <div className="flex items-end justify-between gap-2 pt-1">
                      <div>
                        <span className="text-lg font-black text-emerald-700 font-mono block">
                          ₨ {availableAffiliateCommissionPkr.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-emerald-600 font-semibold font-mono">
                          ${availableAffiliateCommissionUsd.toFixed(2)} USD ready
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWithdrawAmountPkr(String(availableAffiliateCommissionPkr))}
                        disabled={availableAffiliateCommissionPkr < 100}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap active:scale-95"
                      >
                        Max Comm.
                      </button>
                    </div>
                  </div>

                  {/* Card 2: Main Account Balance (Locked for Services/Orders) */}
                  <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 flex flex-col justify-between shadow-xs">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Wallet className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 truncate">
                          Main Account Balance
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 shrink-0 whitespace-nowrap">
                        Services Only
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="text-lg font-black text-slate-700 font-mono block">
                        ₨ {Math.round((currentUser?.balance || 0) * cryptoRate).toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Non-withdrawable (Orders & Top-ups)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Strict Restriction Policy Notice */}
                <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-start gap-2 text-[11px] text-amber-900 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Affiliate Commission Restriction:</strong> You can only withdraw your earned affiliate/referral commissions. Main account wallet balances and top-up deposits cannot be withdrawn via this payout gateway.
                  </div>
                </div>

                {/* Low commission warning */}
                {availableAffiliateCommissionPkr < 100 && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-[11px] text-rose-700 font-semibold">
                    <Info className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>
                      You have ₨ {availableAffiliateCommissionPkr.toLocaleString()} in withdrawable commission. Minimum ₨ 100 PKR commission required.
                    </span>
                  </div>
                )}

                {/* Amount Input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Withdrawal Amount (PKR) <span className="text-rose-500">*</span></span>
                    <span className="text-[11px] text-slate-500 font-normal">Min: ₨ 100 • Max: ₨ {availableAffiliateCommissionPkr.toLocaleString()}</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">₨</span>
                    <input
                      type="number"
                      min="100"
                      max={availableAffiliateCommissionPkr}
                      step="1"
                      required
                      placeholder="e.g. 500"
                      value={withdrawAmountPkr}
                      onChange={(e) => setWithdrawAmountPkr(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-20 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      {withdrawAmountPkr && !isNaN(Number(withdrawAmountPkr))
                        ? `~${(Number(withdrawAmountPkr) / cryptoRate).toFixed(2)}`
                        : "PKR"}
                    </div>
                  </div>

                  {/* Preset Amount Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {[100, 500, 1000, 2500, 5000]
                      .filter(preset => preset <= Math.max(100, availableAffiliateCommissionPkr))
                      .map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setWithdrawAmountPkr(String(preset))}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                            Number(withdrawAmountPkr) === preset
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                          }`}
                        >
                          ₨ {preset.toLocaleString()}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Payout Method */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 block">
                    Payout Gateway / Channel <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      { id: "easypaisa", name: "EasyPaisa", icon: Smartphone },
                      { id: "jazzcash", name: "JazzCash", icon: CreditCard },
                      { id: "bank", name: "Bank Transfer", icon: Landmark },
                      { id: "nayapay", name: "NayaPay", icon: CreditCard },
                      { id: "sadapay", name: "SadaPay", icon: CreditCard },
                      { id: "crypto", name: "Crypto (USDT)", icon: Globe }
                    ].map((method) => {
                      const isSelected = withdrawMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setWithdrawMethod(method.id)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer ${
                            isSelected
                              ? "bg-emerald-50/80 border-emerald-500 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-500"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 font-semibold"
                          }`}
                        >
                          <method.icon className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                          <span className="text-xs truncate">{method.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
                      Account Title / Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Muhammad Ali"
                      value={withdrawAccountTitle}
                      onChange={(e) => setWithdrawAccountTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
                      {withdrawMethod === "crypto" ? "USDT Address (TRC20/BEP20)" : "Account No / IBAN / Mobile"} <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={withdrawMethod === "crypto" ? "T..." : "e.g. 03001234567 / PK36MEZN..."}
                      value={withdrawAccountNumber}
                      onChange={(e) => setWithdrawAccountNumber(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                {withdrawMethod === "bank" && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800">
                      Bank Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Meezan Bank, HBL, Allied Bank, MCB"
                      value={withdrawBankName}
                      onChange={(e) => setWithdrawBankName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">
                    Additional Instructions / Memo (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Branch code, WhatsApp confirmation number"
                    value={withdrawNotes}
                    onChange={(e) => setWithdrawNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Real-time Ledger Breakdown Box */}
                {withdrawAmountPkr && !isNaN(Number(withdrawAmountPkr)) && Number(withdrawAmountPkr) >= 100 && (
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>Gross Withdrawal Request:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        ₨ {Number(withdrawAmountPkr).toLocaleString()} PKR
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                      <span>2.0% Processing Fee:</span>
                      <span className="font-bold text-amber-600 font-mono">
                        - ₨ {(Number(withdrawAmountPkr) * 0.02).toFixed(2)} PKR
                      </span>
                    </div>
                    <div className="border-t border-emerald-200/80 pt-2 flex items-center justify-between text-xs">
                      <span className="font-black text-emerald-950">Net Dispatched to Your Account:</span>
                      <span className="font-black text-emerald-700 font-mono text-sm">
                        ₨ {(Number(withdrawAmountPkr) * 0.98).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PKR
                      </span>
                    </div>
                  </div>
                )}

                {/* Notice Text */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2 text-[11px] text-slate-600 leading-relaxed">
                  <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    Request is verified by Admin and disbursed directly into your specified account. An official printable invoice and statement record will be generated automatically.
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isSubmittingWithdraw}
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmittingWithdraw || !withdrawAmountPkr || Number(withdrawAmountPkr) < 100 || Number(withdrawAmountPkr) > availableAffiliateCommissionPkr || availableAffiliateCommissionPkr < 100}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-black text-xs transition shadow-md shadow-emerald-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    id="confirm-withdrawal-submit-btn"
                  >
                    {isSubmittingWithdraw ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Submitting Request...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Submit &amp; Generate Invoice</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. OFFICIAL INVOICE MODAL */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        data={selectedInvoiceData}
      />
    </div>
  );
}
