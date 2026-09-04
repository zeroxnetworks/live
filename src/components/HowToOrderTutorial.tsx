import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { ZXLogo } from "./ZXLogo";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  Smartphone,
  Globe,
  Radio,
  Clock,
  ShieldCheck,
  Zap,
  MousePointer,
  Check,
  Copy,
  MessageSquare,
  FileText,
  Wallet,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  XCircle,
  Ban,
  Search,
  Star,
  Layers,
  ChevronDown,
  ShoppingCart,
  Store,
  Crown,
  Users,
  LayoutDashboard,
  Ticket,
  Send,
  Hash,
  Download,
  History,
  FileDown
} from "lucide-react";

export type VirtualNumberTutorialStepId =
  | "OVERVIEW"
  | "SELECT_COUNTRY"
  | "SELECT_SERVICE"
  | "OPERATOR_PRICING"
  | "ALLOCATE_BUTTON"
  | "ORDER_DETAILS_NUMBER"
  | "ORDER_DETAILS_OTP"
  | "ORDER_DETAILS_OPTIONS"
  | "ACTIVATION_HISTORY"
  | "COMPLETED";

interface StepDefinition {
  id: VirtualNumberTutorialStepId;
  badge: string;
  stepNumber: number;
  totalSteps: number;
  title: string;
  shortCaption: string;
  voiceText: string;
  targetSelector: string;
  fallbackSelector?: string;
  icon: any;
  actionHint: string;
  simulatedClickLabel?: string;
  clickDelayMs: number;
  fallbackDurationMs: number;
}

const TUTORIAL_STEPS: StepDefinition[] = [
  {
    id: "OVERVIEW",
    badge: "1/10",
    stepNumber: 1,
    totalSteps: 10,
    title: "3-Step Virtual Number Ordering",
    shortCaption: "Step 1: Choose Country • Step 2: Choose Platform • Step 3: Allocate Line.",
    voiceText: "Welcome to Zerox Network. Here is how to order your virtual number in three simple steps.",
    targetSelector: "#demo-catalog-root",
    fallbackSelector: "#demo-catalog-view",
    icon: Smartphone,
    actionHint: "Viewing 3-step checkout grid",
    clickDelayMs: 1200,
    fallbackDurationMs: 4800
  },
  {
    id: "SELECT_COUNTRY",
    badge: "2/10",
    stepNumber: 2,
    totalSteps: 10,
    title: "Step 1: Select Country (United Kingdom)",
    shortCaption: "Selecting United Kingdom (+44) for WhatsApp activation.",
    voiceText: "Step one: Select your country. For example, let's select the United Kingdom with plus forty-four country code.",
    targetSelector: "#demo-country-uk",
    fallbackSelector: "#step-1-country-card",
    icon: Globe,
    actionHint: "Selecting United Kingdom 🇬🇧",
    simulatedClickLabel: "United Kingdom 🇬🇧 (+44) Selected ✓",
    clickDelayMs: 1800,
    fallbackDurationMs: 5200
  },
  {
    id: "SELECT_SERVICE",
    badge: "3/10",
    stepNumber: 3,
    totalSteps: 10,
    title: "Step 2: Select Platform (WhatsApp)",
    shortCaption: "Selecting WhatsApp from 100+ global platforms.",
    voiceText: "Step two: Select your platform. Let's select WhatsApp for instant SMS verification.",
    targetSelector: "#demo-service-whatsapp",
    fallbackSelector: "#step-2-service-card",
    icon: Zap,
    actionHint: "Selecting WhatsApp 💬",
    simulatedClickLabel: "WhatsApp 💬 Selected ✓",
    clickDelayMs: 1800,
    fallbackDurationMs: 5200
  },
  {
    id: "OPERATOR_PRICING",
    badge: "4/10",
    stepNumber: 4,
    totalSteps: 10,
    title: "Step 3: Telecom Route & Live Pricing",
    shortCaption: "Route: O2 UK • Stock: 1,420 lines • Live Price: Rs 236 ($0.85).",
    voiceText: "Step three: Review the available telecom route, live stock, and pricing.",
    targetSelector: "#demo-operator-box",
    fallbackSelector: "#step-3-order-card",
    icon: Radio,
    actionHint: "Checking live route & price",
    simulatedClickLabel: "Route O2 UK • Stock 1,420 • Rs 236",
    clickDelayMs: 1500,
    fallbackDurationMs: 4800
  },
  {
    id: "ALLOCATE_BUTTON",
    badge: "5/10",
    stepNumber: 5,
    totalSteps: 10,
    title: "Allocate Virtual Number",
    shortCaption: "Click Allocate Virtual Number to instantly reserve line.",
    voiceText: "Now, click Allocate Virtual Number to instantly reserve your line.",
    targetSelector: "#demo-buy-btn",
    fallbackSelector: "#step-3-order-card",
    icon: ShoppingCart,
    actionHint: "Clicking Allocate",
    simulatedClickLabel: "Allocating Number...",
    clickDelayMs: 900,
    fallbackDurationMs: 4200
  },
  {
    id: "ORDER_DETAILS_NUMBER",
    badge: "6/10",
    stepNumber: 6,
    totalSteps: 10,
    title: "Allocated Virtual Number & Copy",
    shortCaption: "Allocated line: +44 7911 123456 • One-tap Copy Full or Copy Local.",
    voiceText: "Here is your allocated number. Tap Copy to paste it into WhatsApp.",
    targetSelector: "#demo-order-allocated-card",
    fallbackSelector: "#demo-order-detail-view",
    icon: Smartphone,
    actionHint: "Copying Number",
    simulatedClickLabel: "Virtual Number Copied ✓",
    clickDelayMs: 1800,
    fallbackDurationMs: 4800
  },
  {
    id: "ORDER_DETAILS_OTP",
    badge: "7/10",
    stepNumber: 7,
    totalSteps: 10,
    title: "15-Min Timer & Incoming OTP",
    shortCaption: "15-min auto-expiry • 100% refund if no code • Code arrives live!",
    voiceText: "Your 15-minute activation timer is active. Waiting for your WhatsApp code. If no code arrives within 15 minutes, your order automatically expires with a 100% full wallet refund. Once the code is received, no refunds are permitted.",
    targetSelector: "#demo-order-otp-box",
    fallbackSelector: "#demo-order-timer-bar",
    icon: ShieldCheck,
    actionHint: "Receiving OTP",
    simulatedClickLabel: "WhatsApp Code: 849-201 Copied ✓",
    clickDelayMs: 4200,
    fallbackDurationMs: 7800
  },
  {
    id: "ORDER_DETAILS_OPTIONS",
    badge: "8/10",
    stepNumber: 8,
    totalSteps: 10,
    title: "Order Options: Refunds & Auto-Expiry",
    shortCaption: "Auto-expiry (100% refund if no code) • Cancel (93% refund) • Code received = No refunds.",
    voiceText: "If no code is received, you can cancel manually for a 93% refund, or wait for the 15-minute auto-expiry for a 100% full refund. Once a code arrives, no refunds are allowed.",
    targetSelector: "#demo-order-management-card",
    fallbackSelector: "#demo-order-detail-view",
    icon: ShieldCheck,
    actionHint: "Reviewing Order Options",
    simulatedClickLabel: "Auto-Expiry 100% Refund • Code Received = No Refund",
    clickDelayMs: 2000,
    fallbackDurationMs: 6400
  },
  {
    id: "ACTIVATION_HISTORY",
    badge: "9/10",
    stepNumber: 9,
    totalSteps: 10,
    title: "Activation History & Download PDF Invoice",
    shortCaption: "Access all past numbers in Activation History • Download official PDF tax invoice for every number.",
    voiceText: "You can find all your active and past orders anytime in your Activation History. Re-copy OTP codes and download official PDF tax invoices for every virtual number.",
    targetSelector: "#demo-history-card",
    fallbackSelector: "#demo-history-modal-overlay",
    icon: FileText,
    actionHint: "Downloading PDF Invoice",
    simulatedClickLabel: "PDF Tax Invoice Downloaded ✓",
    clickDelayMs: 2400,
    fallbackDurationMs: 6800
  },
  {
    id: "COMPLETED",
    badge: "✓",
    stepNumber: 10,
    totalSteps: 10,
    title: "Ready to Order!",
    shortCaption: "You are ready to order real virtual numbers with instant OTP verification.",
    voiceText: "You are all set. Add balance to your wallet and start activating virtual numbers instantly.",
    targetSelector: "#demo-completion-card",
    icon: Sparkles,
    actionHint: "Demo Complete",
    clickDelayMs: 1000,
    fallbackDurationMs: 6000
  }
];

interface HowToOrderTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToWallet?: () => void;
  siteLogoUrl?: string;
  siteTitle?: string;
  formatPrice?: (baseUnits: number) => string;
}

export const HowToOrderTutorial: React.FC<HowToOrderTutorialProps> = ({
  isOpen,
  onClose,
  onNavigateToWallet,
  siteLogoUrl,
  siteTitle
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zerox_tutorial_voice_enabled");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  // Simulated interactive UI states
  const [simulatedClickActive, setSimulatedClickActive] = useState(false);
  const [demoCopiedNumber, setDemoCopiedNumber] = useState(false);
  const [demoCopiedLocal, setDemoCopiedLocal] = useState(false);
  const [demoCopiedOtp, setDemoCopiedOtp] = useState(false);
  const [demoTimerSeconds, setDemoTimerSeconds] = useState(888);
  const [demoOtpReceived, setDemoOtpReceived] = useState(false);

  const autoPlayTimerRef = useRef<any>(null);
  const clickAnimTimerRef = useRef<any>(null);
  const otpArrivalTimerRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentStep = TUTORIAL_STEPS[currentStepIndex] || TUTORIAL_STEPS[0];

  // Format 15-minute demo countdown
  const formatDemoTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 15-minute countdown effect
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setDemoTimerSeconds((prev) => (prev > 0 ? prev - 1 : 890));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Voice speech synthesis
  const speakText = useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferred =
          voices.find((v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium"))) ||
          voices.find((v) => v.lang.startsWith("en"));
        if (preferred) utterance.voice = preferred;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (autoPlay && currentStepIndex < TUTORIAL_STEPS.length - 1) {
          clearTimeout(autoPlayTimerRef.current);
          autoPlayTimerRef.current = setTimeout(() => {
            setCurrentStepIndex((prev) => prev + 1);
          }, 900);
        }
      };

      utterance.onerror = () => setIsSpeaking(false);

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled, autoPlay, currentStepIndex]
  );

  // Handle PDF Invoice Download
  const handleDownloadPdfInvoice = () => {
    const invoiceContent = `================================================
ZEROX NETWORK - OFFICIAL TAX INVOICE
================================================
Invoice Number: #INV-ZX-78924
Date: ${new Date().toLocaleDateString()}
Payment Method: ZeroX Wallet Balance
Status: PAID & VERIFIED

------------------------------------------------
Item: WhatsApp Virtual Number (United Kingdom +44)
Allocated Line: +44 7911 123456
Telecom Route: O2 UK
Verification OTP: 849-201
Price Paid: Rs 236 ($0.85 USD)
------------------------------------------------

Thank you for choosing ZeroX Network!
Official Portal: https://zeroxnetwork.com
================================================`;

    try {
      const blob = new Blob([invoiceContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_INV-ZX-78924_ZeroXNetwork.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("PDF Tax Invoice #INV-ZX-78924 Downloaded!");
    } catch {
      toast.success("PDF Tax Invoice #INV-ZX-78924 Ready!");
    }
  };

  // Smooth scroll and target positioning with multi-container auto-alignment
  const updateTargetPosition = useCallback((shouldScroll = true) => {
    const target =
      document.querySelector(currentStep.targetSelector) ||
      (currentStep.fallbackSelector ? document.querySelector(currentStep.fallbackSelector) : null);

    if (target) {
      if (shouldScroll) {
        // Find scrollable parent container
        const scrollContainer =
          document.getElementById("demo-catalog-view") ||
          document.getElementById("demo-order-detail-view") ||
          document.getElementById("demo-history-modal-overlay") ||
          target.closest(".overflow-y-auto");

        if (scrollContainer) {
          if (currentStep.id === "OVERVIEW") {
            scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            const containerRect = scrollContainer.getBoundingClientRect();
            const targetRectCurrent = target.getBoundingClientRect();
            const relativeTop = targetRectCurrent.top - containerRect.top + scrollContainer.scrollTop;
            const targetScrollTop = Math.max(0, relativeTop - (containerRect.height / 2) + (targetRectCurrent.height / 2));

            scrollContainer.scrollTo({
              top: targetScrollTop,
              behavior: "smooth"
            });
          }
        } else {
          target.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
      }
      setTargetRect(target.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  // Handle Step Navigation & Animation Lifecycle
  useEffect(() => {
    if (!isOpen) return;

    setSimulatedClickActive(false);
    updateTargetPosition(true);

    let animFrameId: number;
    const startTime = performance.now();
    const smoothTrack = (now: number) => {
      if (now - startTime < 1400) {
        updateTargetPosition(false);
        animFrameId = requestAnimationFrame(smoothTrack);
      }
    };
    animFrameId = requestAnimationFrame(smoothTrack);

    const scrollTimer1 = setTimeout(() => updateTargetPosition(false), 100);
    const scrollTimer2 = setTimeout(() => updateTargetPosition(false), 250);
    const scrollTimer3 = setTimeout(() => updateTargetPosition(false), 500);
    const scrollTimer4 = setTimeout(() => updateTargetPosition(false), 800);

    // Trigger simulated click feedback & OTP arrival
    clearTimeout(clickAnimTimerRef.current);
    clearTimeout(otpArrivalTimerRef.current);

    if (currentStep.id === "ORDER_DETAILS_NUMBER") {
      setDemoOtpReceived(false);
    } else if (currentStep.id === "ORDER_DETAILS_OTP") {
      setDemoOtpReceived(false);
      // Code arrives live after a short moment (2.2s)
      otpArrivalTimerRef.current = setTimeout(() => {
        setDemoOtpReceived(true);
      }, 2200);
    } else if (
      currentStep.id === "ORDER_DETAILS_OPTIONS" ||
      currentStep.id === "ACTIVATION_HISTORY" ||
      currentStep.id === "COMPLETED"
    ) {
      setDemoOtpReceived(true);
    }

    clickAnimTimerRef.current = setTimeout(() => {
      setSimulatedClickActive(true);

      if (currentStep.id === "ORDER_DETAILS_NUMBER") {
        setDemoCopiedNumber(true);
        setTimeout(() => setDemoCopiedNumber(false), 2400);
      } else if (currentStep.id === "ORDER_DETAILS_OTP") {
        setDemoCopiedOtp(true);
        setTimeout(() => setDemoCopiedOtp(false), 2400);
      }

      setTimeout(() => updateTargetPosition(false), 60);
      setTimeout(() => updateTargetPosition(false), 200);
      setTimeout(() => updateTargetPosition(false), 450);
    }, currentStep.clickDelayMs);

    // Speak voiceover
    speakText(currentStep.voiceText);

    // Fallback auto-timer in case speech is muted or disabled in browser
    if (autoPlay) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = setTimeout(() => {
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          if (!window.speechSynthesis.speaking) {
            if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
              setCurrentStepIndex((prev) => prev + 1);
            }
          }
        } else {
          if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
          }
        }
      }, currentStep.fallbackDurationMs);
    }

    const handleResize = () => updateTargetPosition(false);
    const handleScroll = () => {
      const el =
        document.querySelector(currentStep.targetSelector) ||
        (currentStep.fallbackSelector ? document.querySelector(currentStep.fallbackSelector) : null);
      if (el) setTargetRect(el.getBoundingClientRect());
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true, capture: true });
    window.addEventListener("wheel", handleScroll, { passive: true });
    window.addEventListener("touchmove", handleScroll, { passive: true });

    const catalogEl = document.getElementById("demo-catalog-view");
    if (catalogEl) {
      catalogEl.addEventListener("scroll", handleScroll, { passive: true });
    }
    const orderDetailEl = document.getElementById("demo-order-detail-view");
    if (orderDetailEl) {
      orderDetailEl.addEventListener("scroll", handleScroll, { passive: true });
    }
    const historyEl = document.getElementById("demo-history-modal-overlay");
    if (historyEl) {
      historyEl.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      cancelAnimationFrame(animFrameId);
      clearTimeout(scrollTimer1);
      clearTimeout(scrollTimer2);
      clearTimeout(scrollTimer3);
      clearTimeout(scrollTimer4);
      clearTimeout(autoPlayTimerRef.current);
      clearTimeout(clickAnimTimerRef.current);
      clearTimeout(otpArrivalTimerRef.current);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll, { capture: true } as any);
      window.removeEventListener("wheel", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
      if (catalogEl) {
        catalogEl.removeEventListener("scroll", handleScroll);
      }
      if (orderDetailEl) {
        orderDetailEl.removeEventListener("scroll", handleScroll);
      }
      if (historyEl) {
        historyEl.removeEventListener("scroll", handleScroll);
      }
    };
  }, [isOpen, currentStepIndex, updateTargetPosition, speakText, currentStep, autoPlay]);

  const handleNextStep = () => {
    setAutoPlay(false);
    if (currentStepIndex < TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleExitTutorial();
    }
  };

  const handlePrevStep = () => {
    setAutoPlay(false);
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleExitTutorial = () => {
    if (typeof window !== "undefined") {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
    clearTimeout(autoPlayTimerRef.current);
    clearTimeout(clickAnimTimerRef.current);
    setIsSpeaking(false);
    onClose();
  };

  const toggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    try {
      localStorage.setItem("zerox_tutorial_voice_enabled", String(nextVal));
    } catch {}

    if (!nextVal && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (nextVal) {
      speakText(currentStep.voiceText);
    }
  };

  const handleReplayVoice = () => {
    speakText(currentStep.voiceText);
  };

  const handleRestartDemo = () => {
    setCurrentStepIndex(0);
    setAutoPlay(true);
    speakText(TUTORIAL_STEPS[0].voiceText);
  };

  if (!isOpen) return null;

  const IconComp = currentStep.icon || Smartphone;
  const isCatalogStep = currentStepIndex <= 4;
  const isOrderDetailsStep =
    currentStep.id === "ORDER_DETAILS_NUMBER" ||
    currentStep.id === "ORDER_DETAILS_OTP" ||
    currentStep.id === "ORDER_DETAILS_OPTIONS";
  const isHistoryStep = currentStep.id === "ACTIVATION_HISTORY";
  const isCompletionStep = currentStep.id === "COMPLETED";

  // Selection states derived from tutorial progression
  const isUkSelected = currentStepIndex >= 2;
  const isWhatsAppSelected = currentStepIndex >= 3;
  const isAllocatingNow = currentStep.id === "ALLOCATE_BUTTON" && simulatedClickActive;

  return (
    <div
      id="how-to-order-tutorial-root"
      className="fixed inset-0 z-[99999] pointer-events-none select-none bg-transparent"
      style={{
        backdropFilter: "none",
        filter: "none"
      }}
    >
      {/* 1. COMPACT SLEEK TOP FLOATING PILL (Non-intrusive, 100% visible interface) */}
      <div className="fixed top-2.5 inset-x-2 sm:inset-x-4 z-[100005] flex items-center justify-between pointer-events-auto max-w-xl mx-auto">
        {/* Left: Demo Indicator & Step */}
        <div className="flex items-center gap-2 bg-slate-950/95 border border-slate-700/80 text-white px-3 py-1.5 rounded-full shadow-xl">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00AEEF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00AEEF]" />
          </span>
          <span className="text-[11px] font-black font-mono text-[#00AEEF] tracking-tight whitespace-nowrap">
            DEMO {currentStep.badge}
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-300 font-semibold truncate max-w-[140px] sm:max-w-[200px] hidden xs:inline">
            {currentStep.title}
          </span>
        </div>

        {/* Right: Controls & Exit */}
        <div className="flex items-center gap-1.5 bg-slate-950/95 border border-slate-700/80 p-1 rounded-full shadow-xl">
          {/* Speaking Audio Wave Indicator */}
          {isSpeaking && (
            <div className="flex items-center gap-0.5 px-2 py-0.5 text-[#00AEEF]">
              <span className="w-0.5 h-2.5 bg-[#00AEEF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-0.5 h-3.5 bg-[#00AEEF] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-0.5 h-2 bg-[#00AEEF] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          )}

          {/* Voice Mute / Unmute */}
          <button
            type="button"
            onClick={toggleVoice}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              voiceEnabled ? "text-[#00AEEF] hover:bg-slate-800" : "text-slate-500 hover:bg-slate-800"
            }`}
            title={voiceEnabled ? "Mute Voice" : "Enable Voice"}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Replay */}
          <button
            type="button"
            onClick={handleReplayVoice}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Replay Voice"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Auto Play/Pause */}
          <button
            type="button"
            onClick={() => setAutoPlay(!autoPlay)}
            className={`px-2 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              autoPlay
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title={autoPlay ? "Pause Auto-Demo" : "Play Auto-Demo"}
          >
            {autoPlay ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
            <span className="hidden sm:inline">{autoPlay ? "Auto" : "Paused"}</span>
          </button>

          {/* Close / Exit Button */}
          <button
            type="button"
            onClick={handleExitTutorial}
            className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer ml-0.5"
            title="Exit Demo"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. RAZOR-SHARP ACTIVE TARGET HIGHLIGHT */}
      {targetRect && !isHistoryStep && !isCompletionStep && (
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{
            opacity: 1,
            scale: 1,
            top: Math.max(8, targetRect.top - 4),
            left: Math.max(8, targetRect.left - 4),
            width: targetRect.width + 8,
            height: targetRect.height + 8
          }}
          transition={{ type: "spring", stiffness: 340, damping: 32 }}
          className="fixed z-[100000] rounded-2xl border-2 border-[#00AEEF] pointer-events-none"
          style={{
            boxShadow: "0 0 0 2px rgba(0,174,239,0.8), 0 0 20px rgba(0,174,239,0.5)"
          }}
        >
          {/* Animated Interactive Demo Cursor / Click Feedback */}
          <motion.div
            animate={{
              y: simulatedClickActive ? [0, -3, 2, 0] : [0, -6, 0],
              scale: simulatedClickActive ? [1, 0.92, 1.04, 1] : [1, 0.97, 1]
            }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            className="absolute -bottom-6 right-3 flex items-center gap-1.5 bg-slate-950 text-white border border-[#00AEEF] text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-2xl"
          >
            <MousePointer className="w-3 h-3 text-[#00AEEF] fill-[#00AEEF]" />
            <span className="font-mono text-slate-100 font-bold whitespace-nowrap">
              {simulatedClickActive && currentStep.simulatedClickLabel
                ? currentStep.simulatedClickLabel
                : currentStep.actionHint}
            </span>
          </motion.div>
        </motion.div>
      )}

      {/* 2.5 100% COMPLETE COPY OF THE ORIGINAL VIRTUAL NUMBER TAB (Steps 1 to 5) */}
      <AnimatePresence>
        {isCatalogStep && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.22 }}
            id="demo-catalog-view"
            className="fixed inset-0 z-[100001] bg-[#f8fafc] text-[#0f172a] overflow-y-auto overscroll-contain touch-pan-y pointer-events-auto pb-28 pt-14 px-3 sm:px-6 font-sans antialiased"
            style={{
              WebkitOverflowScrolling: "touch"
            }}
          >
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Authentic Top App Header */}
              <header className="h-14 sm:h-16 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl flex items-center justify-between px-3 sm:px-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <ZXLogo size={36} interactive={false} withBackground={true} />
                  <div className="flex flex-col leading-none">
                    <span className="text-sm font-black text-slate-900 uppercase">
                      {siteTitle || "ZEROX NETWORK"}
                    </span>
                    <span className="text-[8px] font-bold text-slate-400 font-mono mt-0.5 uppercase">
                      VIRTUAL NUMBER STORE
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-slate-100/80 rounded-full px-3 py-1 flex items-center gap-2 border border-slate-200/50">
                    <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#00AEEF] to-blue-600 text-white flex items-center justify-center">
                      <Wallet className="h-2.5 w-2.5" />
                    </div>
                    <span className="text-xs font-black text-slate-900 font-mono">
                      ₨ 1,250.00
                    </span>
                  </div>
                </div>
              </header>

              {/* Navigation Tabs Bar */}
              <div className="bg-white rounded-2xl p-2 border border-slate-200/60 shadow-xs flex items-center justify-between sm:justify-center gap-2 sm:gap-6 overflow-x-auto">
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black text-[#00AEEF] bg-blue-50/80 border border-blue-200/60 cursor-pointer">
                  <Store className="w-4 h-4" />
                  <span>Virtual Numbers</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 opacity-60">
                  <Globe className="w-4 h-4" />
                  <span className="hidden sm:inline">SMM Services</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 opacity-60">
                  <Crown className="w-4 h-4" />
                  <span className="hidden sm:inline">Subscriptions</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 opacity-60">
                  <Users className="w-4 h-4" />
                  <span className="hidden md:inline">Affiliate</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 opacity-60">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden md:inline">Dashboard</span>
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 opacity-60">
                  <Ticket className="w-4 h-4" />
                  <span className="hidden md:inline">Support</span>
                </div>
              </div>

              {/* Purchase Virtual Number Banner Section */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/98 to-slate-950 border border-slate-800/80 text-white rounded-2xl p-3.5 sm:p-4 md:p-5 shadow-xl transition-all">
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3.5 min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#00AEEF]/20 to-blue-600/20 text-[#00AEEF] border border-[#00AEEF]/30 shadow-[0_0_12px_rgba(0,174,239,0.2)] shrink-0 relative">
                        <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-[#00AEEF]" />
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight truncate">
                          Purchase Virtual Number
                        </h2>
                        <p className="text-[10.5px] sm:text-[11px] text-slate-400 font-medium leading-none mt-0.5 flex items-center gap-1.5">
                          <span>150+ Global Regions</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-emerald-400 font-semibold">Live Stock</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-slate-800/60 sm:border-0 flex-wrap sm:flex-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-[#00AEEF]/10 text-[#00AEEF] border border-[#00AEEF]/30 shadow-[0_0_12px_rgba(0,174,239,0.15)] uppercase tracking-wider select-none shrink-0">
                        <Zap className="w-3 h-3 fill-[#00AEEF] text-[#00AEEF] animate-pulse shrink-0" />
                        <span className="whitespace-nowrap">Instant Allocation</span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-500/20 text-[#00AEEF] border border-blue-400/40 shrink-0 shadow-sm">
                        <Play className="w-2.5 h-2.5 fill-current text-[#00AEEF]" />
                        <span className="whitespace-nowrap">Interactive Demo Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3-Step Premium Checkout Grid (100% Copy of CatalogSelector.tsx) */}
              <div id="demo-catalog-root" className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* STEP 1: Select Country Card */}
                {!isUkSelected ? (
                  <div id="step-1-country-card" className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm transition hover:shadow-md duration-200 h-[400px] sm:h-[450px] lg:h-[520px]">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold font-mono">
                          01
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 leading-tight">Country</h3>
                          <p className="text-[10px] text-slate-400">Select virtual number origin</p>
                        </div>
                      </div>
                      <Globe className="h-4 w-4 text-[#00AEEF] drop-shadow-[0_0_6px_rgba(0,174,239,0.6)] animate-[spin_6s_linear_infinite]" />
                    </div>

                    {/* Quick Select Grid */}
                    <div className="grid grid-cols-3 gap-1.5 mb-3">
                      {/* Pakistan */}
                      <button
                        type="button"
                        className="w-full flex flex-col items-center justify-center p-2 rounded-xl border text-center transition cursor-pointer bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50"
                      >
                        <span className="text-lg mb-0.5">🇵🇰</span>
                        <span className="text-[10px] truncate max-w-full font-medium leading-tight">Pakistan</span>
                      </button>

                      {/* Palestine */}
                      <button
                        type="button"
                        className="w-full flex flex-col items-center justify-center p-1.5 rounded-xl border text-center transition cursor-pointer bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50"
                      >
                        <span className="text-lg mb-0.5">🇵🇸</span>
                        <span className="text-[10px] truncate max-w-full font-medium leading-tight">Palestine</span>
                        <span className="text-[7.5px] text-slate-400 font-medium block leading-none mt-1 tracking-tight scale-95 whitespace-nowrap">
                          love from Pakistan
                        </span>
                      </button>

                      {/* UK (Target in Demo) */}
                      <button
                        type="button"
                        id="demo-country-uk"
                        onClick={() => {
                          if (currentStep.id === "SELECT_COUNTRY") {
                            setSimulatedClickActive(true);
                            setTimeout(() => setCurrentStepIndex(2), 350);
                          }
                        }}
                        className={`w-full flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all duration-150 cursor-pointer ${
                          currentStep.id === "SELECT_COUNTRY"
                            ? simulatedClickActive
                              ? "bg-blue-600 border-2 border-blue-600 text-white shadow-lg ring-4 ring-blue-500/50 scale-95"
                              : "bg-blue-50/90 border-2 border-blue-500 text-blue-700 shadow-md ring-2 ring-blue-400/30 scale-105"
                            : "bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="text-lg mb-0.5">🇬🇧</span>
                        <span className="text-[10px] truncate max-w-full font-bold leading-tight">United Kingdom</span>
                      </button>

                      {/* USA */}
                      <button
                        type="button"
                        className="w-full flex flex-col items-center justify-center p-2 rounded-xl border text-center transition cursor-pointer bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50"
                      >
                        <span className="text-lg mb-0.5">🇺🇸</span>
                        <span className="text-[10px] truncate max-w-full font-medium leading-tight">United States</span>
                      </button>

                      {/* India */}
                      <button
                        type="button"
                        className="w-full flex flex-col items-center justify-center p-2 rounded-xl border text-center transition cursor-pointer bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50"
                      >
                        <span className="text-lg mb-0.5">🇮🇳</span>
                        <span className="text-[10px] truncate max-w-full font-medium leading-tight">India</span>
                      </button>

                      {/* Germany */}
                      <button
                        type="button"
                        className="w-full flex flex-col items-center justify-center p-2 rounded-xl border text-center transition cursor-pointer bg-slate-50/50 border-slate-100 text-slate-600 hover:bg-slate-50"
                      >
                        <span className="text-lg mb-0.5">🇩🇪</span>
                        <span className="text-[10px] truncate max-w-full font-medium leading-tight">Germany</span>
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        readOnly
                        placeholder="Search 153 countries..."
                        value={currentStep.id === "SELECT_COUNTRY" ? "United Kingdom" : ""}
                        className="w-full bg-slate-50/60 border border-slate-200/80 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none"
                      />
                    </div>

                    {/* Scrollable list */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                      {/* UK Row */}
                      <div
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition border ${
                          currentStep.id === "SELECT_COUNTRY"
                            ? "bg-blue-50/90 border-blue-400 text-blue-900 font-bold"
                            : "bg-transparent border-transparent text-slate-600 hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">🇬🇧</span>
                          <span className="font-semibold text-slate-800">United Kingdom</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100/80 px-1.5 py-0.5 rounded">
                          +44
                        </span>
                      </div>

                      {/* USA Row */}
                      <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition border bg-transparent border-transparent text-slate-600 hover:bg-slate-50/80">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">🇺🇸</span>
                          <span className="font-medium text-slate-700">United States</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100/80 px-1.5 py-0.5 rounded">
                          +1
                        </span>
                      </div>

                      {/* Pakistan Row */}
                      <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition border bg-transparent border-transparent text-slate-600 hover:bg-slate-50/80">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">🇵🇰</span>
                          <span className="font-medium text-slate-700">Pakistan</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100/80 px-1.5 py-0.5 rounded">
                          +92
                        </span>
                      </div>

                      {/* Palestine Row */}
                      <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition border bg-transparent border-transparent text-slate-600 hover:bg-slate-50/80">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">🇵🇸</span>
                          <span className="font-medium text-slate-700">Palestine</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100/80 px-1.5 py-0.5 rounded">
                          +970
                        </span>
                      </div>

                      {/* Germany Row */}
                      <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition border bg-transparent border-transparent text-slate-600 hover:bg-slate-50/80">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base leading-none">🇩🇪</span>
                          <span className="font-medium text-slate-700">Germany</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100/80 px-1.5 py-0.5 rounded">
                          +49
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Collapsed Selected Country Pill (Exact copy from CatalogSelector.tsx) */
                  <div
                    id="step-1-country-card"
                    className="flex items-center w-full py-1.5 px-1.5 rounded-full border border-blue-400 bg-white shadow-sm mb-4 lg:mb-0"
                  >
                    <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 mr-3">
                      <X className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2.5 flex-1 pr-3">
                      <span className="text-xl leading-none">🇬🇧</span>
                      <span className="font-bold text-blue-500 text-[15px]">United Kingdom</span>
                    </div>
                  </div>
                )}

                {/* STEP 2: Select Service Card */}
                {!isWhatsAppSelected ? (
                  <div id="step-2-service-card" className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-5 flex flex-col shadow-sm transition hover:shadow-md duration-200 h-[400px] sm:h-[450px] lg:h-[520px]">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold font-mono">
                          02
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 leading-tight">Service</h3>
                          <p className="text-[10px] text-slate-400">Select application to verify</p>
                        </div>
                      </div>
                      <Hash className="h-4 w-4 text-fuchsia-500 drop-shadow-[0_0_6px_rgba(217,70,239,0.6)] animate-pulse" />
                    </div>

                    {/* Service category filters */}
                    <div className="flex gap-1 mb-3">
                      <button
                        type="button"
                        className="flex-1 py-1 px-1.5 rounded-xl text-[10px] sm:text-[10.5px] font-bold border transition bg-slate-900 border-slate-900 text-white"
                      >
                        All (126)
                      </button>
                      <button
                        type="button"
                        className="flex-1 py-1 px-1.5 rounded-xl text-[10px] sm:text-[10.5px] font-bold border transition bg-amber-50/50 border-amber-200/60 text-amber-700 flex items-center justify-center gap-1"
                      >
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        Starred (0)
                      </button>
                      <button
                        type="button"
                        className="flex-1 py-1 px-1.5 rounded-xl text-[10px] sm:text-[10.5px] font-bold border transition bg-slate-50/50 border-slate-100 text-slate-500"
                      >
                        Popular
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        readOnly
                        placeholder="Search 126 platforms..."
                        value={currentStep.id === "SELECT_SERVICE" ? "WhatsApp" : ""}
                        className="w-full bg-slate-50/60 border border-slate-200/80 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 font-medium focus:outline-none"
                      />
                    </div>

                    {/* Service List Scroll Area */}
                    <div className="flex-1 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
                      {/* WhatsApp (Target in Demo) */}
                      <div
                        id="demo-service-whatsapp"
                        onClick={() => {
                          if (currentStep.id === "SELECT_SERVICE") {
                            setSimulatedClickActive(true);
                            setTimeout(() => setCurrentStepIndex(3), 350);
                          }
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition-all duration-150 border cursor-pointer ${
                          currentStep.id === "SELECT_SERVICE"
                            ? simulatedClickActive
                              ? "bg-blue-600 border-2 border-blue-600 text-white shadow-lg ring-4 ring-blue-500/50 scale-98"
                              : "bg-blue-50/90 border-2 border-blue-500 text-blue-900 shadow-md ring-2 ring-blue-400/30 scale-[1.02]"
                            : "bg-transparent border-transparent text-slate-600 hover:bg-slate-50/80"
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400 shrink-0" />
                          <div className="p-1.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-600 shrink-0">
                            <MessageSquare className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-bold text-slate-800 truncate">WhatsApp</span>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">From</span>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-800">
                            ₨ 236 <span className="text-[10px] font-normal text-emerald-600 font-mono">($0.85)</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                            1,420 left
                          </span>
                        </div>
                      </div>

                      {/* Telegram */}
                      <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition border bg-transparent border-transparent text-slate-600 hover:bg-slate-50/80">
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <Star className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                          <div className="p-1.5 rounded-lg border bg-sky-50 border-sky-200 text-sky-500 shrink-0">
                            <Send className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold text-slate-700 truncate">Telegram</span>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">From</span>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-800">
                            ₨ 190 <span className="text-[10px] font-normal text-emerald-600 font-mono">($0.68)</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                            1,820 left
                          </span>
                        </div>
                      </div>

                      {/* Google */}
                      <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition border bg-transparent border-transparent text-slate-600 hover:bg-slate-50/80">
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <Star className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                          <div className="p-1.5 rounded-lg border bg-red-50 border-red-200 text-red-500 shrink-0">
                            <Globe className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold text-slate-700 truncate">Google</span>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">From</span>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-800">
                            ₨ 170 <span className="text-[10px] font-normal text-emerald-600 font-mono">($0.61)</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                            940 left
                          </span>
                        </div>
                      </div>

                      {/* OpenAI */}
                      <div className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left text-xs transition border bg-transparent border-transparent text-slate-600 hover:bg-slate-50/80">
                        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
                          <Star className="h-3.5 w-3.5 text-slate-300 shrink-0" />
                          <div className="p-1.5 rounded-lg border bg-emerald-50 border-emerald-200 text-emerald-600 shrink-0">
                            <Sparkles className="h-3.5 w-3.5" />
                          </div>
                          <span className="font-semibold text-slate-700 truncate">OpenAI / ChatGPT</span>
                        </div>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">From</span>
                          <span className="text-[10px] sm:text-xs font-bold text-slate-800">
                            ₨ 180 <span className="text-[10px] font-normal text-emerald-600 font-mono">($0.65)</span>
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-0.5">
                            1,150 left
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Collapsed Selected Service Pill (Exact copy from CatalogSelector.tsx) */
                  <div
                    id="step-2-service-card"
                    className="flex items-center w-full py-1.5 px-1.5 rounded-full border border-blue-400 bg-white shadow-sm mb-4 lg:mb-0"
                  >
                    <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-blue-50 text-blue-500 mr-3">
                      <X className="h-4 w-4" />
                    </div>
                    <div className="flex items-center gap-2.5 flex-1 pr-3 min-w-0">
                      <div className="p-1.5 rounded-full border bg-slate-50 border-slate-200 shrink-0">
                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                      </div>
                      <span className="font-bold text-blue-500 text-[15px] truncate">WhatsApp</span>
                    </div>
                  </div>
                )}

                {/* STEP 3: Final Order Checkout Card (Exact copy from CatalogSelector.tsx) */}
                <div id="step-3-order-card" className="bg-white border border-slate-200/60 rounded-2xl p-4 sm:p-5 flex flex-col h-auto justify-between shadow-sm transition hover:shadow-md duration-200">
                  <div>
                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs font-bold font-mono">
                          03
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 leading-tight">Final Order</h3>
                          <p className="text-[10px] text-slate-400">Review and allocate number</p>
                        </div>
                      </div>
                      <ShieldCheck className="h-4 w-4 text-emerald-500 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse" />
                    </div>

                    {/* Mode Switcher inside Checkout */}
                    <div className="grid grid-cols-2 gap-1 bg-slate-100/80 p-1 rounded-xl mb-4">
                      <button
                        type="button"
                        className="py-1.5 rounded-lg text-[10px] font-bold bg-white text-blue-600 shadow-sm flex items-center justify-center gap-1.5"
                      >
                        <Layers className="h-3 w-3" />
                        <span>Auto Stock</span>
                      </button>
                      <button
                        type="button"
                        className="py-1.5 rounded-lg text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5"
                      >
                        <Smartphone className="h-3 w-3" />
                        <span>By Number</span>
                      </button>
                    </div>

                    {/* Selection Overview Section */}
                    <div className="space-y-3.5 mb-4 bg-slate-50/60 rounded-2xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Origin:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-base leading-none">🇬🇧</span>
                          <span className="text-xs font-bold text-slate-700">United Kingdom</span>
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">(+44)</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Platform:</span>
                        <div className="flex items-center gap-1.5">
                          <div className="p-1 rounded bg-slate-100 text-emerald-500">
                            <MessageSquare className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-bold text-slate-700">WhatsApp</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">Operator Route:</span>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border text-emerald-600 bg-emerald-50 border-emerald-200/50">
                            1,420 Numbers Stock
                          </span>
                        </div>

                        {/* Operator Dropdown Box */}
                        <div
                          id="demo-operator-box"
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 px-3 text-[11px] text-slate-800 font-mono flex justify-between items-center shadow-sm"
                        >
                          <div className="flex items-center gap-2 text-left truncate">
                            <Radio className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span className="font-bold block truncate">O2 UK</span>
                          </div>
                          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                        </div>
                      </div>
                    </div>

                    {/* Total Price Box */}
                    <div className="bg-slate-50/60 border border-slate-200/60 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-500 font-mono">Total Price</span>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="text-lg sm:text-xl font-black text-slate-800">₨ 236</span>
                          <span className="text-blue-500 font-black text-sm sm:text-base font-mono">($0.85)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Allocate Number Buy Button */}
                  <div className="space-y-3 mt-4">
                    <button
                      id="demo-buy-btn"
                      type="button"
                      onClick={() => {
                        if (currentStep.id === "ALLOCATE_BUTTON") {
                          setSimulatedClickActive(true);
                          setTimeout(() => setCurrentStepIndex(5), 400);
                        }
                      }}
                      className={`w-full font-bold py-3.5 px-6 rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                        isAllocatingNow
                          ? "bg-emerald-500 text-white shadow-emerald-500/20 scale-98"
                          : "bg-[#00AEEF] hover:bg-[#009CD6] text-white shadow-[#00AEEF]/20 hover:scale-[1.01]"
                      }`}
                    >
                      {isAllocatingNow ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin text-white" />
                          <span>Allocating Line...</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          <span>Allocate Virtual Number</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. 100% COMPLETE COPY OF ORIGINAL ORDER DETAILS PAGE (Steps 6, 7 & 8) */}
      <AnimatePresence>
        {isOrderDetailsStep && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.25 }}
            id="demo-order-detail-view"
            className="fixed inset-0 z-[100001] bg-[#070B12] overflow-y-auto overscroll-contain touch-pan-y pointer-events-auto pb-28 pt-14 px-3 sm:px-6 font-sans text-slate-100"
            style={{
              WebkitOverflowScrolling: "touch"
            }}
          >
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Header Bar */}
              <div className="bg-[#0B0F19] border border-slate-800 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-md">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1 text-xs font-semibold">
                    <ArrowLeft className="h-3.5 w-3.5 text-[#00AEEF]" />
                    <span className="hidden sm:inline">Back</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-mono font-black text-white">Order #ZX-78924</span>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        CODE RECEIVED
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      WhatsApp · 🇬🇧 United Kingdom (+44)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 text-[#00AEEF] animate-spin" />
                    <span className="hidden sm:inline text-[11px]">Sync Status</span>
                  </div>
                  <div className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-[#00AEEF]" />
                    <span className="hidden md:inline">Invoice</span>
                  </div>
                </div>
              </div>

              {/* Section 1: Allocated Virtual Number Card */}
              <div
                id="demo-order-allocated-card"
                className={`bg-[#0D1321] rounded-2xl p-4 sm:p-6 border transition-all duration-300 shadow-lg ${
                  currentStep.id === "ORDER_DETAILS_NUMBER"
                    ? "border-2 border-[#00AEEF] ring-4 ring-[#00AEEF]/20"
                    : "border-slate-800"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="p-1.5 rounded-lg border bg-emerald-500/10 border-emerald-500/30 text-emerald-400 inline-flex items-center justify-center">
                        <Zap className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-300">
                        🇬🇧 United Kingdom · WhatsApp
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                        O2 UK
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="text-[10px] font-mono font-bold text-[#00AEEF] uppercase tracking-wider block">
                        Allocated Virtual Number
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                        +44 7911 123456
                      </h2>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => setDemoCopiedNumber(true)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-[#00AEEF] font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {demoCopiedNumber ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Copied ✓</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy Full</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setDemoCopiedLocal(true)}
                      className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-200 hover:text-white font-bold text-xs font-mono transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {demoCopiedLocal ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Copied ✓</span>
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
              </div>

              {/* Section 2: Session Timer Bar */}
              <div
                id="demo-order-timer-bar"
                className="bg-[#0D1321] border border-slate-800 rounded-2xl p-4 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-300 font-semibold">
                    <Clock className="h-4 w-4 text-[#00AEEF]" />
                    <span>Activation Session Timer (Authoritative)</span>
                  </div>
                  <span className="font-mono font-black text-white">
                    {formatDemoTimer(demoTimerSeconds)}{" "}
                    <span className="text-slate-400 font-normal text-xs">remaining</span>
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-[#00AEEF] rounded-full transition-all duration-1000"
                    style={{ width: `${Math.max(5, (demoTimerSeconds / 900) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Section 3: SMS / OTP Verification Code */}
              <div
                id="demo-order-otp-box"
                className={`bg-[#0D1321] rounded-2xl p-4 sm:p-6 border transition-all duration-300 shadow-md space-y-3 ${
                  currentStep.id === "ORDER_DETAILS_OTP"
                    ? "border-2 border-emerald-500 ring-4 ring-emerald-500/20"
                    : "border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                      SMS Verification Code (OTP)
                    </h3>
                  </div>
                  {demoOtpReceived ? (
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      1 Code Received
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-[#00AEEF] border border-cyan-500/30 flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#00AEEF]" />
                      Listening on Line...
                    </span>
                  )}
                </div>

                {!demoOtpReceived ? (
                  /* Waiting for Incoming SMS State */
                  <div className="bg-[#0B0F19] border border-cyan-500/20 rounded-xl p-5 sm:p-6 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-[#00AEEF]">
                      <RefreshCw className="h-4 w-4 animate-spin text-[#00AEEF]" />
                      <span className="text-xs font-mono font-bold uppercase tracking-wider">
                        Waiting for incoming WhatsApp SMS...
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-mono font-bold text-slate-500 tracking-widest">
                      ••• - •••
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Paste allocated number <strong className="text-slate-200 font-mono">+44 7911 123456</strong> into WhatsApp to send verification code.
                    </p>
                  </div>
                ) : (
                  /* Live Code Arrived State */
                  <>
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 sm:p-5 text-center space-y-3 shadow-lg ring-1 ring-emerald-500/20"
                    >
                      <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-[10px] font-mono font-black uppercase tracking-widest">
                        <Sparkles className="w-3.5 h-3.5 fill-current" />
                        <span>SMS CODE RECEIVED LIVE</span>
                      </div>
                      <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 tracking-wider">
                        849-201
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setDemoCopiedOtp(true)}
                          className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs font-mono transition flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                        >
                          {demoCopiedOtp ? (
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

                        <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs">
                          Finish Activation
                        </div>
                      </div>
                    </motion.div>

                    {/* Received Message Bubble */}
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#0B0F19] border border-slate-800 rounded-xl p-3.5 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#00AEEF] font-mono">Sender: WhatsApp</span>
                        <span className="text-[10px] text-emerald-400 font-mono font-bold">Just now</span>
                      </div>
                      <p className="text-xs text-slate-300 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                        Your WhatsApp verification code is: 849-201. Do not share this code with anyone.
                      </p>
                    </motion.div>
                  </>
                )}
              </div>

              {/* Section 4: Order Management & Refund Guarantees */}
              <div
                id="demo-order-management-card"
                className={`bg-[#0D1321] rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-md space-y-3 ${
                  currentStep.id === "ORDER_DETAILS_OPTIONS"
                    ? "border-2 border-[#00AEEF] ring-4 ring-[#00AEEF]/20"
                    : "border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-[#00AEEF]" />
                    <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
                      Order Actions & Refund Rules
                    </h3>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Guaranteed Policy
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 15-Min Auto Expiry */}
                  <div className="p-3 rounded-xl bg-[#0B0F19] border border-emerald-500/20 text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>15-Min Auto Expiry</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-snug">
                      If no code arrives within 15 mins, order automatically expires with a <strong className="text-emerald-300 font-mono">100% full refund</strong>.
                    </p>
                  </div>

                  {/* Manual Cancel */}
                  <div className="p-3 rounded-xl bg-[#0B0F19] border border-rose-500/20 text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold font-mono">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Manual Cancel</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-snug">
                      Cancel order before SMS arrives for a <strong className="text-rose-300 font-mono">93% net refund</strong> credited instantly to wallet.
                    </p>
                  </div>

                  {/* Code Received Rule */}
                  <div className="p-3 rounded-xl bg-[#0B0F19] border border-amber-500/20 text-left space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold font-mono">
                      <Ban className="w-3.5 h-3.5" />
                      <span>Code Received Rule</span>
                    </div>
                    <p className="text-[10px] text-slate-300 leading-snug">
                      Once an SMS code is received, <strong className="text-amber-300 font-mono">no refunds</strong> are permitted as activation is complete.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. ACTIVATION HISTORY & PDF INVOICE DOWNLOAD VIEW (Step 9) */}
      <AnimatePresence>
        {isHistoryStep && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            transition={{ duration: 0.22 }}
            id="demo-history-modal-overlay"
            className="fixed inset-0 z-[100001] bg-slate-950/90 overflow-y-auto overscroll-contain pointer-events-auto flex items-center justify-center p-3 sm:p-6 pb-28 pt-14 font-sans text-slate-100"
          >
            <div
              id="demo-history-card"
              className="w-full max-w-xl bg-[#0D1321] text-white rounded-3xl p-4 sm:p-6 shadow-2xl border-2 border-[#00AEEF] ring-4 ring-[#00AEEF]/20 space-y-4"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#00AEEF]/15 border border-[#00AEEF]/30 text-[#00AEEF] flex items-center justify-center shrink-0">
                    <History className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                      <span>Activation History</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-[#00AEEF] border border-blue-500/30 uppercase font-bold">
                        Live History
                      </span>
                    </h2>
                    <p className="text-[11px] text-slate-400">
                      View all active orders, re-copy SMS codes, and download official PDF tax invoices.
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs bar inside Activation History */}
              <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2">
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-[#00AEEF]/15 text-[#00AEEF] border border-[#00AEEF]/30 text-xs font-bold font-mono"
                >
                  All Orders (1)
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400 text-xs font-medium"
                >
                  Active Numbers (0)
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-slate-900 text-slate-400 text-xs font-medium"
                >
                  Completed (1)
                </button>
              </div>

              {/* Order Row Card */}
              <div className="bg-[#0B0F19] border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base">🇬🇧</span>
                      <span className="font-mono font-black text-white text-sm sm:text-base">
                        +44 7911 123456
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        COMPLETED ✓
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Service: WhatsApp 💬 • Route: O2 UK • Price: ₨ 236 ($0.85)
                    </p>
                  </div>

                  <span className="text-[10px] text-slate-500 font-mono shrink-0">Just now</span>
                </div>

                {/* Received Code Display in History */}
                <div className="bg-slate-950/90 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[9px] font-mono text-emerald-400 uppercase font-extrabold block">
                      Received WhatsApp OTP
                    </span>
                    <span className="text-lg sm:text-xl font-black font-mono text-emerald-400 tracking-wider">
                      849-201
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDemoCopiedOtp(true)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs font-mono border border-emerald-500/40 hover:bg-emerald-500/30 transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    {demoCopiedOtp ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Invoice PDF Download Section */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-800/80 gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono">
                    <FileText className="w-3.5 h-3.5 text-[#00AEEF]" />
                    <span>Tax Invoice #INV-ZX-78924</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPdfInvoice}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00AEEF] to-blue-600 hover:from-[#009CD6] hover:to-blue-700 text-slate-950 font-black text-xs font-mono transition flex items-center gap-2 shadow-lg shadow-[#00AEEF]/25 cursor-pointer active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-950" />
                    <span>Download PDF Invoice</span>
                  </button>
                </div>
              </div>

              {/* Tax Invoice Document Preview */}
              <div className="bg-white text-slate-900 rounded-2xl p-4 space-y-2.5 shadow-md border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <ZXLogo size={22} interactive={false} withBackground={false} />
                    <span className="text-xs font-black font-mono text-slate-900">
                      ZEROX NETWORK TAX INVOICE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    PAID & VERIFIED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Invoice No:</span>
                    <strong className="text-slate-900">#INV-ZX-78924</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Allocated Line:</span>
                    <strong className="text-blue-600">+44 7911 123456</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Total Amount:</span>
                    <strong className="text-slate-900">₨ 236 ($0.85 USD)</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">Payment Method:</span>
                    <strong className="text-slate-900">ZeroX Wallet Balance</strong>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. FINAL CELEBRATION (Step 10) */}
      <AnimatePresence>
        {isCompletionStep && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            id="demo-completion-card"
            className="fixed inset-0 z-[100001] bg-slate-950/95 overflow-y-auto pointer-events-auto flex items-center justify-center p-3 sm:p-6 pb-28 pt-14"
          >
            <div className="w-full max-w-sm bg-slate-900 text-white rounded-2xl p-5 sm:p-6 border border-[#00AEEF]/50 shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00AEEF] to-blue-600 text-slate-950 mx-auto flex items-center justify-center shadow-lg shadow-[#00AEEF]/30">
                <Sparkles className="w-6 h-6 fill-current text-white" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg font-black text-white">
                  Ready to Order Your Virtual Number?
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Deposit funds into your wallet to start activating numbers in seconds.
                </p>
              </div>

              <div className="pt-1 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleExitTutorial();
                    if (onNavigateToWallet) onNavigateToWallet();
                  }}
                  className="w-full py-3 rounded-xl bg-[#00AEEF] hover:bg-[#009CD6] text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-[#00AEEF]/30 transition active:scale-95 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Deposit & Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleRestartDemo}
                  className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Replay Demo</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. ENHANCED ORGANIZED STEP BAR (Bottom Floating Bar) */}
      <div
        className="pointer-events-auto"
        style={{
          position: "fixed",
          bottom: "12px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(96vw, 560px)",
          zIndex: 100006
        }}
      >
        <motion.div
          key={currentStep.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="bg-[#0A0E17]/95 text-white border border-slate-700/80 rounded-2xl p-3 sm:px-4 sm:py-3 shadow-2xl flex items-center justify-between gap-3 backdrop-blur-xl ring-1 ring-white/10"
        >
          {/* Step Icon & Organized Content */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-[#00AEEF] flex items-center justify-center shrink-0 shadow-sm">
              <IconComp className="w-4 h-4" />
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-[#00AEEF]/20 text-[#00AEEF] text-[10px] font-mono font-black border border-[#00AEEF]/40 shrink-0">
                  STEP {currentStep.stepNumber}/{currentStep.totalSteps}
                </span>
                <span className="text-xs sm:text-sm font-black text-white tracking-wide truncate">
                  {currentStep.title}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-medium leading-normal truncate">
                {currentStep.shortCaption}
              </p>
            </div>
          </div>

          {/* Quick Navigation Buttons */}
          <div className="flex items-center gap-1.5 shrink-0 pl-1 border-l border-slate-800">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className={`p-2 rounded-xl text-xs font-bold transition flex items-center justify-center ${
                currentStepIndex === 0
                  ? "opacity-30 cursor-not-allowed text-slate-600"
                  : "bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white cursor-pointer active:scale-95"
              }`}
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNextStep}
              className="px-3.5 py-2 rounded-xl bg-[#00AEEF] hover:bg-[#009CD6] text-slate-950 font-black text-xs sm:text-xs flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-lg shadow-[#00AEEF]/25"
            >
              <span>{currentStepIndex === TUTORIAL_STEPS.length - 1 ? "Done" : "Next"}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
