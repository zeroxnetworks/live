import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { UserAccount } from "../types";
import { ZXLogo } from "./ZXLogo";

export type OnboardingStep = 
  | "WELCOME"
  | "STEP_1_LOGIN_BTN"
  | "STEP_2_SIGNUP_TAB"
  | "STEP_3_FULLNAME"
  | "STEP_3_WHATSAPP"
  | "STEP_3_USERNAME"
  | "STEP_3_EMAIL"
  | "STEP_3_PASSWORD"
  | "STEP_3_REFERRAL"
  | "STEP_4_CREATE_ACCOUNT"
  | "STEP_5_OTP_INPUT"
  | "STEP_5_VERIFY_BTN"
  | "COMPLETED";

interface OnboardingGuideProps {
  currentUser: UserAccount | null;
  showAuthModal: boolean;
  onOpenAuthModal: () => void;
  siteLogoUrl?: string;
}

interface StepConfig {
  step: OnboardingStep;
  badge: string;
  title: string;
  instruction: string;
  voiceText: string;
  selector: string;
  fallbackSelector?: string;
  order: number;
  totalOrders: number;
}

const STEP_CONFIGS: Record<OnboardingStep, Omit<StepConfig, "step"> | null> = {
  WELCOME: null,
  STEP_1_LOGIN_BTN: {
    badge: "Step 1 of 6 • Getting Started",
    title: "Login or Register",
    instruction: "Click the Login / Register button in the top bar to open the portal.",
    voiceText: "First, click Login or Register to get started.",
    selector: "#onboarding-login-btn",
    fallbackSelector: "#system-status-time button",
    order: 1,
    totalOrders: 6
  },
  STEP_2_SIGNUP_TAB: {
    badge: "Step 2 of 6 • Account Mode",
    title: "Select Sign Up",
    instruction: "If you're creating a new account, select the Sign Up tab.",
    voiceText: "If you’re creating a new account, select Sign Up.",
    selector: "#onboarding-signup-tab",
    fallbackSelector: "button:has(.lucide-user-plus)",
    order: 2,
    totalOrders: 6
  },
  STEP_3_FULLNAME: {
    badge: "Step 3 of 6 • Profile Info",
    title: "Enter Full Name",
    instruction: "Enter your full name as you would like it to appear on your profile.",
    voiceText: "First, enter your full name.",
    selector: "#onboarding-fullname-input",
    fallbackSelector: "input[placeholder*='Full Name']",
    order: 3,
    totalOrders: 6
  },
  STEP_3_WHATSAPP: {
    badge: "Step 3 of 6 • WhatsApp Contact",
    title: "WhatsApp Number",
    instruction: "Enter your WhatsApp number with country code for notifications & support.",
    voiceText: "Next, enter your WhatsApp number.",
    selector: "#onboarding-whatsapp-input",
    fallbackSelector: "input[type='tel']",
    order: 3,
    totalOrders: 6
  },
  STEP_3_USERNAME: {
    badge: "Step 3 of 6 • Username",
    title: "Unique Username",
    instruction: "Choose a memorable username for your Zerox Network account.",
    voiceText: "Choose a unique username for your account.",
    selector: "#onboarding-username-input",
    fallbackSelector: "input[placeholder*='Username']",
    order: 3,
    totalOrders: 6
  },
  STEP_3_EMAIL: {
    badge: "Step 3 of 6 • Email Address",
    title: "Email Verification Address",
    instruction: "Enter your active email address. You will receive a 6-digit code for verification.",
    voiceText: "Now enter your email address. You’ll need access to this email for verification.",
    selector: "#onboarding-email-input",
    fallbackSelector: "input[placeholder*='name@domain.com']",
    order: 3,
    totalOrders: 6
  },
  STEP_3_PASSWORD: {
    badge: "Step 3 of 6 • Security",
    title: "Create Password",
    instruction: "Create a secure password with a mix of letters, numbers, and symbols.",
    voiceText: "Create a secure password for your account.",
    selector: "#onboarding-password-input",
    fallbackSelector: "input[placeholder*='Abcdef7!']",
    order: 3,
    totalOrders: 6
  },
  STEP_3_REFERRAL: {
    badge: "Step 3 of 6 • Referral (Optional)",
    title: "Referral Code",
    instruction: "If you have a referrer username, enter it here or proceed directly.",
    voiceText: "If you have a referral code, enter it here.",
    selector: "#onboarding-referral-input",
    fallbackSelector: "input[placeholder*='Referrer']",
    order: 3,
    totalOrders: 6
  },
  STEP_4_CREATE_ACCOUNT: {
    badge: "Step 4 of 6 • Account Creation",
    title: "Submit Registration",
    instruction: "Review your information and click Create Free Account to continue.",
    voiceText: "Everything looks good. Click Create Free Account to continue.",
    selector: "#onboarding-submit-btn",
    fallbackSelector: "button[type='submit']:has(.lucide-user-plus)",
    order: 4,
    totalOrders: 6
  },
  STEP_5_OTP_INPUT: {
    badge: "Step 5 of 6 • Email Verification",
    title: "6-Digit Code",
    instruction: "Check your email inbox for the 6-digit code and enter it below.",
    voiceText: "One last step. Check your email and enter the six-digit verification code.",
    selector: "#onboarding-otp-input",
    fallbackSelector: "input[placeholder='123456']",
    order: 5,
    totalOrders: 6
  },
  STEP_5_VERIFY_BTN: {
    badge: "Step 5 of 6 • Activate Account",
    title: "Verify Account",
    instruction: "Click Verify & Activate Account to complete your verification.",
    voiceText: "Once you’ve entered the code, verify your account.",
    selector: "#onboarding-verify-btn",
    fallbackSelector: "button:has-text('Verify')",
    order: 5,
    totalOrders: 6
  },
  COMPLETED: null
};

const STORAGE_KEY = "zerox_onboarding_completed";
const VOICE_PREF_KEY = "zerox_onboarding_voice_enabled";

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({
  currentUser,
  showAuthModal,
  onOpenAuthModal,
  siteLogoUrl
}) => {
  const [activeStep, setActiveStep] = useState<OnboardingStep | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem(VOICE_PREF_KEY);
    return saved !== "false";
  });
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() => 
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );

  const prevStepRef = useRef<OnboardingStep | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);

  // Initialize SpeechSynthesis voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    const updateVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  // Check if onboarding should start on first visit or on manual event trigger
  useEffect(() => {
    // Only for visitors who haven't completed or skipped onboarding and aren't already logged in
    const isCompleted = localStorage.getItem(STORAGE_KEY);
    if (!isCompleted && !currentUser) {
      // Short delay for smooth entrance
      const timer = setTimeout(() => {
        setActiveStep("WELCOME");
      }, 600);
      return () => clearTimeout(timer);
    }

    const handleManualStart = () => {
      setActiveStep("WELCOME");
    };

    window.addEventListener("zerox:start-onboarding", handleManualStart);
    return () => window.removeEventListener("zerox:start-onboarding", handleManualStart);
  }, [currentUser]);

  // Handle final completion voice when user registers/logs in while onboarding was active
  useEffect(() => {
    if (currentUser && activeStep && activeStep !== "COMPLETED") {
      // User finished registration / login!
      setActiveStep("COMPLETED");
      localStorage.setItem(STORAGE_KEY, "true");
      
      // Play final voice only
      speak("Perfect! Your account is ready. Welcome to Zerox Network.");

      const endTimer = setTimeout(() => {
        setActiveStep(null);
      }, 3500);

      return () => clearTimeout(endTimer);
    }
  }, [currentUser, activeStep]);

  // Voice player helper - strictly respects device native volume and mute settings
  const speak = useCallback((text: string) => {
    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      // Natural cadence and tone matching professional product onboarding
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      // Native unity gain (1.0) - automatically follows the user's current device/system media volume
      // and never overrides, amplifies, or resets the system media volume slider or hardware mute state
      utterance.volume = 1.0;

      const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
      
      // Professional UK English Female Voice preference
      const ukFemale = voices.find(v => 
        (v.lang.startsWith("en-GB") || v.lang === "en_GB") && 
        (v.name.toLowerCase().includes("female") || 
         v.name.toLowerCase().includes("natural") || 
         v.name.toLowerCase().includes("serena") || 
         v.name.toLowerCase().includes("sonia") || 
         v.name.toLowerCase().includes("victoria") || 
         v.name.toLowerCase().includes("martha") || 
         v.name.toLowerCase().includes("google uk english female"))
      ) || voices.find(v => v.lang.startsWith("en-GB"))
        || voices.find(v => v.lang.startsWith("en") && (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("karen")))
        || voices.find(v => v.lang.startsWith("en"));

      if (ukFemale) {
        utterance.voice = ukFemale;
      }
      utterance.lang = "en-GB";

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("SpeechSynthesis error:", e);
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);

  // Play step voice on step change
  useEffect(() => {
    if (!activeStep || activeStep === prevStepRef.current) return;
    prevStepRef.current = activeStep;

    if (activeStep === "WELCOME") {
      speak("Hi! Welcome to Zerox Network. I’ll quickly show you how to create your account. Just follow me.");
    } else if (activeStep !== "COMPLETED") {
      const config = STEP_CONFIGS[activeStep];
      if (config?.voiceText) {
        speak(config.voiceText);
      }
    }
  }, [activeStep, speak]);

  // Resize listener
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Dynamic step element tracking & bounding box calculator
  useEffect(() => {
    if (!activeStep || activeStep === "WELCOME" || activeStep === "COMPLETED") {
      setTargetRect(null);
      return;
    }

    const config = STEP_CONFIGS[activeStep];
    if (!config) return;

    let isMounted = true;

    const updateRect = () => {
      if (!isMounted) return;

      let el = document.querySelector(config.selector);
      if (!el && config.fallbackSelector) {
        el = document.querySelector(config.fallbackSelector);
      }

      if (el) {
        const rect = el.getBoundingClientRect();
        // Check if element is visible
        if (rect.width > 0 && rect.height > 0) {
          setTargetRect(rect);
        }
      }

      animationFrameRef.current = requestAnimationFrame(updateRect);
    };

    updateRect();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [activeStep]);

  // Smart Step Transitions based on DOM & User Actions
  useEffect(() => {
    if (!activeStep || activeStep === "WELCOME" || activeStep === "COMPLETED") return;

    // Step 1 -> When auth modal opens, move to Step 2
    if (activeStep === "STEP_1_LOGIN_BTN" && showAuthModal) {
      // Check if sign-up is already active or if we should highlight sign-up tab
      const isSignUpForm = document.querySelector("#onboarding-fullname-input");
      if (isSignUpForm) {
        setActiveStep("STEP_3_FULLNAME");
      } else {
        setActiveStep("STEP_2_SIGNUP_TAB");
      }
      return;
    }

    // If auth modal is closed while on steps 2-5, move back to Step 1
    if (!showAuthModal && activeStep !== "STEP_1_LOGIN_BTN") {
      setActiveStep("STEP_1_LOGIN_BTN");
      return;
    }

    // Step 2 -> If signup tab is clicked and fullname input appears, move to Step 3 Fullname
    if (activeStep === "STEP_2_SIGNUP_TAB") {
      const checkSignUpTimer = setInterval(() => {
        const fullnameEl = document.querySelector("#onboarding-fullname-input");
        if (fullnameEl) {
          setActiveStep("STEP_3_FULLNAME");
          clearInterval(checkSignUpTimer);
        }
      }, 100);
      return () => clearInterval(checkSignUpTimer);
    }

    // Step 3 -> Event listeners on form fields for smooth field-by-field progression
    if (activeStep.startsWith("STEP_3_") || activeStep === "STEP_4_CREATE_ACCOUNT") {
      // Monitor OTP step appearance
      const otpInput = document.querySelector("#onboarding-otp-input");
      if (otpInput) {
        setActiveStep("STEP_5_OTP_INPUT");
        return;
      }
    }

    // Step 5 -> OTP Input to Verify Button
    if (activeStep === "STEP_5_OTP_INPUT") {
      const otpEl = document.querySelector("#onboarding-otp-input") as HTMLInputElement | null;
      if (otpEl && otpEl.value.length === 6) {
        setActiveStep("STEP_5_VERIFY_BTN");
      }
    }
  }, [activeStep, showAuthModal]);

  // Setup input focus & blur auto-advancers for Step 3
  useEffect(() => {
    if (!activeStep || !activeStep.startsWith("STEP_3_")) return;

    const config = STEP_CONFIGS[activeStep];
    if (!config) return;

    const el = document.querySelector(config.selector) as HTMLInputElement | null;
    if (!el) return;

    // Scroll element into view smoothly without being obstructed
    try {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {}

    const handleFocus = () => {
      // Element is being interacted with
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab" || e.key === "Enter") {
        advanceNextStep();
      }
    };

    el.addEventListener("focus", handleFocus);
    el.addEventListener("keydown", handleKeyDown);

    return () => {
      el.removeEventListener("focus", handleFocus);
      el.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeStep]);

  const advanceNextStep = () => {
    switch (activeStep) {
      case "WELCOME":
        setActiveStep("STEP_1_LOGIN_BTN");
        break;
      case "STEP_1_LOGIN_BTN":
        onOpenAuthModal();
        setActiveStep("STEP_2_SIGNUP_TAB");
        break;
      case "STEP_2_SIGNUP_TAB":
        setActiveStep("STEP_3_FULLNAME");
        break;
      case "STEP_3_FULLNAME":
        setActiveStep("STEP_3_WHATSAPP");
        break;
      case "STEP_3_WHATSAPP":
        setActiveStep("STEP_3_USERNAME");
        break;
      case "STEP_3_USERNAME":
        setActiveStep("STEP_3_EMAIL");
        break;
      case "STEP_3_EMAIL":
        setActiveStep("STEP_3_PASSWORD");
        break;
      case "STEP_3_PASSWORD":
        setActiveStep("STEP_3_REFERRAL");
        break;
      case "STEP_3_REFERRAL":
        setActiveStep("STEP_4_CREATE_ACCOUNT");
        break;
      case "STEP_4_CREATE_ACCOUNT":
        setActiveStep("STEP_5_OTP_INPUT");
        break;
      case "STEP_5_OTP_INPUT":
        setActiveStep("STEP_5_VERIFY_BTN");
        break;
      case "STEP_5_VERIFY_BTN":
        // Await real verification
        break;
      default:
        break;
    }
  };

  const handleSkip = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    localStorage.setItem(STORAGE_KEY, "true");
    setActiveStep(null);
  };

  const toggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    localStorage.setItem(VOICE_PREF_KEY, String(nextVal));
    if (!nextVal && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (nextVal && activeStep) {
      if (activeStep === "WELCOME") {
        speak("Hi! Welcome to Zerox Network. I’ll quickly show you how to create your account. Just follow me.");
      } else {
        const config = STEP_CONFIGS[activeStep];
        if (config?.voiceText) speak(config.voiceText);
      }
    }
  };

  if (!activeStep) return null;

  // 1. WELCOME MODAL OVERLAY
  if (activeStep === "WELCOME") {
    return (
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-md bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Header Badge */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center p-1.5 shrink-0 overflow-hidden shadow-inner">
                {siteLogoUrl ? (
                  <img src={siteLogoUrl} alt="Platform Logo" className="w-full h-full object-contain rounded-lg" />
                ) : (
                  <ZXLogo size={28} withBackground={false} interactive={false} />
                )}
              </div>
              <div>
                <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-blue-400 block">
                  Zerox Guide
                </span>
                <span className="text-xs font-semibold text-zinc-400">
                  Quick Onboarding Walkthrough
                </span>
              </div>
            </div>

            {/* Voice Toggle */}
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                voiceEnabled 
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30" 
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white"
              }`}
              title={voiceEnabled ? "Voice Enabled (Click to Mute)" : "Voice Muted (Click to Enable)"}
            >
              {voiceEnabled ? (
                <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                  <Volume2 className="w-4 h-4" />
                  <span className="hidden xs:inline text-[10px]">VOICE ON</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
                  <VolumeX className="w-4 h-4" />
                  <span className="hidden xs:inline text-[10px]">MUTED</span>
                </div>
              )}
            </button>
          </div>

          {/* Welcome Content */}
          <div className="space-y-3 mb-6">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Welcome to Zerox Network
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              “Hi! Welcome to Zerox Network. I’ll quickly show you how to create your account. Just follow me.”
            </p>
            <div className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-2xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <p className="text-xs text-zinc-400">
                Learn how to register, set up your profile, and activate your account with 6-digit email verification.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={advanceNextStep}
              className="w-full sm:flex-1 py-3.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <span>START GUIDE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="w-full sm:w-auto py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center"
            >
              SKIP TUTORIAL
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // 2. FINAL COMPLETION TOAST / VOICE OVERLAY
  if (activeStep === "COMPLETED") {
    return (
      <div className="fixed top-6 right-6 z-[100000] pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="bg-zinc-950/95 border border-emerald-500/40 p-4 rounded-2xl shadow-2xl shadow-emerald-500/20 flex items-center gap-3.5 max-w-sm backdrop-blur-xl"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 font-mono">
              Account Ready!
            </h4>
            <p className="text-xs font-medium text-white leading-snug">
              “Perfect! Your account is ready. Welcome to Zerox Network.”
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // 3. ACTIVE STEP SPOTLIGHT & FLOATING TOOLTIP
  const currentConfig = STEP_CONFIGS[activeStep];
  if (!currentConfig) return null;

  // Calculate Tooltip position based on target rect & viewport
  const getTooltipStyle = (): React.CSSProperties => {
    if (!targetRect) {
      return {
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        width: isMobile ? "calc(100vw - 32px)" : "420px",
        zIndex: 100002
      };
    }

    const padding = 16;
    const tooltipWidth = isMobile ? window.innerWidth - 32 : 380;
    const tooltipHeight = 180; // approximate

    // On mobile, position at bottom or above target
    if (isMobile) {
      if (targetRect.top > window.innerHeight / 2) {
        // Position above target
        return {
          position: "fixed",
          bottom: window.innerHeight - targetRect.top + 16,
          left: 16,
          width: tooltipWidth,
          zIndex: 100002
        };
      } else {
        // Position below target
        return {
          position: "fixed",
          top: targetRect.bottom + 16,
          left: 16,
          width: tooltipWidth,
          zIndex: 100002
        };
      }
    }

    // On desktop, try right side, then below, then left, then above
    if (targetRect.right + tooltipWidth + padding < window.innerWidth) {
      return {
        position: "fixed",
        top: Math.max(padding, Math.min(targetRect.top - 20, window.innerHeight - tooltipHeight - padding)),
        left: targetRect.right + 18,
        width: tooltipWidth,
        zIndex: 100002
      };
    } else if (targetRect.left - tooltipWidth - padding > 0) {
      return {
        position: "fixed",
        top: Math.max(padding, Math.min(targetRect.top - 20, window.innerHeight - tooltipHeight - padding)),
        left: targetRect.left - tooltipWidth - 18,
        width: tooltipWidth,
        zIndex: 100002
      };
    } else if (targetRect.bottom + tooltipHeight + padding < window.innerHeight) {
      return {
        position: "fixed",
        top: targetRect.bottom + 16,
        left: Math.max(padding, Math.min(targetRect.left, window.innerWidth - tooltipWidth - padding)),
        width: tooltipWidth,
        zIndex: 100002
      };
    } else {
      return {
        position: "fixed",
        bottom: window.innerHeight - targetRect.top + 16,
        left: Math.max(padding, Math.min(targetRect.left, window.innerWidth - tooltipWidth - padding)),
        width: tooltipWidth,
        zIndex: 100002
      };
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] pointer-events-none">
      {/* Target Element Spotlight Ring (Allowing Clicks on Target Element) */}
      {targetRect && (
        <motion.div
          layoutId="onboarding-spotlight"
          initial={false}
          animate={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            opacity: 1
          }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          className="fixed rounded-2xl border-2 border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.6)] ring-4 ring-blue-500/30 pointer-events-none z-[100001]"
        >
          {/* Animated corner pulsing beacons */}
          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
          <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-400" />
        </motion.div>
      )}

      {/* Floating Interactive Guide Card */}
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.96 }}
        style={getTooltipStyle()}
        className="pointer-events-auto bg-zinc-950/95 border border-blue-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-xl ring-1 ring-blue-500/20 overflow-hidden"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-mono font-black uppercase tracking-wider text-blue-400">
              {currentConfig.badge}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Voice Toggle */}
            <button
              type="button"
              onClick={toggleVoice}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                voiceEnabled 
                  ? "bg-blue-600/20 border-blue-500/40 text-blue-300" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-500"
              }`}
              title={voiceEnabled ? "Mute Voice" : "Enable Voice"}
            >
              {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            {/* Close / Skip */}
            <button
              type="button"
              onClick={handleSkip}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
              title="Skip Tutorial"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Card Title & Spoken Instruction */}
        <div className="space-y-1 mb-3.5">
          <h3 className="text-sm font-bold text-white tracking-tight">
            {currentConfig.title}
          </h3>
          <p className="text-xs text-zinc-300 leading-relaxed font-normal">
            {currentConfig.instruction}
          </p>
          <div className="pt-1">
            <p className="text-[11px] text-blue-300/90 italic font-medium">
              “{currentConfig.voiceText}”
            </p>
          </div>
        </div>

        {/* Footer Navigation & Actions */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-900">
          <button
            type="button"
            onClick={handleSkip}
            className="text-[10px] font-bold text-zinc-500 hover:text-zinc-300 uppercase tracking-wider transition-colors cursor-pointer py-1"
          >
            Skip Tutorial
          </button>

          <div className="flex items-center gap-2">
            {activeStep.startsWith("STEP_3_") && (
              <button
                type="button"
                onClick={advanceNextStep}
                className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Next Field</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            )}

            {activeStep === "STEP_1_LOGIN_BTN" && (
              <button
                type="button"
                onClick={() => {
                  onOpenAuthModal();
                  setActiveStep("STEP_2_SIGNUP_TAB");
                }}
                className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider shadow-md transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <span>Open Login</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
