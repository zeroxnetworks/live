import React, { useState, useRef, useEffect } from "react";
import { 
  Bot, MessageSquare, X, Send, Sparkles, User, RefreshCw, ChevronDown, 
  Minimize2, Maximize2, ChevronUp, ExternalLink, HelpCircle, ChevronRight, 
  ChevronLeft, Check, Cpu, Mic, MicOff, PhoneCall, PhoneOff, Volume2, VolumeX, Radio, Zap, Clock, ShieldAlert, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserAccount } from "../types";
import { playClickSound, playSlideSound, playSuccessSound } from "../lib/sounds";

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

interface InjazifyChatbotProps {
  onNavigateToTab?: (tab: string) => void;
  userBalance?: number;
  currentUser?: UserAccount | null;
  formatPrice?: (baseUnits: number) => string;
  cryptoRate?: number;
  activeTab?: string;
}

export const InjazifyChatbot: React.FC<InjazifyChatbotProps> = ({ 
  onNavigateToTab, 
  userBalance,
  currentUser,
  formatPrice,
  cryptoRate = 278,
  activeTab
}) => {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem("zerox_chat_open");
    return saved === "true";
  });
  const [isMinimized, setIsMinimized] = useState(() => {
    const saved = localStorage.getItem("zerox_chat_minimized");
    return saved === "true";
  });
  const [isDismissed, setIsDismissed] = useState(() => {
    const saved = localStorage.getItem("zerox_chat_dismissed");
    return saved === "true";
  });
  
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("zerox_chat_messages");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved messages", e);
      }
    }
    return [
      {
        id: "welcome-1",
        sender: "bot",
        text: "👋 Hi! I'm **Mr.Zx**, your official AI assistant for **Zerox Network** (A project of **Injazify** • [injazify.com](https://www.injazify.com/)).\n\n🌐 **Official Website**: [zeroxnetwork.ai.studio](https://zeroxnetwork.ai.studio)\n\nI'm updated with all platform services:\n- 📱 **Virtual Phone Numbers**: Live OTP SMS verification for WhatsApp, Telegram, Google, TikTok, ChatGPT & 500+ apps across 100+ countries (20-min window, 100% auto-refund).\n- 🚀 **SMM Social Panel**: Instant followers, likes, members & views for Telegram, Instagram, TikTok, YouTube & Facebook with auto-refill.\n- 🎬 **Subscriptions**: Premium digital accounts & licenses at wholesale rates.\n- 💳 **Auto-Deposits**: EasyPaisa, JazzCash, USDT (TRC20/BEP20), Binance Pay & Bank Transfer.\n- ⭐ **Loyalty Cashbacks**: Earn points on purchases & convert 1:1 to wallet credit!\n- 🔑 **Developer API**: Standard 5sim & SMM panel protocol keys.\n\nHow can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
  });
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<any>(null);

  // --- AI VOICE CALL ENGINE STATE & REFS ---
  type VoiceCallState = "IDLE" | "CONNECTING" | "CONNECTED" | "LISTENING" | "PROCESSING" | "AI_SPEAKING" | "ENDING" | "COMPLETED" | "ERROR";

  const [isVoiceConfirmOpen, setIsVoiceConfirmOpen] = useState(false);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [isVoiceConnecting, setIsVoiceConnecting] = useState(false);
  const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null);
  const [connectedSeconds, setConnectedSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceCallState>("IDLE");
  const [interimSpeech, setInterimSpeech] = useState("");
  const [warningBanner, setWarningBanner] = useState<string | null>(null);
  const [voiceErrorMessage, setVoiceErrorMessage] = useState<string | null>(null);
  const [voiceMicError, setVoiceMicError] = useState<string | null>(null);
  const [callEndSummary, setCallEndSummary] = useState<{ durationSecs: number; totalCharge: number; endReason: string } | null>(null);

  // Refs for synchronous state access without stale closure traps
  const voiceStateRef = useRef<VoiceCallState>("IDLE");
  const isVoiceCallActiveRef = useRef(false);
  const isMutedRef = useRef(false);
  const isSpeakerMutedRef = useRef(false);
  const voiceSessionIdRef = useRef<string | null>(null);
  const connectedSecondsRef = useRef(0);

  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<any>(null);
  const ttsTimeoutRef = useRef<any>(null);
  const callTimerRef = useRef<any>(null);
  const heartbeatTimerRef = useRef<any>(null);
  const callStartTimeRef = useRef<number>(0);

  const isProcessingUtteranceRef = useRef(false);
  const isFinalizingRef = useRef(false);
  const isInitiatingCallRef = useRef(false);
  const silenceTimerRef = useRef<any>(null);

  // Sync state variables into refs
  useEffect(() => {
    voiceStateRef.current = voiceState;
  }, [voiceState]);

  useEffect(() => {
    isVoiceCallActiveRef.current = isVoiceCallActive;
  }, [isVoiceCallActive]);

  useEffect(() => {
    isMutedRef.current = isMuted;
    if (isMuted && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
    } else if (!isMuted && isVoiceCallActiveRef.current && voiceStateRef.current === "LISTENING") {
      safeStartRecognition();
    }
  }, [isMuted]);

  useEffect(() => {
    isSpeakerMutedRef.current = isSpeakerMuted;
    if (isSpeakerMuted && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [isSpeakerMuted]);

  useEffect(() => {
    voiceSessionIdRef.current = voiceSessionId;
  }, [voiceSessionId]);

  useEffect(() => {
    connectedSecondsRef.current = connectedSeconds;
  }, [connectedSeconds]);

  const baseBalanceUnits = currentUser?.balance ?? userBalance ?? 0;
  const userPkrBalance = baseBalanceUnits * (cryptoRate || 278);
  const MIN_CALL_BALANCE = 20.0; // Rs 20 PKR required for max 2-minute call
  const currentAccruedCharge = Number((Math.min(120, connectedSeconds) * (10.0 / 60.0)).toFixed(2));
  const remainingWalletBalance = Math.max(0, Number((userPkrBalance - currentAccruedCharge).toFixed(2)));

  // Voice Call Timer & Heartbeat Loop
  useEffect(() => {
    if (isVoiceCallActive && voiceSessionId) {
      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }

      callTimerRef.current = setInterval(() => {
        const elapsed = Math.min(120, Math.floor((Date.now() - callStartTimeRef.current) / 1000));
        setConnectedSeconds(elapsed);
        connectedSecondsRef.current = elapsed;

        const remainingSecs = Math.max(0, 120 - elapsed);
        if (remainingSecs <= 30 && remainingSecs > 0) {
          setWarningBanner(`⚠️ ${remainingSecs} seconds remaining (Call auto-disconnects at 2 minutes)`);
        } else if (remainingSecs > 30) {
          setWarningBanner(null);
        }

        if (elapsed >= 120) {
          handleEndVoiceCall("MAX_DURATION_REACHED");
        }
      }, 1000);

      heartbeatTimerRef.current = setInterval(async () => {
        if (!voiceSessionIdRef.current) return;
        try {
          const res = await fetch("/api/ai-voice/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId: voiceSessionIdRef.current,
              userId: currentUser?.id || (currentUser as any)?.uid || "guest",
              elapsedSeconds: connectedSecondsRef.current
            })
          });
          const data = await res.json();
          if (data.terminate) {
            handleEndVoiceCall(data.endReason || "SERVER_TERMINATED");
          }
        } catch (e) {
          console.warn("Voice heartbeat error", e);
        }
      }, 5000);
    } else {
      setWarningBanner(null);
    }

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    };
  }, [isVoiceCallActive, voiceSessionId]);

  // Hydrate Previous Chat History on Component Load
  useEffect(() => {
    const loadHistory = async () => {
      const targetId = currentUser?.id || (currentUser as any)?.uid || "guest_user";
      try {
        const res = await fetch(`/api/chat/history?userId=${targetId}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          setMessages(data.messages);
        }
      } catch (e) {
        console.warn("[Chatbot] History hydration error:", e);
      }
    };
    loadHistory();
  }, [currentUser?.id, (currentUser as any)?.uid]);

  // Natural Female Speech Synthesis Helper
  const speakWithFemaleVoice = (textToSpeak: string, onEndCallback?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setVoiceState("LISTENING");
      voiceStateRef.current = "LISTENING";
      if (onEndCallback) onEndCallback();
      return;
    }

    if (isSpeakerMutedRef.current) {
      setVoiceState("LISTENING");
      voiceStateRef.current = "LISTENING";
      if (onEndCallback) onEndCallback();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);

      const cleanText = textToSpeak.replace(/[\*\_`\#]/g, "").replace(/\n/g, " ").trim();
      if (!cleanText) {
        setVoiceState("LISTENING");
        voiceStateRef.current = "LISTENING";
        if (onEndCallback) onEndCallback();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utteranceRef.current = utterance;

      const voices = window.speechSynthesis.getVoices();
      const femaleVoice = voices.find((v) => 
        (v.name.includes("Female") || v.name.includes("Zira") || v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Victoria") || v.name.includes("Natural")) &&
        !v.name.toLowerCase().includes("male") && !v.name.toLowerCase().includes("david")
      ) || voices.find(v => v.lang.startsWith("en") || v.lang.startsWith("ur") || v.lang.startsWith("hi")) || voices[0];

      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.pitch = 1.1;
      utterance.rate = 1.02;

      let hasEnded = false;
      const finishTTS = () => {
        if (hasEnded) return;
        hasEnded = true;
        if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);
        const st = voiceStateRef.current as VoiceCallState;
        if (st !== "ENDING" && st !== "COMPLETED") {
          setVoiceState("LISTENING");
          voiceStateRef.current = "LISTENING";
        }
        if (onEndCallback) onEndCallback();
      };

      utterance.onstart = () => {
        setVoiceState("AI_SPEAKING");
        voiceStateRef.current = "AI_SPEAKING";
      };

      utterance.onend = finishTTS;
      utterance.onerror = finishTTS;

      // Fallback timer in case browser fails to fire onend
      const maxDurationMs = Math.max(3500, Math.ceil(cleanText.length / 8) * 1000 + 3000);
      ttsTimeoutRef.current = setTimeout(finishTTS, maxDurationMs);

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("TTS Error", e);
      setVoiceState("LISTENING");
      voiceStateRef.current = "LISTENING";
      if (onEndCallback) onEndCallback();
    }
  };

  // Safe Start Recognition
  const safeStartRecognition = () => {
    if (!isVoiceCallActiveRef.current || isMutedRef.current) return;
    if (voiceStateRef.current !== "LISTENING") return;

    if (!recognitionRef.current) {
      initSpeechRecognition();
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (err: any) {
      if (err.name === "InvalidStateError" || err.message?.includes("already started")) {
        // Recognition is already active
      } else {
        setTimeout(() => {
          if (isVoiceCallActiveRef.current && voiceStateRef.current === "LISTENING") {
            try { recognitionRef.current.start(); } catch(e){}
          }
        }, 300);
      }
    }
  };

  // Check Browser Microphone Permission
  const checkMicrophonePermission = async (): Promise<{ granted: boolean; errorMessage?: string }> => {
    if (typeof window === "undefined" || !navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return {
        granted: false,
        errorMessage: "Microphone access is not supported by your browser or current environment."
      };
    }

    if (window.isSecureContext === false && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return {
        granted: false,
        errorMessage: "Microphone access requires a secure HTTPS connection."
      };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop tracks immediately so mic is released for speech recognition
      stream.getTracks().forEach((track) => track.stop());
      return { granted: true };
    } catch (err: any) {
      console.warn("[Mic Check Error]", err);
      let msg = "Microphone access is required to talk with Mr.Zx AI Assistant. Please allow microphone access in your browser site settings.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        msg = "Microphone permission was denied. Please allow microphone access in your browser settings to start the AI voice call.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        msg = "No microphone hardware was detected on your device. Please attach a microphone and try again.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        msg = "Your microphone is currently in use by another application. Please close that application and try again.";
      }
      return { granted: false, errorMessage: msg };
    }
  };

  // Speech Recognition Initializer with Silence Timeout & Robust State Control
  const initSpeechRecognition = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceErrorMessage("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.stop();
        } catch(e) {}
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        if (voiceStateRef.current !== "PROCESSING" && voiceStateRef.current !== "AI_SPEAKING") {
          setVoiceState("LISTENING");
          voiceStateRef.current = "LISTENING";
        }
      };

      const processSpeechText = async (rawText: string) => {
        if (isProcessingUtteranceRef.current || !rawText || rawText.trim().length < 2) return;
        isProcessingUtteranceRef.current = true;

        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }

        try { rec.stop(); } catch (e) {}

        setVoiceState("PROCESSING");
        voiceStateRef.current = "PROCESSING";
        setInterimSpeech("");

        const cleanUserText = rawText.trim();
        const userMsg: ChatMessage = {
          id: "user-voice-" + Date.now(),
          sender: "user",
          text: `🎙️ "${cleanUserText}"`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, userMsg]);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        try {
          const apiRes = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({ 
              message: cleanUserText, 
              history: [],
              userId: currentUser?.id || (currentUser as any)?.uid || "guest_user",
              username: currentUser?.username || currentUser?.fullName || "Valued User"
            })
          });
          clearTimeout(timeoutId);

          const data = await apiRes.json();
          const aiText = data.text || "I am Mr.Zx, your official AI Assistant. How can I assist you on ZeroX Network?";

          const aiMsg: ChatMessage = {
            id: "bot-voice-" + Date.now(),
            sender: "bot",
            text: aiText,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          };
          setMessages((prev) => [...prev, aiMsg]);

          speakWithFemaleVoice(aiText, () => {
            isProcessingUtteranceRef.current = false;
            if (isVoiceCallActiveRef.current && !isMutedRef.current) {
              setVoiceState("LISTENING");
              voiceStateRef.current = "LISTENING";
              safeStartRecognition();
            }
          });
        } catch (err: any) {
          clearTimeout(timeoutId);
          isProcessingUtteranceRef.current = false;

          const currentVoiceState = voiceStateRef.current as VoiceCallState;
          if (currentVoiceState !== "ENDING" && currentVoiceState !== "COMPLETED") {
            const fallbackText = "Sorry, I didn't catch that. Could you please repeat?";
            speakWithFemaleVoice(fallbackText, () => {
              if (isVoiceCallActiveRef.current && !isMutedRef.current) {
                setVoiceState("LISTENING");
                voiceStateRef.current = "LISTENING";
                safeStartRecognition();
              }
            });
          }
        }
      };

      rec.onresult = (event: any) => {
        if (voiceStateRef.current !== "LISTENING" || isProcessingUtteranceRef.current) return;

        let transcript = "";
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          transcript += res[0].transcript;
          if (res.isFinal) isFinal = true;
        }

        setInterimSpeech(transcript);

        if (isFinal && transcript.trim().length > 1) {
          processSpeechText(transcript);
        } else if (transcript.trim().length > 1) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            if (voiceStateRef.current === "LISTENING" && !isProcessingUtteranceRef.current) {
              processSpeechText(transcript);
            }
          }, 1800);
        }
      };

      rec.onerror = (err: any) => {
        console.warn("[SpeechRecognition Error]", err?.error);
        if (err?.error === "not-allowed" || err?.error === "service-not-allowed") {
          handleEndVoiceCall("PERMISSION_DENIED");
        } else if (err?.error === "audio-capture") {
          handleEndVoiceCall("MIC_ERROR");
        } else if (isVoiceCallActiveRef.current && voiceStateRef.current === "LISTENING" && !isMutedRef.current) {
          setTimeout(() => safeStartRecognition(), 500);
        }
      };

      rec.onend = () => {
        if (isVoiceCallActiveRef.current && !isMutedRef.current && voiceStateRef.current === "LISTENING" && !isProcessingUtteranceRef.current) {
          setTimeout(() => safeStartRecognition(), 300);
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch (err) {
        console.warn("Failed to start speech recognition", err);
      }
    } catch (err) {
      console.warn("Failed to init speech recognition", err);
    }
  };

  // Start Voice Call Session (Requires explicit pre-check of microphone permission)
  const handleStartVoiceCall = async () => {
    if (isInitiatingCallRef.current || isVoiceCallActiveRef.current) return;
    isInitiatingCallRef.current = true;

    const currentBal = Number(userPkrBalance || 0);
    if (currentBal < MIN_CALL_BALANCE) {
      isInitiatingCallRef.current = false;
      return;
    }

    try {
      setIsVoiceConnecting(true);
      setVoiceMicError(null);
      setVoiceErrorMessage(null);
      isFinalizingRef.current = false;
      setCallEndSummary(null);
      setWarningBanner(null);
      setConnectedSeconds(0);
      connectedSecondsRef.current = 0;
      callStartTimeRef.current = 0;

      // STEP 1: Check microphone permission BEFORE creating backend session or starting timers
      const micCheck = await checkMicrophonePermission();
      if (!micCheck.granted) {
        setIsVoiceConnecting(false);
        isInitiatingCallRef.current = false;
        setVoiceMicError(micCheck.errorMessage || "Microphone access is required to start an AI voice call.");
        return;
      }

      // STEP 2: Only after mic is granted, initialize billable backend session
      const res = await fetch("/api/ai-voice/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id || (currentUser as any)?.uid || "guest",
          username: currentUser?.username || currentUser?.fullName || "Guest"
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setIsVoiceConnecting(false);
        isInitiatingCallRef.current = false;
        setVoiceMicError(data.error || "Failed to initiate voice call session. No charge was made.");
        return;
      }

      setVoiceSessionId(data.sessionId);
      voiceSessionIdRef.current = data.sessionId;

      setIsVoiceConfirmOpen(false);
      setIsVoiceCallActive(true);
      isVoiceCallActiveRef.current = true;
      setIsVoiceConnecting(false);
      isInitiatingCallRef.current = false;

      setVoiceState("CONNECTING");
      voiceStateRef.current = "CONNECTING";

      const greeting = `Hello ${userName}! I am Mr. Zx, your official AI Assistant. How can I help you today?`;
      
      callStartTimeRef.current = Date.now();

      speakWithFemaleVoice(greeting, () => {
        if (isVoiceCallActiveRef.current) {
          setVoiceState("LISTENING");
          voiceStateRef.current = "LISTENING";
          initSpeechRecognition();
        }
      });
    } catch (err: any) {
      console.error("Start call error", err);
      setIsVoiceConnecting(false);
      isInitiatingCallRef.current = false;
      setVoiceMicError("Unable to start the voice call. Please try again.");
    }
  };

  // End Voice Call Session & Atomic Finalization
  const handleEndVoiceCall = async (reason = "USER_HANGUP") => {
    if (isFinalizingRef.current) return;
    isFinalizingRef.current = true;

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    setVoiceState("ENDING");
    voiceStateRef.current = "ENDING";

    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
    if (ttsTimeoutRef.current) clearTimeout(ttsTimeoutRef.current);

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const activeSessionId = voiceSessionIdRef.current;
    
    const isFailedOrPermission = ["PERMISSION_DENIED", "MIC_ERROR", "CONNECTION_FAILED", "CANCELLED", "INITIALIZATION_FAILED"].includes(reason);
    const rawSecs = isFailedOrPermission ? 0 : Math.min(120, Math.max(0, connectedSecondsRef.current));
    const finalSecs = callStartTimeRef.current > 0 ? rawSecs : 0;
    const expectedCharge = isFailedOrPermission ? 0 : Number((finalSecs * (10.0 / 60.0)).toFixed(2));

    if (!activeSessionId) {
      setIsVoiceCallActive(false);
      isVoiceCallActiveRef.current = false;
      setVoiceSessionId(null);
      voiceSessionIdRef.current = null;
      setVoiceState("COMPLETED");
      voiceStateRef.current = "COMPLETED";
      return;
    }

    try {
      const res = await fetch("/api/ai-voice/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSessionId,
          userId: currentUser?.id || (currentUser as any)?.uid || "guest",
          connectedDurationSeconds: finalSecs,
          endReason: reason
        })
      });

      const data = await res.json();
      const billableSecs = typeof data.billableSeconds === "number" ? data.billableSeconds : finalSecs;
      const finalCharge = typeof data.totalChargePKR === "number" 
        ? data.totalChargePKR 
        : (typeof data.totalCharge === "number" ? data.totalCharge : expectedCharge);

      if (billableSecs > 0 && finalCharge > 0 && !isFailedOrPermission) {
        setCallEndSummary({
          durationSecs: billableSecs,
          totalCharge: finalCharge,
          endReason: reason
        });

        const logMsg: ChatMessage = {
          id: "vcall-summary-" + Date.now(),
          sender: "bot",
          text: `📞 **AI Voice Call Summary**\n⏱️ **Connected Duration**: ${Math.floor(billableSecs / 60)}m ${billableSecs % 60}s\n💰 **Rate**: Rs 10.00 / minute\n💳 **Total Charged**: **Rs ${finalCharge.toFixed(2)} PKR**`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages((prev) => [...prev, logMsg]);
      } else {
        if (isFailedOrPermission) {
          const errLogMsg: ChatMessage = {
            id: "vcall-error-" + Date.now(),
            sender: "bot",
            text: `⚠️ **AI Voice Call Ended**\nReason: Microphone permission or connection unavailable.\n💳 **Total Charged**: **Rs 0.00 PKR** (No charge made)`,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          };
          setMessages((prev) => [...prev, errLogMsg]);
        }
      }
    } catch (err) {
      console.error("End call error", err);
    } finally {
      setIsVoiceCallActive(false);
      isVoiceCallActiveRef.current = false;
      setVoiceSessionId(null);
      voiceSessionIdRef.current = null;
      setVoiceState("COMPLETED");
      voiceStateRef.current = "COMPLETED";
    }
  };

  const userName = currentUser?.fullName || currentUser?.username || "Friend";


  // Persistence Effects
  useEffect(() => {
    localStorage.setItem("zerox_chat_open", String(isOpen));
  }, [isOpen]);

  useEffect(() => {
    localStorage.setItem("zerox_chat_minimized", String(isMinimized));
  }, [isMinimized]);

  useEffect(() => {
    localStorage.setItem("zerox_chat_dismissed", String(isDismissed));
  }, [isDismissed]);

  useEffect(() => {
    localStorage.setItem("zerox_chat_messages", JSON.stringify(messages));
  }, [messages]);

  const quickQuestions = [
    "📱 Buy Virtual OTP Number",
    "🚀 SMM Growth Rates & Speed",
    "🎬 Premium Subscriptions Store",
    "💳 Deposit EasyPaisa / JazzCash / USDT",
    "⭐ Redeem Loyalty Points",
    "💼 My Account Balance"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputValue).trim();
    if (!query || isLoading) return;

    

    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsLoading(true);

    const lowerQuery = query.toLowerCase();

    // --- DETERMINISTIC SYSTEM / QUICK ACTIONS (NO NEED TO HIT EXTERNAL AI) ---
    let systemResponseText: string | null = null;
    let targetTab: string | null = null;

    if (query === "💼 My Account Balance" || lowerQuery === "my account balance" || lowerQuery === "balance") {
      const baseBal = currentUser?.balance ?? userBalance ?? 0;
      const rateToUse = cryptoRate || 278;
      const pkrFormatted = formatPrice 
        ? formatPrice(baseBal) 
        : `Rs ${(baseBal * rateToUse).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      
      const displayPkr = pkrFormatted.startsWith("Rs") ? `${pkrFormatted} PKR` : `Rs ${pkrFormatted} PKR`;
      const usdVal = baseBal.toFixed(2);
      const userDisp = currentUser?.username || currentUser?.fullName || "Valued User";

      systemResponseText = `💼 **Your Account Balance**\n\n💰 **Current Wallet Balance:** **${displayPkr}**\n💵 **Approx. USD Value:** $${usdVal} USD\n👤 **Account User:** ${userDisp}\n\nNeed to top up? Tap **💳 Deposit EasyPaisa / JazzCash / USDT** below to add funds instantly!`;
      targetTab = "wallet";
    } else if (query === "💳 Deposit EasyPaisa / JazzCash / USDT" || lowerQuery.includes("deposit easypaisa") || lowerQuery.includes("jazzcash") || lowerQuery.includes("usdt") || lowerQuery.includes("minimum deposit") || lowerQuery.includes("min deposit") || lowerQuery.includes("deposit limit") || lowerQuery.includes("minimum topup")) {
      systemResponseText = `💳 **Easy Deposit Instructions (EasyPaisa / JazzCash / USDT)**\n\n1. Go to the **Wallet & Deposits** section.\n2. Choose your preferred deposit method (**EasyPaisa**, **JazzCash**, **USDT**, or **Bank Transfer**).\n3. Send your deposit amount to the displayed account details.\n4. Copy and enter your **Transaction ID (TID)** and submit!\n\n✨ **Minimum Deposit:** **Rs 100 PKR**\n⚡ **Instant Auto-Credit:** Funds are verified and credited automatically!`;
      targetTab = "wallet";
    } else if (query === "📱 Buy Virtual OTP Number" || lowerQuery.includes("buy virtual otp") || lowerQuery.includes("otp number")) {
      systemResponseText = `📱 **Virtual OTP Numbers for Verification**\n\n1. Go to the **Virtual Numbers Store**.\n2. Select your required app (WhatsApp, Telegram, Google, TikTok, Binance, etc.).\n3. Choose your preferred country or provider.\n4. Click **Buy Number** — your number appears with a 20-minute countdown.\n5. Copy the number into your app, request OTP, and view the received SMS code live!`;
      targetTab = "store";
    } else if (query === "🚀 SMM Growth Rates & Speed" || lowerQuery.includes("smm growth rates") || lowerQuery.includes("smm speed")) {
      systemResponseText = `🚀 **SMM Social Media Growth Panel**\n\n• **Instant Start**: Orders begin processing within 5–30 seconds.\n• **High Speed**: High-quality followers, likes, and views for Telegram, Instagram, TikTok & YouTube.\n• **Auto-Refill**: Non-drop quality backed by 30-day refill policies.\n• **Wholesale Rates**: Lowest prices direct from top providers.`;
      targetTab = "smm";
    } else if (query === "🎬 Premium Subscriptions Store" || lowerQuery.includes("premium subscriptions store")) {
      systemResponseText = `🎬 **Digital Store & Premium Subscriptions**\n\nGet wholesale access to **Telegram Premium**, **ChatGPT Plus**, **Netflix**, **Canva Pro**, and **AI Tools** with instant delivery & full warranty!`;
      targetTab = "subscriptions";
    } else if (query === "⭐ Redeem Loyalty Points" || lowerQuery.includes("redeem loyalty points")) {
      systemResponseText = `⭐ **Zerox Loyalty Rewards System**\n\n• Earn **1 Loyalty Point** for every ₨ 100 spent on any service.\n• Redeem accumulated points directly into wallet cash anytime in your Dashboard!\n• Points never expire!`;
      targetTab = "dashboard";
    }

    if (systemResponseText) {
      setTimeout(() => {
        const botMsg: ChatMessage = {
          id: "bot-sys-" + Date.now(),
          sender: "bot",
          text: systemResponseText!,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
        setIsLoading(false);
        if (targetTab && onNavigateToTab) {
          onNavigateToTab(targetTab);
        }
      }, 250);
      return;
    }

    // --- FREEFORM AI CHAT API REQUEST ---
    try {
      const historyPayload = messages.slice(-10).map(m => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));

      const targetId = currentUser?.id || (currentUser as any)?.uid || "guest_user";
      const targetName = currentUser?.username || currentUser?.fullName || "Valued User";

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          userId: targetId,
          username: targetName
        })
      });

      const data = await res.json();
      let botText = data.text || "I am Mr.Zx, your official Zerox Network Assistant. How can I help you today?";

      if (lowerQuery.includes("balance") && userBalance !== undefined && !botText.includes("Balance") && !botText.includes("Wallet")) {
        const baseBal = currentUser?.balance ?? userBalance ?? 0;
        const rateToUse = cryptoRate || 278;
        const pkrFormatted = formatPrice 
          ? formatPrice(baseBal) 
          : `Rs ${(baseBal * rateToUse).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const displayPkr = pkrFormatted.startsWith("Rs") ? `${pkrFormatted} PKR` : `Rs ${pkrFormatted} PKR`;
        botText += `\n\n💡 *Your Wallet Balance:* **${displayPkr}**.`;
      }

      const botMsg: ChatMessage = {
        id: "bot-" + Date.now(),
        sender: "bot",
        text: botText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error("[InjazifyChatbot] Chat network error:", err);
      const errorMsg: ChatMessage = {
        id: "bot-err-" + Date.now(),
        sender: "bot",
        text: "I am experiencing a minor network issue right now. Please try again shortly or reach out on WhatsApp (+44 7868 713315).",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const [isDragging, setIsDragging] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isDismissed && !isOpen) {
    return null;
  }

  return (
    <div className="fixed bottom-2.5 right-2.5 left-2.5 sm:left-auto sm:right-5 sm:bottom-5 z-[9999] font-sans pointer-events-none flex flex-col items-end sm:items-end max-w-full">
      {/* Draggable Minimal Circular Launcher Button */}
      {!isOpen && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.08}
          whileDrag={{ scale: 1.12, cursor: "grabbing" }}
          whileHover={{ scale: 1.08 }}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={() => setTimeout(() => setIsDragging(false), 120)}
          className="pointer-events-auto cursor-grab active:cursor-grabbing relative group"
        >
          {/* Tooltip on hover */}
          <div className="absolute right-full mr-2.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap bg-zinc-900 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-zinc-700 shadow-xl flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Mr.Zx AI Support</span>
            <span className="text-[9px] text-zinc-400 font-mono">(Drag me)</span>
          </div>

          {/* Dismiss x badge on launcher icon */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-zinc-900 hover:bg-red-600 text-zinc-400 hover:text-white rounded-full border border-zinc-700 flex items-center justify-center transition shadow-md z-20 cursor-pointer"
            title="Dismiss AI Assistant launcher"
          >
            <X className="w-3 h-3" />
          </button>

          <button
            onClick={() => {
              if (!isDragging) {
                setIsOpen(true);
                setIsMinimized(false);
              }
            }}
            className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-zinc-950 hover:bg-black text-white flex items-center justify-center shadow-2xl hover:shadow-indigo-500/25 border-2 border-zinc-700 hover:border-indigo-500 transition-colors duration-200 backdrop-blur-xl group cursor-pointer overflow-visible"
            id="x-chatbot-launcher"
            aria-label="Open Mr.Zx AI Assistant"
          >
            {/* Glowing Ring Effect */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-indigo-500/20 via-blue-500/10 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>

            {/* Zx Emblem in Center */}
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-900/90 border border-zinc-700/80 flex items-center justify-center font-black text-xs sm:text-sm tracking-tighter text-white shadow-inner group-hover:border-indigo-400/80 transition-colors">
              <span className="font-mono font-black bg-gradient-to-tr from-white via-zinc-100 to-indigo-300 bg-clip-text text-transparent">
                Zx
              </span>

              {/* Pinging Online Dot */}
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-zinc-950"></span>
              </span>
            </div>
          </button>
        </motion.div>
      )}

      {/* Open Chat Window */}
      {isOpen && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`pointer-events-auto bg-zinc-950/95 border border-zinc-800/90 shadow-2xl flex flex-col transition-all duration-300 overflow-hidden backdrop-blur-xl ${
              isMinimized 
                ? "w-auto max-w-[280px] h-10 sm:h-12 rounded-full border-zinc-700 hover:border-zinc-500 bg-black/95" 
                : "w-full max-w-[calc(100vw-20px)] sm:max-w-none sm:w-[370px] md:w-[400px] h-[65vh] max-h-[480px] min-h-[280px] sm:h-[520px] sm:max-h-[80vh] rounded-2xl"
            }`}
          >
            {/* Header */}
            <div 
              onClick={() => isMinimized && setIsMinimized(false)}
              className={`bg-black border-zinc-800/80 flex items-center justify-between shrink-0 transition-all ${
                isMinimized 
                  ? "p-1.5 px-3 cursor-pointer hover:bg-zinc-900/50" 
                  : "p-2 sm:p-3 sm:p-3.5 border-b"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white font-mono font-black text-[10px] sm:text-xs text-center shadow-sm shrink-0">
                  <span className="bg-gradient-to-tr from-white via-zinc-200 to-indigo-300 bg-clip-text text-transparent">Zx</span>
                  <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 sm:w-2.5 sm:h-2.5 bg-emerald-500 border-2 border-black rounded-full"></span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-extrabold text-white text-[10px] sm:text-xs tracking-wider uppercase font-mono truncate">Mr.Zx AI</h3>
                    <span className="bg-blue-600/30 text-blue-300 text-[7px] sm:text-[8px] font-extrabold px-1 py-0.1 sm:px-1.5 sm:py-0.2 rounded border border-blue-500/30 font-mono shrink-0 uppercase tracking-widest">v3</span>
                  </div>
                  <p className="text-[9px] sm:text-[10px] text-emerald-400 font-medium flex items-center gap-1 mt-0.1 truncate"><span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>Online</p>
                </div>
              </div>

              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setIsVoiceConfirmOpen(true)}
                  className="px-2 py-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-lg transition-all flex items-center gap-1 text-[10px] font-bold shadow-md hover:scale-105 cursor-pointer shrink-0 animate-pulse"
                  title="AI Voice Call (Rs 10/min)"
                >
                  <Mic className="w-3 h-3 text-emerald-300" />
                  <span>Talk to AI</span>
                </button>
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? <ChevronUp className="w-3.5 h-3.5 text-[#00AEEF] neon-arrow-bounce" /> : <Minimize2 className="w-3 h-3 text-[#00AEEF]" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Voice Confirmation Modal */}
            {isVoiceConfirmOpen && (
              <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 max-w-xs w-full space-y-4 shadow-2xl relative text-white">
                  <button 
                    onClick={() => {
                      setVoiceMicError(null);
                      setIsVoiceConfirmOpen(false);
                    }}
                    className="absolute top-3 right-3 text-zinc-400 hover:text-white p-1 rounded-lg cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Mic className="w-5 h-5 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">AI Voice Call</h3>
                      <p className="text-[10px] text-zinc-400">Talk live with Mr.Zx AI Assistant</p>
                    </div>
                  </div>

                  {voiceMicError ? (
                    <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 space-y-3 text-xs">
                      <div className="flex items-center gap-2 font-bold text-rose-300">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Microphone Access Required</span>
                      </div>
                      <p className="text-[11px] text-rose-200/90 leading-relaxed">
                        {voiceMicError}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        Please allow microphone access in your browser site settings to start the AI voice call. No charges have been made.
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={handleStartVoiceCall}
                          disabled={isVoiceConnecting}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1 disabled:opacity-50"
                        >
                          {isVoiceConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Try Again"}
                        </button>
                        <button
                          onClick={() => {
                            setVoiceMicError(null);
                            setIsVoiceConfirmOpen(false);
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold px-3 py-2 rounded-xl text-xs transition cursor-pointer"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-zinc-300">
                          <span className="text-zinc-400">Call Rate:</span>
                          <span className="font-mono font-bold text-emerald-400">Rs 10 / minute</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-300">
                          <span className="text-zinc-400">Max Duration:</span>
                          <span className="font-mono font-bold text-amber-400">2 minutes (120s)</span>
                        </div>
                        <div className="flex justify-between items-center text-zinc-300">
                          <span className="text-zinc-400">Maximum possible charge:</span>
                          <span className="font-mono font-bold text-rose-400">Rs 20.00 PKR</span>
                        </div>
                        <div className="border-t border-zinc-800 pt-2 flex justify-between items-center">
                          <span className="text-zinc-400">Your Balance:</span>
                          <span className={`font-mono font-bold ${userPkrBalance < MIN_CALL_BALANCE ? "text-rose-400" : "text-emerald-400"}`}>
                            {formatPrice ? (formatPrice(baseBalanceUnits).startsWith("Rs") ? `${formatPrice(baseBalanceUnits)} PKR` : `Rs ${formatPrice(baseBalanceUnits)} PKR`) : `Rs ${userPkrBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PKR`}
                          </span>
                        </div>
                      </div>

                      {userPkrBalance < MIN_CALL_BALANCE ? (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-[11px] text-rose-300 space-y-1">
                          <div className="flex items-center gap-1.5 font-bold">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                            <span>Insufficient Balance</span>
                          </div>
                          <p className="text-[10px] text-rose-200/80">
                            You need at least Rs 20.00 PKR in your wallet to start the call. Minimum deposit is Rs 100 PKR.
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={handleStartVoiceCall}
                          disabled={isVoiceConnecting}
                          className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          {isVoiceConnecting ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Requesting Microphone...</span>
                            </>
                          ) : (
                            <>
                              <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
                              <span>Start Voice Call</span>
                            </>
                          )}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Active Voice Call Screen */}
            {isVoiceCallActive && (
              <div className="absolute inset-x-0 top-[52px] bottom-0 bg-zinc-950/95 backdrop-blur-xl z-40 flex flex-col justify-between p-4 text-white">
                {warningBanner && (
                  <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-2 text-[10px] text-amber-300 text-center font-bold font-mono animate-pulse">
                    {warningBanner}
                  </div>
                )}

                <div className="flex items-center justify-between bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
                    <span className="text-xs font-bold text-white">AI Voice Call • Mr.Zx</span>
                  </div>
                  <div className="font-mono text-xs font-bold bg-zinc-800 px-2.5 py-1 rounded-lg text-emerald-400 border border-zinc-700">
                    {Math.floor((120 - connectedSeconds) / 60)}:{(120 - connectedSeconds) % 60 < 10 ? "0" : ""}{(120 - connectedSeconds) % 60} remaining
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center my-auto space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute w-28 h-28 bg-indigo-500/20 rounded-full blur-xl animate-pulse"></div>
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center border-4 border-indigo-400/40 shadow-2xl transition-all ${voiceState === "AI_SPEAKING" ? "scale-110 shadow-indigo-500/50" : "scale-100"}`}>
                      {voiceState === "AI_SPEAKING" ? (
                        <Volume2 className="w-8 h-8 text-white animate-bounce" />
                      ) : (voiceState === "PROCESSING" || voiceState === "ENDING" || voiceState === "CONNECTING") ? (
                        <RefreshCw className="w-8 h-8 text-white animate-spin" />
                      ) : (
                        <Mic className="w-8 h-8 text-white animate-pulse" />
                      )}
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
                      {voiceState === "CONNECTING" && "Connecting..."}
                      {voiceState === "LISTENING" && (isMuted ? "Muted" : "Listening...")}
                      {voiceState === "PROCESSING" && "Mr.Zx is thinking..."}
                      {voiceState === "AI_SPEAKING" && "Mr.Zx AI Speaking..."}
                      {voiceState === "ENDING" && "Ending Call & Finalizing..."}
                      {voiceState === "ERROR" && (voiceErrorMessage || "Connection error")}
                    </span>
                    {interimSpeech && (
                      <p className="text-[10px] text-zinc-300 italic max-w-xs line-clamp-2 bg-zinc-900/80 px-2 py-1 rounded-lg border border-zinc-800">
                        "{interimSpeech}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 text-[11px] space-y-1 font-mono">
                    <div className="flex justify-between text-zinc-400">
                      <span>Elapsed Time:</span>
                      <span className="text-white font-bold">{Math.floor(connectedSeconds / 60)}m {connectedSeconds % 60}s</span>
                    </div>
                    <div className="flex justify-between text-zinc-400">
                      <span>Accrued Charge (Rs 10/min):</span>
                      <span className="text-amber-400 font-bold">Rs {currentAccruedCharge.toFixed(2)} PKR</span>
                    </div>
                    <div className="flex justify-between text-zinc-400 border-t border-zinc-800/80 pt-1">
                      <span>Remaining Wallet:</span>
                      <span className="text-emerald-400 font-bold">Rs {remainingWalletBalance.toFixed(2)} PKR</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      disabled={voiceState === "ENDING"}
                      className={`p-2.5 rounded-xl border transition cursor-pointer ${
                        isMuted 
                          ? "bg-rose-600/20 text-rose-400 border-rose-500/30" 
                          : "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                      }`}
                      title={isMuted ? "Unmute Mic" : "Mute Mic"}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => handleEndVoiceCall("USER_HANGUP")}
                      disabled={voiceState === "ENDING"}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>{voiceState === "ENDING" ? "Ending..." : "End Call"}</span>
                    </button>

                    <button
                      onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                      disabled={voiceState === "ENDING"}
                      className={`p-2.5 rounded-xl border transition cursor-pointer ${
                        isSpeakerMuted 
                          ? "bg-rose-600/20 text-rose-400 border-rose-500/30" 
                          : "bg-zinc-800 hover:bg-zinc-700 text-white border-zinc-700"
                      }`}
                      title={isSpeakerMuted ? "Unmute Speaker" : "Mute Speaker"}
                    >
                      {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Messages & Chat Controls */}
            {!isMinimized && (
              <>
                {/* Messages Container */}
                <div className="flex-1 p-2 sm:p-3 overflow-y-auto space-y-2 bg-black/60 custom-scrollbar">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-1.5 sm:gap-2.5 ${
                        msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg shrink-0 flex items-center justify-center text-[8px] sm:text-[10px] font-bold font-mono ${
                          msg.sender === "user"
                            ? "bg-zinc-100 text-black shadow-sm"
                            : "bg-zinc-900 text-white border border-zinc-700"
                        }`}
                      >
                        {msg.sender === "user" ? "U" : "Zx"}
                      </div>

                      <div className={`max-w-[88%] sm:max-w-[82%] space-y-0.5`}>
                        <div
                          className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl text-[10.5px] sm:text-xs leading-tight sm:leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${
                            msg.sender === "user"
                              ? "bg-indigo-600 text-white rounded-tr-none shadow-md font-medium"
                              : "bg-zinc-900/90 text-zinc-200 border border-zinc-800 rounded-tl-none shadow-sm"
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span
                          className={`text-[8px] text-zinc-500 block px-0.5 ${
                            msg.sender === "user" ? "text-right" : "text-left"
                          }`}
                        >
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[10px] p-1">
                      <span className="w-3.5 h-3.5 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[7px] font-mono font-bold animate-spin text-white">Zx</span>
                      <span className="font-medium animate-pulse text-zinc-500">Typing...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions Chips */}
                <div className="p-1.5 bg-zinc-950 border-t border-zinc-900 overflow-x-auto whitespace-nowrap flex gap-1 custom-scrollbar">
                  {quickQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      disabled={isLoading}
                      onClick={() => handleSendMessage(q)}
                      className="shrink-0 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-zinc-800 transition-colors disabled:opacity-50 cursor-pointer uppercase tracking-tight"
                    >
                      {q.replace("🚀 ", "").replace("📱 ", "").replace("🎬 ", "").replace("💳 ", "").replace("⭐ ", "").replace("💼 ", "")}
                    </button>
                  ))}
                </div>

                {/* Input Footer */}
                <div className="p-2 sm:p-3 bg-black border-t border-zinc-900 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={isLoading}
                    className="flex-1 bg-zinc-900 border border-zinc-800 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 rounded-lg px-2.5 py-1 sm:py-1.5 text-[10.5px] sm:text-xs text-white placeholder-zinc-500 outline-none transition disabled:opacity-50 font-sans"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputValue.trim() || isLoading}
                    className="bg-white hover:bg-zinc-200 disabled:bg-zinc-900 text-black p-1.5 rounded-lg transition-all shadow-md active:scale-95 shrink-0 disabled:opacity-30 disabled:text-zinc-600 cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

