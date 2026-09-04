import React, { useState, useEffect, useRef } from "react";
import { PWABadge } from "./components/PWABadge";
import { motion, AnimatePresence } from "motion/react";
import { Toaster, toast } from "react-hot-toast";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, where, getDocs, serverTimestamp, deleteDoc } from "firebase/firestore";
import { 
  ShieldCheck, MessageSquare, HelpCircle, Laptop, Shield, Moon, Sun, Ticket, Star,
  Info, AlertTriangle, AlertCircle, Key, ExternalLink, Globe, Wallet, CheckSquare, Clock, Landmark, LayoutDashboard, ShoppingCart, User, LogIn, Store, Receipt, Briefcase, Code2, MessageCircle, RefreshCw, Sparkles, ChevronLeft, ChevronRight, Compass, ShieldAlert, X, Crown, Gift, ChevronDown, Smartphone, Zap, ChevronsRight, ChevronsLeft, Users, CreditCard, ArrowRightLeft, Play
} from "lucide-react";

import { 
  UserProfile, ActivationOrder, SMSMessage, ServiceData, 
  UserAccount, DepositRequest, DepositInstruction, Announcement,
  SmmProvider, SmmService, SmmCategory, SmmOrder, SmmLog, SmmPriceRule, SmmSettings, SmsProvider, CustomImageItem
} from "./types";
import DashboardStats from "./components/DashboardStats";
import CatalogSelector from "./components/CatalogSelector";
import AdminPortal from "./components/AdminPortal";
import OrdersHistory from "./components/OrdersHistory";
import SellerPortal from "./components/SellerPortal";
import ApiDocs from "./components/ApiDocs";
import AboutPortal from "./components/AboutPortal";
import ReviewsPortal from "./components/ReviewsPortal";
import PrivacyPolicyPortal from "./components/PrivacyPolicyPortal";
import PlatformUpdates from "./components/PlatformUpdates";
import Tickets from "./components/Tickets";
import UserAuth from "./components/UserAuth";
import ResetPasswordPage from "./components/ResetPasswordPage";
import CashDeposit from "./components/CashDeposit";
import SmmClientStore from "./components/SmmClientStore";
import UserProfilePopover from "./components/UserProfilePopover";
import OrderTrackingSync from "./components/OrderTrackingSync";
import ActivityFeed from "./components/ActivityFeed";
import CurrencyDisplay from "./components/CurrencyDisplay";
import { InjazifyChatbot } from "./components/InjazifyChatbot";
import { sanitizeUrl, sanitizeInput, isSafeUrl } from "./lib/security";
import { AnalyticsTracker } from "./components/AnalyticsTracker";
import TabInstructionsModal from "./components/TabInstructionsModal";
import { ZXLogo } from "./components/ZXLogo";
import { TabMaintenanceView } from "./components/TabMaintenanceView";
import SubscriptionsClientStore from "./components/SubscriptionsClientStore";
import ReferralAffiliateStore from "./components/ReferralAffiliateStore";
import LowBalanceBanner from "./components/LowBalanceBanner";
import { processReferralCommission } from "./lib/referrals";
import { sendNotification } from "./lib/notifications";
import { UNIQUE_CURRENCIES } from "./data/currencies";
import CurrencySelector from "./components/CurrencySelector";
import { UNIQUE_LANGUAGES } from "./data/languages";
import LanguageSelector from "./components/LanguageSelector";
import { useTranslation } from "./hooks/useTranslation";
import { playClickSound, playSlideSound } from "./lib/sounds";
import SocialMediaLinks from "./components/SocialMediaLinks";
import OrderDetailPage from "./components/OrderDetailPage";
import { OnboardingGuide } from "./components/OnboardingGuide";
import { HowToOrderTutorial } from "./components/HowToOrderTutorial";

const processingDeposits = new Set<string>();

const ClaimBonus = ({ bonusId, userId, onClaimed }: { bonusId: string; userId: string; onClaimed: () => void }) => {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "expired" | "already_claimed">("loading");
  const [error, setError] = useState("");
  const [bonusData, setBonusData] = useState<any>(null);

  useEffect(() => {
    const processClaim = async () => {
      try {
        // 1. Fetch bonus details
        const bonusDoc = await getDoc(doc(db, "claimable_bonuses", bonusId));
        if (!bonusDoc.exists()) {
          setStatus("error");
          setError("This bonus offer does not exist or has been removed.");
          return;
        }
        const data = bonusDoc.data();
        setBonusData(data);

        // 2. Check expiry
        if (new Date(data.expiresAt) < new Date()) {
          setStatus("expired");
          return;
        }

        // 3. Check if already claimed
        const claimId = `${userId}_${bonusId}`;
        const claimDoc = await getDoc(doc(db, "user_claims", claimId));
        if (claimDoc.exists()) {
          setStatus("already_claimed");
          return;
        }

        // 4. Atomic Claim (In real app, use a transaction or cloud function)
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) throw new Error("User not found");

        const currentBalance = userDoc.data().balance || 0;
        const newBalance = currentBalance + Number(data.amount);

        await updateDoc(userRef, { balance: newBalance });
        await setDoc(doc(db, "user_claims", claimId), {
          bonusId,
          userId,
          claimedAt: new Date().toISOString(),
          amount: data.amount
        });

        setStatus("success");
        onClaimed();
      } catch (err: any) {
        console.error(err);
        setStatus("error");
        setError(err.message || "Failed to process your claim.");
      }
    };
    processClaim();
  }, [bonusId, userId]);

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div className="p-8 text-center">
          {status === "loading" && (
            <div className="space-y-6 py-8">
              <div className="relative mx-auto w-24 h-24">
                <RefreshCw className="w-24 h-24 text-blue-500 animate-spin opacity-20" />
                <Gift className="absolute inset-0 m-auto w-10 h-10 text-blue-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">Verifying Reward...</h2>
              <p className="text-slate-500 font-medium">Please wait while we secure your bonus balance.</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-6">
              <div className="mx-auto w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce shadow-lg shadow-emerald-200">
                <CheckSquare className="w-12 h-12 text-emerald-600" />
              </div>
              <h2 className="text-3xl font-black text-slate-900">Reward Claimed!</h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                Congratulations! <span className="text-emerald-600 font-bold">₨ {bonusData?.amount} PKR</span> has been successfully added to your wallet.
              </p>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                Transaction Completed
              </div>
              <button 
                onClick={() => window.location.href = "/"}
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-900/20 active:scale-95 transition-all"
              >
                Enter Your Dashboard
              </button>
            </div>
          )}

          {(status === "error" || status === "expired" || status === "already_claimed") && (
            <div className="space-y-6">
              <div className="mx-auto w-24 h-24 bg-rose-100 rounded-full flex items-center justify-center shadow-lg shadow-rose-200">
                <AlertCircle className="w-12 h-12 text-rose-600" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">
                {status === "expired" ? "Offer Expired" : status === "already_claimed" ? "Already Claimed" : "Claim Failed"}
              </h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                {status === "expired" ? "Sorry, this special reward campaign has ended." : 
                 status === "already_claimed" ? "You have already claimed this bonus reward. Check your wallet balance!" : 
                 error || "We encountered an issue while processing your reward."}
              </p>
              <button 
                onClick={() => window.location.href = "/"}
                className="w-full bg-slate-100 text-slate-800 font-black py-4 rounded-2xl border border-slate-200 active:scale-95 transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialIsSignUp, setAuthInitialIsSignUp] = useState(false);
  const [authInitialRefCode, setAuthInitialRefCode] = useState("");

  useEffect(() => {
    const handleLoginReq = (e: any) => {
      if (e?.detail?.isSignUp) {
        setAuthInitialIsSignUp(true);
      }
      setShowAuthModal(true);
    };
    window.addEventListener("request-login", handleLoginReq);
    return () => window.removeEventListener("request-login", handleLoginReq);
  }, []);

  // API credentials state
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("5sim_api_key") || "server";
  });

  // User profile for connected 5sim
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Admin Modal Toggle & Appointed Admins List
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminStartMaximized, setIsAdminStartMaximized] = useState(false);
  const [appointedAdminsList, setAppointedAdminsList] = useState<any[]>([]);
  const [showAccessDeniedModal, setShowAccessDeniedModal] = useState(false);

  // Firestore Sync for Appointed Admins
  useEffect(() => {
    try {
      const q = query(collection(db, "admin_appointed_users"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetched: any[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        setAppointedAdminsList(fetched);
      }, (err) => {
        console.warn("Failed to sync appointed admins in App:", err);
      });
      return () => unsubscribe();
    } catch (err) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Firestore query error for appointed admins:: Quota exceeded.");
      } else {
        console.error("Firestore query error for appointed admins::", err);
      }
    }
  }, []);

  const [activeTab, setActiveTab] = useState<"store" | "dashboard" | "wallet" | "seller" | "about" | "api" | "smm" | "tickets" | "subscriptions" | "reviews" | "privacy" | "affiliate">("store");
  
  // "How to Order" Interactive Tutorial State
  const [showOrderTutorial, setShowOrderTutorial] = useState(false);
  const [showOrderTutorialHint, setShowOrderTutorialHint] = useState<boolean>(() => {
    try {
      return localStorage.getItem("zerox_order_tutorial_hint_seen") !== "true";
    } catch {
      return true;
    }
  });

  const handleStartOrderTutorial = () => {
    if (activeTab !== "store") {
      setActiveTab("store");
    }
    setShowOrderTutorial(true);
    setShowOrderTutorialHint(false);
    try {
      localStorage.setItem("zerox_order_tutorial_hint_seen", "true");
    } catch {}
  };

  const handleDismissOrderTutorialHint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOrderTutorialHint(false);
    try {
      localStorage.setItem("zerox_order_tutorial_hint_seen", "true");
    } catch {}
  };
  const [tabMaintenance, setTabMaintenance] = useState<Record<string, { hidden: boolean; maintenance: boolean; notes: string }>>({
    store: { hidden: false, maintenance: false, notes: "" },
    smm: { hidden: false, maintenance: false, notes: "" },
    subscriptions: { hidden: false, maintenance: false, notes: "" },
    reviews: { hidden: false, maintenance: false, notes: "" },
    privacy: { hidden: false, maintenance: false, notes: "" },
    dashboard: { hidden: false, maintenance: false, notes: "" },
    wallet: { hidden: false, maintenance: false, notes: "" },
    seller: { hidden: false, maintenance: false, notes: "" },
    api: { hidden: false, maintenance: false, notes: "" },
    tickets: { hidden: false, maintenance: false, notes: "" },
    about: { hidden: false, maintenance: false, notes: "" }
  });

  // Tab Bar scroll indicators and state
  const tabBarRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasUserScrolledTabs, setHasUserScrolledTabs] = useState(false);

  const checkScroll = () => {
    const el = tabBarRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollWidth - clientWidth - scrollLeft > 10);
      if (scrollLeft > 15) {
        setHasUserScrolledTabs(true);
      }
    }
  };

  useEffect(() => {
    const el = tabBarRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      // Run once immediately
      checkScroll();
      
      const timer = setTimeout(checkScroll, 300);

      const observer = new MutationObserver(checkScroll);
      observer.observe(el, { childList: true, subtree: true });

      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
        clearTimeout(timer);
        observer.disconnect();
      };
    }
  }, [tabMaintenance]);

  // Global click sound listener
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Find closest clickable element
      const target = (e.target as HTMLElement).closest('button, a, [role="button"]');
      if (target) {
        playClickSound();
      }
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  const handleTabChange = (tab: any) => {
    playSlideSound();
    setActiveTab(tab);
  };

  const isTabHidden = (tabId: string) => {
    return tabMaintenance[tabId]?.hidden && sessionStorage.getItem("zerox_admin_logged") !== "true";
  };

  // Zerox Custom States (synced in real-time with Firestore)
  const [disabledServices, setDisabledServices] = useState<string[]>([]);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [priceMarkupPercent, setPriceMarkupPercent] = useState<number>(10);
  const [customServices, setCustomServices] = useState<ServiceData[]>([]);
  const [customLinks, setCustomLinks] = useState<Array<{ name: string; url: string }>>([]);
  const [isCatalogGuideMinimized, setIsCatalogGuideMinimized] = useState(true);

  // --- NEW CASH DEPOSIT & USER LOGIN ENGINE STATES ---
  const [registeredUsers, setRegisteredUsers] = useState<UserAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem("zerox_user_account");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.warn("Failed loading cached user:", e);
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("zerox_user_account", JSON.stringify(currentUser));
      localStorage.setItem("zerox_local_user_id", currentUser.id);
    } else {
      localStorage.removeItem("zerox_user_account");
      localStorage.removeItem("zerox_local_user_id");
      localStorage.removeItem("zerox_admin_session");
    }
  }, [currentUser]);

  // Detect URL Referral Code & Registration Flag (?ref=username, ?register=true)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get("ref") || params.get("referral") || params.get("refCode");
        const isRegister = params.get("register") === "true" || params.get("signup") === "true" || !!refCode;

        if (refCode) {
          const cleanRef = refCode.trim();
          setAuthInitialRefCode(cleanRef);
          localStorage.setItem("zerox_ref_code", cleanRef);
          sessionStorage.setItem("zerox_ref_code", cleanRef);
        }

        if (isRegister) {
          setAuthInitialIsSignUp(true);
        }

        // Auto-open registration modal if user is not logged in
        if (!currentUser && (isRegister || refCode)) {
          setShowAuthModal(true);
          if (refCode) {
            toast.success(`🎁 Referral code @${refCode.trim()} applied! Please complete your registration below.`, {
              id: "url-referral-detected",
              duration: 5000,
              icon: "🚀"
            });
          }
        }
      }
    } catch (e) {
      console.warn("Referral URL parse error:", e);
    }
  }, [currentUser]);

  // Compute Admin Status & Role for logged in user
  const userAdminInfo = React.useMemo(() => {
    if (!currentUser) return null;

    const emailLower = (currentUser.email || "").toLowerCase().trim();
    const usernameLower = (currentUser.username || "").toLowerCase().trim();

    // 1. PRIMARY SUPREME SUPER ADMIN / ROOT ADMIN (Highest Platform Authority): zeroxnetworks@gmail.com
    if (emailLower === "zeroxnetworks@gmail.com" || (currentUser.role && (currentUser.role === "SUPREME_SUPER_ADMIN" || currentUser.role === "Supreme Super Admin"))) {
      return {
        isAdmin: true,
        role: "SUPREME_SUPER_ADMIN",
        isPrimary: true,
        isSupreme: true,
        customTitle: "Primary Supreme Super Admin (Root Authority)"
      };
    }

    // 2. Primary Super Admins: info.rayanmirza@gmail.com, pandapals.manager@gmail.com, or username Zerox, or explicit ID
    if (
      emailLower === "info.rayanmirza@gmail.com" ||
      emailLower === "pandapals.manager@gmail.com" ||
      usernameLower === "zerox" ||
      currentUser.id === "YnRIua7IMhc8"
    ) {
      return {
        isAdmin: true,
        role: "PRIMARY SUPER ADMIN",
        isPrimary: true,
        isSupreme: false,
        customTitle: "Chief Executive & Platform Lead"
      };
    }

    // Check Appointed Admins list from Firestore
    const matched = appointedAdminsList.find(a => 
      (a.email && a.email.toLowerCase().trim() === emailLower) ||
      (a.username && a.username.toLowerCase().trim() === usernameLower)
    );

    if (matched && matched.status !== "INACTIVE") {
      return {
        isAdmin: true,
        role: (matched.role || "ADMINISTRATOR").toUpperCase(),
        isPrimary: false,
        customTitle: matched.customTitle || "System Administrator"
      };
    }

    // Local/session storage override if admin was logged in manually via Admin Portal
    if (
      sessionStorage.getItem("zerox_admin_logged") === "true" ||
      localStorage.getItem("zerox_admin_logged") === "true"
    ) {
      return {
        isAdmin: true,
        role: "SUPER ADMIN",
        isPrimary: false,
        customTitle: "System Administrator"
      };
    }

    return null;
  }, [currentUser, appointedAdminsList]);

  // Direct URL parameter & hash detection for Admin Access (#admin, ?admin=true)
  useEffect(() => {
    const checkAdminAccessAttempt = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = (window.location.hash || "").toLowerCase();
      const hasAdminHash = hash === "#admin" || hash === "#admin_portal" || hash === "#admin_access";
      const isAdminUrl = params.get("admin") === "true" || params.get("admin") === "1" || params.get("admin_portal") === "true" || hasAdminHash;
      const isFullscreenUrl = params.get("fullscreen") === "true" || params.get("maximized") === "true";

      if (isAdminUrl) {
        const isLoggedAdmin = sessionStorage.getItem("zerox_admin_logged") === "true" || localStorage.getItem("zerox_admin_logged") === "true";
        const isUserAdmin = !!userAdminInfo?.isAdmin;

        if (isLoggedAdmin || isUserAdmin) {
          setIsAdminOpen(true);
          if (isFullscreenUrl) {
            setIsAdminStartMaximized(true);
          }
        } else {
          // Unauthorized attempt to access #admin!
          setIsAdminOpen(false);
          setShowAccessDeniedModal(true);
          toast.error("🔒 Access Denied: Better luck next time!", { id: "admin-access-denied", duration: 5000 });

          // Clean URL parameters & hash to remove #admin
          try {
            window.history.replaceState(null, "", window.location.pathname);
          } catch (e) {
            // ignore
          }
        }
      }
    };

    checkAdminAccessAttempt();

    window.addEventListener("hashchange", checkAdminAccessAttempt);
    return () => window.removeEventListener("hashchange", checkAdminAccessAttempt);
  }, [userAdminInfo]);
  const [showConverter, setShowConverter] = useState(false);
  const [showProfilePopover, setShowProfilePopover] = useState(false);
  const [showMobileLinks, setShowMobileLinks] = useState(false);
  const [tabInstructions, setTabInstructions] = useState<Record<string, string>>({});
  const [isTabHelpOpen, setIsTabHelpOpen] = useState(false);
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);

  const handleFooterNavigate = (tab: "store" | "dashboard" | "wallet" | "seller" | "about" | "api" | "smm" | "tickets" | "subscriptions" | "reviews" | "privacy") => {
    handleTabChange(tab);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Bonus Claim State
  const [claimInfo, setClaimInfo] = useState<{ bonusId: string; userId: string } | null>(null);

  // Virtual Number Dedicated Order Detail State & URL Sync (/orders/:id or ?orderId=:id)
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const orderIdParam = params.get("orderId") || params.get("order_id");
      if (orderIdParam && !isNaN(Number(orderIdParam))) {
        return Number(orderIdParam);
      }
      const path = window.location.pathname;
      if (path.startsWith("/orders/")) {
        const idStr = path.replace("/orders/", "").split("/")[0];
        if (idStr && !isNaN(Number(idStr))) {
          return Number(idStr);
        }
      }
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    const handleUrlOrderCheck = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const orderIdParam = params.get("orderId") || params.get("order_id");
        const path = window.location.pathname;
        if (orderIdParam && !isNaN(Number(orderIdParam))) {
          setSelectedOrderId(Number(orderIdParam));
        } else if (path.startsWith("/orders/")) {
          const idStr = path.replace("/orders/", "").split("/")[0];
          if (idStr && !isNaN(Number(idStr))) {
            setSelectedOrderId(Number(idStr));
          } else {
            setSelectedOrderId(null);
          }
        }
      } catch (e) {}
    };

    window.addEventListener("popstate", handleUrlOrderCheck);
    return () => window.removeEventListener("popstate", handleUrlOrderCheck);
  }, []);

  // Reset Password Token detection from URL (e.g. ?reset_token=... or ?action=reset_password&token=...)
  const [resetPasswordToken, setResetPasswordToken] = useState<string | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const rToken = params.get("reset_token") || 
                     (params.get("action") === "reset_password" ? params.get("token") : null) || 
                     (params.get("mode") === "resetPassword" ? (params.get("oobCode") || params.get("token")) : null) || 
                     params.get("resetToken");
      return rToken || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const handleUrlResetCheck = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const rToken = params.get("reset_token") || 
                       (params.get("action") === "reset_password" ? params.get("token") : null) || 
                       (params.get("mode") === "resetPassword" ? (params.get("oobCode") || params.get("token")) : null) || 
                       params.get("resetToken");
        if (rToken) {
          setResetPasswordToken(rToken);
        }
      } catch (e) {}
    };

    window.addEventListener("popstate", handleUrlResetCheck);
    return () => window.removeEventListener("popstate", handleUrlResetCheck);
  }, []);

  useEffect(() => {
    // Check if URL is a claim link
    const params = new URLSearchParams(window.location.search);
    const bonusId = params.get("id");
    const userId = params.get("uid");
    if (window.location.pathname === "/claim-bonus" && bonusId && userId) {
      setClaimInfo({ bonusId, userId });
    }
  }, []);

  const [autoApproveDeposits, setAutoApproveDeposits] = useState(false);
  const [autoApproveCrypto, setAutoApproveCrypto] = useState(false);

  const [cryptoGatewaySettings, setCryptoGatewaySettings] = useState<any>(null);

  const [cryptoRate, setCryptoRate] = useState(278);
  const [cryptoMinDeposit, setCryptoMinDeposit] = useState(5);
  const [localMinDeposit, setLocalMinDeposit] = useState(100);
  const [virtualNumberMinimumPricePKR, setVirtualNumberMinimumPricePKR] = useState(50);

  // Website Branding States
  const [siteLogoUrl, setSiteLogoUrl] = useState<string>("");
  const [siteTitle, setSiteTitle] = useState<string>("ZEROX NETWORK");
  const [siteTagline, setSiteTagline] = useState<string>("NETWORK");
  const [siteCoverUrl, setSiteCoverUrl] = useState<string>("");
  const [showSiteCover, setShowSiteCover] = useState<boolean>(true);
  const [siteCoverTitle, setSiteCoverTitle] = useState<string>("One Platform. Endless Possibilities.");
  const [siteCoverSubtitle, setSiteCoverSubtitle] = useState<string>("Everything you need to connect, automate, and grow your business.");
  const [sellerCoverUrl, setSellerCoverUrl] = useState<string>("");
  const [depositCoverUrl, setDepositCoverUrl] = useState<string>("");
  const [aboutAvatarUrl, setAboutAvatarUrl] = useState<string>("");
  const [smmCoverUrl, setSmmCoverUrl] = useState<string>("");
  const [subscriptionsCoverUrl, setSubscriptionsCoverUrl] = useState<string>("");
  const [reviewsCoverUrl, setReviewsCoverUrl] = useState<string>("");
  const [privacyCoverUrl, setPrivacyCoverUrl] = useState<string>("");
  const [customImages, setCustomImages] = useState<CustomImageItem[]>([]);
  
  const [depositInstructions, setDepositInstructions] = useState<DepositInstruction[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Dynamic Favicon Update matching Header Logo
  useEffect(() => {
    const faviconElement = document.getElementById("app-favicon") as HTMLLinkElement | null;
    if (faviconElement) {
      faviconElement.href = siteLogoUrl || "/favicon.svg";
    }
  }, [siteLogoUrl]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>(localStorage.getItem("zerox_currency") || "PKR");
  const [selectedLanguageCode, setSelectedLanguageCode] = useState<string>(() => {
    const saved = localStorage.getItem("zerox_language_code");
    if (saved) return saved;
    // Migration for old "English", "Urdu" strings if they exist
    const old = localStorage.getItem("zerox_language");
    if (old === "Urdu") return "ur";
    if (old === "Arabic") return "ar";
    if (old === "Spanish") return "es";
    if (old === "Hindi") return "hi";
    return "en";
  });

  useEffect(() => {
    localStorage.setItem("zerox_currency", selectedCurrency);
  }, [selectedCurrency]);

  useEffect(() => {
    const prevLang = localStorage.getItem("zerox_language_code");
    localStorage.setItem("zerox_language_code", selectedLanguageCode);
    
    // Google Translate auto-translation
    const cookieString = `/en/${selectedLanguageCode}`;
    document.cookie = `googtrans=${cookieString}; path=/`;
    document.cookie = `googtrans=${cookieString}; path=/; domain=${window.location.hostname}`;
    
    // Apply RTL/LTR globally
    const langData = UNIQUE_LANGUAGES.find(l => l.code === selectedLanguageCode);
    if (langData) {
      document.documentElement.dir = langData.direction;
      document.documentElement.lang = langData.code;
    }
    
    if (prevLang && prevLang !== selectedLanguageCode) {
      window.location.reload();
    }
  }, [selectedLanguageCode]);

  const LANGUAGES = UNIQUE_LANGUAGES;
  const { t } = useTranslation(selectedLanguageCode);

  const formatPrice = (baseUnits: number) => {
    const curr = UNIQUE_CURRENCIES.find(c => c.code === selectedCurrency) || UNIQUE_CURRENCIES.find(c => c.code === "PKR") || UNIQUE_CURRENCIES[0];
    const rateToUse = curr.code === 'PKR' ? cryptoRate : curr.rate;
    const converted = baseUnits * rateToUse;
    const decimals = 2;
    const formattedNum = converted.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    if (curr.code === 'PKR') {
      return `Rs ${formattedNum}`;
    }
    return `${curr.symbol}${formattedNum} ${curr.code}`;
  };
  useEffect(() => {
    const docRef = doc(db, "settings", "zerox_config");
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.disabledServices !== undefined) setDisabledServices(data.disabledServices);
        if (data.customPrices !== undefined) setCustomPrices(data.customPrices);
        if (data.priceMarkupPercent !== undefined) setPriceMarkupPercent(data.priceMarkupPercent);
        if (data.autoApproveDeposits !== undefined) setAutoApproveDeposits(data.autoApproveDeposits);
        if (data.autoApproveCrypto !== undefined) setAutoApproveCrypto(data.autoApproveCrypto);
        if (data.cryptoRate !== undefined) setCryptoRate(data.cryptoRate);
        if (data.cryptoMinDeposit !== undefined) setCryptoMinDeposit(data.cryptoMinDeposit);
        if (data.localMinDeposit !== undefined) setLocalMinDeposit(data.localMinDeposit);
        if (data.virtualNumberMinimumPricePKR !== undefined) setVirtualNumberMinimumPricePKR(data.virtualNumberMinimumPricePKR);
        if (data.customServices !== undefined) setCustomServices(data.customServices);
        if (data.customLinks !== undefined) setCustomLinks(data.customLinks);

        if (data.siteLogoUrl !== undefined) setSiteLogoUrl(data.siteLogoUrl);
        if (data.siteTitle !== undefined) setSiteTitle(data.siteTitle);
        if (data.siteTagline !== undefined) setSiteTagline(data.siteTagline);
        if (data.siteCoverUrl !== undefined) setSiteCoverUrl(data.siteCoverUrl);
        if (data.showSiteCover !== undefined) setShowSiteCover(data.showSiteCover);
        if (data.siteCoverTitle !== undefined) {
          if (!data.siteCoverTitle || data.siteCoverTitle === "Fastest & Cheapest Virtual SMS Activations") {
            setSiteCoverTitle("One Platform. Endless Possibilities.");
          } else {
            setSiteCoverTitle(data.siteCoverTitle);
          }
        }
        if (data.siteCoverSubtitle !== undefined) {
          if (!data.siteCoverSubtitle || data.siteCoverSubtitle === "Instant OTP codes from 100+ countries for WhatsApp, Telegram, Google, TikTok & more") {
            setSiteCoverSubtitle("Everything you need to connect, automate, and grow your business.");
          } else {
            setSiteCoverSubtitle(data.siteCoverSubtitle);
          }
        }
        if (data.sellerCoverUrl !== undefined) setSellerCoverUrl(data.sellerCoverUrl);
        if (data.depositCoverUrl !== undefined) setDepositCoverUrl(data.depositCoverUrl);
        if (data.aboutAvatarUrl !== undefined) setAboutAvatarUrl(data.aboutAvatarUrl);
        if (data.smmCoverUrl !== undefined) setSmmCoverUrl(data.smmCoverUrl);
        if (data.subscriptionsCoverUrl !== undefined) setSubscriptionsCoverUrl(data.subscriptionsCoverUrl);
        if (data.reviewsCoverUrl !== undefined) setReviewsCoverUrl(data.reviewsCoverUrl);
        if (data.privacyCoverUrl !== undefined) setPrivacyCoverUrl(data.privacyCoverUrl);
        if (data.customImages !== undefined) setCustomImages(data.customImages);
        
        const defaultTabMaintenance = {
          store: { hidden: false, maintenance: false, notes: "" },
          smm: { hidden: false, maintenance: false, notes: "" },
          subscriptions: { hidden: false, maintenance: false, notes: "" },
          reviews: { hidden: false, maintenance: false, notes: "" },
          privacy: { hidden: false, maintenance: false, notes: "" },
          dashboard: { hidden: false, maintenance: false, notes: "" },
          wallet: { hidden: false, maintenance: false, notes: "" },
          seller: { hidden: false, maintenance: false, notes: "" },
          api: { hidden: false, maintenance: false, notes: "" },
          tickets: { hidden: false, maintenance: false, notes: "" },
          about: { hidden: false, maintenance: false, notes: "" }
        };
        const mergedTabMaintenance = {
          ...defaultTabMaintenance,
          ...(data.tabMaintenance || {})
        };
        setTabMaintenance(mergedTabMaintenance);
        if (data.tabMaintenance === undefined) {
          // Auto-migrate old documents in Firestore to include default tab maintenance
          updateDoc(docRef, { tabMaintenance: defaultTabMaintenance }).catch(console.error);
        }
      } else {
        // Seed default configuration document
        const defaults = {
          priceMarkupPercent: 10,
          disabledServices: [],
          customPrices: {},
          autoApproveDeposits: false,
          autoApproveCrypto: false,
          cryptoRate: 278,
          cryptoMinDeposit: 5,
          localMinDeposit: 100,
          virtualNumberMinimumPricePKR: 50,
          customServices: [],
          customLinks: [
            { name: "WhatsApp Support", url: "https://wa.me/447868713315" }
          ],
          siteLogoUrl: "",
          siteTitle: "ZEROX NETWORK",
          siteTagline: "NETWORK",
          siteCoverUrl: "",
          showSiteCover: true,
          siteCoverTitle: "One Platform. Endless Possibilities.",
          siteCoverSubtitle: "Everything you need to connect, automate, and grow your business.",
          sellerCoverUrl: "",
          depositCoverUrl: "",
          aboutAvatarUrl: "",
          smmCoverUrl: "",
          customImages: [],
          tabMaintenance: {
            store: { hidden: false, maintenance: false, notes: "" },
            smm: { hidden: false, maintenance: false, notes: "" },
            subscriptions: { hidden: false, maintenance: false, notes: "" },
            dashboard: { hidden: false, maintenance: false, notes: "" },
            wallet: { hidden: false, maintenance: false, notes: "" },
            seller: { hidden: false, maintenance: false, notes: "" },
            api: { hidden: false, maintenance: false, notes: "" },
            tickets: { hidden: false, maintenance: false, notes: "" },
            about: { hidden: false, maintenance: false, notes: "" }
          }
        };
        setDoc(docRef, defaults);
      }
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Zerox config sync failed:: Quota exceeded.");
      } else {
        console.error("Zerox config sync failed::", err);
      }
    });
    return () => unsub();
  }, []);

  // Redirect away from hidden tabs for standard users
  useEffect(() => {
    if (isTabHidden(activeTab)) {
      const allTabs: string[] = [
        "store", "smm", "subscriptions", "reviews", "privacy", "dashboard", "wallet", "seller", "api", "tickets", "about"
      ];
      const fallbackTab = allTabs.find(t => !isTabHidden(t));
      if (fallbackTab) {
        handleTabChange(fallbackTab);
      }
    }
  }, [tabMaintenance, activeTab]);

  // Real-time synchronization of Deposit Instructions from Firestore
  useEffect(() => {
    const colRef = collection(db, "deposit_instructions");
    const unsub = onSnapshot(colRef, async (snapshot) => {
      const fetched: DepositInstruction[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ method: docSnap.id, ...docSnap.data() } as any);
      });
      if (snapshot.empty || fetched.length === 0) {
        // Seed initial default instructions so the platform starts with complete fields
        const defaults: Record<string, any> = {
          easypaisa: {
            accountTitle: "Muhammad Ali",
            accountNumber: "03001234567",
            instructions: "Please transfer PKR amount to this Easypaisa account and upload the receipt/TxID below.",
            isActive: true,
        isHidden: false
          },
          jazzcash: {
            accountTitle: "Muhammad Ali",
            accountNumber: "03001234567",
            instructions: "Please transfer PKR amount to this JazzCash account and upload the receipt/TxID below.",
            isActive: true,
        isHidden: false
          },
          nayapay: {
            accountTitle: "Muhammad Zulfiqar",
            accountNumber: "03238269032",
            instructions: "Please transfer PKR amount to NayaPay account 03238269032 (Account Title: Muhammad Zulfiqar) and submit the transaction ID (TID) and amount below. Instant auto-verification enabled.",
            isActive: true,
        isHidden: false
          },
          bank: {
            accountTitle: "Muhammad Ali",
            accountNumber: "IBAN1234567890",
            instructions: "Please transfer PKR amount to this Bank account and upload the receipt/TxID below.",
            isActive: true,
        isHidden: false
          },
          crypto: {
            accountTitle: "Global Crypto (USDT TRC20 / BEP20 / Binance Pay)",
            accountNumber: "TY1234567890abcdef",
            instructions: "International Worldwide Payment: Send USDT (TRC20 / BEP20 / ERC20), BTC, ETH or Binance Pay. Fast global block confirmation & instant wallet deposit verification.",
            isActive: true,
        isHidden: false
          },
          redotpay: {
            accountTitle: "RedotPay",
            accountNumber: "1397066551",
            instructions: "Transfer to RedotPay ID: 1397066551 or scan QR code. Instant confirmation.",
            isActive: true,
        isHidden: false,
            qrImageUrl: "/redotpay_qr.svg"
          }
        };
        try {
          const promises = Object.entries(defaults).map(([method, data]) => {
            return setDoc(doc(db, "deposit_instructions", method), data);
          });
          await Promise.all(promises);
        } catch (err) {
          if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to seed default deposit instructions:: Quota exceeded.");
      } else {
        console.error("Failed to seed default deposit instructions::", err);
      }
        }
      } else {
        // Ensure NayaPay account is set to Muhammad Zulfiqar / 03238269032 in Firestore
        const nayapayInst = fetched.find(inst => inst.method === "nayapay");
        if (!nayapayInst || nayapayInst.accountTitle !== "Muhammad Zulfiqar" || nayapayInst.accountNumber !== "03238269032" || !nayapayInst.accountNumber) {
          const nayaData = {
            accountTitle: "Muhammad Zulfiqar",
            accountNumber: "03238269032",
            instructions: "Please transfer PKR amount to NayaPay account 03238269032 (Account Title: Muhammad Zulfiqar) and submit the transaction ID (TID) and amount below. Instant auto-verification enabled.",
            isActive: true,
        isHidden: false
          };
          setDoc(doc(db, "deposit_instructions", "nayapay"), nayaData, { merge: true }).catch(err => console.error("Error updating NayaPay instructions:", err));
          if (nayapayInst) {
            nayapayInst.accountNumber = "03238269032";
            nayapayInst.accountTitle = "Muhammad Zulfiqar";
            nayapayInst.instructions = nayaData.instructions;
          } else {
            fetched.push({ method: "nayapay", ...nayaData });
          }
        }

        // Auto-seed redotpay if missing from Firestore
        const hasRedotpay = fetched.some(inst => inst.method === "redotpay");
        if (!hasRedotpay) {
          const redotDefault = {
            accountTitle: "RedotPay",
            accountNumber: "1397066551",
            instructions: "Transfer to RedotPay ID: 1397066551 or scan QR code. Instant confirmation.",
            isActive: true,
        isHidden: false,
            qrImageUrl: "/redotpay_qr.svg"
          };
          setDoc(doc(db, "deposit_instructions", "redotpay"), redotDefault).catch(err => console.error("Error seeding RedotPay:", err));
          fetched.push({ method: "redotpay", ...redotDefault });
        }
        setDepositInstructions(fetched);
      }
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Deposit instructions sync failed:: Quota exceeded.");
      } else {
        console.error("Deposit instructions sync failed::", err);
      }
    });
    return () => unsub();
  }, []);

  // Real-time synchronization of Announcements from Firestore
  useEffect(() => {
    const colRef = collection(db, "announcements");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const fetched: Announcement[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as any);
      });
      fetched.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAnnouncements(fetched);
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Announcements sync failed:: Quota exceeded.");
      } else {
        console.error("Announcements sync failed::", err);
      }
    });
    return () => unsub();
  }, []);

  const [depositRequests, setDepositRequests] = useState<DepositRequest[]>([]);

  // Active & Past orders
  const [orders, setOrders] = useState<ActivationOrder[]>([]);

  // Purchase state loader
  const [isBuying, setIsBuying] = useState(false);

  // SMM Panel states
  const [smmProviders, setSmmProviders] = useState<SmmProvider[]>([]);
  const [smsProviders, setSmsProviders] = useState<SmsProvider[]>([]);
  const [smmCategories, setSmmCategories] = useState<SmmCategory[]>([]);
  const [smmServices, setSmmServices] = useState<SmmService[]>([]);
  const [smmOrders, setSmmOrders] = useState<SmmOrder[]>([]);
  const [smmPriceRules, setSmmPriceRules] = useState<SmmPriceRule[]>([]);
  const [smmLogs, setSmmLogs] = useState<SmmLog[]>([]);
  const [smmSettings, setSmmSettings] = useState<SmmSettings>({
    autoSyncEnabled: true,
    defaultProfitPercent: 20,
    defaultFixedProfit: 0,
    defaultRoundDecimals: 2,
    maxQueueWorkers: 4
  });

  useEffect(() => {
    localStorage.setItem("sms_providers", JSON.stringify(smsProviders));
    const activeProv = smsProviders.find(p => p.status === "ACTIVE");
    if (activeProv && activeProv.apiKey && activeProv.apiKey !== apiKey) {
      setApiKey(activeProv.apiKey);
      localStorage.setItem("5sim_api_key", activeProv.apiKey);
    }
  }, [smsProviders, apiKey]);

  // Ref to hold latest orders to bypass closure scopes in setIntervals
  const ordersRef = useRef<ActivationOrder[]>(orders);
  ordersRef.current = orders;

  // Migrate old telegram support links to whatsapp
  useEffect(() => {
    setCustomLinks(prev => {
      if (prev.some(link => link.name.toLowerCase().includes('telegram'))) {
        return prev.map(link => {
          if (link.name.toLowerCase().includes('telegram')) {
            return { name: "WhatsApp Support", url: "https://wa.me/447868713315" };
          }
          return link;
        });
      }
      return prev;
    });
  }, []);

  const [insufficientBalanceInfo, setInsufficientBalanceInfo] = useState<{
    neededPkr: number;
    neededUsd: number;
    userBalancePkr: number;
    serviceName: string;
    tabName: string;
  } | null>(null);

  
  // Real-time Firestore sync listeners
  useEffect(() => {
    let unsubUserDoc: (() => void) | null = null;

    const setupUserDocListener = (activeUid: string) => {
      if (unsubUserDoc) unsubUserDoc();
      const userDocRef = doc(db, "users", activeUid);
      unsubUserDoc = onSnapshot(userDocRef, (userDoc) => {
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.status === "Blocked" || data.status === "Suspended") {
            localStorage.removeItem("zerox_user_account");
            localStorage.removeItem("zerox_local_user_id");
            setCurrentUser(null);
            signOut(auth).catch(() => {});
            toast.error(`Your account has been ${data.status.toLowerCase()}.`);
            return;
          }
          const updatedAccount: UserAccount = {
            id: activeUid,
            username: data.username || "",
            email: data.email || "",
            balance: typeof data.balance === "number" ? data.balance : 0,
            loyaltyPoints: typeof data.loyaltyPoints === "number" ? data.loyaltyPoints : 0,
            createdAt: data.createdAt || new Date().toISOString(),
            whatsappNumber: data.whatsappNumber || "",
            fullName: data.fullName || "",
            status: data.status || "Active",
            isVerified: data.isVerified || false,
            apiKey: data.apiKey,
            apiStatus: data.apiStatus
          };
          setCurrentUser(updatedAccount);
          localStorage.setItem("zerox_user_account", JSON.stringify(updatedAccount));
          localStorage.setItem("zerox_local_user_id", activeUid);
        }
      }, (err) => {
        if (err && err.message && err.message.includes("Quota limit exceeded")) {
          console.warn("Current user real-time doc sync failed:: Quota exceeded.");
        } else {
          console.error("Current user real-time doc sync failed::", err);
        }
      });
    };

    const initialUid = auth.currentUser?.uid || localStorage.getItem("zerox_local_user_id");
    if (initialUid) {
      setupUserDocListener(initialUid);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setupUserDocListener(user.uid);
      } else {
        const storedUid = localStorage.getItem("zerox_local_user_id");
        if (storedUid) {
          setupUserDocListener(storedUid);
        } else {
          if (unsubUserDoc) {
            unsubUserDoc();
            unsubUserDoc = null;
          }
          setCurrentUser(null);
        }
      }
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);

  // Real-time synchronization of all users (primarily for Admin balance center)
  useEffect(() => {
    const isUserAdmin = isAdminOpen || !!userAdminInfo?.isAdmin || currentUser?.email?.toLowerCase() === "zeroxnetworks@gmail.com" || currentUser?.email?.toLowerCase() === "info.rynmirza@gmail.com";
    if (!isUserAdmin) {
      if (currentUser) {
        setRegisteredUsers([currentUser]);
      } else {
        setRegisteredUsers([]);
      }
      return;
    }
    const usersCol = collection(db, "users");
    const unsubAllUsers = onSnapshot(usersCol, (snapshot) => {
      const fetched: UserAccount[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetched.push({
          id: docSnap.id,
          username: data.username || "",
          email: data.email || "",
          balance: typeof data.balance === "number" ? data.balance : 0,
          loyaltyPoints: typeof data.loyaltyPoints === "number" ? data.loyaltyPoints : 0,
          createdAt: data.createdAt || new Date().toISOString(),
          whatsappNumber: data.whatsappNumber || "",
          fullName: data.fullName || "",
          status: data.status || "Active",
          isVerified: data.isVerified || false,
          apiKey: data.apiKey,
          apiStatus: data.apiStatus,
          warningMessage: data.warningMessage,
          isBanned: data.isBanned,
          banReason: data.banReason,
          dailyLimit: data.dailyLimit
        });
      });
      setRegisteredUsers(fetched);
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Registered users real-time sync failed:: Quota exceeded.");
      } else {
        console.error("Registered users real-time sync failed::", err);
      }
    });
    return () => unsubAllUsers();
  }, [isAdminOpen, currentUser]);

  const prevDepositsRef = React.useRef<Record<string, string>>({});

  // Real-time synchronization of deposit requests (for both Admin center and Client wallet deposit status)
  useEffect(() => {
    if (!currentUser) {
      setDepositRequests([]);
      return;
    }
    const isUserAdmin = isAdminOpen || !!userAdminInfo?.isAdmin || currentUser?.email?.toLowerCase() === "zeroxnetworks@gmail.com" || currentUser?.email?.toLowerCase() === "info.rynmirza@gmail.com";
    const depositsCol = isUserAdmin
      ? collection(db, "deposits")
      : query(collection(db, "deposits"), where("userId", "==", currentUser.id));

    const unsubDeposits = onSnapshot(depositsCol, (snapshot) => {
      const fetched: DepositRequest[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const deposit: DepositRequest = {
          id: docSnap.id,
          userId: data.userId || "",
          username: data.username || "",
          method: data.method || "easypaisa",
          amount: typeof data.amount === "number" ? data.amount : 0,
          txId: data.txId || "",
          senderName: data.senderName || "",
          senderPhone: data.senderPhone || "",
          proofImageUrl: data.proofImageUrl || "",
          status: data.status || "PENDING",
          createdAt: data.createdAt || new Date().toISOString(),
          adminNotes: data.adminNotes || ""
        };
        fetched.push(deposit);

        // Notify user if their deposit was approved/rejected
        const isUserMatch = currentUser && (
          deposit.userId === currentUser.id || 
          (deposit.username && deposit.username.toLowerCase() === currentUser.username.toLowerCase())
        );

        if (isUserMatch) {
          const prevStatusUpper = (prevDepositsRef.current[deposit.id] || "").toUpperCase();
          const currentStatusUpper = (deposit.status || "").toUpperCase();
          if (prevStatusUpper === "PENDING" && currentStatusUpper === "APPROVED") {
            toast.success(`🎉 Deposit Approved! ${formatPrice(deposit.amount / cryptoRate)} has been credited to your wallet.`, {
              duration: 6000
            });
            console.log(`[Notification Sent]: Deposit Approved for ${deposit.username} - ₨ ${deposit.amount}`);
            try {
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Zerox Network Deposit Approved", {
                  body: `Your deposit of ₨ ${deposit.amount} was approved and credited!`,
                  icon: "/favicon.ico"
                });
              }
            } catch (e) {}
          } else if (prevStatusUpper === "PENDING" && currentStatusUpper === "REJECTED") {
            toast.error(`❌ Deposit Rejected for ${formatPrice(deposit.amount / cryptoRate)}. Reason: ${deposit.adminNotes || "Verification failed"}`, {
              duration: 6000
            });
            console.log(`[Notification Sent]: Deposit Rejected for ${deposit.username} - ₨ ${deposit.amount}`);
          }
        }
        prevDepositsRef.current[deposit.id] = deposit.status;
      });
      // Sort by date descending
      fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setDepositRequests(fetched);
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Deposit requests real-time sync failed:: Quota exceeded.");
      } else {
        console.error("Deposit requests real-time sync failed::", err);
      }
    });
    return () => unsubDeposits();
  }, [currentUser, isAdminOpen]);

  // Real-time synchronization of SMS activation orders
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      return;
    }
    const isUserAdmin = isAdminOpen || !!userAdminInfo?.isAdmin || currentUser?.email?.toLowerCase() === "zeroxnetworks@gmail.com" || currentUser?.email?.toLowerCase() === "info.rynmirza@gmail.com";
    const ordersCol = isUserAdmin
      ? collection(db, "orders")
      : query(collection(db, "orders"), where("userId", "==", currentUser.id));

    const unsubOrders = onSnapshot(ordersCol, (snapshot) => {
      const fetched: ActivationOrder[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetched.push({
          id: Number(docSnap.id),
          phone: data.phone || "",
          operator: data.operator || "",
          product: data.product || "",
          price: typeof data.price === "number" ? data.price : 0,
          status: data.status || "PENDING",
          expires: data.expires || new Date().toISOString(),
          sms: data.sms || null,
          created_at: data.created_at || new Date().toISOString(),
          country: data.country || "",
          userId: data.userId || ""
        });
      });
      // Sort by date descending
      fetched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(fetched);
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Orders real-time sync failed:: Quota exceeded.");
      } else {
        console.error("Orders real-time sync failed::", err);
      }
    });
    return () => unsubOrders();
  }, [currentUser, isAdminOpen]);

  // Real-time synchronization of SMS Provider gateways (with auto-seeding default gateways if Firestore is empty)
  useEffect(() => {
    const providersCol = collection(db, "sms_providers");
    const unsubProviders = onSnapshot(providersCol, (snapshot) => {
      const fetched: SmsProvider[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as any);
      });

      if (fetched.length === 0) {
        // No default to seed
      } else {
        setSmsProviders(fetched);
      }
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("SMS providers subscription error:: Quota exceeded.");
      } else {
        console.error("SMS providers subscription error::", err);
      }
    });
    return () => unsubProviders();
  }, []);

  // Real-time synchronization of SMM Providers
  useEffect(() => {
    const colRef = collection(db, "smm_providers");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const fetched: SmmProvider[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as any);
      });
      if (fetched.length === 0) {
        // No default to seed
      } else {
        setSmmProviders(fetched);
      }
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("SMM providers sync failed:: Quota exceeded.");
      } else {
        console.error("SMM providers sync failed::", err);
      }
    });
    return () => unsub();
  }, []);

  // Real-time synchronization of SMM Categories
  useEffect(() => {
    const colRef = collection(db, "smm_categories");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const fetched: SmmCategory[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as any);
      });
      if (fetched.length === 0) {
        // No default to seed
      } else {
        fetched.sort((a, b) => a.sortOrder - b.sortOrder);
        setSmmCategories(fetched);
      }
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("SMM categories sync failed:: Quota exceeded.");
      } else {
        console.error("SMM categories sync failed::", err);
      }
    });
    return () => unsub();
  }, []);

  // Real-time synchronization of SMM Services
  useEffect(() => {
    const colRef = collection(db, "smm_services");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const fetched: SmmService[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as any);
      });
      if (fetched.length === 0) {
        // No default to seed
      } else {
        setSmmServices(fetched);
      }
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("SMM services sync failed:: Quota exceeded.");
      } else {
        console.error("SMM services sync failed::", err);
      }
    });
    return () => unsub();
  }, []);

  // Real-time synchronization of SMM Price Rules
  useEffect(() => {
    const colRef = collection(db, "smm_price_rules");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const fetched: SmmPriceRule[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as any);
      });
      if (fetched.length === 0) {
        // No default to seed
      } else {
        setSmmPriceRules(fetched);
      }
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("SMM price rules sync failed:: Quota exceeded.");
      } else {
        console.error("SMM price rules sync failed::", err);
      }
    });
    return () => unsub();
  }, []);

  // Real-time synchronization of SMM Settings
  useEffect(() => {
    const docRef = doc(db, "smm_settings", "config");
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setSmmSettings(docSnap.data() as SmmSettings);
      } else {
        const defaults: SmmSettings = {
          autoSyncEnabled: true,
          defaultProfitPercent: 20,
          defaultFixedProfit: 0,
          defaultRoundDecimals: 2,
          maxQueueWorkers: 4
        };
        setDoc(docRef, defaults);
      }
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("SMM settings sync failed:: Quota exceeded.");
      } else {
        console.error("SMM settings sync failed::", err);
      }
    });
    return () => unsub();
  }, []);

  const prevSmmOrdersRef = React.useRef<Record<string, string>>({});

  // Real-time synchronization of SMM Orders
  useEffect(() => {
    if (!currentUser) {
      setSmmOrders([]);
      return;
    }
    const isUserAdmin = isAdminOpen || !!userAdminInfo?.isAdmin || currentUser?.email?.toLowerCase() === "zeroxnetworks@gmail.com" || currentUser?.email?.toLowerCase() === "info.rynmirza@gmail.com";
    const colRef = isUserAdmin
      ? collection(db, "smm_orders")
      : query(collection(db, "smm_orders"), where("userId", "==", currentUser.id));

    const unsub = onSnapshot(colRef, (snapshot) => {
      const fetched: SmmOrder[] = [];
      snapshot.forEach((docSnap) => {
        const order = { id: docSnap.id, ...docSnap.data() } as any;
        fetched.push(order);
        
        if (currentUser && order.userId === currentUser.id) {
            const prevStatus = prevSmmOrdersRef.current[order.id];
            if (prevStatus && prevStatus !== order.status) {
                if (order.status === "Completed") {
                    toast.success(`Your SMM order for ${order.serviceName} has been Completed!`);
                    console.log(`[WhatsApp/Email Notification Sent]: SMM Order Completed for ${order.username}`);
                } else if (order.status === "Processing") {
                    console.log(`[WhatsApp/Email Notification Sent]: SMM Order Processing for ${order.username}`);
                }
            }
        }
        prevSmmOrdersRef.current[order.id] = order.status;
      });
      if (fetched.length === 0) {
        // No default to seed
      } else {
        // Sort SMM orders by createdAt descending
        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSmmOrders(fetched);
      }
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("SMM orders sync failed:: Quota exceeded.");
      } else {
        console.error("SMM orders sync failed::", err);
      }
    });
    return () => unsub();
  }, [currentUser, isAdminOpen]);

  // Periodic real-time status sync with SMM provider API for active orders
  useEffect(() => {
    if (smmOrders.length === 0 || !currentUser) return;

    const activeOrders = smmOrders.filter(o => {
      const st = (o.status || "").toLowerCase();
      return st === "pending" || st === "processing" || st === "in progress" || st === "in_progress";
    });

    if (activeOrders.length === 0) return;

    const syncStatus = async () => {
      try {
        await fetch("/api/smm/sync-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id, orderIds: activeOrders.map(o => o.id) })
        });
      } catch (err) {
        console.warn("Real-time SMM status sync error:", err);
      }
    };

    // Run initial sync once
    syncStatus();

    // Poll every 30 seconds
    const interval = setInterval(syncStatus, 30000);
    return () => clearInterval(interval);
  }, [smmOrders, currentUser]);

  // Real-time synchronization of SMM Activity Logs
  useEffect(() => {
    const isUserAdmin = isAdminOpen || !!userAdminInfo?.isAdmin || currentUser?.email?.toLowerCase() === "zeroxnetworks@gmail.com" || currentUser?.email?.toLowerCase() === "info.rynmirza@gmail.com";
    if (!isUserAdmin) {
      setSmmLogs([]);
      return;
    }
    const colRef = collection(db, "smm_logs");
    const unsub = onSnapshot(colRef, (snapshot) => {
      const fetched: SmmLog[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as any);
      });
      if (fetched.length === 0) {
        // No default to seed
      } else {
        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setSmmLogs(fetched);
      }
    }, (err) => {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("SMM logs sync failed:: Quota exceeded.");
      } else {
        console.error("SMM logs sync failed::", err);
      }
    });
    return () => unsub();
  }, []);

  // Sync deposit instructions to localStorage
  useEffect(() => {
    localStorage.setItem("zerox_deposit_instructions", JSON.stringify(depositInstructions));
  }, [depositInstructions]);

  // Initial validation of stored API key
  useEffect(() => {
    if (apiKey) {
      validateAPIKey(apiKey);
    }
  }, []);

  // API Key validation function
  const validateAPIKey = async (keyToValidate: string) => {
    if (!keyToValidate) return;
    setIsValidating(true);
    setValidationError(null);
    try {
      const activeProv = smsProviders.find(p => p.status === "ACTIVE") || smsProviders[0];
      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${keyToValidate}`,
          "x-provider-url": activeProv?.apiUrl || "https://5sim.net/v1",
          "x-provider-type": activeProv?.apiType || "5sim"
        }
      });
      if (!response.ok) {
        throw new Error("Local simulation fallback engaged");
      }
      const data = await response.json();
      setProfile(data);
      setApiKey(keyToValidate);
      localStorage.setItem("5sim_api_key", keyToValidate);
    } catch (err: any) {
      console.warn("API Key Validation Failed:", err.message);
      setValidationError(err.message || "Invalid API Key or Provider unreachable");
      setProfile(null);
    } finally {
      setIsValidating(false);
    }
  };

  // Clear previous orders logs
  const handleBuyAgain = (country: string, product: string) => {
    handleTabChange("store");
    // Optionally pre-select the country and product in CatalogSelector
    // But since state is in CatalogSelector, we might need to hoist it or just scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success(`Switched to store for ${product} in ${country}`);
  };

  const handleClearHistory = () => {
    if (currentUser) {
      setOrders(prev => prev.filter(o => (o.status === "PENDING" || o.status === "RECEIVED") || o.userId !== currentUser.id));
    } else {
      setOrders(prev => prev.filter(o => o.status === "PENDING" || o.status === "RECEIVED"));
    }
  };

  // --- Purchase Virtual Number ---
  const handleBuyNumber = async (country: string, operator: string, product: string, price: number, targetPhone?: string) => {
    // Request notification permission to alert user of SMS
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    // SECURITY: user must be logged in to order!
    if (!currentUser) {
      toast.error("Please log in or register a free account to purchase activation numbers.");
      setShowAuthModal(true);
      return;
    }

    if (currentUser.balance < price) {
      setInsufficientBalanceInfo({
        neededUsd: price,
        neededPkr: price * cryptoRate,
        userBalancePkr: currentUser.balance * cryptoRate,
        serviceName: `${product.toUpperCase()} (Virtual Number - ${country.toUpperCase()})`,
        tabName: "store"
      });
      toast.error(`Insufficient balance. This virtual number costs ${formatPrice(price)}, but your account balance is only ${formatPrice(currentUser.balance)}. Please make a cash deposit to top-up!`);
      return;
    }

    setIsBuying(true);
    try {
      const response = await fetch("/api/secure-buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          country,
          operator,
          product,
          price,
          targetPhone
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Virtual number allocation currently unavailable for this selection.");
      }

      toast.success("Order placed successfully!");
      
      // Deduct balance locally immediately
      const updatedBalance = Number((currentUser.balance - price).toFixed(4));
      handleUpdateUserBalance(currentUser.id, updatedBalance);
      
      // Send Alert
      fetch("/api/admin/alert/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "new_order",
          details: `Username: ${currentUser.username}\nUser ID: ${currentUser.id}\n\n--- Order Details ---\nProduct: ${product.toUpperCase()}\nCountry: ${country.toUpperCase()}\nOperator: ${operator}\nPrice Deducted: ${price} USD (${formatPrice(price)})`
        })
      }).catch(err => console.error("Alert trigger failed", err));

      // Trigger Order Confirmation Email to User and Admin
      fetch("/api/email/virtual-number-ordered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: currentUser.email,
          username: currentUser.username || currentUser.name || "Customer",
          orderDetails: {
            id: data.id || "PENDING",
            service: product.toUpperCase(),
            country: country.toUpperCase(),
            operator: operator,
            phone: data.phone || "N/A",
            amount: (price * cryptoRate).toFixed(2)
          }
        })
      }).catch(err => console.error("Order confirmation email failed", err));

      // Low Balance Warning Check (Threshold: 200 PKR)
      const currentBalancePkr = (currentUser.balance - price) * cryptoRate;
      if (currentBalancePkr < 200) {
        fetch("/api/email/low-balance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: currentUser.email,
            username: currentUser.username,
            balance: formatPrice(currentUser.balance - price)
          })
        }).catch(err => console.error("Low balance email failed", err));
      }

      validateAPIKey(apiKey);

      // Automatic smooth redirect to Order Detail page for the newly allocated virtual number
      if (data && data.id) {
        setSelectedOrderId(Number(data.id));
        try {
          window.history.pushState(null, "", `/orders/${data.id}`);
        } catch (e) {}
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        handleTabChange("store");
        setTimeout(() => {
          const activeElem = document.getElementById("active-orders-section") || document.getElementById("active-orders-wrapper");
          if (activeElem) {
            activeElem.scrollIntoView({ behavior: "smooth", block: "start" });
          } else {
            window.scrollTo({ top: 0, behavior: "smooth" });
          }
        }, 100);
      }
    } catch (err: any) {
      const errMsg = err?.message || "Purchase failed: Out of stock";
      if (errMsg.includes("Quota limit exceeded")) {
        console.warn("Purchase notice: Quota exceeded.");
      } else if (errMsg.includes("Out of stock") || errMsg.includes("no free phones") || errMsg.includes("No free numbers") || errMsg.includes("no product")) {
        console.warn("Purchase notice (Out of stock):", errMsg);
      } else {
        console.error("Purchase error:", err);
      }
      toast.error(errMsg);
    } finally {
      setIsBuying(false);
    }
  };
  const handleCancelOrder = async (id: number) => {
    if (!currentUser) return;
    try {
      const response = await fetch("/api/secure-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, userId: currentUser.id })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel order");
      }
      const order = orders.find(o => o.id === id);
      const netRefundAmt = typeof data.netRefund === "number" ? data.netRefund : Number(((order?.price || 0) * 0.93).toFixed(4));
      
      toast.success(`Order canceled. Net refund of ${formatPrice(netRefundAmt)} credited to your wallet.`);
      
      if (order && currentUser) {
        const newBalance = Number((currentUser.balance + netRefundAmt).toFixed(4));
        setCurrentUser(prev => prev ? { ...prev, balance: newBalance } : prev);
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "CANCELED" } : o));
      }

      // Send email alert for order canceled with accurate PKR amounts
      if (order && currentUser?.email) {
        const orderPricePkr = Number(((order.price || 0) * cryptoRate).toFixed(2));
        const netRefundPkr = Number(((netRefundAmt || (order.price * 0.95)) * cryptoRate).toFixed(2));
        const cancelFeePkr = Number((orderPricePkr * 0.05).toFixed(2));
        const procFeePkr = Number((orderPricePkr * 0.02).toFixed(2));

        fetch("/api/email/order-canceled", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            toEmail: currentUser.email,
            username: currentUser.name || "Customer",
            orderDetails: {
              id: order.id,
              service: order.service,
              country: order.country,
              operator: order.operator,
              phone: order.phone,
              amount: orderPricePkr.toFixed(2),
              originalAmountPkr: orderPricePkr.toFixed(2),
              netRefundAmountPkr: netRefundPkr.toFixed(2),
              cancellationFeePkr: cancelFeePkr.toFixed(2),
              processingFeePkr: procFeePkr.toFixed(2)
            }
          })
        }).catch(console.error);
      }
      
      validateAPIKey(apiKey);
    } catch (err: any) {
      toast.error(`Error canceling: ${err.message}`);
    }
  };

  // --- Order Action Trigger: Finish ---
  const handleFinishOrder = async (id: number) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    try {
      const activeProv = smsProviders.find(p => p.status === "ACTIVE") || smsProviders[0];
      const response = await fetch(`/api/finish/${id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "x-provider-url": activeProv?.apiUrl || "https://5sim.net/v1",
          "x-provider-type": activeProv?.apiType || "5sim"
        }
      });
      if (response.ok) {
        await updateDoc(doc(db, "orders", String(id)), { status: "FINISHED" });
        validateAPIKey(apiKey);
        toast.success("Order finished.");
      } else {
        // If finish not supported, set status directly in Firestore
        await updateDoc(doc(db, "orders", String(id)), { status: "FINISHED" });
      }
    } catch (err) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Finish failed:: Quota exceeded.");
      } else {
        console.error("Finish failed::", err);
      }
    }
  };

  // --- Order Action Trigger: Ban/Retry ---
  const handleBanOrder = async (id: number) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    try {
      const activeProv = smsProviders.find(p => p.status === "ACTIVE") || smsProviders[0];
      const response = await fetch(`/api/ban/${id}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "x-provider-url": activeProv?.apiUrl || "https://5sim.net/v1",
          "x-provider-type": activeProv?.apiType || "5sim"
        }
      });
      if (response.ok) {
        await updateDoc(doc(db, "orders", String(id)), { status: "BANNED" });

        // Refund user in Firestore!
        const userRef = doc(db, "users", order.userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const currentBal = userDoc.data().balance || 0;
          const refundedBalance = Number((currentBal + order.price).toFixed(2));
          await updateDoc(userRef, { balance: refundedBalance });
        }

        validateAPIKey(apiKey);
        toast.success("Number banned/retried and funds refunded.");
        
        // Send email alert for marked bad with accurate PKR amounts
        if (currentUser?.email) {
          const orderPricePkr = Number(((order.price || 0) * cryptoRate).toFixed(2));
          const netRefundPkr = Number(((order.price || 0) * 0.95 * cryptoRate).toFixed(2));
          const cancelFeePkr = Number((orderPricePkr * 0.05).toFixed(2));
          const procFeePkr = Number((orderPricePkr * 0.02).toFixed(2));

          fetch("/api/email/order-marked-bad", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toEmail: currentUser.email,
              username: currentUser.name || "Customer",
              orderDetails: {
                id: order.id,
                service: order.service,
                country: order.country,
                operator: order.operator,
                phone: order.phone,
                amount: orderPricePkr.toFixed(2),
                originalAmountPkr: orderPricePkr.toFixed(2),
                netRefundAmountPkr: netRefundPkr.toFixed(2),
                cancellationFeePkr: cancelFeePkr.toFixed(2),
                processingFeePkr: procFeePkr.toFixed(2)
              }
            })
          }).catch(console.error);
        }
      } else {
        toast.error("Failed to ban/retry number. Setting status to canceled.");
        await updateDoc(doc(db, "orders", String(id)), { status: "BANNED" });
      }
    } catch (err) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Ban failed:: Quota exceeded.");
      } else {
        console.error("Ban failed::", err);
      }
    }
  };

  // --- Real API Polling loop (Fetches status from 5sim.net every 5 seconds) ---
  useEffect(() => {
    const pollingInterval = setInterval(async () => {
      const activeReal = ordersRef.current.filter(o => o.status === "PENDING" || o.status === "RECEIVED");
      if (activeReal.length === 0) return;

      for (const order of activeReal) {
        try {
          const activeProv = smsProviders.find(p => p.status === "ACTIVE") || smsProviders[0];
          const headers: Record<string, string> = {
            "x-provider-url": activeProv?.apiUrl || "https://5sim.net/v1",
            "x-provider-type": activeProv?.apiType || "5sim"
          };
          if (apiKey) {
            headers["Authorization"] = `Bearer ${apiKey}`;
          }

          const response = await fetch("/api/secure-check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: order.id, userId: order.userId || currentUser?.id })
          }).catch(() => null);
          
          if (response && response.ok) {
            const data = await response.json().catch(() => null);
            if (!data) continue;
            
            if (data.status !== order.status || JSON.stringify(data.sms) !== JSON.stringify(order.sms)) {
              const oldSmsCount = order.sms ? order.sms.length : 0;
              const newSmsCount = data.sms ? data.sms.length : 0;
              if (newSmsCount > oldSmsCount) {
                if ("Notification" in window && Notification.permission === "granted") {
                  const newSmsText = data.sms[data.sms.length - 1].code || "New message received!";
                  new Notification("ZeroX: New SMS Received", { body: `Number: ${order.phone}
Code: ${newSmsText}` });
                } else if ("vibrate" in navigator) {
                  navigator.vibrate([200, 100, 200]);
                }
              }
              // The backend now handles Firestore updates for status/sms and refunds if canceled.
              // We just refresh user balance if status changed.
              if (currentUser) {
                validateAPIKey(apiKey);
              }
            }
          }
        } catch (err: any) {
          console.warn(`Polling status for order ${order.id} paused temporarily:`, err?.message || err);
        }
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollingInterval);
  }, [apiKey]);

  const handleLogoClick = () => {
    setActiveTab("store");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateGlobalSettings = async (settingsToUpdate: any) => {
    try {
      await updateDoc(doc(db, "settings", "zerox_config"), settingsToUpdate);
      // Invalidate backend cache
      fetch("/api/admin/invalidate-settings-cache", { method: "POST" }).catch(e => console.warn("Failed to invalidate backend settings cache:", e));
    } catch (err) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to update global settings in Firestore:: Quota exceeded.");
      } else {
        console.error("Failed to update global settings in Firestore::", err);
      }
      throw err;
    }
  };

  const handleUpdateMarkupPercent = async (percent: number) => {
    setPriceMarkupPercent(percent);
    try {
      await updateDoc(doc(db, "settings", "zerox_config"), { priceMarkupPercent: percent });
      fetch("/api/admin/invalidate-settings-cache", { method: "POST" }).catch(e => console.warn("Failed to invalidate backend settings cache:", e));
      toast.success("Markup percentage updated and synced in real-time!");
    } catch (err) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to update price markup percent in Firestore:: Quota exceeded.");
      } else {
        console.error("Failed to update price markup percent in Firestore::", err);
      }
      toast.error("Failed to save markup percent");
    }
  };

  const handleToggleService = async (key: string) => {
    const updated = disabledServices.includes(key)
      ? disabledServices.filter(k => k !== key)
      : [...disabledServices, key];
    await updateDoc(doc(db, "settings", "zerox_config"), { disabledServices: updated });
  };

  const handleUpdateCustomPrice = async (key: string, price: number) => {
    const updated = { ...customPrices, [key]: price };
    await updateDoc(doc(db, "settings", "zerox_config"), { customPrices: updated });
  };

  const handleAddCustomService = async (service: ServiceData & { defaultPrice?: number }) => {
    if (customServices.some(s => s.key === service.key)) return;
    const updatedServices = [...customServices, { key: service.key, name: service.name, icon: service.icon, popular: service.popular }];
    const updates: any = { customServices: updatedServices };
    if (service.defaultPrice !== undefined && service.defaultPrice > 0) {
      updates.customPrices = { ...customPrices, [service.key]: service.defaultPrice };
    }
    await updateDoc(doc(db, "settings", "zerox_config"), updates);
  };

  const handleRemoveCustomService = async (key: string) => {
    const updatedServices = customServices.filter(s => s.key !== key);
    const updatedPrices = { ...customPrices };
    delete updatedPrices[key];
    await updateDoc(doc(db, "settings", "zerox_config"), {
      customServices: updatedServices,
      customPrices: updatedPrices
    });
  };

  const handleAddCustomLink = async (name: string, url: string) => {
    const updatedLinks = [...customLinks, { name, url }];
    await updateDoc(doc(db, "settings", "zerox_config"), { customLinks: updatedLinks });
  };

  const handleRemoveCustomLink = async (index: number) => {
    const updatedLinks = customLinks.filter((_, i) => i !== index);
    await updateDoc(doc(db, "settings", "zerox_config"), { customLinks: updatedLinks });
  };

  const handleUpdateCustomLink = async (index: number, name: string, url: string) => {
    const updatedLinks = [...customLinks];
    updatedLinks[index] = { name, url };
    await updateDoc(doc(db, "settings", "zerox_config"), { customLinks: updatedLinks });
  };

  // --- SMM PANEL FIRESTORE INTEGRATIVE WRAPPERS ---
  const handleUpdateSmmProviders = async (updater: any) => {
    const updated = typeof updater === "function" ? updater(smmProviders) : updater;
    setSmmProviders(updated);
    for (const p of updated) {
      await setDoc(doc(db, "smm_providers", p.id), p);
    }
    const deletedIds = smmProviders.map(x => x.id).filter(id => !updated.map((x: any) => x.id).includes(id));
    for (const id of deletedIds) {
      try {
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "smm_providers", id));
      } catch (e) { console.error(e); }
    }
  };

  const handleUpdateSmmCategories = async (updater: any) => {
    const updated = typeof updater === "function" ? updater(smmCategories) : updater;
    setSmmCategories(updated);
    for (const c of updated) {
      await setDoc(doc(db, "smm_categories", c.id), c);
    }
    const deletedIds = smmCategories.map(x => x.id).filter(id => !updated.map((x: any) => x.id).includes(id));
    for (const id of deletedIds) {
      try {
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "smm_categories", id));
      } catch (e) { console.error(e); }
    }
  };

  const handleUpdateSmmServices = async (updater: any) => {
    const updated = typeof updater === "function" ? updater(smmServices) : updater;
    setSmmServices(updated);
    for (const s of updated) {
      await setDoc(doc(db, "smm_services", s.id), s);
    }
    const deletedIds = smmServices.map(x => x.id).filter(id => !updated.map((x: any) => x.id).includes(id));
    for (const id of deletedIds) {
      try {
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "smm_services", id));
      } catch (e) { console.error(e); }
    }
  };

  const handleUpdateSmmOrders = async (updater: any) => {
    const updated = typeof updater === "function" ? updater(smmOrders) : updater;
    setSmmOrders(updated);
    for (const o of updated) {
      await setDoc(doc(db, "smm_orders", o.id), o);
    }
    const deletedIds = smmOrders.map(x => x.id).filter(id => !updated.map((x: any) => x.id).includes(id));
    for (const id of deletedIds) {
      try {
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "smm_orders", id));
      } catch (e) { console.error(e); }
    }
  };

  const handleUpdateSmmPriceRules = async (updater: any) => {
    const updated = typeof updater === "function" ? updater(smmPriceRules) : updater;
    setSmmPriceRules(updated);
    for (const r of updated) {
      await setDoc(doc(db, "smm_price_rules", r.id), r);
    }
    const deletedIds = smmPriceRules.map(x => x.id).filter(id => !updated.map((x: any) => x.id).includes(id));
    for (const id of deletedIds) {
      try {
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "smm_price_rules", id));
      } catch (e) { console.error(e); }
    }
  };

  const handleUpdateSmmLogs = async (updater: any) => {
    const updated = typeof updater === "function" ? updater(smmLogs) : updater;
    setSmmLogs(updated);
    for (const l of updated) {
      await setDoc(doc(db, "smm_logs", l.id), l);
    }
    const deletedIds = smmLogs.map(x => x.id).filter(id => !updated.map((x: any) => x.id).includes(id));
    for (const id of deletedIds) {
      try {
        const { deleteDoc } = await import("firebase/firestore");
        await deleteDoc(doc(db, "smm_logs", id));
      } catch (e) { console.error(e); }
    }
  };

  const handleUpdateSmmSettings = async (updater: any) => {
    const updated = typeof updater === "function" ? updater(smmSettings) : updater;
    setSmmSettings(updated);
    await setDoc(doc(db, "smm_settings", "config"), updated);
  };

  // --- USER AUTHENTICATION HANDLERS ---
  const handleLogin = (user: UserAccount) => {
    setCurrentUser(user);
    localStorage.setItem("zerox_user_account", JSON.stringify(user));
    localStorage.setItem("zerox_local_user_id", user.id);
    handleTabChange("dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("zerox_user_account");
    localStorage.removeItem("zerox_local_user_id");
    localStorage.removeItem("zerox_admin_session");
    localStorage.removeItem("zerox_admin_logged");
    localStorage.removeItem("zerox_admin_role");
    localStorage.removeItem("zerox_admin_username");
    localStorage.removeItem("zerox_reviews_cache");
    localStorage.removeItem("zerox_privacy_policy");
    sessionStorage.clear();
    setCurrentUser(null);
    signOut(auth).catch(() => {});
    toast.success("Logged out successfully");
  };

  const handleRegister = (newUser: UserAccount) => {
    setRegisteredUsers(prev => [...prev, newUser]);
  };

  // --- CASH DEPOSIT SYSTEM ENGINE HANDLERS ---
  const handleAddDepositRequest = async (req: Omit<DepositRequest, "id" | "userId" | "username" | "status" | "createdAt">) => {
    if (!currentUser) {
      toast.error("Please log in first to submit a deposit request.");
      return;
    }

     
     
    const reqId = "dep_" + Math.random().toString(36).substr(2, 9);

    let finalStatus: "APPROVED" | "PENDING" | "ALREADY_PROCESSED" = "PENDING";
    let autoNotes = "";

    // Duplicate check
    try {
      const q = query(collection(db, "deposits"), where("txId", "==", req.txId));
      const snaps = await getDocs(q);
      const hasApproved = snaps.docs.some(d => d.data().status === "APPROVED");
      if (hasApproved) {
        finalStatus = "ALREADY_PROCESSED";
        autoNotes = "Transaction Already Used";
      }
    } catch (e) {}

    // Check automatic TID verification API if available
    if (finalStatus === "PENDING") {
      try {
        const verifyRes = await fetch("/api/deposit/verify-tid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: currentUser.id,
            username: currentUser.username,
            tid: req.txId,
            amount: req.amount,
            method: req.method,
            screenshotPath: req.proofImageUrl
          })
        });
        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          if (verifyData.success && verifyData.status === "auto-approved") {
            finalStatus = "APPROVED";
            autoNotes = verifyData.message || "Verified instantly via TID payment matcher engine.";
          } else if (verifyData.status === "already_used") {
            finalStatus = "ALREADY_PROCESSED";
            autoNotes = "Transaction Already Used";
          }
        }
      } catch (apiErr) {
        console.warn("TID verification API note:", apiErr);
      }
    }

    const newReq: DepositRequest = {
      id: reqId,
      userId: currentUser.id || "",
      username: currentUser.username || "user",
      method: req.method || "easypaisa",
      amount: req.amount || 0,
      txId: req.txId || "",
      senderName: req.senderName || "",
      senderPhone: req.senderPhone || "",
      proofImageUrl: req.proofImageUrl || "",
      status: finalStatus,
      adminNotes: autoNotes || "",
      createdAt: new Date().toISOString()
    };

    try {
      // Save deposit request in Firestore under /deposits/{depositId}
      await setDoc(doc(db, "deposits", reqId), newReq);

      // Send Alert
      if (finalStatus === "PENDING") {
        fetch("/api/deposit/pending-review-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: currentUser.email,
            userName: currentUser.username,
            userId: currentUser.id,
            amount: req.amount,
            method: req.method,
            txId: req.txId,
            depositId: reqId,
            createdAt: newReq.createdAt
          })
        }).catch(err => console.error("Deposit request email failed", err));
      } else {
        if (finalStatus === "APPROVED") {
          fetch("/api/admin/alert/trigger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "new_deposit",
              title: "✅ Auto-Approved Deposit",
              details: `Username: ${currentUser?.username || "Unknown"}\nUser ID: ${currentUser?.id || "Unknown"}\nUser Email: ${currentUser?.email || "N/A"}\n\n--- Deposit Details ---\nAmount: ${req.amount} PKR\nMethod: ${req.method}\nTransaction ID: ${req.txId}\nSender Name: ${req.senderName || "N/A"}\nSender Phone: ${req.senderPhone || "N/A"}\n\n--- Status ---\nStatus: ${finalStatus}\nSystem Note: ${autoNotes || "Awaiting manual verification"}`
            })
          }).catch(err => console.error("Alert trigger failed", err));
        } else if (finalStatus === "ALREADY_PROCESSED") {
          fetch("/api/admin/alert/trigger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "new_deposit",
              title: "⚠️ Duplicate Deposit Attempt",
              details: `Username: ${currentUser?.username || "Unknown"}\nUser ID: ${currentUser?.id || "Unknown"}\nTransaction ID: ${req.txId}\nAmount: ${req.amount} PKR\nStatus: ALREADY PROCESSED`
            })
          }).catch(err => console.error("Alert trigger failed", err));
        }
      }


      if (finalStatus === "APPROVED") {
        let targetUserId = currentUser.id;
        let userRef = doc(db, "users", targetUserId);
        let userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const currentBal = typeof userDoc.data().balance === "number" ? userDoc.data().balance : 0;
          setCurrentUser(prev => prev ? { ...prev, balance: currentBal } : prev);
        }
        const grossAmount = req.amount || 0;
        const feePercent = 2.0;
        const feeAmount = Number((grossAmount * (feePercent / 100)).toFixed(2));
        const netAmount = Number(Math.max(0, grossAmount - feeAmount).toFixed(2));
        toast.success(`🎉 Deposited PKR ${grossAmount.toLocaleString()} (Net: ₨ ${netAmount.toLocaleString()} after ${feePercent}% fee) successfully! Wallet credited instantly.`);
      } else if (finalStatus === "ALREADY_PROCESSED") {
        toast.error("This Transaction ID has already been used and credited.");
      } else {
        toast.success("Deposit request submitted successfully! Pending administrator verification.");
      }
    } catch (err: any) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to add deposit request:: Quota exceeded.");
      } else {
        console.error("Failed to add deposit request::", err);
      }
      toast.error("Failed to process deposit transaction.");
    }
    return reqId;
  };

  
  const handleDeleteDepositInstruction = async (method: string) => {
    try {
      await deleteDoc(doc(db, "deposit_instructions", method));
      toast.success("Deposit provider deleted successfully!");
    } catch (err) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to delete deposit instruction:: Quota exceeded.");
      } else {
        console.error("Failed to delete deposit instruction::", err);
      }
      toast.error("Failed to delete provider.");
      throw err;
    }
  };

  const handleUpdateDepositInstruction = async (
    method: "easypaisa" | "jazzcash" | "nayapay" | "bank" | "crypto" | "redotpay" | string,
    accountTitle: string,
    accountNumber: string,
    instructionsText: string,
    isActive: boolean,
    isHidden?: boolean,
    qrImageUrl?: string,
    gatewayLogoUrl?: string,
    subtitle?: string,
    badges?: string[],
    headerTitle?: string,
    headerTag?: string,
    verificationBadge?: string,
    subAccounts?: { label: string; title: string; number: string }[],
    cryptoAddresses?: any[]
  ) => {
    try {
      const payload: any = {
        accountTitle,
        accountNumber,
        instructions: instructionsText,
        isActive,
        isHidden
      };
      if (qrImageUrl !== undefined) payload.qrImageUrl = qrImageUrl;
      if (gatewayLogoUrl !== undefined) payload.gatewayLogoUrl = gatewayLogoUrl;
      if (subtitle !== undefined) payload.subtitle = subtitle;
      if (badges !== undefined) payload.badges = badges;
      if (headerTitle !== undefined) payload.headerTitle = headerTitle;
      if (headerTag !== undefined) payload.headerTag = headerTag;
      if (verificationBadge !== undefined) payload.verificationBadge = verificationBadge;
      if (subAccounts !== undefined) payload.subAccounts = subAccounts;
      if (cryptoAddresses !== undefined) payload.cryptoAddresses = cryptoAddresses;

      await setDoc(doc(db, "deposit_instructions", method), payload, { merge: true });
      toast.success("Deposit account details updated in real-time!");
    } catch (err) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to update deposit instructions in Firestore:: Quota exceeded.");
      } else {
        console.error("Failed to update deposit instructions in Firestore::", err);
      }
      toast.error("Failed to update deposit instructions.");
      throw err;
    }
  };

  const handleApproveDeposit = async (requestId: string, notes?: string) => {
    if (processingDeposits.has(requestId)) return;
    processingDeposits.add(requestId);
    try {
      const depRef = doc(db, "deposits", requestId);
      const depDoc = await getDoc(depRef);
      if (depDoc.exists()) {
        const req = depDoc.data();
        const currentStatus = (req.status || "").toUpperCase();
        if (currentStatus === "APPROVED") {
          toast.error("Deposit request is already APPROVED.");
          return;
        }

        const isCrypto = ["crypto", "nowpayments", "usdt", "btc", "eth", "bnb", "binance_pay", "redotpay"].includes((req.method || "").toLowerCase()) || (req.method || "").toLowerCase().includes("crypto");
        const feePercent = isCrypto ? 0.5 : 2.0;
        const grossAmount = req.amount || 0;
        const feeAmount = Number((grossAmount * (feePercent / 100)).toFixed(2));
        const netAmount = Number(Math.max(0, grossAmount - feeAmount).toFixed(2));
        const usdTopup = Number((netAmount / cryptoRate).toFixed(2));
        
        let targetUserId = req.userId;
        let userRef = doc(db, "users", targetUserId);
        let userDoc = await getDoc(userRef);

        if (!userDoc.exists() && req.username) {
          const matchedUser = registeredUsers.find(u => 
            u.id === req.userId || 
            (u.username && u.username.toLowerCase() === req.username.toLowerCase()) ||
            (u.email && req.userEmail && u.email.toLowerCase() === req.userEmail.toLowerCase())
          );
          if (matchedUser) {
            targetUserId = matchedUser.id;
            userRef = doc(db, "users", targetUserId);
            userDoc = await getDoc(userRef);
          } else {
            const q = query(collection(db, "users"), where("username", "==", req.username));
            const snap = await getDocs(q);
            if (!snap.empty) {
              targetUserId = snap.docs[0].id;
              userRef = doc(db, "users", targetUserId);
              userDoc = snap.docs[0];
            }
          }
        }

        if (userDoc.exists()) {
          const currentBal = typeof userDoc.data().balance === "number" ? userDoc.data().balance : 0;
          const nextBalance = Number((currentBal + usdTopup).toFixed(2));
          await updateDoc(userRef, { balance: nextBalance });

          // Send professional email & system notification
          sendNotification(
            targetUserId,
            userDoc.data().email || req.userEmail || "",
            userDoc.data().username || req.username || "User",
            "Deposit Approved",
            `₨ ${netAmount.toLocaleString()} PKR credited (Gross: ₨ ${grossAmount.toLocaleString()} PKR, Fee: ${feePercent}%) via ${req.method}`
          );

          if (currentUser && (currentUser.id === targetUserId || (currentUser.username && currentUser.username.toLowerCase() === (req.username || "").toLowerCase()))) {
            setCurrentUser(prev => prev ? { ...prev, balance: nextBalance } : prev);
          }
          
          // Trigger Payment Received Email Alert
          fetch("/api/email/payment-received", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              toEmail: userDoc.data().email || req.userEmail,
              username: userDoc.data().username || req.username,
              amount: grossAmount,
              grossAmount: grossAmount,
              feeAmount: feeAmount,
              netAmount: netAmount,
              method: req.method,
              txId: req.txId
            })
          }).catch(err => console.error("Payment email failed", err));

          // Process Referral Commission for referrer
          processReferralCommission(
            targetUserId,
            netAmount || 0,
            usdTopup,
            req.method || "easypaisa",
            userDoc.data().username || req.username
          ).catch(err => console.error("Referral commission error:", err));

          console.log(`[Deposit Approved] Credited ${usdTopup} units (₨ ${netAmount} net, ₨ ${grossAmount} gross) to ${req.username || req.userId}. New balance: ${nextBalance}`);
        } else {
          console.warn(`[Deposit Approved Warning] User document not found for userId: ${req.userId}, username: ${req.username}`);
        }
        
        // Approve request in Firestore
        await updateDoc(depRef, {
          status: "APPROVED",
          adminNotes: notes || `Payment verified: ₨ ${netAmount.toLocaleString()} credited (${feePercent}% fee).`
        });
        
        toast.success(`Deposit approved! ₨ ${netAmount.toLocaleString()} net credited (${feePercent}% fee deducted) to @${req.username || 'user'}.`);
      } else {
        toast.error("Deposit document not found.");
      }
    } catch (err: any) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to approve deposit:: Quota exceeded.");
      } else {
        console.error("Failed to approve deposit::", err);
      }
      toast.error("Failed to approve deposit.");
    } finally {
      processingDeposits.delete(requestId);
    }
  };

  const handleRejectDeposit = async (requestId: string, notes?: string) => {
    if (processingDeposits.has(requestId)) return;
    processingDeposits.add(requestId);
    try {
      const depRef = doc(db, "deposits", requestId);
      await updateDoc(depRef, {
        status: "REJECTED",
        adminNotes: notes || "Payment details could not be verified."
      });
      toast.success("Deposit request rejected.");
    } catch (err: any) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to reject deposit:: Quota exceeded.");
      } else {
        console.error("Failed to reject deposit::", err);
      }
      toast.error("Failed to reject deposit.");
    } finally {
      processingDeposits.delete(requestId);
    }
  };

  const handleDeleteDeposit = async (requestId: string) => {
    try {
      await deleteDoc(doc(db, "deposits", requestId));
      toast.success("Deposit record deleted from log.");
    } catch (err) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to delete deposit record:: Quota exceeded.");
      } else {
        console.error("Failed to delete deposit record::", err);
      }
      toast.error("Failed to delete deposit record.");
    }
  };

  const handleAddManualDeposit = async (payload: {
    userId?: string;
    username: string;
    method: string;
    amount: number;
    txId: string;
    senderName?: string;
    senderPhone?: string;
    proofImageUrl?: string;
    adminNotes?: string;
    autoCredit?: boolean;
  }) => {
    try {
      let targetUser = registeredUsers.find(u => 
        (payload.userId && u.id === payload.userId) ||
        (u.username && u.username.toLowerCase() === payload.username.toLowerCase()) ||
        (u.email && u.email.toLowerCase() === payload.username.toLowerCase())
      );

      const targetUserId = targetUser ? targetUser.id : (payload.userId || "user_" + Math.random().toString(36).substr(2, 7));
      const targetUsername = targetUser ? targetUser.username : payload.username;

      const reqId = "dep_" + Math.random().toString(36).substr(2, 9);
      const shouldCredit = payload.autoCredit !== false;

      const newReq: DepositRequest = {
        id: reqId,
        userId: targetUserId,
        username: targetUsername,
        method: payload.method || "manual_bank",
        amount: payload.amount,
        txId: payload.txId || ("TX_" + Date.now().toString(36).toUpperCase()),
        senderName: payload.senderName || "Admin Direct Deposit",
        senderPhone: payload.senderPhone || "",
        proofImageUrl: payload.proofImageUrl || "",
        status: shouldCredit ? "APPROVED" : "PENDING",
        adminNotes: payload.adminNotes || (shouldCredit ? "Manually credited by Administrator" : "Pending admin review"),
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "deposits", reqId), newReq);

      if (shouldCredit) {
        const isCrypto = ["crypto", "nowpayments", "usdt", "btc", "eth", "bnb", "binance_pay", "redotpay"].includes((payload.method || "").toLowerCase()) || (payload.method || "").toLowerCase().includes("crypto");
        const feePercent = isCrypto ? 0.5 : 2.0;
        const grossAmount = payload.amount || 0;
        const feeAmount = Number((grossAmount * (feePercent / 100)).toFixed(2));
        const netAmount = Number(Math.max(0, grossAmount - feeAmount).toFixed(2));
        const usdTopup = Number((netAmount / cryptoRate).toFixed(2));
        const userRef = doc(db, "users", targetUserId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const currentBal = typeof userDoc.data().balance === "number" ? userDoc.data().balance : 0;
          const nextBalance = Number((currentBal + usdTopup).toFixed(2));
          await updateDoc(userRef, { balance: nextBalance });
          if (currentUser && (currentUser.id === targetUserId || (currentUser.username && currentUser.username.toLowerCase() === targetUsername.toLowerCase()))) {
            setCurrentUser(prev => prev ? { ...prev, balance: nextBalance } : prev);
          }

          // Process Referral Commission for referrer
          processReferralCommission(
            targetUserId,
            netAmount || 0,
            usdTopup,
            payload.method || "manual_bank",
            targetUsername
          ).catch(err => console.error("Referral commission error:", err));
        }
        toast.success(`🎉 Deposit log created & ₨ ${netAmount.toLocaleString()} PKR credited (Gross: ₨ ${grossAmount.toLocaleString()}, Fee: ${feePercent}%) to @${targetUsername}!`);
      } else {
        toast.success(`Deposit log created for @${targetUsername} (Status: PENDING).`);
      }
    } catch (err: any) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to create manual deposit:: Quota exceeded.");
      } else {
        console.error("Failed to create manual deposit::", err);
      }
      toast.error("Failed to create manual deposit log.");
    }
  };

  const handleUpdateUserBalance = async (userId: string, newBalance: number) => {
    try {
      setCurrentUser(prev => (prev && prev.id === userId) ? { ...prev, balance: newBalance } : prev);
      setRegisteredUsers(prev => prev.map(u => u.id === userId ? { ...u, balance: newBalance } : u));

      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);
      const oldBalance = userDoc.exists() ? (userDoc.data().balance || 0) : 0;
      
      await updateDoc(userRef, { balance: newBalance });
      
      if (newBalance > oldBalance) {
        const added = newBalance - oldBalance;
        const userData = userDoc.data();
        if (userData) {
          sendNotification(
            userId,
            userData.email || "",
            userData.username || "User",
            "Manual Credit",
            `${added.toFixed(2)}`
          );
        }
      }
    } catch (err: any) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to update user balance:: Quota exceeded.");
      } else {
        console.error("Failed to update user balance::", err);
      }
      toast.error("Failed to update user balance.");
    }
  };

  // Filter orders by logged-in user to keep order histories personal and private!
  const userOrdersList = currentUser 
    ? orders.filter(o => o.userId === currentUser.id)
    : [];

  return (
    <div id="app-root" className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased pb-12">
      {/* Header Banner - Designed as per Sleek Interface navbar */}
      <header id="app-header" className="h-14 sm:h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 flex items-center justify-between px-3 sm:px-8 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.02)] shrink-0 transition-all">
        <div className="flex items-center gap-3 sm:gap-6">
          <div 
            onClick={handleLogoClick} 
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group"
            title="Return to Home / Store"
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shrink-0">
              {siteLogoUrl ? (
                <img src={siteLogoUrl} alt="Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-xl" />
              ) : (
                <ZXLogo size={42} withBackground={false} interactive={true} />
              )}
            </div>
            <div className="flex flex-col leading-none justify-center">
              <span className="text-sm sm:text-base font-black tracking-tight text-slate-900 uppercase leading-none">
                {siteTitle || "ZEROX NETWORK"}
              </span>
              <span className="text-[8px] sm:text-[9px] font-black tracking-widest text-slate-400 font-mono mt-0.5 leading-none hidden sm:inline uppercase">
                {siteTagline || "NETWORK"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {currentUser ? (
            <div id="system-status-time" className="flex items-center gap-1.5 sm:gap-3">
              {/* Real-time Account Balance (compact & shadowless minimal pill) */}
              <button
                type="button"
                onClick={() => handleTabChange("wallet")}
                className="bg-slate-100/70 hover:bg-slate-200/60 rounded-full px-2.5 py-1 flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer group outline-none shrink-0"
                title="Click to view wallet and add funds"
              >
                <div className="w-5.5 h-5.5 rounded-full bg-gradient-to-tr from-[#00AEEF] to-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Wallet className="h-3 w-3" />
                </div>
                <div className="flex flex-col text-left justify-center leading-none">
                  <span className="text-[11px] sm:text-xs font-black text-slate-900 tracking-tight whitespace-nowrap">
                    {formatPrice(currentUser.balance)}
                  </span>
                  <span className="text-[8.5px] sm:text-[9px] font-bold text-emerald-600 mt-0.5 tracking-tight font-mono whitespace-nowrap">
                    ${(currentUser.balance ).toFixed(2)} USD
                  </span>
                </div>
              </button>

              {/* Username with Avatar & profile management */}
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setShowProfilePopover(!showProfilePopover)}
                  className="relative group flex items-center gap-2 bg-white/95 hover:bg-slate-50 border border-slate-200/80 hover:border-blue-300 transition-all p-1 pl-1.5 pr-2.5 rounded-full text-xs font-bold text-slate-700 outline-none cursor-pointer h-9.5 shadow-2xs hover:shadow-xs"
                  title="Account Settings & Profile Menu"
                >
                  {/* Rotating Arrow Circle around Profile Avatar */}
                  <div className="relative w-7.5 h-7.5 flex items-center justify-center shrink-0">
                    {/* Rotating Ring Track with Single Orbiting Arrow */}
                    <div className="absolute inset-0 rounded-full border border-emerald-500/20 border-t-blue-500 border-r-emerald-500 animate-[spin_3.5s_linear_infinite] pointer-events-none">
                      {/* Single Green/Blue Arrow Head orbiting around avatar */}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 transform text-emerald-500">
                        <ChevronRight className="w-2.5 h-2.5 text-emerald-500 fill-emerald-500/40 rotate-90 drop-shadow-[0_0_3px_rgba(16,185,129,0.8)]" />
                      </div>
                    </div>

                    {/* Profile Avatar */}
                    <img 
                      src={currentUser.avatarUrl || "https://cdn.phototourl.com/member/2026-07-24-b4f94510-1a75-430c-9101-a1527cb13f05.png"} 
                      alt="Profile" 
                      className="h-6 w-6 rounded-full object-cover bg-white relative z-10 border border-slate-100 shadow-2xs" 
                    />

                    {/* Admin Account Indicator Badge on Avatar */}
                    {userAdminInfo?.isAdmin && (
                      <div className="absolute -top-0.5 -right-0.5 bg-amber-500 text-slate-950 rounded-full w-3.5 h-3.5 flex items-center justify-center border border-white z-20 shadow-2xs" title="Super Admin Account">
                        <ShieldCheck className="w-2.5 h-2.5 text-slate-950 fill-slate-950 shrink-0" />
                      </div>
                    )}
                  </div>

                  {/* Dropdown Chevron Indicator */}
                  <ChevronDown className={`h-3.5 w-3.5 text-[#00AEEF] neon-arrow-bounce transition-transform duration-200 ${showProfilePopover ? "rotate-180" : ""}`} />
                </button>
              </div>

              {/* Admin Portal Launcher Button (Only for Admins) - Positioned on far right */}
              {userAdminInfo?.isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsAdminOpen(true)}
                  className={userAdminInfo.isSupreme 
                    ? "bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 border border-yellow-300 rounded-full px-3 py-1.5 flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-amber-500/25 text-xs font-black uppercase tracking-wider active:scale-95 shrink-0 animate-pulse"
                    : "bg-slate-950 hover:bg-slate-900 text-amber-300 border border-amber-400/50 rounded-full px-2.5 py-1.5 sm:px-3 sm:py-1.5 flex items-center gap-1.5 transition-all cursor-pointer shadow-md text-xs font-black uppercase tracking-wider active:scale-95 shrink-0"
                  }
                  title={userAdminInfo.isSupreme ? "Open Admin Portal (Primary Supreme Super Admin - Root Authority)" : `Open Admin Portal (${userAdminInfo.role})`}
                >
                  <ShieldCheck className={`w-4 h-4 shrink-0 ${userAdminInfo.isSupreme ? "text-slate-950" : "text-amber-400"}`} />
                  <span className="hidden sm:inline">{userAdminInfo.isSupreme ? "Supreme Admin" : "Admin Portal"}</span>
                </button>
              )}
            </div>
          ) : (
            <div id="system-status-time" className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                id="onboarding-login-btn"
                onClick={() => setShowAuthModal(true)}
                className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2 rounded-xl shadow-md transition-all h-9 flex items-center justify-center cursor-pointer gap-1.5 hover:shadow-blue-500/20 active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5" />
                Login / Register
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Top Announcement Marquee */}
      
      {/* Dynamic Offer Banner */}
      {announcements.filter(a => a.isActive && a.isOffer && (!a.offerEndTime || new Date(a.offerEndTime).getTime() > Date.now())).map((offer, idx) => (
        <div key={offer.id} className="bg-indigo-600 text-white relative z-40 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 shadow-md border-b border-indigo-700/50">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-50" />
          <div className="relative z-10 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-300">Limited Time Offer</span>
          </div>
          <div className="relative z-10 text-center sm:text-left flex-1 max-w-2xl">
            <span className="text-sm font-bold mr-2">{offer.title}:</span>
            <span className="text-xs sm:text-sm text-indigo-100">{offer.content}</span>
            {offer.linkUrl && (
              <a href={offer.linkUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-xs font-bold bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition whitespace-nowrap">
                Claim Now
              </a>
            )}
          </div>
          {offer.offerEndTime && (
            <div className="relative z-10 flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full shrink-0">
              <Clock className="w-3.5 h-3.5 text-indigo-200" />
              <span className="text-xs font-bold text-indigo-100">
                Ends {new Date(offer.offerEndTime).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          )}
        </div>
      ))}

      {/* Top Announcement Marquee */}
      {(() => {
        const activeTickerAnnouncements = announcements.filter(a => a.isActive && !a.isOffer);
        if (activeTickerAnnouncements.length === 0) return null;
        
        // Repeat array 3 times for continuous seamless -33.333% infinite marquee looping
        const tickerItems = [...activeTickerAnnouncements, ...activeTickerAnnouncements, ...activeTickerAnnouncements];
        
        return (
          <div className="bg-slate-900 text-slate-200 border-b border-slate-800 relative z-40 flex items-center justify-center h-8 sm:h-9">
            <div className="flex items-center gap-2 sm:gap-3 px-4 w-full max-w-7xl overflow-hidden">
              <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0 relative">
                <span className="animate-ping absolute inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-widest uppercase text-slate-400 shrink-0">UPDATE</span>
              
              <div className="flex-1 overflow-hidden relative">
                <div className="animate-marquee whitespace-nowrap text-[10px] sm:text-xs flex items-center">
                  {tickerItems.map((a, idx) => (
                    <span key={`${a.id}-${idx}`} className="mr-8 sm:mr-12 inline-flex items-center shrink-0">
                      <span className="font-semibold text-white mr-1.5">{a.title}</span> 
                      <span className="text-slate-300">{a.content ? a.content.replace(/\s+/g, ' ') : ''}</span>
                      {a.linkUrl && (
                        <a href={sanitizeUrl(a.linkUrl)} target="_blank" rel="noopener noreferrer" className="underline decoration-slate-600 text-slate-300 ml-2 hover:text-white transition">
                          Details
                        </a>
                      )}
                      <span className="ml-8 sm:ml-12 text-slate-700">•</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Hero Banner Section */}
      {showSiteCover && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-3.5 sm:p-4 shadow-md transition-all duration-300 relative overflow-hidden">
            {siteCoverUrl && (
              <img src={siteCoverUrl} alt="Cover" className="absolute inset-0 w-full h-full object-cover opacity-15 pointer-events-none rounded-2xl mix-blend-overlay" />
            )}
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-blue-500/15 text-[#00AEEF] border border-blue-500/20 shrink-0">
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5 animate-[spin_6s_linear_infinite]" />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate font-sans">
                    {siteCoverTitle || "Welcome to Zerox Network"}
                  </h1>
                  {siteCoverSubtitle && (
                    <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#00AEEF]/15 text-[#00AEEF] border border-[#00AEEF]/30 uppercase tracking-wider shrink-0 w-fit">
                      <Sparkles className="w-3 h-3 fill-[#00AEEF] shrink-0" />
                      <span>{siteCoverSubtitle}</span>
                    </span>
                  )}
                </div>
              </div>
              {!currentUser && (
                <button 
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#00AEEF] hover:bg-[#0090C5] text-white transition-all text-xs font-semibold shrink-0 cursor-pointer shadow-md"
                >
                  <span className="hidden sm:inline">Get Started</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 mt-6 space-y-6">
        
        {/* Navigation Tabs Bar */}
        <div className="relative bg-[#f8fafc] rounded-2xl p-2 sm:p-3 border border-slate-200/60 transition-all max-w-7xl mx-auto">
          {/* Scrollable Track */}
          <div 
            ref={tabBarRef}
            className="flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:gap-6 lg:gap-8 snap-x snap-mandatory touch-pan-x py-0.5 justify-start md:justify-center"
          >
            {/* Store Tab */}
            {!isTabHidden("store") && (
              <button
                id="tab-store"
                onClick={() => handleTabChange("store")}
                className={`w-1/3 md:w-auto shrink-0 flex-none md:flex-initial snap-start flex flex-col items-center justify-center gap-0.5 px-1 md:px-3 py-1 transition-all duration-200 cursor-pointer group ${
                  activeTab === "store"
                    ? "text-[#00AEEF] font-extrabold"
                    : "text-slate-500 hover:text-[#00AEEF] font-semibold"
                }`}
              >
                <Store className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${activeTab === "store" ? "text-[#00AEEF] scale-110" : "text-slate-400 group-hover:text-[#00AEEF]"}`} />
                <span className="text-[11px] sm:text-xs whitespace-nowrap">Virtual Numbers</span>
              </button>
            )}


            {/* SMM Panel Tab */}
            {!isTabHidden("smm") && (
              <button
                id="tab-smm"
                onClick={() => handleTabChange("smm")}
                className={`w-1/3 md:w-auto shrink-0 flex-none md:flex-initial snap-start flex flex-col items-center justify-center gap-0.5 px-1 md:px-3 py-1 transition-all duration-200 cursor-pointer group ${
                  activeTab === "smm"
                    ? "text-[#00AEEF] font-extrabold"
                    : "text-slate-500 hover:text-[#00AEEF] font-semibold"
                }`}
              >
                <Globe className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${activeTab === "smm" ? "text-[#00AEEF] scale-110" : "text-slate-400 group-hover:text-[#00AEEF]"}`} />
                <span className="text-[11px] sm:text-xs whitespace-nowrap">SMM Services</span>
              </button>
            )}

            {/* Subscriptions Tab */}
            {!isTabHidden("subscriptions") && (
              <button
                id="tab-subscriptions"
                onClick={() => handleTabChange("subscriptions")}
                className={`w-1/3 md:w-auto shrink-0 flex-none md:flex-initial snap-start flex flex-col items-center justify-center gap-0.5 px-1 md:px-3 py-1 transition-all duration-200 cursor-pointer group ${
                  activeTab === "subscriptions"
                    ? "text-[#00AEEF] font-extrabold"
                    : "text-slate-500 hover:text-[#00AEEF] font-semibold"
                }`}
              >
                <Crown className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${activeTab === "subscriptions" ? "text-[#00AEEF] scale-110" : "text-slate-400 group-hover:text-[#00AEEF]"}`} />
                <span className="text-[11px] sm:text-xs whitespace-nowrap">Subscriptions</span>
              </button>
            )}

            {/* Affiliate & Referrals Tab */}
            {!isTabHidden("affiliate") && (
              <button
                id="tab-affiliate"
                onClick={() => handleTabChange("affiliate")}
                className={`w-1/3 md:w-auto shrink-0 flex-none md:flex-initial snap-start flex flex-col items-center justify-center gap-0.5 px-1 md:px-3 py-1 transition-all duration-200 cursor-pointer group ${
                  activeTab === "affiliate"
                    ? "text-[#00AEEF] font-extrabold"
                    : "text-slate-500 hover:text-[#00AEEF] font-semibold"
                }`}
              >
                <Users className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${activeTab === "affiliate" ? "text-[#00AEEF] scale-110" : "text-slate-400 group-hover:text-[#00AEEF]"}`} />
                <span className="text-[11px] sm:text-xs whitespace-nowrap">Affiliate</span>
              </button>
            )}

            {/* Dashboard Tab */}
            {!isTabHidden("dashboard") && (
              <button
                id="tab-dashboard"
                onClick={() => handleTabChange("dashboard")}
                className={`w-1/3 md:w-auto shrink-0 flex-none md:flex-initial snap-start flex flex-col items-center justify-center gap-0.5 px-1 md:px-3 py-1 transition-all duration-200 cursor-pointer group ${
                  activeTab === "dashboard"
                    ? "text-[#00AEEF] font-extrabold"
                    : "text-slate-500 hover:text-[#00AEEF] font-semibold"
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${activeTab === "dashboard" ? "text-[#00AEEF] scale-110" : "text-slate-400 group-hover:text-[#00AEEF]"}`} />
                <span className="text-[11px] sm:text-xs whitespace-nowrap">Dashboard</span>
              </button>
            )}

            {/* Wallet Tab */}
            {!isTabHidden("wallet") && (
              <button
                id="tab-wallet"
                onClick={() => handleTabChange("wallet")}
                className={`w-1/3 md:w-auto shrink-0 flex-none md:flex-initial snap-start flex flex-col items-center justify-center gap-0.5 px-1 md:px-3 py-1 transition-all duration-200 cursor-pointer group ${
                  activeTab === "wallet"
                    ? "text-[#00AEEF] font-extrabold"
                    : "text-slate-500 hover:text-[#00AEEF] font-semibold"
                }`}
              >
                <Wallet className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${activeTab === "wallet" ? "text-[#00AEEF] scale-110" : "text-slate-400 group-hover:text-[#00AEEF]"}`} />
                <span className="text-[11px] sm:text-xs whitespace-nowrap">Wallet</span>
              </button>
            )}

            {/* Seller Tab */}
            {!isTabHidden("seller") && (
              <button
                onClick={() => handleTabChange("seller")}
                className={`w-1/3 md:w-auto shrink-0 flex-none md:flex-initial snap-start flex flex-col items-center justify-center gap-0.5 px-1 md:px-3 py-1 transition-all duration-200 cursor-pointer group ${
                  activeTab === "seller"
                    ? "text-[#00AEEF] font-extrabold"
                    : "text-slate-500 hover:text-[#00AEEF] font-semibold"
                }`}
              >
                <Briefcase className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${activeTab === "seller" ? "text-[#00AEEF] scale-110" : "text-slate-400 group-hover:text-[#00AEEF]"}`} />
                <span className="text-[11px] sm:text-xs whitespace-nowrap">Seller</span>
              </button>
            )}

            {/* API Docs Tab */}
            {!isTabHidden("api") && (
              <button
                onClick={() => handleTabChange("api")}
                className={`w-1/3 md:w-auto shrink-0 flex-none md:flex-initial snap-start flex flex-col items-center justify-center gap-0.5 px-1 md:px-3 py-1 transition-all duration-200 cursor-pointer group ${
                  activeTab === "api"
                    ? "text-[#00AEEF] font-extrabold"
                    : "text-slate-500 hover:text-[#00AEEF] font-semibold"
                }`}
              >
                <Code2 className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${activeTab === "api" ? "text-[#00AEEF] scale-110" : "text-slate-400 group-hover:text-[#00AEEF]"}`} />
                <span className="text-[11px] sm:text-xs whitespace-nowrap">API Docs</span>
              </button>
            )}

            {/* Tickets Tab */}
            {!isTabHidden("tickets") && (
              <button
                id="tab-tickets"
                onClick={() => handleTabChange("tickets")}
                className={`w-1/3 md:w-auto shrink-0 flex-none md:flex-initial snap-start flex flex-col items-center justify-center gap-0.5 px-1 md:px-3 py-1 transition-all duration-200 cursor-pointer group ${
                  activeTab === "tickets"
                    ? "text-[#00AEEF] font-extrabold"
                    : "text-slate-500 hover:text-[#00AEEF] font-semibold"
                }`}
              >
                <Ticket className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${activeTab === "tickets" ? "text-[#00AEEF] scale-110" : "text-slate-400 group-hover:text-[#00AEEF]"}`} />
                <span className="text-[11px] sm:text-xs whitespace-nowrap">Support</span>
              </button>
            )}

            {/* About Tab */}
            {!isTabHidden("about") && (
              <button
                onClick={() => handleTabChange("about")}
                className={`w-1/3 md:w-auto shrink-0 flex-none md:flex-initial snap-start flex flex-col items-center justify-center gap-0.5 px-1 md:px-3 py-1 transition-all duration-200 cursor-pointer group ${
                  activeTab === "about"
                    ? "text-[#00AEEF] font-extrabold"
                    : "text-slate-500 hover:text-[#00AEEF] font-semibold"
                }`}
              >
                <Info className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${activeTab === "about" ? "text-[#00AEEF] scale-110" : "text-slate-400 group-hover:text-[#00AEEF]"}`} />
                <span className="text-[11px] sm:text-xs whitespace-nowrap">About</span>
              </button>
            )}

            {/* Reviews Tab */}
            {!isTabHidden("reviews") && (
              <button
                onClick={() => handleTabChange("reviews")}
                className={`w-1/3 md:w-auto shrink-0 flex-none md:flex-initial snap-start flex flex-col items-center justify-center gap-0.5 px-1 md:px-3 py-1 transition-all duration-200 cursor-pointer group ${
                  activeTab === "reviews"
                    ? "text-[#00AEEF] font-extrabold"
                    : "text-slate-500 hover:text-[#00AEEF] font-semibold"
                }`}
              >
                <Star className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${activeTab === "reviews" ? "text-amber-500 fill-amber-400 scale-110" : "text-slate-400 group-hover:text-[#00AEEF]"}`} />
                <span className="text-[11px] sm:text-xs whitespace-nowrap">Reviews</span>
              </button>
            )}

            {/* Privacy Policy Tab */}
            {!isTabHidden("privacy") && (
              <button
                onClick={() => handleTabChange("privacy")}
                className={`w-1/3 md:w-auto shrink-0 flex-none md:flex-initial snap-start flex flex-col items-center justify-center gap-0.5 px-1 md:px-3 py-1 transition-all duration-200 cursor-pointer group ${
                  activeTab === "privacy"
                    ? "text-[#00AEEF] font-extrabold"
                    : "text-slate-500 hover:text-[#00AEEF] font-semibold"
                }`}
              >
                <ShieldCheck className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-transform duration-200 ${activeTab === "privacy" ? "text-[#00AEEF] scale-110" : "text-slate-400 group-hover:text-[#00AEEF]"}`} />
                <span className="text-[11px] sm:text-xs whitespace-nowrap">Privacy</span>
              </button>
            )}
          </div>

          {/* Bottom Scroll Indicator strictly for mobile screens - auto hides when user scrolls */}
          {canScrollRight && !hasUserScrolledTabs && (
            <div className="flex md:hidden items-center justify-center gap-1.5 text-[10px] font-black tracking-[0.18em] text-slate-400/90 uppercase pt-2 pb-0.5 select-none transition-opacity duration-300">
              <span>SCROLL FOR MORE OPTIONS</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#00AEEF]" />
            </div>
          )}
        </div>

        {activeTab === "store" && !isTabHidden("store") && (
          tabMaintenance["store"]?.maintenance && sessionStorage.getItem("zerox_admin_logged") !== "true" ? (
            <TabMaintenanceView tabId="store" tabLabel="Virtual Numbers" notes={tabMaintenance["store"]?.notes} />
          ) : (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
                {/* Curated Catalog Selection Section */}
                <div id="catalog-section" className="space-y-6">
                  {/* Sleek Modern Header with 1-Line & Responsive Flow + Collapsible Process Guide */}
                  <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/98 to-slate-950 border border-slate-800/80 text-white rounded-2xl p-3.5 sm:p-4 md:p-5 shadow-xl transition-all duration-300">
                    {/* Ambient Glows */}
                    <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#00AEEF]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10">
                      {/* Responsive Top Bar */}
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4">
                        {/* Left Group: Icon + Title + Badges & CTA */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-3.5 min-w-0">
                          {/* Title & Icon */}
                          <div className="flex items-center justify-between sm:justify-start gap-2.5 min-w-0">
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

                            {/* Mobile-only Guide Toggle Button on top right */}
                            <button
                              type="button"
                              onClick={() => setIsCatalogGuideMinimized(!isCatalogGuideMinimized)}
                              className="sm:hidden flex items-center justify-center p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/70 active:scale-95 transition-all text-xs font-semibold shrink-0 cursor-pointer"
                              title={isCatalogGuideMinimized ? "Expand process guide" : "Minimize process guide"}
                              aria-label="Toggle Guide"
                            >
                              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCatalogGuideMinimized ? "" : "rotate-180 text-[#00AEEF]"}`} />
                            </button>
                          </div>

                          {/* Badges & Actions Row (Stacked cleanly on mobile, inline on tablet/desktop) */}
                          <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t border-slate-800/60 sm:border-0 flex-wrap sm:flex-nowrap">
                            {/* Instant Allocation Live Badge */}
                            <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-extrabold bg-[#00AEEF]/10 text-[#00AEEF] border border-[#00AEEF]/30 shadow-[0_0_12px_rgba(0,174,239,0.15)] uppercase tracking-wider select-none shrink-0">
                              <Zap className="w-3 h-3 fill-[#00AEEF] text-[#00AEEF] animate-pulse shrink-0" />
                              <span className="whitespace-nowrap">Instant Allocation</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-0.5 hidden xs:inline-block" />
                            </div>

                            {/* Tutorial Trigger Button & First-Time User Hint */}
                            <div className="relative inline-flex items-center shrink-0">
                              <button
                                id="how-to-order-btn"
                                type="button"
                                onClick={handleStartOrderTutorial}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-blue-600/25 via-[#00AEEF]/20 to-blue-500/25 hover:from-blue-600/40 hover:to-[#00AEEF]/40 text-white border border-[#00AEEF]/40 hover:border-[#00AEEF] shadow-[0_0_12px_rgba(0,174,239,0.2)] hover:shadow-[0_0_18px_rgba(0,174,239,0.35)] transition-all cursor-pointer active:scale-95 group shrink-0"
                                title="Automatic Demo: How to Order a Virtual Number"
                              >
                                <div className="w-4 h-4 rounded-full bg-[#00AEEF]/25 group-hover:bg-[#00AEEF] text-[#00AEEF] group-hover:text-slate-950 flex items-center justify-center transition-colors">
                                  <Play className="w-2.5 h-2.5 fill-current ml-0.5 transition-transform group-hover:scale-110" />
                                </div>
                                <span className="whitespace-nowrap font-bold tracking-tight">How to Order</span>
                              </button>

                              {/* Subtle First-Time User Hint (Shows only once) */}
                              {showOrderTutorialHint && (
                                <div className="absolute top-full left-0 mt-2 z-30 bg-gradient-to-r from-blue-600 via-[#00AEEF] to-cyan-500 text-white text-[10.5px] font-bold px-3 py-1.5 rounded-xl shadow-2xl border border-blue-300/50 flex items-center gap-2 whitespace-nowrap animate-bounce">
                                  <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                                  <button
                                    type="button"
                                    onClick={handleStartOrderTutorial}
                                    className="cursor-pointer hover:underline text-white font-bold"
                                  >
                                    Watch Virtual Number Demo ▶
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleDismissOrderTutorialHint}
                                    className="p-1 hover:bg-black/20 rounded-md text-blue-100 hover:text-white cursor-pointer ml-1 transition-colors"
                                    title="Dismiss hint"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Desktop-only Guide Toggle Button on Right */}
                        <button
                          type="button"
                          onClick={() => setIsCatalogGuideMinimized(!isCatalogGuideMinimized)}
                          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-xs font-semibold shrink-0 cursor-pointer active:scale-95"
                          title={isCatalogGuideMinimized ? "Expand process guide" : "Minimize process guide"}
                        >
                          <span className="text-[11px] text-slate-300">
                            {isCatalogGuideMinimized ? "3-Step Guide" : "Hide Guide"}
                          </span>
                          <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isCatalogGuideMinimized ? "" : "rotate-180 text-[#00AEEF]"}`} />
                        </button>
                      </div>

                      {/* Expandable Process Guide & Steps (Collapsible) */}
                      {!isCatalogGuideMinimized && (
                        <div className="mt-3.5 pt-3.5 border-t border-slate-800/80">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
                            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-2.5 flex items-start gap-2.5">
                              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-500/20 text-[#00AEEF] text-xs font-extrabold shrink-0">
                                01
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-white">Select Country</h4>
                                <p className="text-[10px] text-slate-400">150+ international origins with instant stock</p>
                              </div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-2.5 flex items-start gap-2.5">
                              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-500/20 text-[#00AEEF] text-xs font-extrabold shrink-0">
                                02
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-white">Choose Service</h4>
                                <p className="text-[10px] text-slate-400">WhatsApp, Telegram, OpenAI, Google & 500+ apps</p>
                              </div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-2.5 flex items-start gap-2.5">
                              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-extrabold shrink-0">
                                03
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-white">Receive Instant SMS</h4>
                                <p className="text-[10px] text-slate-400">Real-time OTP live stream with instant copy</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 bg-slate-800/30 rounded-lg px-3 py-1.5">
                            <span>Ready to start? Select your country below or run the automated demo.</span>
                            <button
                              type="button"
                              onClick={handleStartOrderTutorial}
                              className="text-[#00AEEF] hover:text-white font-bold inline-flex items-center gap-1 cursor-pointer hover:underline shrink-0"
                            >
                              Launch Demo <Play className="w-2.5 h-2.5 fill-current" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <CatalogSelector
                    apiKey={apiKey}
                    onBuyNumber={handleBuyNumber}
                    isBuying={isBuying}
                    disabledServices={disabledServices}
                    customPrices={customPrices}
                    priceMarkupPercent={priceMarkupPercent}
                    virtualNumberMinimumPricePKR={virtualNumberMinimumPricePKR}
                    cryptoRate={cryptoRate}
                    customServices={customServices}
                    formatPrice={formatPrice}
                  />
                </div>

                {/* Activation History for Virtual Numbers */}
                <div id="orders-history-wrapper" className="pt-2">
                  <OrdersHistory cryptoRate={cryptoRate}
                    orders={userOrdersList}
                    onClearHistory={handleClearHistory}
                    onBuyAgain={handleBuyAgain}
                    formatPrice={formatPrice}
                    currentUser={currentUser}
                    onViewDetails={(order) => {
                      setSelectedOrderId(order.id);
                      try {
                        window.history.pushState(null, "", `/orders/${order.id}`);
                      } catch (e) {}
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              </div>
            )
          )}

        {activeTab === "smm" && !isTabHidden("smm") && (
          tabMaintenance["smm"]?.maintenance && sessionStorage.getItem("zerox_admin_logged") !== "true" ? (
            <TabMaintenanceView tabId="smm" tabLabel="SMM Services" notes={tabMaintenance["smm"]?.notes} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SmmClientStore cryptoRate={cryptoRate}
                smmCoverUrl={smmCoverUrl}
                currentUser={currentUser}
                smmProviders={smmProviders}
                smmCategories={smmCategories}
                smmServices={smmServices}
                smmOrders={smmOrders}
                setSmmOrders={handleUpdateSmmOrders}
                smmLogs={smmLogs}
                setSmmLogs={handleUpdateSmmLogs}
                onUpdateUserBalance={handleUpdateUserBalance}
                setActiveTab={handleTabChange}
                formatPrice={formatPrice}
                onInsufficientBalance={(neededPkr, neededUsd, userBalancePkr, serviceName) => {
                  setInsufficientBalanceInfo({
                    neededPkr,
                    neededUsd,
                    userBalancePkr,
                    serviceName,
                    tabName: "smm"
                  });
                }}
              />
            </div>
          )
        )}

        {activeTab === "subscriptions" && !isTabHidden("subscriptions") && (
          tabMaintenance["subscriptions"]?.maintenance && sessionStorage.getItem("zerox_admin_logged") !== "true" ? (
            <TabMaintenanceView tabId="subscriptions" tabLabel="Subscriptions" notes={tabMaintenance["subscriptions"]?.notes} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SubscriptionsClientStore cryptoRate={cryptoRate} 
                currentUser={currentUser} 
                onUpdateUserBalance={handleUpdateUserBalance} 
                coverUrl={subscriptionsCoverUrl}
                formatPrice={formatPrice}
              />
            </div>
          )
        )}

        {activeTab === "dashboard" && !isTabHidden("dashboard") && (
          tabMaintenance["dashboard"]?.maintenance && sessionStorage.getItem("zerox_admin_logged") !== "true" ? (
            <TabMaintenanceView tabId="dashboard" tabLabel="Dashboard" notes={tabMaintenance["dashboard"]?.notes} />
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Dashboard statistics */}
              <div id="dashboard-stats-wrapper">
                <DashboardStats
                  profile={currentUser ? { id: currentUser.id, email: currentUser.email, balance: currentUser.balance, rating: 5, frozen: 0, referralCode: (currentUser as any).referralCode } : null}
                  activeCount={userOrdersList.filter(o => o.status === "PENDING" || o.status === "RECEIVED").length}
                  completedCount={userOrdersList.filter(o => o.status === "FINISHED" || o.status === "CANCELED" || o.status === "BANNED").length}
                  onOpenSettings={() => {
                    setIsAdminOpen(true);
                  }}
                  formatPrice={formatPrice}
                />
              </div>

              {/* Real-time System Activity Feed */}
              <div id="activity-feed-wrapper">
                <ActivityFeed />
              </div>

              {/* Live Visitor Analytics Session Tracker */}
              <AnalyticsTracker currentUser={currentUser} activeTab={activeTab} />

              {/* Provider Auto-Sync & Order Tracking Engine */}
              <div id="order-tracking-sync-wrapper">
                <OrderTrackingSync
                  currentUser={currentUser}
                  smmOrders={smmOrders}
                  setSmmOrders={handleUpdateSmmOrders}
                  smmProviders={smmProviders}
                  activationOrders={userOrdersList}
                />
              </div>
            </div>
          )
        )}

        {activeTab === "wallet" && !isTabHidden("wallet") && (
          tabMaintenance["wallet"]?.maintenance && sessionStorage.getItem("zerox_admin_logged") !== "true" ? (
            <TabMaintenanceView tabId="wallet" tabLabel="Wallet" notes={tabMaintenance["wallet"]?.notes} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-6xl mx-auto px-2 sm:px-0">
              <CashDeposit
                depositCoverUrl={depositCoverUrl}
                currentUser={currentUser}
                instructions={depositInstructions}
                onAddDepositRequest={handleAddDepositRequest}
                depositHistory={depositRequests}
                cryptoRate={cryptoRate}
                cryptoMinDeposit={cryptoMinDeposit}
                cryptoGatewaySettings={cryptoGatewaySettings}
                localMinDeposit={localMinDeposit}
                formatPrice={formatPrice}
              />
            </div>
          )
        )}

        {activeTab === "seller" && !isTabHidden("seller") && (
          tabMaintenance["seller"]?.maintenance && sessionStorage.getItem("zerox_admin_logged") !== "true" ? (
            <TabMaintenanceView tabId="seller" tabLabel="Seller" notes={tabMaintenance["seller"]?.notes} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SellerPortal coverUrl={sellerCoverUrl} />
            </div>
          )
        )}

        
        {activeTab === "api" && !isTabHidden("api") && (
          tabMaintenance["api"]?.maintenance && sessionStorage.getItem("zerox_admin_logged") !== "true" ? (
            <TabMaintenanceView tabId="api" tabLabel="API Docs" notes={tabMaintenance["api"]?.notes} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ApiDocs currentUser={currentUser} setActiveTab={handleTabChange} />
            </div>
          )
        )}

        {activeTab === "tickets" && !isTabHidden("tickets") && (
          tabMaintenance["tickets"]?.maintenance && sessionStorage.getItem("zerox_admin_logged") !== "true" ? (
            <TabMaintenanceView tabId="tickets" tabLabel="Support Tickets" notes={tabMaintenance["tickets"]?.notes} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="max-w-4xl mx-auto">
                <Tickets currentUser={currentUser} />
              </div>
            </div>
          )
        )}

        {activeTab === "about" && !isTabHidden("about") && (
          tabMaintenance["about"]?.maintenance && sessionStorage.getItem("zerox_admin_logged") !== "true" ? (
            <TabMaintenanceView tabId="about" tabLabel="About Updates" notes={tabMaintenance["about"]?.notes} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <AboutPortal />
            </div>
          )
        )}

        {activeTab === "reviews" && !isTabHidden("reviews") && (
          tabMaintenance["reviews"]?.maintenance && sessionStorage.getItem("zerox_admin_logged") !== "true" ? (
            <TabMaintenanceView tabId="reviews" tabLabel="Customer Reviews" notes={tabMaintenance["reviews"]?.notes} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ReviewsPortal currentUser={currentUser} onNavigateToTab={handleTabChange} coverUrl={reviewsCoverUrl} />
            </div>
          )
        )}



        {activeTab === "affiliate" && !isTabHidden("affiliate") && (
          tabMaintenance["affiliate"]?.maintenance && sessionStorage.getItem("zerox_admin_logged") !== "true" ? (
            <TabMaintenanceView tabId="affiliate" tabLabel="Affiliate & Referrals" notes={tabMaintenance["affiliate"]?.notes} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <ReferralAffiliateStore cryptoRate={cryptoRate} currentUser={currentUser} onNavigateToTab={handleTabChange} formatPrice={formatPrice} />
            </div>
          )
        )}

        {activeTab === "privacy" && !isTabHidden("privacy") && (
          tabMaintenance["privacy"]?.maintenance && sessionStorage.getItem("zerox_admin_logged") !== "true" ? (
            <TabMaintenanceView tabId="privacy" tabLabel="Privacy Policy" notes={tabMaintenance["privacy"]?.notes} />
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <PrivacyPolicyPortal coverUrl={privacyCoverUrl} />
            </div>
          )
        )}

      
      {/* Global Announcements Footer */}
      <PlatformUpdates announcements={announcements} />

      {/* Website Footer with Collapsible Navigation */}
      <footer className="mt-5 bg-white border-t border-slate-200/80 pt-6 pb-6 text-slate-600 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          
          {/* Top Header Bar & Arrow Toggle Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="font-black text-slate-900 text-sm sm:text-base tracking-tight uppercase">ZEROX NETWORK</span>
              <p className="hidden md:block text-xs text-slate-400 font-medium">
                Pakistan's #1 digital platform for virtual SMS, SMM, and subscriptions
              </p>
            </div>

            {/* Toggle Arrow Button */}
            <button
              type="button"
              onClick={() => setIsFooterExpanded(!isFooterExpanded)}
              aria-expanded={isFooterExpanded}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <span>{isFooterExpanded ? "Hide Details" : "Show Details"}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isFooterExpanded ? "rotate-180 text-[#00AEEF]" : "text-slate-400"}`} />
            </button>
          </div>

          {/* Always-Visible Minimal Animated Social Media Logos Bar */}
          <div className="py-3.5 border-b border-slate-100/80">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
                  Follow Us:
                </span>
              </div>
              <div className="flex items-center">
                <SocialMediaLinks />
              </div>
            </div>
          </div>

          {/* Expandable Links Grid */}
          <AnimatePresence>
            {isFooterExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="overflow-hidden pt-6 pb-6 border-b border-slate-100"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-slate-600">
                  
                  {/* Quick Services */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Services</h4>
                    <ul className="space-y-2 text-xs font-medium">
                      <li>
                        <button type="button" onClick={() => handleFooterNavigate("store")} className="hover:text-[#00AEEF] transition flex items-center gap-1.5 text-slate-600 active:scale-98 cursor-pointer">
                          <span className="text-slate-300">•</span>
                          <span>Virtual SMS Activations</span>
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => handleFooterNavigate("smm")} className="hover:text-[#00AEEF] transition flex items-center gap-1.5 text-slate-600 active:scale-98 cursor-pointer">
                          <span className="text-slate-300">•</span>
                          <span>SMM Panel Gateway</span>
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => handleFooterNavigate("subscriptions")} className="hover:text-[#00AEEF] transition flex items-center gap-1.5 text-slate-600 active:scale-98 cursor-pointer">
                          <span className="text-slate-300">•</span>
                          <span>Digital Subscriptions Store</span>
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => handleFooterNavigate("wallet")} className="hover:text-[#00AEEF] transition flex items-center gap-1.5 text-slate-600 active:scale-98 cursor-pointer">
                          <span className="text-slate-300">•</span>
                          <span>Easypaisa & JazzCash Wallet</span>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Support & Community */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Help & Community</h4>
                    <ul className="space-y-2 text-xs font-medium">
                      <li>
                        <button type="button" onClick={() => handleFooterNavigate("tickets")} className="hover:text-[#00AEEF] transition flex items-center gap-1.5 text-slate-600 active:scale-98 cursor-pointer">
                          <span className="text-slate-300">•</span>
                          <span>Support Tickets & Helpdesk</span>
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => handleFooterNavigate("reviews")} className="hover:text-[#00AEEF] transition flex items-center gap-1.5 active:scale-98 cursor-pointer">
                          <span className="text-slate-300">•</span>
                          <span>Customer Reviews</span>
                          <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded-full">5.0 ★</span>
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => handleFooterNavigate("about")} className="hover:text-[#00AEEF] transition flex items-center gap-1.5 text-slate-600 active:scale-98 cursor-pointer">
                          <span className="text-slate-300">•</span>
                          <span>About ZeroX Network</span>
                        </button>
                      </li>
                      <li>
                        <button type="button" onClick={() => handleFooterNavigate("api")} className="hover:text-[#00AEEF] transition flex items-center gap-1.5 text-slate-600 active:scale-98 cursor-pointer">
                          <span className="text-slate-300">•</span>
                          <span>Developer API Documentation</span>
                        </button>
                      </li>
                    </ul>
                  </div>

                  {/* Legal & Privacy */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Legal & Transparency</h4>
                    <ul className="space-y-2 text-xs font-medium">
                      <li>
                        <button type="button" onClick={() => handleFooterNavigate("privacy")} className="hover:text-[#00AEEF] transition flex items-center gap-1.5 text-[#00AEEF] font-bold active:scale-98 cursor-pointer">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Privacy Policy & Terms</span>
                        </button>
                      </li>
                      <li>
                        <p className="text-slate-400 text-[11px] leading-relaxed pt-1">
                          Strict non-retention of received SMS OTPs. Encrypted account vaults & 100% verified customer data protection.
                        </p>
                      </li>
                    </ul>
                  </div>

                  {/* Official Social Media Grid */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">Official Social Networks</h4>
                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
                      Connect with us on our verified social media handles for daily updates, platform announcements, and community support.
                    </p>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Copyright & Quick Navigation */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 font-medium gap-3">
            <span>© {new Date().getFullYear()} ZeroX Network • A project of <a href="https://www.injazify.com/" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-[#00AEEF] underline underline-offset-2 transition-colors">Injazify</a>. All rights reserved.</span>
            <div className="flex items-center gap-4">
              <button type="button" onClick={() => handleFooterNavigate("privacy")} className="hover:text-slate-700 transition cursor-pointer">Privacy Policy</button>
              <span>•</span>
              <button type="button" onClick={() => handleFooterNavigate("reviews")} className="hover:text-slate-700 transition cursor-pointer">User Reviews</button>
              <span>•</span>
              <button type="button" onClick={() => handleFooterNavigate("tickets")} className="hover:text-slate-700 transition cursor-pointer">Help Center</button>
            </div>
          </div>

        </div>
      </footer>

      </main>

      {/* Admin Panel Modal Overlay */}
      <AdminPortal
        initialMaximized={isAdminStartMaximized}
        announcements={announcements}
        setAnnouncements={setAnnouncements}
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        apiKey={apiKey}
        onChangeKey={setApiKey}
        isValidating={isValidating}
        validationError={validationError}
        onValidate={() => validateAPIKey(apiKey)}
        profile={profile}
        disabledServices={disabledServices}
        onToggleService={handleToggleService}
        customPrices={customPrices}
        onUpdateCustomPrice={handleUpdateCustomPrice}
        priceMarkupPercent={priceMarkupPercent}
        onUpdateMarkupPercent={handleUpdateMarkupPercent}
        customServices={customServices}
        onAddCustomService={handleAddCustomService}
        onRemoveCustomService={handleRemoveCustomService}
        customLinks={customLinks}
        onAddCustomLink={handleAddCustomLink}
        onRemoveCustomLink={handleRemoveCustomLink}
        onUpdateCustomLink={handleUpdateCustomLink}
        
        // NEW DEPOSIT LOGS & USER ACCOUNTS PROPS
        depositInstructions={depositInstructions}
        onUpdateDepositInstruction={handleUpdateDepositInstruction}
        onDeleteDepositInstruction={handleDeleteDepositInstruction}
        depositRequests={depositRequests}
        onApproveDeposit={handleApproveDeposit}
        onRejectDeposit={handleRejectDeposit}
        onDeleteDeposit={handleDeleteDeposit}
        onAddManualDeposit={handleAddManualDeposit}
        registeredUsers={registeredUsers}
        onUpdateUserBalance={handleUpdateUserBalance}
        autoApproveDeposits={autoApproveDeposits}
        onToggleAutoApprove={async () => {
          const nextVal = !autoApproveDeposits;
          setAutoApproveDeposits(nextVal);
          try {
            await updateDoc(doc(db, "settings", "zerox_config"), { autoApproveDeposits: nextVal });
            toast.success(`Local Deposit Auto-Approval ${nextVal ? "ENABLED (ON)" : "DISABLED (OFF)"}`);
          } catch (err) {
            console.error("Failed to update autoApproveDeposits in Firestore:", err);
            toast.error("Failed to save auto-approval state.");
          }
        }}
        autoApproveCrypto={autoApproveCrypto}
        onToggleAutoApproveCrypto={async () => {
          const nextVal = !autoApproveCrypto;
          setAutoApproveCrypto(nextVal);
          try {
            await updateDoc(doc(db, "settings", "zerox_config"), { autoApproveCrypto: nextVal });
            toast.success(`Crypto Deposit Auto-Approval ${nextVal ? "ENABLED (ON)" : "DISABLED (OFF)"}`);
          } catch (err) {
            console.error("Failed to update autoApproveCrypto in Firestore:", err);
            toast.error("Failed to save crypto auto-approval state.");
          }
        }}
        cryptoRate={cryptoRate}
        onUpdateCryptoRate={setCryptoRate}
        cryptoMinDeposit={cryptoMinDeposit}
        onUpdateCryptoMinDeposit={setCryptoMinDeposit}
        localMinDeposit={localMinDeposit}
        onUpdateLocalMinDeposit={setLocalMinDeposit}
        virtualNumberMinimumPricePKR={virtualNumberMinimumPricePKR}
        onUpdateVirtualNumberMinimumPricePKR={setVirtualNumberMinimumPricePKR}
        onUpdateGlobalSettings={handleUpdateGlobalSettings}

        // SMM PANEL PROPS
        smmProviders={smmProviders}
        setSmmProviders={handleUpdateSmmProviders}
        smmServices={smmServices}
        setSmmServices={handleUpdateSmmServices}
        smmCategories={smmCategories}
        setSmmCategories={handleUpdateSmmCategories}
        smmOrders={smmOrders}
        setSmmOrders={handleUpdateSmmOrders}
        smmPriceRules={smmPriceRules}
        setSmmPriceRules={handleUpdateSmmPriceRules}
        smmLogs={smmLogs}
        setSmmLogs={handleUpdateSmmLogs}
        smmSettings={smmSettings}
        setSmmSettings={handleUpdateSmmSettings}

        // BRANDING & MEDIA HUB PROPS
        siteLogoUrl={siteLogoUrl}
        siteTitle={siteTitle}
        siteTagline={siteTagline}
        siteCoverUrl={siteCoverUrl}
        showSiteCover={showSiteCover}
        siteCoverTitle={siteCoverTitle}
        siteCoverSubtitle={siteCoverSubtitle}
        sellerCoverUrl={sellerCoverUrl}
        depositCoverUrl={depositCoverUrl}
        aboutAvatarUrl={aboutAvatarUrl}
        smmCoverUrl={smmCoverUrl}
        subscriptionsCoverUrl={subscriptionsCoverUrl}
        reviewsCoverUrl={reviewsCoverUrl}
        privacyCoverUrl={privacyCoverUrl}
        customImages={customImages}

        // SMS/SIM PROVIDERS PROPS
        smsProviders={smsProviders}
        setSmsProviders={setSmsProviders}
        orders={orders}
        tabMaintenance={tabMaintenance}
        formatPrice={formatPrice}
      />

      {insufficientBalanceInfo && (
        <div id="insufficient-balance-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-amber-50 border-b border-amber-100 p-5 flex items-center gap-3 text-amber-800">
              <div className="bg-amber-100 p-2 rounded-full text-amber-700">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Insufficient Wallet Balance</h3>
                <p className="text-xs text-amber-700 font-medium">Deposit required to place order</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="text-slate-600 text-sm leading-relaxed">
                You are trying to purchase <span className="font-bold text-slate-900">{insufficientBalanceInfo.serviceName}</span>. However, your account does not have enough funds to complete this transaction.
              </div>

              {/* Price Table Comparison */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Required Funds:</span>
                  <span className="font-bold text-slate-800">₨ {insufficientBalanceInfo.neededPkr.toFixed(1)} <span className="text-[10px] text-slate-400">(${(insufficientBalanceInfo.neededPkr / 275).toFixed(2)} USD)</span></span>
                </div>
                <div className="flex justify-between items-center text-slate-500 border-b border-slate-200/80 pb-2.5">
                  <span>Your Current Balance:</span>
                  <span className="font-bold text-red-600">₨ {insufficientBalanceInfo.userBalancePkr.toFixed(1)} <span className="text-[10px] text-red-400">(${(insufficientBalanceInfo.userBalancePkr / 275).toFixed(2)} USD)</span></span>
                </div>
                <div className="flex justify-between items-center text-slate-800 pt-0.5">
                  <span className="font-bold">Minimum Top-up Needed:</span>
                  <span className="font-bold text-lg text-blue-600">₨ {Math.max(10, Number((insufficientBalanceInfo.neededPkr - insufficientBalanceInfo.userBalancePkr).toFixed(1)))} PKR</span>
                </div>
              </div>

              <div className="text-xs text-slate-400 leading-normal">
                Easypaisa and JazzCash local deposits are processed and automatically credited within minutes. Cryptocurrencies are approved instantly upon network block confirmations.
              </div>
            </div>

            {/* Footer Actions */}
            <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setInsufficientBalanceInfo(null)}
                className="w-full sm:flex-1 bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl text-xs border border-slate-300 transition"
              >
                Cancel & Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  setInsufficientBalanceInfo(null);
                  handleTabChange("wallet");
                }}
                className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-lg shadow-blue-200"
              >
                Top-up Wallet Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Injazify AI Assistant Chatbot */}
      <InjazifyChatbot 
        onNavigateToTab={handleTabChange} 
        userBalance={currentUser ? currentUser.balance : (profile ? profile.balance : 0)} 
        currentUser={currentUser}
        formatPrice={formatPrice}
        cryptoRate={cryptoRate}
        activeTab={activeTab}
      />

      {/* First-Time User Onboarding Guide */}
      <OnboardingGuide
        currentUser={currentUser}
        showAuthModal={showAuthModal}
        siteLogoUrl={siteLogoUrl}
        onOpenAuthModal={() => {
          setShowAuthModal(true);
          setAuthInitialIsSignUp(true);
        }}
      />

      {/* Tab Instructions Modal */}
      <TabInstructionsModal
        isOpen={isTabHelpOpen}
        onClose={() => setIsTabHelpOpen(false)}
        activeTab={activeTab}
      />

      {/* Bonus Claim Overlay */}
      {claimInfo && (
        <ClaimBonus 
          bonusId={claimInfo.bonusId} 
          userId={claimInfo.userId} 
          onClaimed={() => {
            // Optional: refresh user balance if they are already logged in
          }} 
        />
      )}

      {/* Full Window Profile Settings Window */}
      <AnimatePresence>
        {showProfilePopover && currentUser && (
          <div className="fixed inset-0 z-[100000] bg-slate-950/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
            {/* Backdrop Click Handler */}
            <div 
              className="fixed inset-0 cursor-pointer" 
              onClick={() => setShowProfilePopover(false)}
            />

            {/* Complete Full Window Profile Setting View */}
            <div className="relative w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl h-full bg-white shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200 overflow-hidden">
              <UserProfilePopover cryptoRate={cryptoRate} 
                currentUser={currentUser} 
                userOrders={userOrdersList}
                onClose={() => setShowProfilePopover(false)} 
                onLogout={() => {
                  handleLogout();
                  setShowProfilePopover(false);
                }}
                formatPrice={formatPrice}
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
                selectedLanguageCode={selectedLanguageCode}
                setSelectedLanguageCode={setSelectedLanguageCode}
                onNavigate={(tab) => {
                  const targetMap: Record<string, string> = {
                    orders: "dashboard",
                    support: "tickets",
                    help: "tickets",
                  };
                  const target = targetMap[tab] || tab;
                  handleTabChange(target as any);
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }, 50);
                }}
                isAdmin={!!userAdminInfo?.isAdmin}
                adminRole={userAdminInfo?.role}
                onOpenAdminPortal={() => {
                  setIsAdminOpen(true);
                  setShowProfilePopover(false);
                }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* User Authentication Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60" 
              onClick={() => setShowAuthModal(false)} 
            />
            <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.97 }}
              transition={{ type: "spring", damping: 28, stiffness: 340 }}
              className="relative w-full max-w-full sm:max-w-lg z-10 h-[92dvh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-t-[28px] sm:rounded-3xl shadow-2xl overflow-hidden"
            >
              <UserAuth
                currentUser={currentUser}
                initialIsSignUp={authInitialIsSignUp}
                initialReferralCode={authInitialRefCode}
                onLogin={(user) => {
                  handleLogin(user);
                  setShowAuthModal(false);
                  setAuthInitialIsSignUp(false);
                }}
                onLogout={() => {
                  handleLogout();
                  setShowAuthModal(false);
                  setAuthInitialIsSignUp(false);
                }}
                onClose={() => {
                  setShowAuthModal(false);
                  setAuthInitialIsSignUp(false);
                }}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Unauthorized Admin Access (#admin) Blocked Modal */}
      <AnimatePresence>
        {showAccessDeniedModal && (
          <div className="fixed inset-0 z-[10005] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
            <div 
              className="fixed inset-0" 
              onClick={() => setShowAccessDeniedModal(false)} 
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border-2 border-red-500/70 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-red-500/30 text-white text-center z-10 overflow-hidden"
            >
              {/* Background ambient security glow */}
              <div className="absolute -top-16 -left-16 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <button
                onClick={() => setShowAccessDeniedModal(false)}
                className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center shadow-lg shadow-red-500/40 text-white mb-5 animate-pulse">
                <ShieldAlert className="w-9 h-9" />
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40">
                🔒 Access Restricted
              </span>

              <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-amber-300 to-rose-400 mt-3 mb-2">
                Better Luck Next Time!
              </h2>

              <p className="text-sm text-slate-300 font-medium leading-relaxed mb-5">
                Nice try! Direct access attempt to the <span className="font-mono text-amber-300 font-bold">#admin</span> Gateway was intercepted and blocked by <span className="font-bold text-white">Zerox Shield</span>.
              </p>

              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 text-left text-xs font-mono text-slate-400 space-y-1.5 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-500">Domain:</span>
                  <span className="text-slate-200 font-bold">{window.location.host}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Endpoint:</span>
                  <span className="text-red-400 font-bold">#admin</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="text-amber-400 font-bold">403 FORBIDDEN</span>
                </div>
              </div>

              <button
                onClick={() => setShowAccessDeniedModal(false)}
                className="w-full bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black py-3 px-6 rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer active:scale-95 uppercase tracking-wider text-xs"
              >
                Return to Safety
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ZEROX NETWORK Dedicated Virtual Number Order Detail Page Route (/orders/:id) */}
      <AnimatePresence>
        {selectedOrderId !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-slate-950 overflow-y-auto"
          >
            {(() => {
              const matchedOrder = orders.find(o => o.id === selectedOrderId);
              if (matchedOrder) {
                return (
                  <OrderDetailPage
                    order={matchedOrder}
                    currentUser={currentUser}
                    cryptoRate={cryptoRate}
                    formatPrice={formatPrice}
                    onBack={() => {
                      setSelectedOrderId(null);
                      try {
                        window.history.pushState(null, "", "/");
                      } catch (e) {}
                    }}
                    onCancel={handleCancelOrder}
                    onFinish={handleFinishOrder}
                    onBan={handleBanOrder}
                    onBuyAgain={handleBuyAgain}
                  />
                );
              }
              return (
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300 space-y-4 font-sans">
                  <div className="h-10 w-10 border-2 border-[#00AEEF] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-mono text-slate-300">Loading ZEROX Virtual Number Order #{selectedOrderId}...</p>
                  <button
                    onClick={() => {
                      setSelectedOrderId(null);
                      try {
                        window.history.pushState(null, "", "/");
                      } catch (e) {}
                    }}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Back to Dashboard
                  </button>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dedicated "How to Order" Interactive Tutorial Walkthrough */}
      <HowToOrderTutorial
        isOpen={showOrderTutorial}
        onClose={() => setShowOrderTutorial(false)}
        onNavigateToWallet={() => {
          setShowOrderTutorial(false);
          handleTabChange("wallet");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        formatPrice={formatPrice}
      />

      <PWABadge />

      {/* Dedicated ZeroX Network Password Reset Experience (from Settings or Reset Link) */}
      <AnimatePresence>
        {resetPasswordToken && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[20000] overflow-y-auto bg-[#030712]"
          >
            <ResetPasswordPage
              token={resetPasswordToken}
              onOpenLogin={() => {
                setResetPasswordToken(null);
                setShowAuthModal(true);
                setAuthInitialIsSignUp(false);
              }}
              onClose={() => {
                setResetPasswordToken(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
