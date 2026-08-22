import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, Clock, Copy, Check, AlertTriangle, ArrowLeft,
  XCircle, CheckCircle2, Ban, RefreshCw, MessageSquare, Info,
  Smartphone, FileText, ChevronRight, ChevronLeft, HelpCircle,
  Sparkles, X, ShieldAlert, Zap, Layers, CheckSquare, Square,
  Radio, Wifi, AlertCircle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ActivationOrder, UserAccount } from "../types";
import { getServiceConfig, DynamicServiceIcon } from "../utils/serviceIcons";
import { useOrderTimer } from "../hooks/useOrderTimer";
import { parsePhoneNumber, getCountryDetails } from "../utils/phoneUtils";
import InvoiceModal from "./InvoiceModal";
import { InvoiceData } from "../lib/invoiceGenerator";

interface OrderDetailPageProps {
  order: ActivationOrder;
  currentUser: UserAccount | null;
  cryptoRate?: number;
  formatPrice: (baseUnits: number) => string;
  onBack: () => void;
  onCancel: (id: number) => void;
  onFinish: (id: number) => void;
  onBan: (id: number) => void;
  onBuyAgain?: (country: string, product: string) => void;
}

export default function OrderDetailPage({
  order,
  currentUser,
  cryptoRate = 278,
  formatPrice,
  onBack,
  onCancel,
  onFinish,
  onBan,
  onBuyAgain
}: OrderDetailPageProps) {
  const [currentOrder, setCurrentOrder] = useState<ActivationOrder>(order);
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedLocal, setCopiedLocal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [agreeCancelTerms, setAgreeCancelTerms] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [isBanning, setIsBanning] = useState(false);
  
  // Provider Live Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [providerSyncStatus, setProviderSyncStatus] = useState<"LIVE" | "SYNCING" | "ERROR">("LIVE");
  const [providerErrorMsg, setProviderErrorMsg] = useState<string | null>(null);

  // Carousels state
  const [helpSlide, setHelpSlide] = useState(0);
  const [feeSlide, setFeeSlide] = useState(0);
  
  // Invoice state
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);

  // Keep currentOrder updated when props change
  useEffect(() => {
    setCurrentOrder(prev => {
      // If prop has more sms or updated status, merge them
      const prevSmsLen = prev.sms?.length || 0;
      const newSmsLen = order.sms?.length || 0;
      if (newSmsLen >= prevSmsLen || order.status !== prev.status || order.expires !== prev.expires) {
        return { ...prev, ...order };
      }
      return prev;
    });
  }, [order]);

  // Dynamic Service and Country Config
  const serviceKey = currentOrder.product || currentOrder.service || "";
  const serviceConfig = getServiceConfig(serviceKey);
  const countryDetails = getCountryDetails(currentOrder.country);
  const parsedPhone = parsePhoneNumber(currentOrder.phone, currentOrder.country);

  // Synchronized Provider Timer based on authoritative provider expiry
  const timer = useOrderTimer(currentOrder.expires, currentOrder.status);
  const hasSms = Boolean(currentOrder.sms && currentOrder.sms.length > 0);
  const latestSms = hasSms ? currentOrder.sms![currentOrder.sms!.length - 1] : null;
  
  // Confirmed OTP code detection - strictly requires verified code or text
  const hasOtp = Boolean(
    latestSms && (
      (latestSms.code && String(latestSms.code).trim().length > 0) ||
      (latestSms.text && String(latestSms.text).trim().length > 0)
    )
  );

  // Direct Provider Verification Function
  const verifyWithProvider = async (isManual = false) => {
    if (!currentOrder?.id) return;
    try {
      if (isManual) setIsSyncing(true);
      setProviderSyncStatus("SYNCING");
      
      const res = await fetch(`/api/order/sync/${currentOrder.id}`, {
        headers: { "Accept": "application/json" }
      });
      const data = await res.json();
      
      if (res.ok && data.success && data.order) {
        setCurrentOrder(prev => ({
          ...prev,
          ...data.order,
          sms: data.order.sms || prev.sms,
          status: data.order.status || prev.status,
          expires: data.order.expires || prev.expires
        }));
        setProviderSyncStatus("LIVE");
        setProviderErrorMsg(null);
        setLastSyncTime(new Date());
        if (isManual) {
          toast.success("Order verified with official provider");
        }
      } else {
        setProviderSyncStatus("LIVE");
        if (data.error) {
          setProviderErrorMsg(data.error);
        }
      }
    } catch (e: any) {
      console.warn("Direct provider sync warning:", e);
      setProviderSyncStatus("ERROR");
      setProviderErrorMsg(e.message || "Failed to reach provider");
    } finally {
      if (isManual) setIsSyncing(false);
    }
  };

  // 1. Immediate Direct Verification on Mount & Order ID change
  useEffect(() => {
    verifyWithProvider(false);
  }, [currentOrder.id]);

  // 2. Safe background polling interval (every 5 seconds) while order is active
  useEffect(() => {
    const isActive = currentOrder.status === "PENDING" || currentOrder.status === "RECEIVED";
    if (!isActive) return;

    const intervalId = setInterval(() => {
      verifyWithProvider(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [currentOrder.id, currentOrder.status]);

  // Sound chime when SMS arrives
  useEffect(() => {
    if (hasSms && latestSms) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioContext = new AudioContextClass();
          const osc = audioContext.createOscillator();
          const gain = audioContext.createGain();
          osc.connect(gain);
          gain.connect(audioContext.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(880, audioContext.currentTime);
          osc.frequency.exponentialRampToValueAtTime(1760, audioContext.currentTime + 0.12);
          gain.gain.setValueAtTime(0, audioContext.currentTime);
          gain.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.35);
          osc.start(audioContext.currentTime);
          osc.stop(audioContext.currentTime + 0.35);
        }
      } catch (e) {}
    }
  }, [hasSms, latestSms?.id || (latestSms as any)?._code]);

  // Auto rotate help carousel
  useEffect(() => {
    const timerId = setInterval(() => {
      setHelpSlide(prev => (prev + 1) % 4);
    }, 6000);
    return () => clearInterval(timerId);
  }, []);

  // Auto rotate fee carousel
  useEffect(() => {
    const timerId = setInterval(() => {
      setFeeSlide(prev => (prev + 1) % 4);
    }, 7000);
    return () => clearInterval(timerId);
  }, []);

  const handleCopyFull = () => {
    navigator.clipboard.writeText(parsedPhone.full);
    setCopiedFull(true);
    toast.success("Full Number Copied (+ Country Code)");
    setTimeout(() => setCopiedFull(false), 2000);
  };

  const handleCopyLocal = () => {
    navigator.clipboard.writeText(parsedPhone.local);
    setCopiedLocal(true);
    toast.success("Local Number Copied (Without Country Code)");
    setTimeout(() => setCopiedLocal(false), 2000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success("Verification Code Copied!");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Pricing calculations
  const priceUsd = currentOrder.price || 0;
  const pricePkr = Number((priceUsd * cryptoRate).toFixed(2));
  const cancelFeePkr = Number((pricePkr * 0.05).toFixed(2));
  const processingFeePkr = Number((pricePkr * 0.02).toFixed(2));
  const totalDeductionPkr = Number((cancelFeePkr + processingFeePkr).toFixed(2));
  const netRefundPkr = Number((pricePkr - totalDeductionPkr).toFixed(2));

  const cancelFeeUsd = Number((priceUsd * 0.05).toFixed(4));
  const processingFeeUsd = Number((priceUsd * 0.02).toFixed(4));
  const netRefundUsd = Number((priceUsd * 0.93).toFixed(4));

  const handleConfirmCancel = async () => {
    if (!agreeCancelTerms) {
      toast.error("Please agree to the Cancellation Terms & Conditions to proceed.");
      return;
    }
    setIsCanceling(true);
    try {
      await onCancel(currentOrder.id);
      setCurrentOrder(prev => ({ ...prev, status: "CANCELED" }));
      setShowCancelModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel order");
    } finally {
      setIsCanceling(false);
    }
  };

  const handleExecuteFinish = async () => {
    setIsFinishing(true);
    try {
      const res = await fetch(`/api/order/finish/${currentOrder.id}`, { method: "POST" });
      if (res.ok) {
        setCurrentOrder(prev => ({ ...prev, status: "FINISHED" }));
        onFinish(currentOrder.id);
        toast.success("Activation session finished successfully.");
      } else {
        onFinish(currentOrder.id);
      }
    } catch (e: any) {
      onFinish(currentOrder.id);
    } finally {
      setIsFinishing(false);
    }
  };

  const handleExecuteBan = async () => {
    setIsBanning(true);
    try {
      const res = await fetch(`/api/order/ban/${currentOrder.id}`, { method: "POST" });
      if (res.ok) {
        setCurrentOrder(prev => ({ ...prev, status: "BANNED" }));
        onBan(currentOrder.id);
        toast.success("Number marked bad. 100% refund credited to your wallet.");
      } else {
        onBan(currentOrder.id);
      }
    } catch (e: any) {
      onBan(currentOrder.id);
    } finally {
      setIsBanning(false);
    }
  };

  const handleOpenInvoice = () => {
    const invoiceData: InvoiceData = {
      invoiceNumber: `INV-ZX-${currentOrder.id}`,
      orderId: currentOrder.id,
      date: currentOrder.created_at || new Date().toISOString(),
      customerName: currentUser?.username || "Client",
      customerEmail: currentUser?.email || "",
      customerPhone: currentUser?.whatsappNumber || currentOrder.phone,
      paymentMethod: "ZeroX Wallet Balance",
      status: currentOrder.status === "FINISHED" ? "COMPLETED" : currentOrder.status === "CANCELED" ? "CANCELED" : currentOrder.status === "BANNED" ? "BANNED" : String(currentOrder.status),
      items: [
        {
          id: currentOrder.id,
          title: `ZeroX Virtual Number - ${serviceConfig.name} (${countryDetails.name})`,
          category: "SMS Activation",
          details: `Phone: ${currentOrder.phone} | Operator: ${currentOrder.operator} | Code: ${latestSms?.code || "Pending"}`,
          quantity: 1,
          unitPriceUsd: priceUsd,
          unitPricePkr: pricePkr,
          totalUsd: priceUsd,
          totalPkr: pricePkr
        }
      ],
      subtotalPkr: pricePkr,
      subtotalUsd: priceUsd,
      grandTotalPkr: pricePkr,
      grandTotalUsd: priceUsd
    };

    setSelectedInvoice(invoiceData);
    setIsInvoiceOpen(true);
  };

  // Help troubleshooting slides
  const helpSlides = [
    {
      title: "1. Correct Number Format",
      desc: "Paste the full number including international dial code (+1, +44, +92) into your target app.",
      tip: "Use 'Copy Full' for international fields, or 'Copy Local' if dial code is already selected."
    },
    {
      title: "2. Request via SMS (Not Call)",
      desc: "Select 'Send SMS' or 'Resend code via SMS'. Voice call verification is not supported on standard SMS numbers.",
      tip: "If app shows WhatsApp verification prompt, tap 'Didn't receive code? -> Send SMS'."
    },
    {
      title: "3. Carrier Transit Delay",
      desc: "International SMS routing can take 30 to 90 seconds depending on carrier gateway traffic.",
      tip: "Keep this ZEROX page open — incoming SMS codes appear instantly in real-time."
    },
    {
      title: "4. Number Blocked / In Use?",
      desc: "If the target app reports the number is already registered or banned, click 'Mark Bad' for an instant 100% refund.",
      tip: "ZeroX Network guarantees 100% refund for unactivated or unusable numbers."
    }
  ];

  // Fee slides
  const feeSlides = [
    {
      title: "Cancellation Fee: 5%",
      desc: "Applies when an active virtual number is manually canceled by the user before receiving OTP.",
      badge: "Manual Cancel"
    },
    {
      title: "Processing Fee: 2%",
      desc: "Covers gateway and carrier allocation release handling for manual cancellation refunds.",
      badge: "Processing"
    },
    {
      title: "Net Refund: 93%",
      desc: "Net Refund = Order Amount - 5% Cancellation Fee - 2% Processing Fee (Credited to ZEROX Wallet).",
      badge: "Calculation"
    },
    {
      title: "Automatic Expiry: 100% Refund",
      desc: "If the provider session expires without receiving an OTP, you receive an automatic 100% full refund with 0% fee.",
      badge: "Automatic 100%"
    }
  ];

  const formattedDate = currentOrder.created_at ? new Date(currentOrder.created_at).toLocaleString() : "Just now";

  return (
    <div id="zerox-order-detail-page" className="min-h-screen bg-[#070B12] text-slate-100 font-sans pb-16">
      <InvoiceModal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} data={selectedInvoice} />

      {/* 1. COMPACT ORDER HEADER */}
      <header className="sticky top-0 z-30 bg-[#0B0F19]/95 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="order-detail-back-btn"
              onClick={onBack}
              className="p-1.5 sm:p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer shrink-0"
              title="Close page and return to store (Does not cancel order)"
            >
              <ArrowLeft className="h-4 w-4 text-[#00AEEF]" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-white font-mono">
                  Order #ZX-{currentOrder.id}
                </span>
                {/* Status Badge */}
                {currentOrder.status === "FINISHED" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    <CheckCircle2 className="h-3 w-3 text-blue-400" />
                    FINISHED
                  </span>
                ) : currentOrder.status === "CANCELED" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <XCircle className="h-3 w-3 text-rose-400" />
                    CANCELED
                  </span>
                ) : currentOrder.status === "BANNED" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-slate-500/10 text-slate-300 border border-slate-600">
                    <Ban className="h-3 w-3 text-slate-400" />
                    REFUNDED
                  </span>
                ) : hasOtp ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    CODE RECEIVED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                    OTP PENDING
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {serviceConfig.name} · {countryDetails.emoji} {countryDetails.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Direct Provider Sync Indicator / Manual Trigger */}
            <button
              onClick={() => verifyWithProvider(true)}
              disabled={isSyncing}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Verify order directly with provider API"
            >
              <RefreshCw className={`h-3 w-3 text-[#00AEEF] ${isSyncing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline text-[11px]">Sync Provider</span>
            </button>

            <button
              onClick={handleOpenInvoice}
              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition text-xs font-semibold flex items-center gap-1.5"
              title="View & Download Invoice"
            >
              <FileText className="h-3.5 w-3.5 text-[#00AEEF]" />
              <span className="hidden md:inline">Invoice</span>
            </button>
            <button
              onClick={onBack}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
              title="Close view (Does NOT cancel order)"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 space-y-4">

        {/* PROVIDER STATUS NOTICE (If connection or sync note) */}
        {providerErrorMsg && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-300">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
              <span className="truncate">Provider status: {providerErrorMsg}. Retrying synchronization automatically...</span>
            </div>
            <button
              onClick={() => verifyWithProvider(true)}
              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-bold shrink-0 transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. VIRTUAL NUMBER & SERVICE CARD (MAIN FOCUS) */}
        <section className="bg-[#0D1321] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-lg relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Service & Number Display */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`p-1.5 rounded-lg border ${serviceConfig.bgClass} ${serviceConfig.borderClass} inline-flex items-center justify-center`}>
                  <DynamicServiceIcon serviceKey={serviceKey} className={`h-4 w-4 ${serviceConfig.textClass}`} />
                </div>
                <span className="text-xs font-bold text-slate-300">
                  {countryDetails.emoji} {countryDetails.name} · {serviceConfig.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                  {currentOrder.operator.toUpperCase()}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Provider Synchronized
                </span>
              </div>

              <div className="pt-1">
                <span className="text-[10px] font-mono font-bold text-[#00AEEF] uppercase tracking-wider block">
                  Allocated Virtual Number
                </span>
                <h2 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight select-all">
                  {parsedPhone.display || currentOrder.phone}
                </h2>
              </div>
            </div>

            {/* Quick Copy Buttons */}
            <div className="flex items-center gap-2 pt-1 sm:pt-0">
              <button
                id="order-copy-full-btn"
                onClick={handleCopyFull}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-[#00AEEF] hover:text-cyan-300 font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                {copiedFull ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Full</span>
                  </>
                )}
              </button>

              <button
                id="order-copy-local-btn"
                onClick={handleCopyLocal}
                className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-200 hover:text-white font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                {copiedLocal ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Copied ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-slate-400" />
                    <span>Copy Local</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </section>

        {/* 3. PROVIDER-SYNCED TIMER BAR */}
        <section className="bg-[#0D1321] border border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${timer.isExpired ? "text-rose-400" : "text-[#00AEEF]"}`} />
              <span className="text-xs font-semibold text-slate-300">
                Activation Session Timer (Authoritative)
              </span>
            </div>

            <div className="text-right">
              {timer.isExpired ? (
                <span className="text-xs font-mono font-bold text-rose-400">
                  Session Expired
                </span>
              ) : (
                <span className="text-sm font-mono font-black text-white">
                  {timer.formatted} <span className="text-xs font-normal text-slate-400">remaining</span>
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-1000 ${
                timer.isExpired ? "bg-rose-500 w-full" : timer.minutes < 3 ? "bg-amber-500" : "bg-[#00AEEF]"
              }`}
              style={{ width: timer.isExpired ? "100%" : `${timer.percentRemaining}%` }}
            />
          </div>

          {timer.isExpired && currentOrder.status === "PENDING" && !hasSms && (
            <p className="text-[11px] text-amber-400/90 mt-2 flex items-center gap-1 font-medium">
              <Info className="h-3.5 w-3.5 shrink-0" />
              Session timed out without OTP. Automatic 100% full refund applies to your ZEROX wallet.
            </p>
          )}
        </section>

        {/* 4. SMS / OTP VERIFICATION SECTION (PROMINENT) */}
        <section className="bg-[#0D1321] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#00AEEF]" />
              <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                SMS Verification Code (OTP)
              </h3>
            </div>
            {hasSms && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                {currentOrder.sms?.length || 1} Code Received
              </span>
            )}
          </div>

          {hasSms && latestSms ? (
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4 sm:p-5 text-center space-y-3">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400 block">
                SMS VERIFICATION CODE (OTP)
              </span>
              <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-wider select-all">
                {latestSms.code || latestSms.text || "RECEIVED"}
              </div>

              <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                <button
                  id="order-copy-code-btn"
                  onClick={() => handleCopyCode(latestSms.code || latestSms.text || "")}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs font-mono transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95"
                >
                  {copiedCode ? (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Copied ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>

                {currentOrder.status !== "FINISHED" && (
                  <button
                    onClick={handleExecuteFinish}
                    disabled={isFinishing}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs transition cursor-pointer"
                  >
                    {isFinishing ? "Finishing..." : "Finish Activation"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-[#0B0F19] border border-slate-800/80 rounded-xl p-5 text-center space-y-2">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 mb-1">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-ping" />
              </div>
              <h4 className="text-sm font-bold text-white">
                Waiting for SMS (OTP Pending)...
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Send the verification code from your {serviceConfig.name} application now. The OTP will appear here instantly upon receipt.
              </p>
            </div>
          )}
        </section>

        {/* 5. RECEIVED SMS MESSAGES (CHRONOLOGICAL LIST) */}
        {hasSms && currentOrder.sms && (
          <section className="bg-[#0D1321] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Received Messages ({currentOrder.sms.length})
            </h4>
            <div className="space-y-2">
              {currentOrder.sms.map((msg, index) => (
                <div 
                  key={index}
                  className="bg-[#0B0F19] border border-slate-800 rounded-xl p-3.5 text-left space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#00AEEF] font-mono">
                      Sender: {msg.sender || serviceConfig.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {msg.date || msg.created_at ? new Date(msg.date || msg.created_at).toLocaleTimeString() : "Just now"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-mono leading-relaxed select-all">
                    {msg.text}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. COMPACT ORDER INFORMATION GRID */}
        <section className="bg-[#0D1321] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Order Information
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="bg-[#0B0F19] border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Service</span>
              <span className="text-xs font-bold text-white flex items-center gap-1 mt-0.5">
                <DynamicServiceIcon serviceKey={serviceKey} className="h-3.5 w-3.5 text-[#00AEEF]" />
                {serviceConfig.name}
              </span>
            </div>

            <div className="bg-[#0B0F19] border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Country</span>
              <span className="text-xs font-bold text-white mt-0.5 block">
                {countryDetails.emoji} {countryDetails.name}
              </span>
            </div>

            <div className="bg-[#0B0F19] border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Operator</span>
              <span className="text-xs font-mono font-bold text-slate-200 mt-0.5 block uppercase">
                {currentOrder.operator || "Virtual"}
              </span>
            </div>

            <div className="bg-[#0B0F19] border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Price Paid</span>
              <span className="text-xs font-mono font-bold text-[#00AEEF] mt-0.5 block">
                {formatPrice(currentOrder.price)} <span className="text-[10px] text-slate-400">(${priceUsd.toFixed(2)})</span>
              </span>
            </div>

            <div className="bg-[#0B0F19] border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Order ID</span>
              <span className="text-xs font-mono font-bold text-cyan-400 mt-0.5 block">
                #ZX-{currentOrder.id}
              </span>
            </div>

            <div className="bg-[#0B0F19] border border-slate-800/80 rounded-xl p-3">
              <span className="text-[10px] font-mono text-slate-400 uppercase block">Order Date</span>
              <span className="text-[11px] font-mono text-slate-300 mt-0.5 block truncate" title={formattedDate}>
                {formattedDate}
              </span>
            </div>
          </div>
        </section>

        {/* 7. ORDER ACTIONS */}
        <section className="bg-[#0D1321] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Order Management
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Eligible active orders can be canceled or reported if unusable.
              </p>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {(currentOrder.status === "PENDING" || currentOrder.status === "RECEIVED") && (
                <>
                  <button
                    id="order-cancel-btn"
                    onClick={() => setShowCancelModal(true)}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Cancel Order</span>
                  </button>

                  <button
                    id="order-mark-bad-btn"
                    onClick={handleExecuteBan}
                    disabled={isBanning}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
                    title="Report number as already registered or blocked for instant refund"
                  >
                    <Ban className="h-3.5 w-3.5 text-slate-400" />
                    <span>{isBanning ? "Reporting..." : "Mark Bad"}</span>
                  </button>
                </>
              )}

              {currentOrder.status === "CANCELED" && onBuyAgain && (
                <button
                  onClick={() => onBuyAgain(currentOrder.country, currentOrder.product || currentOrder.service || "")}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#00AEEF] hover:bg-cyan-400 text-slate-950 font-black text-xs transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Order Another Number</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* 8. CAROUSELS SECTION: CAN'T RECEIVE SMS & FEES CAROUSELS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* CAROUSEL 1: CAN'T RECEIVE SMS? */}
          <div className="bg-[#0D1321] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <HelpCircle className="h-4 w-4 text-[#00AEEF]" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Can't Receive SMS?
                  </h4>
                </div>
                <div className="flex items-center gap-1">
                  {helpSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setHelpSlide(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === helpSlide ? "w-4 bg-[#00AEEF]" : "w-1.5 bg-slate-700 hover:bg-slate-600"
                      }`}
                      aria-label={`Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-[#0B0F19] border border-slate-800/80 rounded-xl p-3.5 min-h-[96px] flex flex-col justify-center">
                <h5 className="text-xs font-bold text-[#00AEEF] mb-1">
                  {helpSlides[helpSlide].title}
                </h5>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {helpSlides[helpSlide].desc}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 italic">
                  Tip: {helpSlides[helpSlide].tip}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5">
              <span className="text-[10px] text-slate-500 font-mono">
                Slide {helpSlide + 1} of {helpSlides.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setHelpSlide(prev => (prev === 0 ? helpSlides.length - 1 : prev - 1))}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
                  aria-label="Previous slide"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setHelpSlide(prev => (prev + 1) % helpSlides.length)}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
                  aria-label="Next slide"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* CAROUSEL 2: ORDER & CANCELLATION FEES */}
          <div className="bg-[#0D1321] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Order & Cancellation Fees
                  </h4>
                </div>
                <div className="flex items-center gap-1">
                  {feeSlides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFeeSlide(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === feeSlide ? "w-4 bg-emerald-400" : "w-1.5 bg-slate-700 hover:bg-slate-600"
                      }`}
                      aria-label={`Fee Slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              <div className="bg-[#0B0F19] border border-slate-800/80 rounded-xl p-3.5 min-h-[96px] flex flex-col justify-center">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h5 className="text-xs font-bold text-emerald-400">
                    {feeSlides[feeSlide].title}
                  </h5>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {feeSlides[feeSlide].badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {feeSlides[feeSlide].desc}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2.5">
              <span className="text-[10px] text-slate-500 font-mono">
                Slide {feeSlide + 1} of {feeSlides.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setFeeSlide(prev => (prev === 0 ? feeSlides.length - 1 : prev - 1))}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
                  aria-label="Previous fee slide"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setFeeSlide(prev => (prev + 1) % feeSlides.length)}
                  className="p-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition"
                  aria-label="Next fee slide"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </main>

      {/* 9. AUTHORITATIVE CANCELLATION MODAL */}
      {showCancelModal && (
        <div 
          id="cancellation-terms-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Cancel Virtual Number
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Order #ZX-{currentOrder.id} · {countryDetails.name} {serviceConfig.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Fee Breakdown Card */}
            <div className="bg-[#070B12] border border-slate-800 rounded-xl p-4 space-y-2.5">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                Refund Calculation Breakdown
              </span>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Order Original Amount:</span>
                  <span className="font-mono font-bold text-white">{formatPrice(currentOrder.price)} (${priceUsd.toFixed(2)})</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Cancellation Fee (5%):</span>
                  <span className="font-mono">- {formatPrice(cancelFeeUsd)} (-${cancelFeeUsd.toFixed(4)})</span>
                </div>
                <div className="flex justify-between text-rose-400">
                  <span>Processing Fee (2%):</span>
                  <span className="font-mono">- {formatPrice(processingFeeUsd)} (-${processingFeeUsd.toFixed(4)})</span>
                </div>
                <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-black text-emerald-400">
                  <span>Net Refund (93%):</span>
                  <span className="font-mono">+{formatPrice(netRefundUsd)} (+${netRefundUsd.toFixed(4)})</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 pt-1">
                Net refund of <strong className="text-emerald-400">{formatPrice(netRefundUsd)}</strong> will be credited instantly to your ZEROX Wallet balance upon confirmation.
              </p>
            </div>

            {/* Checkbox Agreement */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeCancelTerms}
                  onChange={(e) => setAgreeCancelTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 bg-slate-800 text-[#00AEEF] focus:ring-[#00AEEF] h-4 w-4"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  I understand that manually canceling this allocated virtual number incurs a <strong className="text-white">5% Cancellation Fee</strong> and a <strong className="text-white">2% Processing Fee</strong> (Total deduction 7%). I authorize the net refund of <strong className="text-emerald-400">{formatPrice(netRefundUsd)}</strong> to my ZEROX Wallet balance.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition"
              >
                Keep Order
              </button>

              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={!agreeCancelTerms || isCanceling}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-black transition flex items-center gap-1.5 shadow-lg shadow-rose-600/20 disabled:shadow-none cursor-pointer"
              >
                {isCanceling ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing Cancellation...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-3.5 w-3.5" />
                    <span>Confirm Cancel &amp; Refund</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
