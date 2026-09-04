import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { ZXLogo } from "./ZXLogo";
import {
  Volume2,
  VolumeX,
  RotateCcw,
  X,
  Sparkles,
  CheckCircle2,
  Play,
  Pause,
  Crown,
  Clock,
  ShieldCheck,
  Zap,
  MousePointer,
  Check,
  Copy,
  Wallet,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Search,
  ShoppingCart,
  Hourglass,
  Tag,
  History,
  Lock,
  Mail,
  Phone,
  User,
  KeyRound,
  FileDown,
  Store,
  Globe,
  Users,
  LayoutDashboard,
  Ticket,
  CheckCircle,
  Tv,
  Bot,
  Music,
  Gamepad2,
  Shield
} from "lucide-react";

export type SubscriptionTutorialStepId =
  | "OVERVIEW"
  | "FILTER_CATEGORY"
  | "SELECT_PLAN"
  | "CLICK_BUY_NOW"
  | "ENTER_DETAILS"
  | "WALLET_PAYMENT"
  | "ORDER_PROCESSING_MODAL"
  | "MY_SUBSCRIPTIONS_ACTIVATION"
  | "COUNTDOWN_AND_RENEWAL"
  | "POLICY_AND_TAX_INVOICE"
  | "COMPLETED";

interface SubscriptionStepDefinition {
  id: SubscriptionTutorialStepId;
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

const SUBSCRIPTION_TUTORIAL_STEPS: SubscriptionStepDefinition[] = [
  {
    id: "OVERVIEW",
    badge: "1/10",
    stepNumber: 1,
    totalSteps: 10,
    title: "Premium Subscriptions Overview",
    shortCaption: "Browse genuine OTT, AI, Streaming, Music, Gaming & VPN accounts with 25% OFF promo pricing.",
    voiceText: "Welcome to Zerox Network Premium Subscriptions. In this walkthrough, you will learn how to order genuine OTT, AI, and VPN accounts with instant delivery, private profile credentials, and full warranty.",
    targetSelector: "#sub-demo-catalog-root",
    fallbackSelector: "#sub-demo-main-view",
    icon: Crown,
    actionHint: "Viewing Subscriptions Catalog",
    clickDelayMs: 1000,
    fallbackDurationMs: 6500
  },
  {
    id: "FILTER_CATEGORY",
    badge: "2/10",
    stepNumber: 2,
    totalSteps: 10,
    title: "Step 1: Filter Category & Search",
    shortCaption: "Filter instantly across Streaming OTT, AI & Productivity, Music, Gaming, or VPN & Security.",
    voiceText: "Step one: Filter by category or use the instant search bar to find services like ChatGPT Plus, Netflix 4K UHD, Spotify, or NordVPN.",
    targetSelector: "#sub-demo-category-pills",
    fallbackSelector: "#sub-demo-search-bar",
    icon: Search,
    actionHint: "Filter 'Streaming OTT' Category",
    simulatedClickLabel: "Streaming OTT Filtered ✓",
    clickDelayMs: 1400,
    fallbackDurationMs: 6000
  },
  {
    id: "SELECT_PLAN",
    badge: "3/10",
    stepNumber: 3,
    totalSteps: 10,
    title: "Step 2: Inspect Plan & 25% Discount",
    shortCaption: "Review 4K UHD features, plan duration (1 Month / 1 Year), official vs discounted wallet pricing.",
    voiceText: "Step two: Review subscription features, verified benefits, official versus discounted price, and duration.",
    targetSelector: "#sub-demo-featured-card",
    fallbackSelector: "#sub-demo-pricing-box",
    icon: Sparkles,
    actionHint: "Inspecting Netflix 4K UHD Plan",
    simulatedClickLabel: "Netflix 4K UHD (1 Month) • 25% OFF Selected ✓",
    clickDelayMs: 1400,
    fallbackDurationMs: 6000
  },
  {
    id: "CLICK_BUY_NOW",
    badge: "4/10",
    stepNumber: 4,
    totalSteps: 10,
    title: "Step 3: Click Buy Now",
    shortCaption: "Opens the secure subscription order configuration modal.",
    voiceText: "Step three: Click the Buy Now button to configure your subscription delivery preferences.",
    targetSelector: "#sub-demo-buy-now-btn",
    fallbackSelector: "#sub-demo-featured-card",
    icon: ShoppingCart,
    actionHint: "Clicking 'Buy Now'",
    simulatedClickLabel: "Opening Order Configuration...",
    clickDelayMs: 1200,
    fallbackDurationMs: 5500
  },
  {
    id: "ENTER_DETAILS",
    badge: "5/10",
    stepNumber: 5,
    totalSteps: 10,
    title: "Step 4: Contact & Delivery Preferences",
    shortCaption: "Enter Full Name, Delivery Email, WhatsApp Number & desired profile name or notes.",
    voiceText: "Step four: Enter your contact details and desired profile name. Your private credentials will be allocated to this name and emailed to you.",
    targetSelector: "#sub-demo-form-fields",
    fallbackSelector: "#sub-demo-modal-body",
    icon: User,
    actionHint: "Entering Delivery Information",
    simulatedClickLabel: "Details Saved: farhan.vip@zerox.net • WhatsApp Linked ✓",
    clickDelayMs: 1600,
    fallbackDurationMs: 6500
  },
  {
    id: "WALLET_PAYMENT",
    badge: "6/10",
    stepNumber: 6,
    totalSteps: 10,
    title: "Step 5: Instant Wallet Checkout",
    shortCaption: "Review price calculation, zero processing fees, and tap Confirm & Pay with Wallet Balance.",
    voiceText: "Step five: Review your order summary. Payment is deducted directly from your Zerox wallet balance with zero processing fees.",
    targetSelector: "#sub-demo-confirm-pay-btn",
    fallbackSelector: "#sub-demo-modal-footer",
    icon: Wallet,
    actionHint: "Confirming Wallet Checkout",
    simulatedClickLabel: "Rs 1,450 ($5.21) Deducted • Instant Activation ✓",
    clickDelayMs: 1400,
    fallbackDurationMs: 6000
  },
  {
    id: "ORDER_PROCESSING_MODAL",
    badge: "7/10",
    stepNumber: 7,
    totalSteps: 10,
    title: "Step 6: Instant Order Dispatch",
    shortCaption: "Order is registered with server nodes. Email confirmation and WhatsApp alert triggered.",
    voiceText: "Your subscription order is placed! Our system immediately allocates your dedicated profile and private credentials.",
    targetSelector: "#sub-demo-success-dialog",
    fallbackSelector: "#sub-demo-success-card",
    icon: CheckCircle2,
    actionHint: "Order Processing Notice",
    simulatedClickLabel: "Order Confirmed • Credentials Allocated",
    clickDelayMs: 1200,
    fallbackDurationMs: 5500
  },
  {
    id: "MY_SUBSCRIPTIONS_ACTIVATION",
    badge: "8/10",
    stepNumber: 8,
    totalSteps: 10,
    title: "Step 7: My Subscriptions & Credentials",
    shortCaption: "Access private login email, password, profile PIN, and license keys with 1-click copy.",
    voiceText: "Step seven: Head to the My Subscriptions tab to access your active subscription. Click Copy Details to copy your email, profile screen, and private 4-digit PIN.",
    targetSelector: "#sub-demo-activation-box",
    fallbackSelector: "#sub-demo-credentials-card",
    icon: KeyRound,
    actionHint: "Copying Private Credentials",
    simulatedClickLabel: "Login & Profile PIN Copied to Clipboard ✓",
    clickDelayMs: 1800,
    fallbackDurationMs: 6800
  },
  {
    id: "COUNTDOWN_AND_RENEWAL",
    badge: "9/10",
    stepNumber: 9,
    totalSteps: 10,
    title: "Step 8: Expiry Countdown & 1-Click Renew",
    shortCaption: "Real-time digital countdown (Days, Hours, Mins, Secs) & 1-Click Renew to preserve profile.",
    voiceText: "Step eight: Track your exact subscription time with the live countdown clock. You can renew anytime with one click to keep your personalized profile and watchlists intact.",
    targetSelector: "#sub-demo-countdown-card",
    fallbackSelector: "#sub-demo-renewal-banner",
    icon: Hourglass,
    actionHint: "Tracking Countdown & 1-Click Renewal",
    simulatedClickLabel: "28 Days Remaining • 1-Click Renew Active",
    clickDelayMs: 1800,
    fallbackDurationMs: 6500
  },
  {
    id: "POLICY_AND_TAX_INVOICE",
    badge: "10/10",
    stepNumber: 10,
    totalSteps: 10,
    title: "Step 9: Privacy Policy & PDF Tax Invoice",
    shortCaption: "Zero data sharing, full warranty on cancellation & download official Zerox PDF Tax Invoices.",
    voiceText: "Step nine: You can download an official PDF tax invoice with full payment details, and review our 30-day zero-disruption warranty policy.",
    targetSelector: "#sub-demo-invoice-action-bar",
    fallbackSelector: "#sub-demo-policy-bar",
    icon: FileDown,
    actionHint: "Downloading PDF Tax Invoice",
    simulatedClickLabel: "Official Tax Invoice #INV-SUB-89421 Downloaded ✓",
    clickDelayMs: 1800,
    fallbackDurationMs: 6500
  },
  {
    id: "COMPLETED",
    badge: "✓",
    stepNumber: 11,
    totalSteps: 11,
    title: "Ready to Subscribe!",
    shortCaption: "Top up your wallet balance and activate genuine premium subscriptions in seconds.",
    voiceText: "You are all set! Top up your wallet and enjoy genuine entertainment, AI tools, and VPN accounts with Zerox Network.",
    targetSelector: "#sub-demo-completion-card",
    icon: Crown,
    actionHint: "Walkthrough Complete",
    clickDelayMs: 1000,
    fallbackDurationMs: 7000
  }
];

interface SubscriptionHowToOrderTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToWallet?: () => void;
  siteLogoUrl?: string;
  siteTitle?: string;
  currentUser?: any;
  formatPrice?: (baseUnits: number) => string;
}

export const SubscriptionHowToOrderTutorial: React.FC<SubscriptionHowToOrderTutorialProps> = ({
  isOpen,
  onClose,
  onNavigateToWallet,
  siteTitle = "ZEROX NETWORK",
  currentUser,
  formatPrice = (val: number) => `Rs ${Math.round(val * 278).toLocaleString()}`
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("zerox_sub_tutorial_voice_enabled");
      return saved !== null ? saved === "true" : true;
    }
    return true;
  });

  // Simulated interactive states
  const [simulatedClickActive, setSimulatedClickActive] = useState(false);
  const [demoSelectedCategory, setDemoSelectedCategory] = useState<string>("Streaming OTT");
  const [demoSearchQuery, setDemoSearchQuery] = useState("");
  const [demoOrderModalOpen, setDemoOrderModalOpen] = useState(false);
  const [demoSuccessModalOpen, setDemoSuccessModalOpen] = useState(false);
  const [demoActiveTab, setDemoActiveTab] = useState<"store" | "my_subscriptions">("store");
  const [demoFullName, setDemoFullName] = useState("");
  const [demoEmail, setDemoEmail] = useState("");
  const [demoWhatsApp, setDemoWhatsApp] = useState("");
  const [demoProfileNotes, setDemoProfileNotes] = useState("");
  const [demoCopiedKey, setDemoCopiedKey] = useState(false);
  const [demoRenewed, setDemoRenewed] = useState(false);
  const [demoSecondsTick, setDemoSecondsTick] = useState(45);

  const autoPlayTimerRef = useRef<any>(null);
  const clickAnimTimerRef = useRef<any>(null);
  const typeTextTimerRef = useRef<any>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const currentStep = SUBSCRIPTION_TUTORIAL_STEPS[currentStepIndex] || SUBSCRIPTION_TUTORIAL_STEPS[0];
  const isCompletionStep = currentStep.id === "COMPLETED";

  // Real-time ticking seconds for countdown demo
  useEffect(() => {
    if (!isOpen) return;
    const secInterval = setInterval(() => {
      setDemoSecondsTick((prev) => (prev > 0 ? prev - 1 : 59));
    }, 1000);
    return () => clearInterval(secInterval);
  }, [isOpen]);

  // Voice speech synthesis
  const speakText = useCallback(
    (text: string) => {
      if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferred =
          voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Premium") || v.name.includes("Samantha"))
          ) || voices.find((v) => v.lang.startsWith("en"));
        if (preferred) utterance.voice = preferred;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // Only advance automatically if autoPlay is explicitly turned on
        if (autoPlay && currentStepIndex < SUBSCRIPTION_TUTORIAL_STEPS.length - 1) {
          if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
          autoPlayTimerRef.current = setTimeout(() => {
            setCurrentStepIndex((prev) => prev + 1);
          }, 2000);
        }
      };
      utterance.onerror = () => setIsSpeaking(false);

      currentUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [voiceEnabled, autoPlay, currentStepIndex]
  );

  const stopVoice = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const toggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("zerox_sub_tutorial_voice_enabled", String(nextVal));
    }
    if (!nextVal) {
      stopVoice();
    } else {
      speakText(currentStep.voiceText);
    }
  };

  // Download PDF Tax Invoice simulation
  const handleDownloadPdfInvoice = () => {
    const invoiceContent = `================================================
ZEROX NETWORK - OFFICIAL SUBSCRIPTION TAX INVOICE
================================================
Invoice Number: #INV-SUB-89421
Order ID: #SUB-89421
Date: ${new Date().toLocaleDateString()}
Payment Method: Zerox Wallet Balance
Status: ACTIVE / VERIFIED

------------------------------------------------
Item: Netflix Premium 4K UHD (Private Screen)
Plan Duration: 1 Month (30-Day Full Warranty)
Profile Allocation: Screen 4 (Farhan) • PIN: 8492
Credentials: netflix.vip82@zerox.net
Official Retail: Rs 1,933 ($6.95 USD)
Discount Applied: 25% OFF Promo
Price Paid: Rs 1,450 ($5.21 USD)
Gateway / Handling Fee: Rs 0.00
------------------------------------------------

Warranty Guarantee:
• 30-Day 100% Zero-Disruption Replacement Guarantee
• Ultra HD 4K Streaming Supported on TV, Mobile & Desktop
• Private PIN-locked profile allocated exclusively to you

Thank you for choosing Zerox Network!
Official Portal: https://zeroxnetwork.com
================================================`;

    try {
      const blob = new Blob([invoiceContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_SUB_89421_ZeroxNetwork.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Subscription Tax Invoice #INV-SUB-89421 Downloaded!");
    } catch {
      toast.success("Subscription Tax Invoice #INV-SUB-89421 Ready!");
    }
  };

  // Synchronize target bounding rect with smooth scrolling
  const updateTargetPosition = useCallback((shouldScroll = true) => {
    if (!isOpen) return;
    const selector = currentStep.targetSelector;
    let el = document.querySelector(selector) as HTMLElement | null;
    if (!el && currentStep.fallbackSelector) {
      el = document.querySelector(currentStep.fallbackSelector) as HTMLElement | null;
    }
    if (el) {
      if (shouldScroll) {
        const scrollContainer =
          document.getElementById("sub-demo-main-view") ||
          document.getElementById("sub-demo-my-subs-view") ||
          el.closest(".overflow-y-auto");

        if (scrollContainer) {
          if (currentStep.id === "OVERVIEW") {
            scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            const containerRect = scrollContainer.getBoundingClientRect();
            const targetRectCurrent = el.getBoundingClientRect();
            const relativeTop = targetRectCurrent.top - containerRect.top + scrollContainer.scrollTop;
            const targetScrollTop = Math.max(0, relativeTop - (containerRect.height / 2) + (targetRectCurrent.height / 2));

            scrollContainer.scrollTo({
              top: targetScrollTop,
              behavior: "smooth"
            });
          }
        } else {
          el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        }
      }
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isOpen]);

  // Handle Step transitions and interactive simulated state mutations
  useEffect(() => {
    if (!isOpen) return;

    // Reset simulated animations
    setSimulatedClickActive(false);
    if (clickAnimTimerRef.current) clearTimeout(clickAnimTimerRef.current);
    if (typeTextTimerRef.current) clearTimeout(typeTextTimerRef.current);
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);

    // Dynamic UI states based on current step
    switch (currentStep.id) {
      case "OVERVIEW":
        setDemoActiveTab("store");
        setDemoSelectedCategory("ALL");
        setDemoSearchQuery("");
        setDemoOrderModalOpen(false);
        setDemoSuccessModalOpen(false);
        break;

      case "FILTER_CATEGORY":
        setDemoActiveTab("store");
        setDemoSelectedCategory("ALL");
        clickAnimTimerRef.current = setTimeout(() => {
          setDemoSelectedCategory("Streaming OTT");
          setSimulatedClickActive(true);
        }, 1000);
        break;

      case "SELECT_PLAN":
        setDemoActiveTab("store");
        setDemoSelectedCategory("Streaming OTT");
        setDemoOrderModalOpen(false);
        setDemoSuccessModalOpen(false);
        clickAnimTimerRef.current = setTimeout(() => {
          setSimulatedClickActive(true);
        }, 1200);
        break;

      case "CLICK_BUY_NOW":
        setDemoActiveTab("store");
        setDemoOrderModalOpen(false);
        setDemoSuccessModalOpen(false);
        clickAnimTimerRef.current = setTimeout(() => {
          setSimulatedClickActive(true);
          setTimeout(() => {
            setDemoOrderModalOpen(true);
            setDemoFullName("Syed Farhan");
            setDemoEmail("farhan.vip@zerox.net");
            setDemoWhatsApp("+92 300 1234567");
            setDemoProfileNotes("Screen 4 (Farhan 4K)");
          }, 500);
        }, 1000);
        break;

      case "ENTER_DETAILS":
        setDemoActiveTab("store");
        setDemoOrderModalOpen(true);
        setDemoSuccessModalOpen(false);
        setDemoFullName("");
        setDemoEmail("");
        setDemoWhatsApp("");
        setDemoProfileNotes("");

        // Simulated progressive typing
        typeTextTimerRef.current = setTimeout(() => {
          setDemoFullName("Syed Farhan");
          setTimeout(() => {
            setDemoEmail("farhan.vip@zerox.net");
            setTimeout(() => {
              setDemoWhatsApp("+92 300 1234567");
              setDemoProfileNotes("Screen 4 (Farhan 4K UHD)");
              setSimulatedClickActive(true);
            }, 500);
          }, 500);
        }, 300);
        break;

      case "WALLET_PAYMENT":
        setDemoActiveTab("store");
        setDemoOrderModalOpen(true);
        setDemoSuccessModalOpen(false);
        setDemoFullName("Syed Farhan");
        setDemoEmail("farhan.vip@zerox.net");
        setDemoWhatsApp("+92 300 1234567");
        setDemoProfileNotes("Screen 4 (Farhan 4K UHD)");
        clickAnimTimerRef.current = setTimeout(() => {
          setSimulatedClickActive(true);
          setTimeout(() => {
            setDemoOrderModalOpen(false);
            setDemoSuccessModalOpen(true);
          }, 700);
        }, 1200);
        break;

      case "ORDER_PROCESSING_MODAL":
        setDemoActiveTab("store");
        setDemoOrderModalOpen(false);
        setDemoSuccessModalOpen(true);
        clickAnimTimerRef.current = setTimeout(() => {
          setSimulatedClickActive(true);
        }, 1000);
        break;

      case "MY_SUBSCRIPTIONS_ACTIVATION":
        setDemoOrderModalOpen(false);
        setDemoSuccessModalOpen(false);
        setDemoActiveTab("my_subscriptions");
        clickAnimTimerRef.current = setTimeout(() => {
          setSimulatedClickActive(true);
          setDemoCopiedKey(true);
          toast.success("Netflix login details copied to clipboard!");
        }, 1600);
        break;

      case "COUNTDOWN_AND_RENEWAL":
        setDemoOrderModalOpen(false);
        setDemoSuccessModalOpen(false);
        setDemoActiveTab("my_subscriptions");
        clickAnimTimerRef.current = setTimeout(() => {
          setSimulatedClickActive(true);
        }, 1500);
        break;

      case "POLICY_AND_TAX_INVOICE":
        setDemoOrderModalOpen(false);
        setDemoSuccessModalOpen(false);
        setDemoActiveTab("my_subscriptions");
        clickAnimTimerRef.current = setTimeout(() => {
          setSimulatedClickActive(true);
        }, 1500);
        break;

      case "COMPLETED":
        setDemoOrderModalOpen(false);
        setDemoSuccessModalOpen(false);
        break;
    }

    // Voice announcement
    speakText(currentStep.voiceText);

    // Target rect update on DOM tick
    updateTargetPosition(true);
    const rectTimer1 = setTimeout(() => updateTargetPosition(false), 120);
    const rectTimer2 = setTimeout(() => updateTargetPosition(false), 350);
    const rectTimer3 = setTimeout(() => updateTargetPosition(false), 700);

    // Fallback auto-play transition ONLY when voice is disabled or finishes
    if (autoPlay && !voiceEnabled && currentStepIndex < SUBSCRIPTION_TUTORIAL_STEPS.length - 1) {
      autoPlayTimerRef.current = setTimeout(() => {
        setCurrentStepIndex((prev) => prev + 1);
      }, currentStep.fallbackDurationMs);
    }

    return () => {
      clearTimeout(rectTimer1);
      clearTimeout(rectTimer2);
      clearTimeout(rectTimer3);
      if (clickAnimTimerRef.current) clearTimeout(clickAnimTimerRef.current);
      if (typeTextTimerRef.current) clearTimeout(typeTextTimerRef.current);
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [currentStepIndex, isOpen, autoPlay, voiceEnabled, speakText, updateTargetPosition]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        if (currentStepIndex < SUBSCRIPTION_TUTORIAL_STEPS.length - 1) {
          setCurrentStepIndex((p) => p + 1);
        } else {
          onClose();
        }
      } else if (e.key === "ArrowLeft") {
        if (currentStepIndex > 0) {
          setCurrentStepIndex((p) => p - 1);
        }
      } else if (e.key === " ") {
        e.preventDefault();
        setAutoPlay((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentStepIndex, onClose]);

  // Cleanup voice on unmount or close
  useEffect(() => {
    if (!isOpen) {
      stopVoice();
      setCurrentStepIndex(0);
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      if (clickAnimTimerRef.current) clearTimeout(clickAnimTimerRef.current);
    }
  }, [isOpen, stopVoice]);

  // Window resize & scroll listeners
  useEffect(() => {
    const handleResizeOrScroll = () => updateTargetPosition(false);
    window.addEventListener("resize", handleResizeOrScroll, { passive: true });
    window.addEventListener("scroll", handleResizeOrScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener("resize", handleResizeOrScroll);
      window.removeEventListener("scroll", handleResizeOrScroll, { capture: true } as any);
    };
  }, [updateTargetPosition]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < SUBSCRIPTION_TUTORIAL_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleReplayVoice = () => {
    speakText(currentStep.voiceText);
  };

  const handleJumpToStep = (index: number) => {
    setCurrentStepIndex(index);
  };

  return (
    <div
      id="subscription-how-to-order-tutorial-root"
      className="fixed inset-0 z-[100000] pointer-events-none select-none bg-transparent"
    >
      {/* 1. TOP FLOATING CONTROL PILL (Non-intrusive, 100% visible interface) */}
      <div className="fixed top-2.5 inset-x-2 sm:inset-x-4 z-[100020] flex items-center justify-between pointer-events-auto max-w-2xl mx-auto">
        {/* Left: Demo Indicator & Step */}
        <div className="flex items-center gap-2 bg-slate-950/95 border border-[#00AEEF]/40 text-white px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00AEEF] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00AEEF]" />
          </span>
          <span className="text-[11px] font-black font-mono text-[#00AEEF] tracking-tight whitespace-nowrap">
            TUTORIAL {currentStep.badge}
          </span>
          <span className="text-slate-600 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-200 font-bold truncate max-w-[140px] sm:max-w-[220px] hidden xs:inline">
            {currentStep.title}
          </span>
        </div>

        {/* Right: Controls & Exit */}
        <div className="flex items-center gap-1.5 bg-slate-950/95 border border-[#00AEEF]/40 p-1 rounded-full shadow-2xl backdrop-blur-md">
          {/* Speaking Audio Wave Indicator */}
          {isSpeaking && (
            <div className="flex items-center gap-0.5 px-2 py-0.5 text-[#00AEEF]">
              <span className="w-0.5 h-2.5 bg-[#00AEEF] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-0.5 h-3.5 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
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
            title={voiceEnabled ? "Mute Voice Narration" : "Enable Voice Narration"}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Replay */}
          <button
            type="button"
            onClick={handleReplayVoice}
            className="p-1.5 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Replay Voice Narration"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Auto Play/Pause */}
          <button
            type="button"
            onClick={() => setAutoPlay(!autoPlay)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
              autoPlay
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "bg-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title={autoPlay ? "Pause Auto-Advance" : "Enable Auto-Advance"}
          >
            {autoPlay ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
            <span className="hidden sm:inline">{autoPlay ? "Auto ON" : "Auto OFF"}</span>
          </button>

          {/* Close / Exit Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer ml-0.5"
            title="Exit Walkthrough"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. RAZOR-SHARP ACTIVE TARGET HIGHLIGHT & ANIMATED POINTER (Z-[100010] ABOVE CONTENT) */}
      {targetRect && !isCompletionStep && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{
            opacity: 1,
            scale: 1,
            top: Math.max(6, targetRect.top - 6),
            left: Math.max(6, targetRect.left - 6),
            width: targetRect.width + 12,
            height: targetRect.height + 12
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="fixed z-[100010] rounded-2xl border-2 border-[#00AEEF] pointer-events-none"
          style={{
            boxShadow:
              "0 0 0 3px rgba(0, 174, 239, 0.4), 0 0 30px rgba(0, 174, 239, 0.6), inset 0 0 15px rgba(0, 174, 239, 0.15)"
          }}
        >
          {/* Animated Interactive Demo Cursor / Click Feedback */}
          <motion.div
            animate={{
              y: simulatedClickActive ? [0, -3, 3, 0] : [0, -5, 0],
              scale: simulatedClickActive ? [1, 0.92, 1.05, 1] : [1, 0.98, 1]
            }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute -bottom-7 right-2 flex items-center gap-1.5 bg-slate-950 text-white border border-[#00AEEF] text-[10.5px] font-bold px-2.5 py-1 rounded-full shadow-2xl backdrop-blur-md"
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

      {/* 3. COMPLETE AUTHENTIC SUBSCRIPTIONS STORE CANVAS (Z-[100001]) */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        id="sub-demo-main-view"
        className="fixed inset-0 z-[100001] bg-[#f8fafc] text-[#0f172a] overflow-y-auto overscroll-contain touch-pan-y pointer-events-auto pb-32 pt-14 px-3 sm:px-6 font-sans antialiased"
        style={{
          WebkitOverflowScrolling: "touch"
        }}
      >
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Authentic Top App Header */}
          <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl flex items-center justify-between px-3.5 sm:px-6 shadow-sm">
            <div className="flex items-center gap-3">
              <ZXLogo size={36} interactive={false} withBackground={true} />
              <div className="flex flex-col leading-none">
                <span className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  {siteTitle}
                </span>
                <span className="text-[8.5px] font-bold text-[#00AEEF] font-mono mt-0.5 uppercase tracking-wider">
                  PREMIUM SUBSCRIPTIONS
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="bg-slate-100/90 rounded-full px-3 py-1 flex items-center gap-2 border border-slate-200/80">
                <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#00AEEF] to-blue-600 text-white flex items-center justify-center">
                  <Wallet className="h-2.5 w-2.5" />
                </div>
                <span className="text-xs font-black text-slate-900 font-mono">
                  {currentUser?.balance ? formatPrice(currentUser.balance) : "₨ 4,850.00"}
                </span>
              </div>
            </div>
          </header>

          {/* Navigation Tabs Bar */}
          <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center justify-between sm:justify-center gap-2 sm:gap-6 overflow-x-auto">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 opacity-60">
              <Store className="w-4 h-4" />
              <span className="hidden sm:inline">Virtual Numbers</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 opacity-60">
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">SMM Services</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-[#00AEEF] bg-blue-50/80 border border-blue-200/70 shadow-xs cursor-pointer">
              <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>Subscriptions</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 opacity-60">
              <Users className="w-4 h-4" />
              <span className="hidden md:inline">Affiliate</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 opacity-60">
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden md:inline">Dashboard</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 opacity-60">
              <Ticket className="w-4 h-4" />
              <span className="hidden md:inline">Support</span>
            </div>
          </div>

          {/* Subscriptions Hero Banner */}
          <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#00AEEF]/20 to-blue-600/20 text-[#00AEEF] border border-[#00AEEF]/40 shadow-inner shrink-0">
                  <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Premium Subscriptions
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase">
                      25% OFF
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    100% Genuine OTT, AI & VPN Accounts with Private PIN and Full Warranty Guarantee
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#00AEEF]/20 text-[#00AEEF] border border-[#00AEEF]/40">
                  <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  <span>Instant Node Activation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Store Tabs (Store vs My Subscriptions) */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 border border-slate-200/80 rounded-2xl w-full max-w-md shadow-inner">
            <button
              type="button"
              onClick={() => setDemoActiveTab("store")}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                demoActiveTab === "store"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-yellow-500" />
              <span>Subscriptions Catalog</span>
            </button>

            <button
              type="button"
              onClick={() => setDemoActiveTab("my_subscriptions")}
              className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                demoActiveTab === "my_subscriptions"
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200/80 font-black"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <History className="w-3.5 h-3.5 text-[#00AEEF]" />
              <span>My Subscriptions</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                1
              </span>
            </button>
          </div>

          {/* Store Tab Content */}
          {demoActiveTab === "store" && (
            <div id="sub-demo-catalog-root" className="space-y-6">
              {/* Category Pills & Search */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3.5">
                <div
                  id="sub-demo-category-pills"
                  className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 [&::-webkit-scrollbar]:hidden"
                >
                  {[
                    { id: "ALL", label: "All Services", icon: Crown },
                    { id: "Streaming OTT", label: "Streaming OTT", icon: Tv },
                    { id: "AI & Productivity", label: "AI & Productivity", icon: Bot },
                    { id: "Music", label: "Music & Audio", icon: Music },
                    { id: "Gaming", label: "Gaming", icon: Gamepad2 },
                    { id: "VPN & Security", label: "VPN & Security", icon: Shield }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setDemoSelectedCategory(cat.id)}
                        className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                          demoSelectedCategory === cat.id
                            ? "bg-slate-900 text-white shadow-md border border-slate-900 font-black"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200/70 border border-slate-200/60"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar */}
                <div id="sub-demo-search-bar" className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search subscriptions (e.g. Netflix 4K, ChatGPT, Spotify, NordVPN)..."
                    value={demoSearchQuery}
                    onChange={(e) => setDemoSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/90 focus:border-[#00AEEF] rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/20 transition-all shadow-inner"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                </div>
              </div>

              {/* Featured Subscriptions Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. NETFLIX 4K UHD (FEATURED STEP TARGET) */}
                <div
                  id="sub-demo-featured-card"
                  className="bg-white rounded-3xl border-2 border-slate-200 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col relative"
                >
                  {/* Card Banner */}
                  <div className="h-36 bg-gradient-to-r from-red-900 via-neutral-900 to-black relative p-4 flex flex-col justify-between overflow-hidden">
                    <div className="flex items-center justify-between relative z-10">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-mono font-bold backdrop-blur-md border border-white/20">
                        ULTRA HD 4K
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-wider shadow-md">
                        25% OFF
                      </span>
                    </div>
                    <div className="relative z-10 flex items-end justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-black/90 p-2 flex items-center justify-center shadow-2xl border border-white/20">
                        <img
                          src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
                          alt="Netflix"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 bg-black/40 px-2.5 py-0.5 rounded-lg backdrop-blur-sm">
                        1 Month Plan
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-slate-900">
                          Netflix Premium 4K UHD
                        </h3>
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          Streaming OTT
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        Dedicated private profile with your personal 4-digit PIN. Stream on TV, PC, and mobile with Ultra HD 4K + HDR.
                      </p>

                      {/* Features */}
                      <ul className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Private Profile with custom 4-digit PIN</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Ultra HD 4K & Dolby Vision Sound</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>30-Day Zero-Disruption Replacement Guarantee</span>
                        </li>
                      </ul>
                    </div>

                    {/* Pricing & Buy Now Action */}
                    <div
                      id="sub-demo-pricing-box"
                      className="pt-3.5 border-t border-slate-100 flex items-center justify-between"
                    >
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">
                          Price
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-slate-900 font-mono">
                            Rs 1,450
                          </span>
                          <span className="text-[11px] text-slate-400 line-through">
                            Rs 1,933
                          </span>
                        </div>
                      </div>

                      <button
                        id="sub-demo-buy-now-btn"
                        type="button"
                        onClick={() => {
                          setDemoOrderModalOpen(true);
                          setDemoFullName("Syed Farhan");
                          setDemoEmail("farhan.vip@zerox.net");
                          setDemoWhatsApp("+92 300 1234567");
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-[#00AEEF] active:scale-95 text-white text-xs font-black shadow-md transition-all cursor-pointer"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. CHATGPT PLUS & CLAUDE PRO */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                  <div className="h-36 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 relative p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between relative z-10">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-mono font-bold backdrop-blur-md border border-white/20">
                        GPT-4o & CLAUDE
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">
                        POPULAR
                      </span>
                    </div>
                    <div className="relative z-10 flex items-end justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-black/90 p-2 flex items-center justify-center shadow-2xl border border-white/20 text-emerald-400">
                        <Bot className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 bg-black/40 px-2.5 py-0.5 rounded-lg backdrop-blur-sm">
                        1 Month Plan
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-slate-900">
                          ChatGPT Plus + Claude Pro
                        </h3>
                        <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          AI
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        Unlimited GPT-4o reasoning, DALL-E image generation, advanced data analysis, and coding tools.
                      </p>
                      <ul className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>GPT-4o + Voice Mode access</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>Private web login & session storage</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">
                          Price
                        </span>
                        <span className="text-base font-black text-slate-900 font-mono">
                          Rs 2,950
                        </span>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. SPOTIFY PREMIUM */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative hidden lg:flex">
                  <div className="h-36 bg-gradient-to-r from-green-950 via-neutral-900 to-black relative p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between relative z-10">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 text-white text-[10px] font-mono font-bold backdrop-blur-md border border-white/20">
                        LOSSLESS AUDIO
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-green-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                        FAMILY SCREEN
                      </span>
                    </div>
                    <div className="relative z-10 flex items-end justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-black/90 p-2 flex items-center justify-center shadow-2xl border border-white/20 text-green-400">
                        <Music className="w-7 h-7" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-200 bg-black/40 px-2.5 py-0.5 rounded-lg backdrop-blur-sm">
                        12 Months Plan
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-slate-900">
                          Spotify Premium Individual
                        </h3>
                        <span className="text-[10px] font-black uppercase text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-100">
                          Music
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        Ad-free music listening, offline song downloads, and unlimited skips on all your devices.
                      </p>
                      <ul className="mt-3.5 space-y-1.5 text-xs text-slate-600">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>100% Ad-free audio & offline downloads</span>
                        </li>
                      </ul>
                    </div>

                    <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">
                          Price
                        </span>
                        <span className="text-base font-black text-slate-900 font-mono">
                          Rs 3,850
                        </span>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* My Subscriptions Tab Content */}
          {demoActiveTab === "my_subscriptions" && (
            <div id="sub-demo-my-subs-view" className="space-y-6">
              <div
                id="sub-demo-activation-box"
                className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-4"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-black p-2 flex items-center justify-center shadow-md">
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg"
                        alt="Netflix"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="text-base font-black text-slate-900">
                        Netflix Premium 4K UHD (Private Screen)
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">
                        Order #SUB-89421 • 1 Month Plan • Verified Node
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    ACTIVE & VERIFIED
                  </span>
                </div>

                {/* Activation Details & Credentials Box with 1-Click Copy */}
                <div
                  id="sub-demo-credentials-card"
                  className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3 shadow-inner"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-[#00AEEF] flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-[#00AEEF]" />
                      Private Account Credentials
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setDemoCopiedKey(true);
                        toast.success("Netflix credentials copied to clipboard!");
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
                    >
                      {demoCopiedKey ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-white" />
                          <span>Copy Details</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="bg-slate-950/90 rounded-xl p-3.5 font-mono text-xs text-emerald-300 border border-emerald-500/20 space-y-2 leading-relaxed">
                    <div>
                      <span className="text-slate-400 font-sans font-bold">Email / Login: </span>
                      <strong className="text-white font-mono">netflix.vip82@zerox.net</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans font-bold">Allocated Profile: </span>
                      <strong className="text-white">Screen 4 (Farhan)</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans font-bold">Profile PIN: </span>
                      <strong className="text-yellow-300 font-mono text-sm tracking-wider">8492</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans font-bold">Warranty: </span>
                      <span className="text-emerald-400">30-Day Zero-Disruption Replacement Guarantee</span>
                    </div>
                  </div>
                </div>

                {/* Digital Expiry Countdown Timer */}
                <div
                  id="sub-demo-countdown-card"
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-xs font-black uppercase text-slate-700 flex items-center gap-1.5">
                      <Hourglass className="w-4 h-4 text-[#00AEEF]" />
                      Subscription Expiry Countdown
                    </span>
                    <span className="text-xs font-bold text-emerald-600 font-mono">92% Time Remaining</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 sm:gap-3 text-center font-mono">
                    <div className="bg-slate-900 text-white rounded-xl p-2 sm:p-2.5 shadow-sm">
                      <span className="text-base sm:text-lg font-black text-[#00AEEF] block">28</span>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-sans mt-0.5 block">
                        Days
                      </span>
                    </div>
                    <div className="bg-slate-900 text-white rounded-xl p-2 sm:p-2.5 shadow-sm">
                      <span className="text-base sm:text-lg font-black text-white block">14</span>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-sans mt-0.5 block">
                        Hours
                      </span>
                    </div>
                    <div className="bg-slate-900 text-white rounded-xl p-2 sm:p-2.5 shadow-sm">
                      <span className="text-base sm:text-lg font-black text-white block">38</span>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-sans mt-0.5 block">
                        Mins
                      </span>
                    </div>
                    <div className="bg-slate-900 text-white rounded-xl p-2 sm:p-2.5 shadow-sm">
                      <span className="text-base sm:text-lg font-black text-emerald-400 block">
                        {String(demoSecondsTick).padStart(2, "0")}
                      </span>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 font-sans mt-0.5 block">
                        Secs
                      </span>
                    </div>
                  </div>

                  {/* Progress line */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00AEEF] to-emerald-500 w-[92%]" />
                  </div>
                </div>

                {/* Action Bar: Download Invoice & 1-Click Renewal */}
                <div
                  id="sub-demo-invoice-action-bar"
                  className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2.5"
                >
                  <button
                    type="button"
                    onClick={handleDownloadPdfInvoice}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <FileDown className="w-4 h-4 text-[#00AEEF]" />
                    <span>Download Tax Invoice (PDF)</span>
                  </button>

                  <button
                    id="sub-demo-renewal-banner"
                    type="button"
                    onClick={() => {
                      setDemoRenewed(true);
                      toast.success("1-Click Subscription Renewal Active!");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#00AEEF] hover:bg-[#009bd4] active:scale-95 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-yellow-300" />
                    <span>Renew Subscription</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* 4. SIMULATED ORDER CONFIGURATION MODAL (STEPS 4, 5, 6) AT Z-[100005] */}
      <AnimatePresence>
        {demoOrderModalOpen && (
          <div className="fixed inset-0 z-[100005] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 pointer-events-auto">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 10 }}
              id="sub-demo-modal-body"
              className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl border border-slate-200 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-black text-xs">
                    N
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Subscribe: Netflix 4K UHD</h3>
                    <p className="text-[11px] text-slate-500 font-medium">1 Month Plan • 25% OFF Promo</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDemoOrderModalOpen(false)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form fields with animated typing check */}
              <div id="sub-demo-form-fields" className="space-y-3 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={demoFullName}
                      readOnly
                      placeholder="Enter Full Name..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    {demoFullName && (
                      <CheckCircle className="w-4 h-4 text-emerald-500 absolute right-3 top-2.5" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Delivery Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={demoEmail}
                      readOnly
                      placeholder="your.email@gmail.com"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    {demoEmail && (
                      <CheckCircle className="w-4 h-4 text-emerald-500 absolute right-3 top-2.5" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    WhatsApp Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={demoWhatsApp}
                      readOnly
                      placeholder="+92 300 1234567"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    {demoWhatsApp && (
                      <CheckCircle className="w-4 h-4 text-emerald-500 absolute right-3 top-2.5" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Profile Name / Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={demoProfileNotes}
                    readOnly
                    placeholder="Desired Profile Name..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Modal Footer & Wallet Payment */}
              <div id="sub-demo-modal-footer" className="pt-3 border-t border-slate-100 space-y-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Wallet Deduction</span>
                    <span className="font-mono font-black text-emerald-600 text-sm">
                      Rs 1,450 <span className="text-[10px] text-slate-500 font-normal">($5.21 USD)</span>
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Processing Fee</span>
                    <span className="font-bold text-slate-700 text-xs">0% Free</span>
                  </div>
                </div>

                <button
                  id="sub-demo-confirm-pay-btn"
                  type="button"
                  onClick={() => {
                    setDemoOrderModalOpen(false);
                    setDemoSuccessModalOpen(true);
                  }}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Confirm & Pay with Wallet Balance</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. SIMULATED ORDER DISPATCH SUCCESS MODAL AT Z-[100005] */}
      <AnimatePresence>
        {demoSuccessModalOpen && (
          <div
            id="sub-demo-success-dialog"
            className="fixed inset-0 z-[100005] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              id="sub-demo-success-card"
              className="bg-white border border-emerald-200 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-black text-slate-900">Order Placed Successfully!</h4>
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  Your subscription is being activated instantly on server nodes!
                </p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-3.5 text-left border border-slate-200 text-xs text-slate-600 space-y-1.5 leading-relaxed">
                <p className="font-black text-slate-900 text-[11px] uppercase tracking-wider">
                  Automated Fulfillment:
                </p>
                <p>
                  1. Private login credentials are now available in your{" "}
                  <strong className="text-[#00AEEF]">My Subscriptions</strong> tab.
                </p>
                <p>
                  2. A confirmation receipt was dispatched to{" "}
                  <strong className="text-slate-800">farhan.vip@zerox.net</strong> and WhatsApp.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDemoSuccessModalOpen(false);
                  setDemoActiveTab("my_subscriptions");
                }}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-[#00AEEF] active:scale-95 text-white font-black text-xs transition-all cursor-pointer shadow-lg"
              >
                View in My Subscriptions
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. COMPLETION SCREEN */}
      <AnimatePresence>
        {isCompletionStep && (
          <div
            id="sub-demo-completion-card"
            className="fixed inset-0 z-[100015] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-[#00AEEF]/40 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl text-center space-y-5 text-white"
            >
              <div className="w-16 h-16 bg-gradient-to-tr from-[#00AEEF] to-blue-600 rounded-3xl flex items-center justify-center mx-auto text-white shadow-xl shadow-[#00AEEF]/30">
                <Crown className="w-8 h-8 fill-current" />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  You are Ready to Subscribe!
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium leading-relaxed">
                  Activate genuine OTT, AI, Streaming, Music, and VPN accounts with 25% OFF savings in seconds.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10.5px] font-bold uppercase text-yellow-300 block mb-1">
                    ✓ Genuine Accounts
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Private profile with personal PIN & Ultra HD 4K streaming.
                  </p>
                </div>
                <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10.5px] font-bold uppercase text-emerald-400 block mb-1">
                    ✓ Full Warranty
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Live digital countdown, PDF invoices & 1-click renewal.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                {onNavigateToWallet && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToWallet();
                    }}
                    className="w-full sm:w-1/2 py-3 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Top Up Wallet</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className={`w-full ${
                    onNavigateToWallet ? "sm:w-1/2" : "sm:w-full"
                  } py-3 rounded-2xl bg-[#00AEEF] hover:bg-[#009bd4] active:scale-95 text-white font-black text-xs transition-all cursor-pointer shadow-lg shadow-[#00AEEF]/30`}
                >
                  Start Subscribing Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. BOTTOM FLOATING INTERACTIVE ACTION BAR (Z-[100020]) */}
      <div className="fixed bottom-3 inset-x-2 sm:inset-x-4 z-[100020] pointer-events-auto max-w-2xl mx-auto">
        <div className="bg-slate-950/95 border border-[#00AEEF]/40 rounded-3xl p-3.5 sm:p-4 shadow-2xl backdrop-blur-md text-white flex flex-col gap-3">
          {/* Step Information & Description */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#00AEEF]/20 border border-[#00AEEF]/40 flex items-center justify-center shrink-0 mt-0.5">
                {React.createElement(currentStep.icon || Crown, {
                  className: "w-4 h-4 text-[#00AEEF]"
                })}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-white truncate">
                    {currentStep.title}
                  </h4>
                  <span className="text-[10px] font-mono text-[#00AEEF] font-bold shrink-0">
                    ({currentStepIndex + 1}/{SUBSCRIPTION_TUTORIAL_STEPS.length})
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed mt-0.5">
                  {currentStep.shortCaption}
                </p>
              </div>
            </div>
          </div>

          {/* Clickable Step Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
            {SUBSCRIPTION_TUTORIAL_STEPS.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleJumpToStep(idx)}
                className={`h-6 px-2 rounded-lg text-[10px] font-mono font-bold transition-all shrink-0 flex items-center justify-center cursor-pointer ${
                  currentStepIndex === idx
                    ? "bg-[#00AEEF] text-slate-950 font-black shadow-md"
                    : currentStepIndex > idx
                    ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-900 text-slate-500 hover:text-slate-300"
                }`}
                title={s.title}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {/* Navigation Controls Bar */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStepIndex === 0}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-xs font-bold transition flex items-center gap-1 border border-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#00AEEF] to-blue-600 hover:from-[#009bd4] hover:to-blue-500 active:scale-95 text-xs font-black transition flex items-center gap-1 shadow-lg shadow-[#00AEEF]/30 text-white cursor-pointer"
              >
                <span>
                  {currentStepIndex === SUBSCRIPTION_TUTORIAL_STEPS.length - 1 ? "Finish Demo" : "Next Step"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {onNavigateToWallet && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToWallet();
                  }}
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-400/50 text-yellow-300 text-xs font-black transition cursor-pointer"
                >
                  <Wallet className="w-3 h-3" />
                  <span>Wallet</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition border border-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionHowToOrderTutorial;
