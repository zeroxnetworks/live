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
  Globe,
  Clock,
  ShieldCheck,
  Zap,
  MousePointer,
  Check,
  Copy,
  FileText,
  Wallet,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Search,
  ChevronDown,
  ShoppingCart,
  Layers,
  ListFilter,
  Link as LinkIcon,
  Download,
  BarChart3,
  TrendingUp,
  Info,
  Sparkle,
  Eye,
  CheckCircle
} from "lucide-react";

export type SmmTutorialStepId =
  | "OVERVIEW"
  | "SELECT_PLATFORM"
  | "SELECT_CATEGORY"
  | "SELECT_PACKAGE"
  | "TARGET_LINK"
  | "QUANTITY_AND_PRESETS"
  | "SUBMIT_ORDER"
  | "ORDER_TRACKING_AND_SYNC"
  | "AUTO_REFILL_AND_RECEIPT"
  | "COMPLETED";

interface SmmStepDefinition {
  id: SmmTutorialStepId;
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

const SMM_TUTORIAL_STEPS: SmmStepDefinition[] = [
  {
    id: "OVERVIEW",
    badge: "1/10",
    stepNumber: 1,
    totalSteps: 10,
    title: "SMM Campaign Flow Overview",
    shortCaption: "Step 1: Gateway • Step 2: Category • Step 3: Package • Step 4: Link & Qty • Step 5: Instant Dispatch.",
    voiceText: "Welcome to Zerox Network Social Media Marketing services. Here is how to create high-speed campaigns and track your orders in real time.",
    targetSelector: "#smm-demo-catalog-root",
    fallbackSelector: "#smm-demo-main-view",
    icon: Sparkles,
    actionHint: "Viewing SMM Gateway",
    clickDelayMs: 1200,
    fallbackDurationMs: 4800
  },
  {
    id: "SELECT_PLATFORM",
    badge: "2/10",
    stepNumber: 2,
    totalSteps: 10,
    title: "Step 1: Select Platform Gateway (TikTok)",
    shortCaption: "Filter instantly across Instagram, TikTok, YouTube, Telegram, WhatsApp & more.",
    voiceText: "Step one: Select your target platform gateway. For example, let's select TikTok for likes, views, or followers.",
    targetSelector: "#smm-demo-platform-tiktok",
    fallbackSelector: "#smm-demo-platform-bar",
    icon: Zap,
    actionHint: "Selecting TikTok Gateway",
    simulatedClickLabel: "TikTok Gateway Selected ✓",
    clickDelayMs: 1800,
    fallbackDurationMs: 5200
  },
  {
    id: "SELECT_CATEGORY",
    badge: "3/10",
    stepNumber: 3,
    totalSteps: 10,
    title: "Step 2: Choose Service Category",
    shortCaption: "Browse categorized services with search filter & category IDs (#01, #02...).",
    voiceText: "Step two: Choose your service category. Let's select TikTok Likes with non-drop and high-speed delivery.",
    targetSelector: "#smm-demo-category-select",
    fallbackSelector: "#smm-demo-form-card",
    icon: Layers,
    actionHint: "Choosing Category #01",
    simulatedClickLabel: "TikTok Likes [Non Drop | Good Speed] Selected ✓",
    clickDelayMs: 1800,
    fallbackDurationMs: 5200
  },
  {
    id: "SELECT_PACKAGE",
    badge: "4/10",
    stepNumber: 4,
    totalSteps: 10,
    title: "Step 3: Select Package & Inspect SLA",
    shortCaption: "Review package rates, instant speed SLA, 30-day auto-refill, and min/max order limits.",
    voiceText: "Step three: Choose your package. Review the live rate per one thousand, instant start speed, and 30-day auto-refill guarantee.",
    targetSelector: "#smm-demo-package-select",
    fallbackSelector: "#smm-demo-specs-card",
    icon: ShoppingCart,
    actionHint: "Selecting Package #01",
    simulatedClickLabel: "Package #01 Selected • Rs 180 / 1K ✓",
    clickDelayMs: 1500,
    fallbackDurationMs: 4800
  },
  {
    id: "TARGET_LINK",
    badge: "5/10",
    stepNumber: 5,
    totalSteps: 10,
    title: "Step 4: Target Destination Link",
    shortCaption: "Paste your public post link, video URL, or account username.",
    voiceText: "Step four: Enter your target destination link. Make sure your post or profile is public before submitting.",
    targetSelector: "#smm-demo-link-input",
    fallbackSelector: "#smm-demo-form-card",
    icon: LinkIcon,
    actionHint: "Entering Public Link",
    simulatedClickLabel: "tiktok.com/@creator/video/739182390123 ✓",
    clickDelayMs: 1600,
    fallbackDurationMs: 5000
  },
  {
    id: "QUANTITY_AND_PRESETS",
    badge: "6/10",
    stepNumber: 6,
    totalSteps: 10,
    title: "Step 5: Order Quantity & Live Cost",
    shortCaption: "Type quantity or tap quick preset pills (+500, +1,000, +2,500). Live cost calculated instantly.",
    voiceText: "Step five: Enter your desired quantity or tap quick preset buttons. Your total cost in rupees and USD is calculated automatically from your wallet.",
    targetSelector: "#smm-demo-quantity-box",
    fallbackSelector: "#smm-demo-total-cost-box",
    icon: TrendingUp,
    actionHint: "Setting Quantity to 2,500",
    simulatedClickLabel: "Quantity: 2,500 • Total: Rs 450 ($1.62) ✓",
    clickDelayMs: 1800,
    fallbackDurationMs: 5000
  },
  {
    id: "SUBMIT_ORDER",
    badge: "7/10",
    stepNumber: 7,
    totalSteps: 10,
    title: "Step 6: Instant Order Dispatch",
    shortCaption: "Click Submit Order. Campaign starts dispatching instantly to server nodes.",
    voiceText: "Click Submit Order. Your order is sent directly to the high-speed server queue for immediate processing.",
    targetSelector: "#smm-demo-submit-btn",
    fallbackSelector: "#smm-demo-form-card",
    icon: Zap,
    actionHint: "Submitting SMM Order",
    simulatedClickLabel: "Order Placed Successfully! ✓",
    clickDelayMs: 1200,
    fallbackDurationMs: 4400
  },
  {
    id: "ORDER_TRACKING_AND_SYNC",
    badge: "8/10",
    stepNumber: 8,
    totalSteps: 10,
    title: "Step 7: Orders & Real-Time Tracking",
    shortCaption: "Monitor Order ID, Start Count, Quantity, Remains, and Live Status in real-time.",
    voiceText: "In the Orders and Tracking tab, monitor your live campaign progress. Click Sync Live Status anytime to refresh server counts and delivery state.",
    targetSelector: "#smm-demo-tracking-tab-btn",
    fallbackSelector: "#smm-demo-tracking-table",
    icon: Clock,
    actionHint: "Live Tracking & Sync",
    simulatedClickLabel: "Live Status: In Progress • 1,850 / 2,500 Delivered ✓",
    clickDelayMs: 2200,
    fallbackDurationMs: 6000
  },
  {
    id: "AUTO_REFILL_AND_RECEIPT",
    badge: "9/10",
    stepNumber: 9,
    totalSteps: 10,
    title: "Step 8: 30-Day Auto Refill & PDF Invoice",
    shortCaption: "Trigger 1-click Auto Refill if drops occur • Download official ZeroX Network PDF Tax Invoice.",
    voiceText: "Enjoy peace of mind with 30-day auto-refill protection and download official PDF tax invoices for all your social media campaigns.",
    targetSelector: "#smm-demo-order-actions-box",
    fallbackSelector: "#smm-demo-invoice-btn",
    icon: ShieldCheck,
    actionHint: "Refill Protection & Tax Invoice",
    simulatedClickLabel: "PDF Tax Invoice #SMM-94812 Downloaded ✓",
    clickDelayMs: 2400,
    fallbackDurationMs: 6800
  },
  {
    id: "COMPLETED",
    badge: "✓",
    stepNumber: 10,
    totalSteps: 10,
    title: "Ready to Boost Your Reach!",
    shortCaption: "Top up your wallet and launch automated social media campaigns in seconds.",
    voiceText: "You are all set. Top up your wallet and launch high-speed campaigns anytime.",
    targetSelector: "#smm-demo-completion-card",
    icon: Sparkles,
    actionHint: "Demo Complete",
    clickDelayMs: 1000,
    fallbackDurationMs: 6000
  }
];

interface SmmHowToOrderTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToWallet?: () => void;
  siteLogoUrl?: string;
  siteTitle?: string;
  formatPrice?: (baseUnits: number) => string;
}

export const SmmHowToOrderTutorial: React.FC<SmmHowToOrderTutorialProps> = ({
  isOpen,
  onClose,
  onNavigateToWallet,
  siteLogoUrl,
  siteTitle,
  formatPrice = (val: number) => `Rs ${Math.round(val * 278).toLocaleString()}`
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zerox_smm_tutorial_voice_enabled");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  // Interactive simulated states
  const [simulatedClickActive, setSimulatedClickActive] = useState(false);
  const [demoSelectedPlatform, setDemoSelectedPlatform] = useState<string>("all");
  const [demoCategoryOpen, setDemoCategoryOpen] = useState(false);
  const [demoPackageOpen, setDemoPackageOpen] = useState(false);
  const [demoTypedLink, setDemoTypedLink] = useState("");
  const [demoQuantity, setDemoQuantity] = useState<number | "">(1000);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoActiveMode, setDemoActiveMode] = useState<"order" | "tracking">("order");
  const [demoSyncing, setDemoSyncing] = useState(false);
  const [demoRefilled, setDemoRefilled] = useState(false);

  const autoPlayTimerRef = useRef<any>(null);
  const clickAnimTimerRef = useRef<any>(null);
  const typeLinkTimerRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentStep = SMM_TUTORIAL_STEPS[currentStepIndex] || SMM_TUTORIAL_STEPS[0];

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
        if (autoPlay && currentStepIndex < SMM_TUTORIAL_STEPS.length - 1) {
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

  // Handle PDF Invoice Download in Demo
  const handleDownloadPdfInvoice = () => {
    const invoiceContent = `================================================
ZEROX NETWORK - SMM CAMPAIGN TAX INVOICE
================================================
Invoice Number: #INV-SMM-94812
Order ID: #SMM-94812
Date: ${new Date().toLocaleDateString()}
Payment Method: ZeroX Wallet Balance
Status: ACTIVE / IN PROGRESS

------------------------------------------------
Platform: TikTok Gateway
Category: TikTok Likes | Non Drop | Fast Speed
Package: #01 TikTok Likes (Instant Speed, 30d Refill)
Target Link: https://www.tiktok.com/@creator/video/739182390123
Quantity Ordered: 2,500 Likes
Rate: Rs 180 / 1,000
Total Paid: Rs 450 ($1.62 USD)
Auto-Refill: 30-Day Auto Refill Guaranteed
------------------------------------------------

Thank you for boosting your reach with ZeroX Network!
Official Portal: https://zeroxnetwork.com
================================================`;

    try {
      const blob = new Blob([invoiceContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_SMM_94812_ZeroXNetwork.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("SMM Tax Invoice #INV-SMM-94812 Downloaded!");
    } catch {
      toast.success("SMM Tax Invoice #INV-SMM-94812 Ready!");
    }
  };

  // Smooth scroll and target positioning
  const updateTargetPosition = useCallback((shouldScroll = true) => {
    const target =
      document.querySelector(currentStep.targetSelector) ||
      (currentStep.fallbackSelector ? document.querySelector(currentStep.fallbackSelector) : null);

    if (target) {
      if (shouldScroll) {
        const scrollContainer =
          document.getElementById("smm-demo-main-view") ||
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

    clearTimeout(clickAnimTimerRef.current);
    clearTimeout(typeLinkTimerRef.current);

    // Dynamic state transitions per step
    if (currentStep.id === "OVERVIEW") {
      setDemoActiveMode("order");
      setDemoSelectedPlatform("all");
      setDemoCategoryOpen(false);
      setDemoPackageOpen(false);
      setDemoTypedLink("");
      setDemoQuantity(1000);
      setDemoSubmitted(false);
    } else if (currentStep.id === "SELECT_PLATFORM") {
      setDemoActiveMode("order");
      setDemoSelectedPlatform("tiktok");
      setDemoCategoryOpen(false);
      setDemoPackageOpen(false);
    } else if (currentStep.id === "SELECT_CATEGORY") {
      setDemoActiveMode("order");
      setDemoSelectedPlatform("tiktok");
      setDemoCategoryOpen(true);
      setDemoPackageOpen(false);
    } else if (currentStep.id === "SELECT_PACKAGE") {
      setDemoActiveMode("order");
      setDemoCategoryOpen(false);
      setDemoPackageOpen(true);
    } else if (currentStep.id === "TARGET_LINK") {
      setDemoActiveMode("order");
      setDemoCategoryOpen(false);
      setDemoPackageOpen(false);
      setDemoTypedLink("");
      // Simulate rapid realistic typing
      const fullUrl = "https://www.tiktok.com/@creator/video/739182390123";
      let charIdx = 0;
      typeLinkTimerRef.current = setInterval(() => {
        if (charIdx <= fullUrl.length) {
          setDemoTypedLink(fullUrl.slice(0, charIdx));
          charIdx += 4;
        } else {
          clearInterval(typeLinkTimerRef.current);
        }
      }, 50);
    } else if (currentStep.id === "QUANTITY_AND_PRESETS") {
      setDemoActiveMode("order");
      setDemoTypedLink("https://www.tiktok.com/@creator/video/739182390123");
      setDemoQuantity(2500);
    } else if (currentStep.id === "SUBMIT_ORDER") {
      setDemoActiveMode("order");
      setDemoSubmitted(true);
    } else if (currentStep.id === "ORDER_TRACKING_AND_SYNC") {
      setDemoActiveMode("tracking");
      setDemoSyncing(true);
      setTimeout(() => setDemoSyncing(false), 1500);
    } else if (currentStep.id === "AUTO_REFILL_AND_RECEIPT") {
      setDemoActiveMode("tracking");
      setDemoRefilled(true);
    }

    // Trigger simulated click feedback
    clickAnimTimerRef.current = setTimeout(() => {
      setSimulatedClickActive(true);
    }, currentStep.clickDelayMs);

    // Speak voice text
    speakText(currentStep.voiceText);

    // Auto-advance fallback
    if (autoPlay && !voiceEnabled && currentStepIndex < SMM_TUTORIAL_STEPS.length - 1) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, currentStep.fallbackDurationMs);
    }

    return () => {
      cancelAnimationFrame(animFrameId);
      clearTimeout(scrollTimer1);
      clearTimeout(scrollTimer2);
      clearTimeout(scrollTimer3);
      clearTimeout(clickAnimTimerRef.current);
      clearTimeout(typeLinkTimerRef.current);
      clearTimeout(autoPlayTimerRef.current);
    };
  }, [isOpen, currentStepIndex, currentStep, autoPlay, voiceEnabled, speakText, updateTargetPosition]);

  // Window resize handler
  useEffect(() => {
    if (!isOpen) return;
    const handleResize = () => updateTargetPosition(false);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, updateTargetPosition]);

  // Handle Close / Exit
  const handleExitTutorial = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    clearTimeout(autoPlayTimerRef.current);
    clearTimeout(clickAnimTimerRef.current);
    clearTimeout(typeLinkTimerRef.current);
    onClose();
  };

  const handleNextStep = () => {
    if (currentStepIndex < SMM_TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleExitTutorial();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReplayVoice = () => {
    speakText(currentStep.voiceText);
  };

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("zerox_smm_tutorial_voice_enabled", String(next));
    }
    if (!next && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (next) {
      speakText(currentStep.voiceText);
    }
  };

  if (!isOpen) return null;

  const IconComp = currentStep.icon || Sparkles;
  const isCompletionStep = currentStep.id === "COMPLETED";

  return (
    <div
      id="smm-how-to-order-tutorial-root"
      className="fixed inset-0 z-[99999] pointer-events-none select-none bg-transparent"
      style={{
        backdropFilter: "none",
        filter: "none"
      }}
    >
      {/* 1. TOP FLOATING CONTROL PILL */}
      <div className="fixed top-2.5 inset-x-2 sm:inset-x-4 z-[100005] flex items-center justify-between pointer-events-auto max-w-xl mx-auto">
        {/* Left: Demo Indicator & Step */}
        <div className="flex items-center gap-2 bg-slate-950/95 border border-slate-700/80 text-white px-3 py-1.5 rounded-full shadow-xl">
          <span className="flex h-2 w-2 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00AEEF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00AEEF]" />
          </span>
          <span className="text-[11px] font-black font-mono text-[#00AEEF] tracking-tight whitespace-nowrap">
            SMM DEMO {currentStep.badge}
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

      {/* 2. RAZOR-SHARP ACTIVE TARGET HIGHLIGHT BOX */}
      {targetRect && !isCompletionStep && (
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

      {/* 3. FULL SIMULATED INTERACTIVE SMM CANVAS */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.22 }}
        id="smm-demo-main-view"
        className="fixed inset-0 z-[100001] bg-[#f8fafc] text-[#0f172a] overflow-y-auto overscroll-contain touch-pan-y pointer-events-auto pb-28 pt-14 px-3 sm:px-6 font-sans antialiased"
        style={{
          WebkitOverflowScrolling: "touch"
        }}
      >
        <div id="smm-demo-catalog-root" className="max-w-6xl mx-auto space-y-4 pt-1 sm:pt-2">
          
          {/* Header Banner */}
          <div className="bg-white border border-slate-200/90 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[#00AEEF] text-[10px] font-bold">
                    <Zap className="w-3 h-3 text-[#00AEEF] fill-current" />
                    Instant Delivery
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-semibold">
                    <Sparkle className="w-3 h-3 text-[#00AEEF]" />
                    674 Verified Services
                  </span>
                </div>

                <div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Social Media Marketing Services
                  </h1>
                  <p className="text-xs text-slate-500 font-medium">
                    Automated high-speed campaigns for Telegram, Instagram, TikTok, YouTube, WhatsApp & more.
                  </p>
                </div>
              </div>

              {/* Wallet Widget */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between lg:flex-col lg:items-end gap-2.5 shrink-0 shadow-2xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">
                    Demo Wallet Balance
                  </span>
                  <div className="font-black text-slate-900 text-base">
                    Rs 5,420 <span className="text-emerald-600 ml-1 text-xs font-bold">($19.50)</span>
                  </div>
                </div>
                <div className="bg-emerald-500/15 border border-emerald-400/40 text-emerald-700 font-bold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Wallet Active</span>
                </div>
              </div>
            </div>

            {/* Feature Bar */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-[11px]">Instant Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-[11px]">30-Day Auto Refill</span>
              </div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[#00AEEF] shrink-0" />
                <span className="text-[11px]">Auto Refund Protection</span>
              </div>
            </div>
          </div>

          {/* Main Navigation Bar */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 shadow-2xs flex items-center justify-between overflow-x-auto gap-1">
            <div className="flex items-center gap-1 min-w-max">
              <button
                type="button"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  demoActiveMode === "order"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>New Order</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Mass / Bulk</span>
              </button>

              <button
                type="button"
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold text-slate-600 hover:bg-slate-100"
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Price List</span>
              </button>

              <button
                id="smm-demo-tracking-tab-btn"
                type="button"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  demoActiveMode === "tracking"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Orders & Tracking</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-black ${
                  demoActiveMode === "tracking" ? "bg-white text-slate-900" : "bg-slate-100 text-slate-700"
                }`}>
                  1
                </span>
              </button>
            </div>

            {/* Sync button */}
            <div className="bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0 ml-2">
              <RefreshCw className={`w-3.5 h-3.5 text-[#00AEEF] ${demoSyncing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">{demoSyncing ? "Syncing..." : "Sync Live Status"}</span>
            </div>
          </div>

          {/* MODE 1: ORDER FLOW VIEW (Steps 1 - 6) */}
          {demoActiveMode === "order" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Form */}
              <div className="lg:col-span-2 space-y-4">
                <div id="smm-demo-form-card" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                  
                  {/* Platform Filter */}
                  <div id="smm-demo-platform-bar" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Select Platform Gateway
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                      {[
                        { id: "all", name: "All Platforms", icon: <Sparkles className="w-3.5 h-3.5 text-[#00AEEF]" /> },
                        { id: "tiktok", name: "TikTok", icon: <Zap className="w-3.5 h-3.5 text-cyan-400" /> },
                        { id: "instagram", name: "Instagram", icon: <Sparkle className="w-3.5 h-3.5 text-pink-500" /> },
                        { id: "youtube", name: "YouTube", icon: <Play className="w-3.5 h-3.5 text-red-500" /> },
                        { id: "telegram", name: "Telegram", icon: <Globe className="w-3.5 h-3.5 text-sky-500" /> }
                      ].map((p) => {
                        const isSelected = demoSelectedPlatform === p.id;
                        return (
                          <div
                            key={p.id}
                            id={p.id === "tiktok" ? "smm-demo-platform-tiktok" : undefined}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                              isSelected
                                ? "bg-slate-900 border-slate-900 text-white shadow-2xs"
                                : "bg-slate-50 border-slate-200 text-slate-600"
                            }`}
                          >
                            {p.icon}
                            <span>{p.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 1. Category Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      1. Choose Service Category
                    </label>
                    <div id="smm-demo-category-select" className="relative">
                      <div className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 flex items-center justify-between ${
                        demoCategoryOpen ? "border-[#00AEEF] bg-white ring-2 ring-blue-100 shadow-sm" : "border-slate-200"
                      }`}>
                        <span className="truncate font-bold text-slate-800 flex items-center gap-2">
                          <span className="shrink-0 bg-slate-200/80 text-slate-700 text-[10px] font-black px-1.5 py-0.5 rounded">
                            #01
                          </span>
                          <span className="truncate">TIKTOK LIKES | NON DROP | GOOD SPEED | 24/7 AUTO</span>
                        </span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 ${demoCategoryOpen ? "rotate-180 text-[#00AEEF]" : ""}`} />
                      </div>

                      {/* Dropdown Open Simulated */}
                      {demoCategoryOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in">
                          <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50">
                            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                            <span className="text-xs font-semibold text-slate-800">TikTok Likes</span>
                          </div>
                          <div className="p-1 space-y-1">
                            <div className="bg-blue-50 text-[#00AEEF] font-extrabold px-3 py-2 text-xs rounded-lg flex items-center justify-between">
                              <span className="flex items-center gap-2">
                                <span className="bg-slate-100 text-slate-600 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">#01</span>
                                <span>TIKTOK LIKES | NON DROP | GOOD SPEED</span>
                              </span>
                              <Check className="w-4 h-4 text-[#00AEEF]" />
                            </div>
                            <div className="text-slate-600 px-3 py-2 text-xs rounded-lg flex items-center gap-2 opacity-60">
                              <span className="bg-slate-100 text-slate-500 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">#02</span>
                              <span>TIKTOK FOLLOWERS | HQ REAL ACCOUNTS</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Package Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-700 block">
                      2. Select Package
                    </label>
                    <div id="smm-demo-package-select" className="relative">
                      <div className={`w-full bg-slate-50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 flex items-center justify-between ${
                        demoPackageOpen ? "border-[#00AEEF] bg-white ring-2 ring-blue-100 shadow-sm" : "border-slate-200"
                      }`}>
                        <span className="truncate mr-2 text-slate-800 font-semibold text-left flex items-center gap-2">
                          <span className="shrink-0 bg-slate-200/80 text-slate-700 text-[10px] font-black px-1.5 py-0.5 rounded">
                            #01
                          </span>
                          <span className="truncate">
                            #01 TikTok Likes | Instant High Speed | 30d Refill — Rs 180 / 1K
                          </span>
                        </span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 shrink-0 ${demoPackageOpen ? "rotate-180 text-[#00AEEF]" : ""}`} />
                      </div>

                      {/* Package Dropdown Simulated */}
                      {demoPackageOpen && (
                        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in">
                          <div className="p-2 border-b border-slate-100 flex items-center gap-1.5 bg-slate-50">
                            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                            <span className="text-xs font-semibold text-slate-800">Search packages...</span>
                          </div>
                          <div className="p-2 space-y-1.5">
                            <div className="bg-blue-50 text-[#00AEEF] p-2.5 rounded-lg flex items-center justify-between text-xs font-bold">
                              <div>
                                <p className="font-extrabold">#01 TikTok Likes | Instant Speed | 30d Refill</p>
                                <p className="text-[10px] text-slate-500 font-normal">Min: 100 | Max: 50,000 • 30d Auto Refill</p>
                              </div>
                              <span className="font-extrabold font-mono text-xs text-[#00AEEF]">Rs 180 / 1K</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Target Link Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-700 block">
                        3. Target Destination Link
                      </label>
                      <span className="text-[10px] text-slate-400 font-bold">Public URL / Video Only</span>
                    </div>
                    <div id="smm-demo-link-input" className="relative">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                        <LinkIcon className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        readOnly
                        value={demoTypedLink || "https://www.tiktok.com/@creator/video/739182390123"}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-semibold text-slate-800 shadow-2xs"
                      />
                    </div>
                  </div>

                  {/* 4. Quantity & Total Cost */}
                  <div id="smm-demo-quantity-box" className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-extrabold text-slate-700 block">
                        4. Order Quantity
                      </label>
                      <span className="text-[10px] text-slate-500 font-bold">
                        Limits: 100 - 50,000
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <input
                          type="number"
                          readOnly
                          value={demoQuantity}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 shadow-2xs"
                        />
                      </div>

                      {/* Total Price Card */}
                      <div id="smm-demo-total-cost-box" className="bg-slate-50 border border-slate-200/90 rounded-xl p-2.5 flex flex-col justify-center items-end sm:col-span-1 shadow-2xs">
                        <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Cost</span>
                        <div className="font-black text-sm text-[#00AEEF]">
                          Rs 450 <span className="text-emerald-600 text-[10px] ml-1 font-bold">($1.62 USD)</span>
                        </div>
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Presets:</span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold">Min (100)</span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold">+500</span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold">+1,000</span>
                      <span className="px-2.5 py-1 rounded-lg bg-[#00AEEF] text-white text-[10px] font-bold shadow-xs">+2,500</span>
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-bold">Max (50,000)</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div id="smm-demo-submit-btn" className="pt-2">
                    <div className={`w-full font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-2xs transition-all ${
                      demoSubmitted
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-900 text-white"
                    }`}>
                      {demoSubmitted ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-white" />
                          <span>Order Placed & Dispatched!</span>
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 text-[#00AEEF]" />
                          <span>Submit Order (Rs 450)</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Specs Card */}
              <div className="lg:col-span-1 space-y-4">
                <div id="smm-demo-specs-card" className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
                    <div className="p-1.5 bg-blue-50 text-[#00AEEF] rounded-lg border border-blue-100">
                      <Info className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">Service Specifications</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Quality & SLA details</p>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#00AEEF] font-black uppercase tracking-wider block">
                      Service ID: #TK-8492
                    </span>
                    <h4 className="font-extrabold text-slate-900 text-xs mt-0.5 leading-snug">
                      TikTok Likes [Instant Speed | 30d Auto Refill]
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Speed</span>
                      <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1 text-xs">
                        <Clock className="h-3 w-3 text-[#00AEEF]" />
                        Instant (0-5 min)
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Refill</span>
                      <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1 text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        30 Days Auto
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Cancel</span>
                      <span className="font-bold text-slate-800 mt-0.5 flex items-center gap-1 text-xs">
                        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                        Non-Cancel
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Min - Max</span>
                      <span className="font-bold text-slate-800 mt-0.5 block text-xs truncate">
                        100 - 50,000
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-500 font-bold uppercase block">Rate per 1,000</span>
                      <div className="text-xs font-black text-slate-900">
                        Rs 180 <span className="text-emerald-600 ml-1 font-bold">($0.65)</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-[#00AEEF] bg-blue-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 2: ORDERS & REAL-TIME TRACKING VIEW (Steps 7 - 8) */}
          {demoActiveMode === "tracking" && (
            <div id="smm-demo-tracking-table" className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#00AEEF]" />
                    <h3 className="text-sm font-black text-slate-900">Campaign Order Tracking</h3>
                  </div>
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live Syncing Active
                  </span>
                </div>

                {/* Single Order Card */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                        #SMM-94812
                      </span>
                      <span className="font-bold text-xs text-slate-800">
                        TikTok Likes (2,500 Units)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
                        In Progress (74%)
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Delivered: 1,850 / 2,500</span>
                      <span>Remains: 650</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                      <motion.div
                        initial={{ width: "20%" }}
                        animate={{ width: "74%" }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-blue-500 to-[#00AEEF] rounded-full"
                      />
                    </div>
                  </div>

                  {/* Destination Link */}
                  <div className="text-[11px] text-slate-600 flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200 truncate">
                    <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate font-mono">https://www.tiktok.com/@creator/video/739182390123</span>
                  </div>

                  {/* Actions Bar (Refill & PDF Invoice) */}
                  <div id="smm-demo-order-actions-box" className="pt-2 border-t border-slate-200/80 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      {/* Auto Refill Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setDemoRefilled(true);
                          toast.success("Auto-Refill Request Dispatched!");
                        }}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{demoRefilled ? "Refill Active (30d Guarantee)" : "Request 30d Refill"}</span>
                      </button>
                    </div>

                    {/* PDF Tax Invoice Download Button */}
                    <button
                      id="smm-demo-invoice-btn"
                      type="button"
                      onClick={handleDownloadPdfInvoice}
                      className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#00AEEF]" />
                      <span>Download Tax Invoice (PDF)</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: COMPLETION STEP */}
          {isCompletionStep && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              id="smm-demo-completion-card"
              className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 text-center space-y-4 border border-slate-800 shadow-2xl"
            >
              <div className="w-16 h-16 rounded-3xl bg-[#00AEEF]/20 text-[#00AEEF] border border-[#00AEEF]/30 mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(0,174,239,0.3)]">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  You are Ready to Launch SMM Campaigns!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto">
                  Instant order dispatch, live tracking, 30-day refill protection, and official tax invoices for all platforms.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
                {onNavigateToWallet && (
                  <button
                    type="button"
                    onClick={onNavigateToWallet}
                    className="bg-[#00AEEF] hover:bg-[#0098d4] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl transition shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Top Up Wallet</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExitTutorial}
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl border border-slate-700 transition cursor-pointer"
                >
                  Start Ordering Now
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </motion.div>

      {/* 4. SLEEK BOTTOM FLOATING STEP CARD (Always visible & interactive) */}
      <div className="fixed bottom-3 inset-x-2 sm:inset-x-4 z-[100005] max-w-xl mx-auto pointer-events-auto">
        <motion.div
          key={currentStep.id}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 14, opacity: 0 }}
          className="bg-slate-950/95 backdrop-blur-md border border-slate-700/90 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl space-y-2.5"
        >
          {/* Header Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-[#00AEEF]/20 text-[#00AEEF] shrink-0 border border-[#00AEEF]/30">
                <IconComp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-extrabold text-white truncate tracking-tight">
                  {currentStep.title}
                </h4>
                <p className="text-[11px] text-slate-300 font-medium leading-tight truncate">
                  {currentStep.shortCaption}
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-black text-[#00AEEF] bg-[#00AEEF]/10 border border-[#00AEEF]/30 px-2 py-0.5 rounded-md shrink-0">
              Step {currentStep.stepNumber} of {currentStep.totalSteps}
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 gap-2">
            <button
              type="button"
              onClick={handlePrevStep}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            {/* Progress Dots */}
            <div className="flex items-center gap-1">
              {SMM_TUTORIAL_STEPS.map((s, idx) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentStepIndex
                      ? "w-5 bg-[#00AEEF]"
                      : idx < currentStepIndex
                      ? "w-1.5 bg-emerald-400"
                      : "w-1.5 bg-slate-700"
                  }`}
                  title={s.title}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-[#00AEEF] hover:bg-[#0098d4] text-white transition flex items-center gap-1 shadow-md cursor-pointer active:scale-95"
            >
              <span>{currentStepIndex === SMM_TUTORIAL_STEPS.length - 1 ? "Finish" : "Next"}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
export default SmmHowToOrderTutorial;
