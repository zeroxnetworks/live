import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Check, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User, 
  UserPlus, 
  KeyRound
} from "lucide-react";
import { ZXLogo } from "./ZXLogo";

export type AuthFlowStep = 
  | "MODE_SELECT"
  | "FULLNAME"
  | "WHATSAPP"
  | "USERNAME"
  | "EMAIL"
  | "PASSWORD"
  | "REFERRAL"
  | "OTP_VERIFY"
  | "LOGIN_MODE"
  | "FORGOT_PASSWORD"
  | "RESET_OTP"
  | "SUCCESS";

interface ZeroxAuthGuideProps {
  currentStep: AuthFlowStep;
  isSignUp: boolean;
  registrationOtpStep: boolean;
  usernameStatus?: "idle" | "checking" | "available" | "taken" | "invalid";
  usernameMsg?: string;
  emailStatus?: "idle" | "checking" | "available" | "taken" | "invalid";
  emailMsg?: string;
  passwordFeedback?: {
    level: string;
    isValid: boolean;
    feedback: string;
  } | null;
  emailAddress?: string;
  onSelectStep?: (step: AuthFlowStep) => void;
}

const VOICE_PREF_KEY = "zerox_onboarding_voice_enabled";

export const ZeroxAuthGuide: React.FC<ZeroxAuthGuideProps> = ({
  currentStep,
  isSignUp,
  registrationOtpStep,
  usernameStatus,
  usernameMsg,
  emailStatus,
  emailMsg,
  passwordFeedback,
  emailAddress,
}) => {
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(VOICE_PREF_KEY);
      return saved !== "false";
    } catch {
      return true;
    }
  });

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [activeSpeechText, setActiveSpeechText] = useState<string>("");
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const lastSpokenRef = useRef<string>("");

  // Load available speech synthesis voices
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

  // Natural speech helper
  const speak = useCallback((text: string, forceReplay = false) => {
    if (!text) return;
    setActiveSpeechText(text);

    if (!voiceEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    if (!forceReplay && lastSpokenRef.current === text) {
      return;
    }
    lastSpokenRef.current = text;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;
      utterance.volume = 1.0;

      const voices = voicesRef.current.length > 0 ? voicesRef.current : window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => 
        (v.lang.startsWith("en-GB") || v.lang === "en_GB") && 
        (v.name.toLowerCase().includes("female") || 
         v.name.toLowerCase().includes("natural") || 
         v.name.toLowerCase().includes("serena") || 
         v.name.toLowerCase().includes("sonia") || 
         v.name.toLowerCase().includes("google uk english female"))
      ) || voices.find(v => v.lang.startsWith("en-GB"))
        || voices.find(v => v.lang.startsWith("en") && (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("samantha") || v.name.toLowerCase().includes("karen")))
        || voices.find(v => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.lang = "en-GB";

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("SpeechSynthesis warning:", err);
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);

  // Determine guidance text based on flow state & validations
  useEffect(() => {
    if (registrationOtpStep) {
      speak(
        emailAddress 
          ? `A 6-digit verification code has been dispatched to ${emailAddress}. Enter the numbers to activate.`
          : "Please check your email inbox for the 6-digit verification code and enter it below."
      );
      return;
    }

    if (!isSignUp) {
      if (currentStep === "FORGOT_PASSWORD") {
        speak("Enter your registered email address to receive a password recovery code.");
      } else if (currentStep === "RESET_OTP") {
        speak("Enter the 6-digit recovery code and choose a new strong password.");
      } else {
        speak("Welcome back! Enter your credentials to log in.");
      }
      return;
    }

    // Sign Up Flow Guidance & Real-Time Alerts
    if (usernameStatus === "taken") {
      speak("This username is already taken. Please choose another username.");
      return;
    }

    if (emailStatus === "taken") {
      speak("This email address is already registered. Please log in or use another email.");
      return;
    }

    if (passwordFeedback && !passwordFeedback.isValid && currentStep === "PASSWORD") {
      speak("Please add a stronger password with at least 8 characters, numbers and symbols.");
      return;
    }

    switch (currentStep) {
      case "FULLNAME":
        speak("Enter your full name for your account profile.");
        break;
      case "WHATSAPP":
        speak("Enter your WhatsApp number with country code for notifications.");
        break;
      case "USERNAME":
        speak("Choose a unique username for your Zerox Network account.");
        break;
      case "EMAIL":
        speak("Enter your email address to receive verification codes.");
        break;
      case "PASSWORD":
        speak("Create a secure password with letters, numbers, and symbols.");
        break;
      case "REFERRAL":
        speak("Enter your referrer code if available, or continue to create account.");
        break;
      case "MODE_SELECT":
      default:
        speak("Select Sign Up to create your account, or Login to access your portal.");
        break;
    }
  }, [
    currentStep, 
    isSignUp, 
    registrationOtpStep, 
    usernameStatus, 
    emailStatus, 
    passwordFeedback, 
    emailAddress, 
    speak
  ]);

  const toggleVoice = () => {
    const nextVal = !voiceEnabled;
    setVoiceEnabled(nextVal);
    try {
      localStorage.setItem(VOICE_PREF_KEY, String(nextVal));
    } catch {}
    if (!nextVal && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else if (nextVal && activeSpeechText) {
      speak(activeSpeechText, true);
    }
  };

  const handleReplayVoice = () => {
    if (activeSpeechText) {
      speak(activeSpeechText, true);
    }
  };

  // Build Roadmap Stages
  const signupSteps = [
    { id: "MODE_SELECT", label: "Mode", icon: UserPlus },
    { id: "INFO", label: "Info", icon: User },
    { id: "CREDENTIALS", label: "Account", icon: Mail },
    { id: "PASSWORD", label: "Security", icon: Lock },
    { id: "OTP_VERIFY", label: "Verify", icon: KeyRound },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="relative overflow-hidden rounded-2xl bg-slate-900/70 border border-blue-500/20 p-2.5 sm:p-3 shadow-md backdrop-blur-md space-y-2"
    >
      {/* Interactive Visual Roadmap Stepper for Sign Up */}
      {isSignUp && (
        <div className="px-1 pt-1 pb-1.5 border-b border-slate-800/80">
          <div className="flex items-center justify-between gap-1 relative">
            <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
            {signupSteps.map((step, idx) => {
              const isCurrent = 
                (step.id === "OTP_VERIFY" && registrationOtpStep) ||
                (step.id === "MODE_SELECT" && currentStep === "MODE_SELECT" && !registrationOtpStep) ||
                (step.id === "INFO" && ["FULLNAME", "WHATSAPP"].includes(currentStep) && !registrationOtpStep) ||
                (step.id === "CREDENTIALS" && ["USERNAME", "EMAIL"].includes(currentStep) && !registrationOtpStep) ||
                (step.id === "PASSWORD" && currentStep === "PASSWORD" && !registrationOtpStep);

              const isPast = 
                (registrationOtpStep && step.id !== "OTP_VERIFY") ||
                (!registrationOtpStep && idx < (
                  ["MODE_SELECT"].includes(currentStep) ? 0 :
                  ["FULLNAME", "WHATSAPP"].includes(currentStep) ? 1 :
                  ["USERNAME", "EMAIL"].includes(currentStep) ? 2 :
                  currentStep === "PASSWORD" ? 3 : 4
                ));

              const Icon = step.icon;

              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-0.5">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all shadow-sm ${
                      isCurrent
                        ? "bg-blue-600 text-white ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-950 scale-110 shadow-blue-500/40"
                        : isPast
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                        : "bg-slate-800 text-slate-500 border border-slate-700"
                    }`}
                  >
                    {isPast ? <Check className="w-2.5 h-2.5" /> : <Icon className="w-2.5 h-2.5" />}
                  </div>
                  <span
                    className={`text-[8.5px] font-mono tracking-tight font-bold uppercase transition-colors whitespace-nowrap ${
                      isCurrent
                        ? "text-blue-400"
                        : isPast
                        ? "text-emerald-400"
                        : "text-slate-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dynamic Voice Speech & Live Validation Feedback */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div className="p-1 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
            {isSpeaking ? (
              <div className="flex items-end gap-0.5 h-3 px-0.5">
                <span className="w-0.5 h-2 bg-blue-400 animate-pulse" />
                <span className="w-0.5 h-3 bg-blue-400 animate-pulse delay-75" />
                <span className="w-0.5 h-1.5 bg-blue-400 animate-pulse delay-150" />
              </div>
            ) : (
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] sm:text-xs text-slate-300 font-medium leading-relaxed italic">
              “{activeSpeechText || "Welcome! Enter your credentials to log in."}”
            </p>

            {/* Real-time Status Badges & Alerts */}
            {usernameStatus === "taken" && (
              <motion.div 
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded-md"
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Username taken. Please choose another username.</span>
              </motion.div>
            )}

            {usernameStatus === "available" && (
              <motion.div 
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md"
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Username is unique and available!</span>
              </motion.div>
            )}

            {emailStatus === "taken" && (
              <motion.div 
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-red-400 bg-red-950/40 border border-red-500/30 px-2 py-0.5 rounded-md"
              >
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span>Email already registered. Log in or use another email.</span>
              </motion.div>
            )}

            {passwordFeedback && !passwordFeedback.isValid && currentStep === "PASSWORD" && (
              <motion.div 
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md"
              >
                <ShieldCheck className="w-3 h-3 shrink-0" />
                <span>{passwordFeedback.feedback}</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Compact Voice Action Controls */}
        <div className="flex items-center gap-1 shrink-0 mt-0.5">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={handleReplayVoice}
            className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer shadow-sm flex items-center justify-center"
            title="Replay Voice Guidance"
          >
            <RotateCcw className="w-3 h-3" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={toggleVoice}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
              voiceEnabled
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300 hover:bg-blue-600/30"
                : "bg-slate-800/90 border-slate-700 text-slate-400 hover:text-white"
            }`}
            title={voiceEnabled ? "Mute Voice Guide" : "Enable Voice Guide"}
          >
            {voiceEnabled ? (
              <Volume2 className="w-3 h-3 text-blue-400" />
            ) : (
              <VolumeX className="w-3 h-3 text-slate-400" />
            )}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
