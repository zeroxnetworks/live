import { toast } from "react-hot-toast";
import React, { useState, useEffect } from "react";
import { 
  CreditCard, Wallet, Landmark, Copy, Check, ArrowUpRight, Clock, 
  CheckCircle2, XCircle, Info, Bitcoin, Sparkles, UploadCloud, ShieldCheck,
  Globe, QrCode, Zap, ChevronDown, RefreshCw, Filter, AlertCircle, Download,
  ArrowLeft, Search, AlertTriangle, Percent, ArrowRight, CheckCircle, X,
  DollarSign, Coins
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { DepositRequest, DepositInstruction, UserAccount, CryptoAddressItem } from "../types";
import { sanitizeInput, sanitizeUrl, isSafeUrl } from "../lib/security";
import { downloadWalletReceiptPdf } from "../lib/walletReceiptGenerator";
import CryptoDepositGateway from "./CryptoDepositGateway";
import { GatewayBrandIcon } from "./GatewayBrandIcon";

// USD conversion rate: 1 USD ≈ 275 PKR
const PKR_TO_USD_RATE = 275;

interface CashDepositProps {
  currentUser: UserAccount | null;
  instructions: DepositInstruction[];
  onAddDepositRequest: (request: Omit<DepositRequest, "id" | "userId" | "username" | "status" | "createdAt">) => Promise<string | void>;
  depositHistory: DepositRequest[];
  cryptoRate?: number;
  cryptoMinDeposit?: number;
  cryptoGatewaySettings?: any;
  localMinDeposit?: number;
  depositCoverUrl?: string;
  formatPrice: (baseUnits: number) => string;
}

export default function CashDeposit({
  currentUser,
  instructions,
  onAddDepositRequest,
  depositHistory,
  cryptoRate = 278,
  cryptoMinDeposit = 20,
  cryptoGatewaySettings,
  localMinDeposit = 100,
  depositCoverUrl,
  formatPrice
}: CashDepositProps) {
  const [selectedMethod, setSelectedMethod] = useState<"card" | "easypaisa" | "jazzcash" | "nayapay" | "bank" | "crypto" | "redotpay">("easypaisa");
  const [amount, setAmount] = useState("");
  const [txId, setTxId] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [proofImage, setProofImage] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(true);
  const [historySearch, setHistorySearch] = useState("");
  const [selectedSubAccountIdx, setSelectedSubAccountIdx] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'success' | 'failed' | 'pending' | 'already_used' | 'expired';
    message: string;
    amount?: number;
  } | null>(null);

  const [activeGatewayModal, setActiveGatewayModal] = useState<"card" | "easypaisa" | "jazzcash" | "nayapay" | "bank" | "crypto" | "redotpay" | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showQrModal) {
          setShowQrModal(false);
        } else if (activeGatewayModal) {
          setActiveGatewayModal(null);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showQrModal, activeGatewayModal]);

  // Lock background scrolling when full-screen gateway is active
  useEffect(() => {
    if (activeGatewayModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [activeGatewayModal]);

  // Auto-select first available valid method if current is hidden
  useEffect(() => {
    const isHidden = instructions.find(i => i.method === selectedMethod)?.isHidden;
    if (!selectedMethod || isHidden) {
      const visibleMethod = [
        "easypaisa", "jazzcash", "nayapay", "bank", "crypto", "redotpay"
      ].find(m => !instructions.find(i => i.method === m)?.isHidden);
      if (visibleMethod) {
        setSelectedMethod(visibleMethod as any);
      }
    }
  }, [instructions, selectedMethod]);

  const currentInstruction: DepositInstruction = instructions.find(inst => inst.method === selectedMethod) || {
    method: selectedMethod,
    accountTitle: selectedMethod === "redotpay" 
      ? "RedotPay" 
      : selectedMethod === "crypto" 
        ? "USDT / Crypto Wallet" 
        : "Not Configured",
    accountNumber: selectedMethod === "redotpay" ? "1397066551" : "Not Configured",
    instructions: selectedMethod === "redotpay" 
      ? "Transfer to RedotPay ID: 1397066551 or scan QR code. Instant confirmation." 
      : "Please make the deposit and submit transaction details below.",
    isActive: true,
    qrImageUrl: selectedMethod === "redotpay" ? "/redotpay_qr.svg" : undefined,
    gatewayLogoUrl: undefined
  };

  const activeSubAccounts = currentInstruction.subAccounts || [];
  const currentSubAccount = (activeSubAccounts.length > 0 && activeSubAccounts[selectedSubAccountIdx])
    ? activeSubAccounts[selectedSubAccountIdx]
    : {
        label: "Primary Account",
        title: currentInstruction.accountTitle,
        number: currentInstruction.accountNumber
      };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!", { id: "deposit-clipboard" });
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const processFile = (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      setError("Image size should be less than 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofImage(reader.result as string);
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        processFile(file);
      } else {
        setError("Please drop a valid image file");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setVerificationResult(null);

    if (!currentUser) {
      setError("Please log in first to make a cash deposit request.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid deposit amount.");
      return;
    }

    const isCryptoOrRedot = selectedMethod === "crypto" || selectedMethod === "redotpay";
    const amountNum = Number(amount) || 0;
    const minLimit = isCryptoOrRedot ? cryptoMinDeposit : localMinDeposit;
    const unitName = isCryptoOrRedot ? "USD/USDT" : "PKR";

    if (amountNum < minLimit) {
      setError(`Minimum deposit for ${selectedMethod.toUpperCase()} is ${minLimit} ${unitName}.`);
      return;
    }

    if (!txId.trim()) {
      setError("Please enter the unique Transaction ID (TxID).");
      return;
    }

    if (!senderName.trim()) {
      setError("Please enter the sender's full account name or username.");
      return;
    }

    if (proofImage && !isSafeUrl(proofImage)) {
      setError("The proof screenshot image URL contains an unsafe protocol or format.");
      return;
    }

    const amountInPKR = isCryptoOrRedot ? amountNum * cryptoRate : amountNum;
    setIsVerifying(true);
    setVerificationStep(0);

    const stepInterval = setInterval(() => {
      setVerificationStep(prev => Math.min(prev + 1, 3));
    }, 1000);

    const minAnimationWait = new Promise(resolve => setTimeout(resolve, 3500));

    let reqId: string | void;
    try {
      reqId = await onAddDepositRequest({
        method: selectedMethod,
        amount: amountInPKR,
        txId: sanitizeInput(txId.trim()),
        senderName: sanitizeInput(senderName.trim()),
        senderPhone: senderPhone.trim() ? sanitizeInput(senderPhone.trim()) : undefined,
        proofImageUrl: proofImage ? sanitizeUrl(proofImage) : undefined
      });

      // Trigger IMAP Poll
      await fetch("/api/imap/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      }).catch(() => {});

    } catch (err) {
      console.error("Deposit submission error", err);
    }

    await minAnimationWait;
    clearInterval(stepInterval);

    let finalStatus = "PENDING";
    let finalMessage = "Your deposit verification request has been logged successfully.";
    let resStatus: "success" | "failed" | "pending" | "already_used" | "expired" = "pending";

    if (reqId) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const dep = depositHistory.find(d => d.id === reqId);
        if (dep) {
          if (dep.status === "APPROVED") {
            resStatus = "success";
            finalMessage = "Deposit Confirmed & Credited";
          } else if (dep.status === "REJECTED" || dep.status === "FAILED") {
            resStatus = "failed";
            finalMessage = "Payment details could not be verified automatically.";
          } else if (dep.status === "ALREADY_PROCESSED" || (dep.adminNotes && dep.adminNotes.includes("ALREADY_PROCESSED"))) {
            resStatus = "already_used";
            finalMessage = "Transaction ID Already Used";
          } else if (dep.status === "EXPIRED") {
            resStatus = "expired";
            finalMessage = "Verification Request Expired";
          } else {
            resStatus = "pending";
            finalMessage = "Your deposit request has been submitted for instant verification.";
          }
        } else {
          const directFetch = await fetch(`/api/deposit/check-status?reqId=${reqId}`);
          if (directFetch.ok) {
            const data = await directFetch.json();
            if (data.status === "APPROVED") {
              resStatus = "success";
              finalMessage = "Deposit Confirmed & Credited";
            } else if (data.status === "REJECTED" || data.status === "FAILED") {
              resStatus = "failed";
              finalMessage = "Payment details could not be verified automatically.";
            } else if (data.status === "ALREADY_PROCESSED" || data.adminNotes?.includes("ALREADY_PROCESSED")) {
              resStatus = "already_used";
              finalMessage = "Transaction ID Already Used";
            }
          }
        }
      } catch (e) {}
    }

    setVerificationResult({
      status: resStatus,
      message: finalMessage,
      amount: amountInPKR
    });
    
    setIsVerifying(false);

    if (resStatus === "success" || resStatus === "pending") {
      setAmount("");
      setTxId("");
      setSenderName("");
      setSenderPhone("");
      setProofImage("");
    }
  };

  // Filter history to current user
  const rawUserHistory = currentUser 
    ? depositHistory.filter(req => req.userId === currentUser.id)
    : [];

  const filteredByUserAndSearch = rawUserHistory.filter(req => {
    if (!historySearch.trim()) return true;
    const query = historySearch.toLowerCase();
    return (
      req.txId.toLowerCase().includes(query) ||
      req.method.toLowerCase().includes(query) ||
      req.senderName.toLowerCase().includes(query)
    );
  });

  const userHistory = statusFilter === "ALL" 
    ? filteredByUserAndSearch 
    : filteredByUserAndSearch.filter(req => req.status === statusFilter);

  const pendingCount = rawUserHistory.filter(req => req.status === "PENDING" || req.status === "MANUAL_REVIEW").length;

  const isCryptoOrRedot = selectedMethod === "crypto" || selectedMethod === "redotpay";
  const feePercent = isCryptoOrRedot ? 0.5 : 2.0;
  const amountNum = Number(amount) || 0;
  const amountInPKR = isCryptoOrRedot ? amountNum * cryptoRate : amountNum;
  const feeAmountPKR = Number((amountInPKR * (feePercent / 100)).toFixed(2));
  const netAmountInPKR = Number(Math.max(0, amountInPKR - feeAmountPKR).toFixed(2));
  const usdEquivalent = isCryptoOrRedot ? amountNum.toFixed(2) : (amountInPKR / PKR_TO_USD_RATE).toFixed(2);
  const netUsdEquivalent = (netAmountInPKR / (cryptoRate || 278)).toFixed(2);

  const availableGateways = [
    { id: "easypaisa" as const, name: "Easypaisa", shortName: "Easypaisa", tag: "2.0% Fee", color: "text-emerald-500", bgActive: "bg-emerald-50 border-emerald-400" },
    { id: "jazzcash" as const, name: "JazzCash", shortName: "JazzCash", tag: "2.0% Fee", color: "text-rose-500", bgActive: "bg-rose-50 border-rose-400" },
    { id: "nayapay" as const, name: "Naya Pay", shortName: "Naya Pay", tag: "2.0% Fee", color: "text-sky-500", bgActive: "bg-sky-50 border-sky-400" },
    { id: "bank" as const, name: "Bank Transfer", shortName: "Bank", tag: "2.0% Fee", color: "text-blue-600", icon: Landmark, bgActive: "bg-blue-50 border-blue-400" },
    { id: "crypto" as const, name: "Crypto (USDT)", shortName: "Crypto", tag: "0.5% Fee", color: "text-amber-500", icon: Bitcoin, bgActive: "bg-amber-50 border-amber-400" },
    { id: "redotpay" as const, name: "RedotPay", shortName: "RedotPay", tag: "0.5% Fee", color: "text-red-500", icon: Globe, bgActive: "bg-red-50 border-red-400" }
  ].filter(method => {
    if (method.id === "crypto") {
      const status = cryptoGatewaySettings?.gatewayStatus || "enabled";
      return status === "enabled" || status === "maintenance";
    }
    const inst = instructions.find(i => i.method === method.id);
    return !inst?.isHidden;
  });

  if (!currentUser) {
    return (
      <div id="locked-deposit-center" className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-8 sm:p-10 text-center shadow-md max-w-lg mx-auto my-12">
        <div className="w-14 h-14 bg-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center mx-auto text-[#00AEEF] mb-4">
          <Wallet className="h-7 w-7" />
        </div>
        <h3 className="text-base font-black text-white uppercase tracking-wider font-sans">
          Wallet Deposit Center
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          Please log in or register a user account to access instant Easypaisa, JazzCash, NayaPay, Bank Transfer, and Crypto wallet deposit services.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sleek Minimalist Section Header - Professional & Streamlined */}
      <div 
        id="select-payment-gateway-section" 
        className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-sm transition-all duration-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Header Title + Badges + Professional Description */}
          <div className="flex items-start sm:items-center gap-3.5 min-w-0">
            <div className="p-2.5 rounded-xl bg-[#00AEEF]/10 text-[#00AEEF] border border-[#00AEEF]/20 shrink-0">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight font-sans">
                  Deposit Funds
                </h2>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                Select an official payment gateway below to top up your account with instant verification.
              </p>
            </div>
          </div>

          {/* Pending Status Badge (Only shown if deposits are currently pending) */}
          {pendingCount > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/30 px-3 py-2 rounded-xl flex items-center gap-2 text-amber-300 text-xs font-bold font-mono shrink-0 self-start sm:self-auto">
              <Clock className="w-4 h-4 text-amber-400 animate-pulse shrink-0" />
              <span>{pendingCount} Deposit{pendingCount > 1 ? "s" : ""} Under Review</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Deposit Card - Gateway Selection Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-5 text-slate-800">
        
        {/* Step 1: Select Payment Gateway */}
        <div className="space-y-3">
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2.5 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/70 font-bold text-xs flex items-center justify-center shadow-2xs shrink-0">
                <Wallet className="w-4 h-4" />
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight font-sans">
                Select Payment Gateway
              </h3>
            </div>
            
            {/* Minimal Fee Tag */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200/80 text-[11px] sm:text-xs whitespace-nowrap shadow-2xs">
                Local: <strong className="font-extrabold text-slate-900">2.0% Fee</strong>
              </span>
              <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200/80 text-[11px] sm:text-xs whitespace-nowrap shadow-2xs">
                Crypto: <strong className="font-extrabold text-slate-900">0.5% Fee</strong>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Choose your preferred deposit channel to open the instant verification gateway:
          </p>

          {/* Gateway Selector Grid - Opens Full Screen on Click */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
            {availableGateways.map((method) => {
              const inst = instructions.find(i => i.method === method.id);
              const customLogo = inst?.gatewayLogoUrl;
              const isCrypto = method.id === "crypto" || method.id === "redotpay";
              const fee = isCrypto ? "0.5% Fee" : "2.0% Fee";
              const minLimit = isCrypto ? `$${cryptoMinDeposit} USD` : `₨ ${localMinDeposit} PKR`;

              return (
                <button
                  key={method.id}
                  type="button"
                  id={`gateway-card-${method.id}`}
                  onClick={() => {
                    setSelectedMethod(method.id);
                    setSelectedSubAccountIdx(0);
                    setError("");
                    setSuccess("");
                    setVerificationResult(null);
                    setActiveGatewayModal(method.id);
                  }}
                  className="group text-left p-4 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-blue-50/40 hover:border-[#00AEEF]/60 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2.5">
                      <GatewayBrandIcon 
                        methodId={method.id} 
                        logoUrl={customLogo} 
                        className="w-10 h-10 group-hover:scale-105 transition-transform" 
                        iconClassName="w-6 h-6" 
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 block group-hover:text-[#00AEEF] transition-colors">
                          {method.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          {method.tag}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md">
                      {fee}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                    <span className="text-[10px] font-mono text-slate-500">
                      Min: <span className="font-bold text-slate-700">{minLimit}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#00AEEF] group-hover:translate-x-0.5 transition-transform">
                      Deposit Now <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full-Screen Dedicated Payment Gateway View */}
      <AnimatePresence>
        {activeGatewayModal && (
          <div 
            id="fullscreen-gateway-page"
            className="fixed inset-0 z-[200] bg-[#070b14] w-full h-full min-h-screen overflow-y-auto flex flex-col"
          >
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="w-full min-h-screen flex-1 flex flex-col bg-[#070b14] text-slate-100"
            >
              {/* Full-Width Sticky Top Navigation Bar */}
              <header className="sticky top-0 z-40 bg-[#0c1322]/95 backdrop-blur-md text-white px-4 sm:px-6 md:px-10 py-3.5 sm:py-4 flex items-center justify-between gap-3 border-b border-slate-800 shadow-md">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <button
                    type="button"
                    onClick={() => setActiveGatewayModal(null)}
                    className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all duration-150 text-xs sm:text-sm font-bold cursor-pointer active:scale-95 shrink-0 shadow-xs"
                    title="Back to Wallet"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Wallet</span>
                  </button>

                  <div className="flex items-center gap-2.5 min-w-0">
                    {(() => {
                      const activeInst = instructions.find(i => i.method === activeGatewayModal);
                      return (
                        <GatewayBrandIcon 
                          methodId={activeGatewayModal || "wallet"} 
                          logoUrl={activeInst?.gatewayLogoUrl} 
                          className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" 
                          iconClassName="w-5 h-5" 
                        />
                      );
                    })()}
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base md:text-lg font-bold text-white truncate tracking-tight">
                          {availableGateways.find(g => g.id === activeGatewayModal)?.name || "Payment Channel"}
                        </h2>
                        <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-950/70 text-emerald-400 border border-emerald-500/30 font-mono">
                          <ShieldCheck className="w-3 h-3" />
                          Verified Channel
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono hidden xs:block">
                        Instant Auto-Verification &amp; Ledger Crediting
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-medium shadow-inner">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="hidden sm:inline">Official 256-bit Secure Gateway</span>
                    <span className="sm:hidden">256-bit Secure</span>
                  </div>
                </div>
              </header>

              {/* Gateway Page Body - Full-Screen Viewport container */}
              <div className="flex-1 w-full max-w-6xl mx-auto px-3.5 sm:px-6 md:px-8 py-5 sm:py-7 space-y-6 pb-28 text-slate-100">

                {/* Crypto Gateway View */}
                {selectedMethod === "crypto" ? (
                  cryptoGatewaySettings?.gatewayStatus === "maintenance" ? (
                    <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl sm:rounded-3xl p-8 text-center space-y-3">
                      <Bitcoin className="w-12 h-12 text-amber-400 mx-auto" />
                      <h4 className="text-amber-200 font-bold text-base">Crypto Gateway Under Scheduled Maintenance</h4>
                      <p className="text-amber-300/80 text-xs max-w-md mx-auto leading-relaxed">
                        Please utilize Easypaisa, JazzCash, NayaPay, or Bank Transfer while cryptocurrency node maintenance completes.
                      </p>
                    </div>
                  ) : (
                    <CryptoDepositGateway 
                      depositHistory={depositHistory}
                      currentUser={currentUser}
                      cryptoRate={cryptoRate}
                      cryptoMinDeposit={cryptoMinDeposit}
                      formatPrice={formatPrice}
                      onDepositCompleted={() => {
                        toast.success("Deposit processed!");
                      }}
                    />
                  )
                ) : !currentInstruction.isActive ? (
                  <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl sm:rounded-3xl p-6 flex items-start gap-3.5 text-amber-200 text-xs">
                    <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-sm block text-amber-100">Gateway Temporarily Offline</span>
                      <span className="text-amber-300/80 mt-1 block">
                        This payment method is currently undergoing routine reconciliation. Please select an alternative gateway from the switcher bar above.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
                    
                    {/* Step 1: Official Transfer Slip & Destination (Left Column) */}
                    <div className="lg:col-span-5 bg-gradient-to-b from-slate-900/95 to-slate-950 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
                      {/* Step Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#00AEEF]/20 text-[#00AEEF] border border-[#00AEEF]/40 font-bold text-xs flex items-center justify-center font-mono">
                            1
                          </span>
                          <div>
                            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-sans">
                              Transfer Destination
                            </h3>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Send funds to the account below</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1 shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Verified
                        </span>
                      </div>

                      {/* Sub-Accounts Switcher if multiple accounts exist */}
                      {activeSubAccounts.length > 1 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                            Select Destination Account:
                          </span>
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {activeSubAccounts.map((acc, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedSubAccountIdx(idx)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border whitespace-nowrap ${
                                  selectedSubAccountIdx === idx
                                    ? "bg-[#00AEEF] border-[#00AEEF] text-slate-950 shadow-xs"
                                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white"
                                }`}
                              >
                                {acc.label || `Account ${idx + 1}`}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Official Digital Bank Card / Slip */}
                      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 shadow-inner">
                        {/* Gateway Brand Header inside Card */}
                        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                          <div className="flex items-center gap-2.5">
                            <GatewayBrandIcon 
                              methodId={selectedMethod} 
                              logoUrl={currentInstruction.gatewayLogoUrl} 
                              className="w-8 h-8 rounded-lg" 
                              iconClassName="w-4 h-4" 
                            />
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Gateway Network
                              </span>
                              <span className="text-xs sm:text-sm font-black text-white">
                                {currentInstruction.subtitle || selectedMethod.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          {(currentInstruction.qrImageUrl || selectedMethod === "redotpay") && (
                            <button
                              type="button"
                              onClick={() => setShowQrModal(true)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                            >
                              <QrCode className="w-3.5 h-3.5 text-[#00AEEF]" />
                              <span>Show QR</span>
                            </button>
                          )}
                        </div>

                        {/* Account Number / IBAN with Instant Copy */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                            {selectedMethod === "redotpay" ? "RedotPay ID" : "Account Number / IBAN"}
                          </span>
                          
                          <div className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 sm:p-3 transition-colors">
                            <span className="text-sm sm:text-base font-mono font-black text-[#00AEEF] tracking-wide select-all truncate">
                              {currentSubAccount.number || currentInstruction.accountNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(currentSubAccount.number || currentInstruction.accountNumber, "number")}
                              className={`w-8 h-8 rounded-lg transition-all duration-150 flex items-center justify-center cursor-pointer shrink-0 border ${
                                copiedField === "number"
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                  : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700 active:scale-95"
                              }`}
                              title="Copy Account Number"
                              aria-label="Copy Account Number"
                            >
                              {copiedField === "number" ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Account Title with Instant Copy */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                            Account Title / Beneficiary
                          </span>
                          <div className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 sm:p-3 transition-colors">
                            <span className="text-xs sm:text-sm font-bold text-white truncate select-all">
                              {currentSubAccount.title || currentInstruction.accountTitle || "ZeroX Official"}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(currentSubAccount.title || currentInstruction.accountTitle, "title")}
                              className={`w-8 h-8 rounded-lg transition-all duration-150 flex items-center justify-center cursor-pointer shrink-0 border ${
                                copiedField === "title"
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                  : "bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700 active:scale-95"
                              }`}
                              title="Copy Account Title"
                              aria-label="Copy Account Title"
                            >
                              {copiedField === "title" ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Instructions / How-It-Works Steps */}
                      <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 space-y-2.5 text-xs text-slate-300">
                        <div className="flex items-center gap-2 text-white font-bold text-xs">
                          <Info className="w-4 h-4 text-[#00AEEF] shrink-0" />
                          <span>Quick Transfer Guide:</span>
                        </div>
                        <ul className="space-y-1.5 text-[11px] text-slate-400 list-disc list-inside leading-relaxed">
                          <li>Open your <strong className="text-slate-200 font-semibold">{currentInstruction.subtitle || selectedMethod.toUpperCase()}</strong> app or internet banking.</li>
                          <li>Send the desired funds to the official account details above.</li>
                          <li>Note down the <strong className="text-slate-200 font-semibold">Transaction ID (TID)</strong> from your SMS receipt.</li>
                          <li>Submit the verification form on the right to receive immediate balance credit.</li>
                        </ul>
                      </div>
                    </div>

                    {/* Step 2: Verification Submission Form (Right Column) */}
                    <div className="lg:col-span-7 bg-gradient-to-b from-slate-900/95 to-slate-950 border border-slate-800/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
                      {/* Step Header */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#00AEEF]/20 text-[#00AEEF] border border-[#00AEEF]/40 font-bold text-xs flex items-center justify-center font-mono">
                            2
                          </span>
                          <div>
                            <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider font-sans">
                              Submit Verification Details
                            </h3>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Automated instant ledger crediting</p>
                          </div>
                        </div>
                      </div>

                      {/* Verification Result Notification if any */}
                      {verificationResult && (
                        <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          verificationResult.status === "success" 
                            ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-200"
                            : verificationResult.status === "failed"
                              ? "bg-rose-950/60 border-rose-500/40 text-rose-200"
                              : verificationResult.status === "already_used"
                                ? "bg-amber-950/60 border-amber-500/40 text-amber-200"
                                : "bg-blue-950/60 border-blue-500/40 text-blue-200"
                        }`}>
                          <div className="flex items-center gap-3">
                            {verificationResult.status === "success" && <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />}
                            {verificationResult.status === "failed" && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
                            {verificationResult.status === "already_used" && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
                            {verificationResult.status === "pending" && <Clock className="w-5 h-5 text-blue-400 shrink-0" />}
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider">{verificationResult.message}</h4>
                              <p className="text-[11px] opacity-80 mt-0.5">
                                {verificationResult.status === "success" 
                                  ? `PKR ${verificationResult.amount?.toLocaleString()} has been credited to your wallet balance.`
                                  : "You can track live verification in your Deposit History."}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setVerificationResult(null)}
                            className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl transition shrink-0 cursor-pointer"
                          >
                            Submit Another
                          </button>
                        </div>
                      )}

                      {/* Quick Amount Suggestion Chips */}
                      {!isCryptoOrRedot && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono block">
                            Quick Amount Select (PKR):
                          </span>
                          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            {[500, 1000, 2500, 5000, 10000].map((quickVal) => (
                              <button
                                key={quickVal}
                                type="button"
                                onClick={() => setAmount(String(quickVal))}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition cursor-pointer border shrink-0 ${
                                  amount === String(quickVal)
                                    ? "bg-[#00AEEF] text-slate-950 border-[#00AEEF] shadow-sm font-black"
                                    : "bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300"
                                }`}
                              >
                                +₨ {quickVal.toLocaleString()}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Verification Form */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Amount Input */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                              {isCryptoOrRedot ? "Amount Sent (USD / USDT)" : "Amount Sent (PKR)"}
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min="1"
                                placeholder={isCryptoOrRedot ? "e.g. 10" : "e.g. 1000"}
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none transition-all placeholder:text-slate-600"
                                required
                              />
                              {amountNum > 0 && (
                                <span className="absolute right-3 top-2.5 text-[10px] font-bold text-emerald-400 font-mono">
                                  {isCryptoOrRedot ? `≈ ${formatPrice(amountInPKR / (cryptoRate || 278))}` : `≈ $${usdEquivalent} USD`}
                                </span>
                              )}
                            </div>
                            <span className="text-[9.5px] text-slate-500 block font-mono">
                              {isCryptoOrRedot 
                                ? `Rate: 1 USD ≈ ${cryptoRate} PKR | Min: ${cryptoMinDeposit} USD` 
                                : `Rate: 1 USD ≈ ${PKR_TO_USD_RATE} PKR | Min: ${localMinDeposit} PKR`}
                            </span>
                          </div>

                          {/* Transaction ID */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                              Transaction ID / Reference (TID)
                            </label>
                            <input
                              type="text"
                              placeholder={selectedMethod === "redotpay" ? "e.g. RedotPay Order ID" : "e.g. 84931057391"}
                              value={txId}
                              onChange={(e) => setTxId(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono font-bold focus:outline-none transition-all placeholder:text-slate-600"
                              required
                            />
                            <span className="text-[9.5px] text-slate-500 block font-mono">
                              11 or 12-digit reference number from your SMS/app receipt
                            </span>
                          </div>
                        </div>

                        {/* Dynamic Fee & Net Credit Breakdown */}
                        {amountNum > 0 && (
                          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5 shadow-inner">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                              <span className="flex items-center gap-1.5 text-[#00AEEF]">
                                <Sparkles className="w-3.5 h-3.5" />
                                Deposit Fee Breakdown
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {feePercent}% {isCryptoOrRedot ? "Crypto" : "Local"} Gateway Fee
                              </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-[9.5px] text-slate-400 font-bold block uppercase font-mono">Gross Amount</span>
                                <span className="font-extrabold text-white font-mono text-xs block mt-1">
                                  {isCryptoOrRedot ? `$${amountNum.toFixed(2)}` : `₨ ${amountNum.toLocaleString()}`}
                                </span>
                              </div>

                              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                                <span className="text-[9.5px] text-amber-400 font-bold block uppercase font-mono">Fee ({feePercent}%)</span>
                                <span className="font-extrabold text-amber-400 font-mono text-xs block mt-1">
                                  {isCryptoOrRedot ? `-$${(amountNum * (feePercent / 100)).toFixed(2)}` : `-₨ ${feeAmountPKR.toFixed(2)}`}
                                </span>
                              </div>

                              <div className="bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30">
                                <span className="text-[9.5px] text-emerald-400 font-bold block uppercase font-mono">Net Credited</span>
                                <span className="font-extrabold text-emerald-400 font-mono text-xs block mt-1">
                                  {formatPrice(netAmountInPKR / (cryptoRate || 278))}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {/* Sender Account Name */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                              Sender Account Title
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Muhammad Ali"
                              value={senderName}
                              onChange={(e) => setSenderName(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:outline-none transition-all placeholder:text-slate-600"
                              required
                            />
                          </div>

                          {/* Sender Phone */}
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                              Sender Phone No. (Optional)
                            </label>
                            <input
                              type="tel"
                              placeholder="e.g. 03001234567"
                              value={senderPhone}
                              onChange={(e) => setSenderPhone(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 focus:border-[#00AEEF] focus:ring-2 focus:ring-[#00AEEF]/20 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none transition-all placeholder:text-slate-600"
                            />
                          </div>
                        </div>

                        {/* Payment Proof Drag & Drop */}
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                            Payment Receipt Screenshot (Recommended)
                          </label>
                          
                          <div 
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-2xl p-4 transition-colors duration-200 flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                              isDragging 
                                ? "border-[#00AEEF] bg-[#00AEEF]/10" 
                                : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
                            }`}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              id="proof-image-file"
                              onChange={handleImageUpload}
                              className="absolute inset-0 opacity-0 cursor-pointer z-10"
                            />
                            
                            {proofImage ? (
                              <div className="flex items-center gap-3 z-20">
                                <img 
                                  src={proofImage} 
                                  alt="Proof preview" 
                                  className="h-12 w-12 object-cover rounded-xl border border-slate-700 shadow-sm" 
                                />
                                <div className="text-left">
                                  <p className="text-xs text-white font-bold">Screenshot Attached</p>
                                  <p className="text-[10px] text-emerald-400 font-mono">Ready for verification</p>
                                  <button 
                                    type="button" 
                                    onClick={() => setProofImage("")}
                                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline mt-0.5 cursor-pointer"
                                  >
                                    Remove Attachment
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-1">
                                <UploadCloud className="h-6 w-6 text-slate-500 mx-auto mb-1" />
                                <p className="text-xs text-slate-300 font-semibold">
                                  Drag &amp; drop receipt or <span className="text-[#00AEEF] underline">browse file</span>
                                </p>
                                <p className="text-[9.5px] text-slate-500 font-mono mt-0.5">
                                  Supports JPG, PNG (Max 2MB)
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Error Notification */}
                        {error && (
                          <div className="text-xs text-rose-300 font-semibold bg-rose-950/50 p-3.5 rounded-xl border border-rose-500/40 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                            <span>{error}</span>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={isVerifying}
                          className="w-full bg-[#00AEEF] hover:bg-[#0096ce] text-slate-950 font-black py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-98 disabled:opacity-50 mt-2"
                        >
                          <Zap className="h-4 w-4 fill-slate-950" />
                          <span>{isVerifying ? "Verifying Transaction..." : "Verify & Credit Deposit"}</span>
                          <ArrowRight className="h-4 w-4 stroke-[3]" />
                        </button>

                        <div className="text-center text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1.5 mt-2">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Bank-grade 256-bit encryption • Instant automated balance issuance</span>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verifying Modal State */}
      <AnimatePresence>
        {isVerifying && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 text-[#00AEEF] flex items-center justify-center mx-auto animate-pulse">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Verifying Deposit</h3>
                <p className="text-xs text-slate-400 mt-1">Connecting to banking ledger node...</p>
              </div>

              <div className="space-y-2 text-left bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs font-mono">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>1. Logging TxID sequence</span>
                </div>
                <div className={`flex items-center gap-2 ${verificationStep >= 1 ? "text-emerald-400" : "text-slate-500"}`}>
                  {verificationStep >= 1 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>2. Matching sender ledger account</span>
                </div>
                <div className={`flex items-center gap-2 ${verificationStep >= 2 ? "text-emerald-400" : "text-slate-500"}`}>
                  {verificationStep >= 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                  <span>3. Finalizing wallet balance issuance</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Deposit History & Status Card - Matched to OrdersHistory in Virtual Number Tab */}
      <div id="deposit-history-card" className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-4 sm:p-5 shadow-md space-y-4 transition-all duration-300">
        
        {/* Header section with Minimize / Expand */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-3.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[#00AEEF]">
              <Clock className="h-4 w-4" />
            </span>
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-sans">
              Deposit History &amp; Status
            </h3>
            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700/80 rounded-md text-[9px] font-black font-mono">
              {rawUserHistory.length} ARCHIVED
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTrackingOpen(!isTrackingOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all text-xs font-semibold cursor-pointer"
              title={isTrackingOpen ? "Minimize section" : "Expand section"}
            >
              <span className="text-[11px] text-slate-300">
                {isTrackingOpen ? "Minimize" : "Expand"}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isTrackingOpen ? "" : "-rotate-90"}`} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isTrackingOpen && (
          <div className="space-y-3">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              {/* Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-xl text-[10px] font-bold transition whitespace-nowrap cursor-pointer border ${
                      statusFilter === st
                        ? "bg-[#00AEEF] text-slate-950 border-[#00AEEF] font-black shadow-xs"
                        : "bg-slate-800/80 text-slate-400 border-slate-700/80 hover:text-white"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search TxID or method..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#00AEEF]"
                />
              </div>
            </div>

            {/* History Records List */}
            <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1 custom-scrollbar">
              {userHistory.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">No Transactions Found</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Your submitted deposit requests will appear here.</p>
                </div>
              ) : (
                userHistory.map((req) => (
                  <div 
                    key={req.id} 
                    className="p-3.5 border border-slate-800 rounded-xl bg-slate-950/60 flex flex-col gap-2.5 transition-all hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                          {req.method}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(req.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                          req.status === "PENDING" || req.status === "MANUAL_REVIEW"
                            ? "bg-amber-950/40 text-amber-400 border-amber-500/30" 
                            : req.status === "APPROVED" 
                              ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30" 
                              : "bg-rose-950/40 text-rose-400 border-rose-500/30"
                        }`}>
                          {(req.status === "PENDING" || req.status === "MANUAL_REVIEW") && <Clock className="h-3 w-3 text-amber-400 animate-pulse" />}
                          {req.status === "APPROVED" && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                          {(req.status === "REJECTED" || req.status === "VERIFICATION_FAILED" || req.status === "ALREADY_USED") && <XCircle className="h-3 w-3 text-rose-400" />}
                          <span>{req.status === "VERIFICATION_FAILED" ? "FAILED" : req.status === "ALREADY_USED" ? "DUPLICATE" : req.status === "MANUAL_REVIEW" ? "REVIEWING" : req.status}</span>
                        </span>

                        {req.status === "APPROVED" && (
                          <button
                            type="button"
                            onClick={() => {
                              toast.promise(downloadWalletReceiptPdf(req, currentUser), {
                                loading: "Generating receipt...",
                                success: "Receipt downloaded!",
                                error: "Failed to generate receipt"
                              });
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                            title="Download PDF Receipt"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block">Amount</span>
                        <span className="font-bold text-white font-mono text-sm block">PKR {req.amount.toLocaleString()}</span>
                        <span className="text-[9.5px] font-mono text-[#00AEEF]">≈ ${(req.amount / PKR_TO_USD_RATE).toFixed(2)} USD</span>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-slate-500 font-mono text-[9px] uppercase tracking-wider block">TxID / Reference</span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="font-mono text-slate-300 text-xs truncate max-w-full select-all font-semibold">
                            {req.txId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(req.txId, `tx_${req.id}`)}
                            className="p-1 text-slate-400 hover:text-white rounded transition cursor-pointer"
                          >
                            {copiedField === `tx_${req.id}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <span className="text-[9.5px] text-slate-400 block mt-0.5">Sender: {req.senderName}</span>
                      </div>
                    </div>

                    {req.adminNotes && (
                      <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800 text-[10px] text-slate-300">
                        <span className="font-bold text-slate-400 block uppercase text-[8px] mb-0.5">Remark:</span>
                        {req.adminNotes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Security Assurance footer note */}
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/80">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00AEEF]" />
              <span>All balance transactions are double-verified under cryptographically secure ledger records.</span>
            </div>
          </div>
        )}
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xs w-full space-y-4 shadow-xl relative text-white"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-[#00AEEF]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    {currentInstruction.accountTitle || `${selectedMethod.toUpperCase()} QR`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQrModal(false)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-white p-3 rounded-xl flex flex-col items-center justify-center">
                <img 
                  src={currentInstruction.qrImageUrl || "/redotpay_qr.svg"} 
                  alt={`${selectedMethod} QR Code`} 
                  className="w-48 h-48 object-contain"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Account / ID</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 truncate block select-all">
                    {currentSubAccount.number || currentInstruction.accountNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(currentSubAccount.number || currentInstruction.accountNumber, "qr_modal_acc")}
                  className={`w-8 h-8 rounded-lg transition-all duration-150 flex items-center justify-center shrink-0 border cursor-pointer ${
                    copiedField === "qr_modal_acc"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                      : "bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700 active:scale-95"
                  }`}
                  title="Copy Account Number"
                  aria-label="Copy Account Number"
                >
                  {copiedField === "qr_modal_acc" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition"
              >
                Close QR Code
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
