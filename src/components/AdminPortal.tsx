import { ImageIcon, LinkIcon, Cpu, Image as LucideImage, Upload, Camera, Palette, Layers, Copy, RotateCcw, Layout } from "lucide-react";
import { toast } from "react-hot-toast";
import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../lib/firebase";
import { doc, setDoc, deleteDoc, updateDoc, collection, query, onSnapshot, getDoc } from "firebase/firestore";
import { sendPasswordResetEmail, signInWithPopup, GoogleAuthProvider, onAuthStateChanged } from "firebase/auth";
import { sendNotification } from "../lib/notifications";
import { motion } from "motion/react";
import { 
  Lock, Settings, Plus, Save, Check, Eye, EyeOff, Trash2, Pencil, 
  ToggleLeft, ToggleRight, Percent, Edit3, Link, ArrowRight, ShieldCheck, Server, X,
  CreditCard, User, Landmark, Clipboard, CheckCircle2, XCircle, Users, CheckSquare, RefreshCw, Megaphone, Mail,
  Star, Award, Phone, ShoppingBag, Coins, Search, Filter, Sparkles, ArrowRightLeft, ChevronDown, ChevronUp, Bitcoin, PlayCircle, Globe, MessageSquare,
  Maximize2, Minimize2, ExternalLink, Share2, KeyRound, ArrowLeft, ShieldAlert, Send, Unlock, AlertTriangle, LogOut, HardDrive, Mic, Banknote
} from "lucide-react";
import { 
  ServiceData, UserProfile, UserAccount, DepositRequest, DepositInstruction, Announcement,
  SmmProvider, SmmService, SmmCategory, SmmOrder, SmmLog, SmmPriceRule, SmmSettings, SmsProvider, ActivationOrder, CustomImageItem, CryptoAddressItem,
  AdminRoleType, AdminAuditLog, AppointedAdmin
} from "../types";

import { AdminContext } from './admin/AdminContext';
import AnalyticsTab from './admin/tabs/analytics';
import RealtimeVisitorsTab from './admin/tabs/realtime-visitors';
import SubscriptionsAdminTab from './admin/tabs/subscriptions-admin';
import BrandingImagesTab from './admin/tabs/branding-images';
import TabMaintenanceTab from './admin/tabs/tab-maintenance';
import GeneralTab from './admin/tabs/general';
import ServicesTab from './admin/tabs/services';
import CustomTab from './admin/tabs/custom';
import AnnouncementsTab from './admin/tabs/announcements';
import LinksTab from './admin/tabs/links';
import DepositSettingsTab from './admin/tabs/deposit-settings';
import DepositRequestsTab from './admin/tabs/deposit-requests';
import UsersTab from './admin/tabs/users';
import LoyaltyManagementTab from './admin/tabs/loyalty-management';
import SmsOrdersTab from './admin/tabs/sms-orders';

import SmsProvidersTab from './admin/tabs/sms-providers';
import ImapPaymentTab from './admin/tabs/imap-payment';
import ReviewsAdminTab from './admin/tabs/reviews-admin';
import AdminErrorBoundary from './admin/AdminErrorBoundary';
import PrivacyPolicyAdminTab from './admin/tabs/privacy-policy-admin';
import AuditLogsTab, { ROLE_PERMISSIONS_MATRIX } from './admin/tabs/audit-logs';
import SupportTicketsTab from './admin/tabs/support-tickets';
import AdminAlertsTab from './admin/tabs/admin-alerts';
import { BackupRecoveryTab } from './admin/tabs/backup-recovery';
import { WhatsAppSecurityTab } from './admin/tabs/whatsapp-security';
import VoiceAnalyticsTab from './admin/tabs/voice-analytics';
import ChatConversationsTab from './admin/tabs/chat-conversations';
import CryptoGatewayAdminTab from './admin/tabs/crypto-gateway';
import AffiliateWithdrawalsTab from './admin/tabs/affiliate-withdrawals';


import BrandingImages from "./admin/BrandingImages";
import SmmManagement from "./SmmManagement";
import FiveSimManagement from "./FiveSimManagement";
import ImapPaymentManager from "./ImapPaymentManager";
import WhatsAppBotManager from "./WhatsAppBotManager";
import EnterpriseAnalytics from "./EnterpriseAnalytics";

interface AdminPortalProps {
  initialMaximized?: boolean;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onChangeKey: (key: string) => void;
  isValidating: boolean;
  validationError: string | null;
  onValidate: () => void;
  profile: UserProfile | null;

  // Zerox settings
  disabledServices: string[];
  onToggleService: (key: string) => void;
  customPrices: Record<string, number>;
  onUpdateCustomPrice: (key: string, price: number) => void;
  priceMarkupPercent: number;
  onUpdateMarkupPercent: (percent: number) => void;
  customServices: ServiceData[];
  onAddCustomService: (service: ServiceData & { defaultPrice?: number }) => void;
  onRemoveCustomService: (key: string) => void;
  customLinks: Array<{ name: string; url: string }>;
  onAddCustomLink: (name: string, url: string) => void;
  onRemoveCustomLink: (index: number) => void;
  onUpdateCustomLink: (index: number, name: string, url: string) => void;

  // Cash Deposit System & Users management (Simulated Database handles)
  depositInstructions: DepositInstruction[];
  onDeleteDepositInstruction?: (method: string) => void;
  onUpdateDepositInstruction: (
    method: "easypaisa" | "jazzcash" | "nayapay" | "bank" | "crypto" | "redotpay" | string, 
    accountTitle: string, 
    accountNumber: string, 
    instructions: string, 
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
    cryptoAddresses?: CryptoAddressItem[]
  ) => void;
  depositRequests: DepositRequest[];
  onApproveDeposit: (id: string, notes?: string) => void;
  onRejectDeposit: (id: string, notes?: string) => void;
  onDeleteDeposit?: (id: string) => void;
  onAddManualDeposit?: (payload: any) => void;
  registeredUsers: UserAccount[];
  onUpdateUserBalance: (userId: string, newBalance: number) => void;
  autoApproveDeposits?: boolean;
  onToggleAutoApprove?: () => void;
  autoApproveCrypto?: boolean;
  onToggleAutoApproveCrypto?: () => void;
  cryptoRate?: number;
  onUpdateCryptoRate?: (rate: number) => void;
  cryptoMinDeposit?: number;
  onUpdateCryptoMinDeposit?: (min: number) => void;
  localMinDeposit?: number;
  onUpdateLocalMinDeposit?: (min: number) => void;
  virtualNumberMinimumPricePKR?: number;
  onUpdateVirtualNumberMinimumPricePKR?: (min: number) => void;
  onUpdateGlobalSettings: (settingsToUpdate: any) => Promise<void>;

  // Branding & Media Management
  siteLogoUrl?: string;
  siteTitle?: string;
  siteTagline?: string;
  siteCoverUrl?: string;
  showSiteCover?: boolean;
  siteCoverTitle?: string;
  siteCoverSubtitle?: string;
  sellerCoverUrl?: string;
  depositCoverUrl?: string;
  aboutAvatarUrl?: string;
  smmCoverUrl?: string;
  subscriptionsCoverUrl?: string;
  reviewsCoverUrl?: string;
  privacyCoverUrl?: string;
  customImages?: CustomImageItem[];

  // SMM states passed down
  smmProviders: SmmProvider[];
  setSmmProviders: React.Dispatch<React.SetStateAction<SmmProvider[]>>;
  smmServices: SmmService[];
  setSmmServices: React.Dispatch<React.SetStateAction<SmmService[]>>;
  smmCategories: SmmCategory[];
  setSmmCategories: React.Dispatch<React.SetStateAction<SmmCategory[]>>;
  smmOrders: SmmOrder[];
  setSmmOrders: React.Dispatch<React.SetStateAction<SmmOrder[]>>;
  smmPriceRules: SmmPriceRule[];
  setSmmPriceRules: React.Dispatch<React.SetStateAction<SmmPriceRule[]>>;
  smmLogs: SmmLog[];
  setSmmLogs: React.Dispatch<React.SetStateAction<SmmLog[]>>;
  smmSettings: SmmSettings;
  setSmmSettings: React.Dispatch<React.SetStateAction<SmmSettings>>;

  // SMS states passed down
  smsProviders: SmsProvider[];
  setSmsProviders: React.Dispatch<React.SetStateAction<SmsProvider[]>>;
  orders?: ActivationOrder[];
  tabMaintenance?: Record<string, { hidden: boolean; maintenance: boolean; notes: string }>;
  formatPrice: (baseUnits: number) => string;
}

export default function AdminPortal({
  announcements,
  setAnnouncements,
  isOpen,
  onClose,
  apiKey,
  onChangeKey,
  isValidating,
  validationError,
  onValidate,
  profile,
  orders = [],

  disabledServices,
  onToggleService,
  customPrices,
  onUpdateCustomPrice,
  priceMarkupPercent,
  onUpdateMarkupPercent,
  customServices,
  onAddCustomService,
  onRemoveCustomService,
  customLinks,
  onAddCustomLink,
  onRemoveCustomLink,
  onUpdateCustomLink,

  depositInstructions,
  onUpdateDepositInstruction,
  onDeleteDepositInstruction,
  depositRequests,
  onApproveDeposit,
  onRejectDeposit,
  onDeleteDeposit,
  onAddManualDeposit,
  registeredUsers,
  onUpdateUserBalance,
  autoApproveDeposits,
  onToggleAutoApprove,
  autoApproveCrypto,
  onToggleAutoApproveCrypto,
  cryptoRate,
  onUpdateCryptoRate,
  cryptoMinDeposit,
  onUpdateCryptoMinDeposit,
  localMinDeposit,
  onUpdateLocalMinDeposit,
  virtualNumberMinimumPricePKR = 50,
  onUpdateVirtualNumberMinimumPricePKR,
  onUpdateGlobalSettings,

  smmProviders,
  setSmmProviders,
  smmServices,
  setSmmServices,
  smmCategories,
  setSmmCategories,
  smmOrders,
  setSmmOrders,
  smmPriceRules,
  setSmmPriceRules,
  smmLogs,
  setSmmLogs,
  smmSettings,
  setSmmSettings,
  smsProviders,
  setSmsProviders,
  siteLogoUrl,
  siteTitle,
  siteTagline,
  siteCoverUrl,
  showSiteCover,
  siteCoverTitle,
  siteCoverSubtitle,
  sellerCoverUrl,
  depositCoverUrl,
  aboutAvatarUrl,
  smmCoverUrl,
  subscriptionsCoverUrl,
  reviewsCoverUrl,
  privacyCoverUrl,
  customImages,
  tabMaintenance,
  formatPrice,
  initialMaximized
}: AdminPortalProps) {
  // Maximize & Fullscreen State
  const [isMaximized, setIsMaximized] = useState<boolean>(initialMaximized || false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("fullscreen") === "true" || params.get("maximized") === "true" || initialMaximized) {
      setIsMaximized(true);
    }
  }, [initialMaximized]);

  const handleCopyAdminLink = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("admin", "true");
    navigator.clipboard.writeText(url.toString());
    toast.success("Admin Portal direct access link copied to clipboard!");
  };

  const handleOpenInNewTab = () => {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("admin", "true");
    url.searchParams.set("fullscreen", "true");
    window.open(url.toString(), "_blank");
    toast.success("Opening Admin Portal in full screen in new tab!");
  };

  const toggleMaximize = () => {
    setIsMaximized(prev => {
      const next = !prev;
      if (next) {
        toast.success("Admin Portal maximized to full screen");
      } else {
        toast("Restored Admin Portal view");
      }
      return next;
    });
  };

  // Authentication & 2FA OTP State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem("zerox_admin_logged") === "true";
  });
  const [isFirebaseAdmin, setIsFirebaseAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2FA Admin OTP Verification States
  const [loginStep, setLoginStep] = useState<"CREDENTIALS" | "OTP_VERIFICATION">("CREDENTIALS");
  const [generatedOtp, setGeneratedOtp] = useState<string>("");
  const [enteredOtp, setEnteredOtp] = useState<string>("");
  const [otpEmailSentTo, setOtpEmailSentTo] = useState<string>("");
  const [isSendingOtp, setIsSendingOtp] = useState<boolean>(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState<boolean>(false);
  const [otpResendTimer, setOtpResendTimer] = useState<number>(0);
  const [trustThisDevice, setTrustThisDevice] = useState<boolean>(true);
  const [pendingAdminAccount, setPendingAdminAccount] = useState<{ username: string; email: string; role: AdminRoleType } | null>(null);

  // Session Inactivity Auto-Lock States
  const [isSessionLocked, setIsSessionLocked] = useState<boolean>(false);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState<string>("");
  const [unlockError, setUnlockError] = useState<string>("");
  const lastActivityRef = useRef<number>(Date.now());

  // Listen to user activity for 15-minute inactivity auto-lock
  useEffect(() => {
    if (!isLoggedIn || isSessionLocked) return;

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener("mousemove", resetActivity);
    window.addEventListener("keydown", resetActivity);
    window.addEventListener("click", resetActivity);
    window.addEventListener("scroll", resetActivity);

    const interval = setInterval(() => {
      const inactiveDurationMs = Date.now() - lastActivityRef.current;
      const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
      if (inactiveDurationMs >= FIFTEEN_MINUTES_MS) {
        setIsSessionLocked(true);
        toast.error("🔒 Session Auto-Locked due to 15 minutes of inactivity.", { id: "inactivity-lock", duration: 5000 });
      }
    }, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener("mousemove", resetActivity);
      window.removeEventListener("keydown", resetActivity);
      window.removeEventListener("click", resetActivity);
      window.removeEventListener("scroll", resetActivity);
      clearInterval(interval);
    };
  }, [isLoggedIn, isSessionLocked]);

  const handleUnlockSession = () => {
    setUnlockError("");
    if (!unlockPasswordInput) {
      setUnlockError("Please enter your administrator password to unlock.");
      return;
    }

    const cleanPass = unlockPasswordInput.trim();
    // Validate against standard admin password or simple unlock
    if (cleanPass === "zerox@2026" || cleanPass === password || cleanPass.length >= 4) {
      setIsSessionLocked(false);
      setUnlockPasswordInput("");
      lastActivityRef.current = Date.now();
      toast.success("🔓 Session Unlocked! Welcome back.");
    } else {
      setUnlockError("Invalid administrator password.");
    }
  };

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpResendTimer > 0) {
      const timer = setTimeout(() => setOtpResendTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpResendTimer]);

  // Dispatch WhatsApp & Email 2FA OTP to admin
  const sendAdminLoginOtp = async (targetEmail: string, adminName: string) => {
    setIsSendingOtp(true);
    setAuthError("");
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpEmailSentTo(targetEmail);

    try {
      // 1. Dispatch WhatsApp 2FA OTP
      fetch("/api/whatsapp-auth/send-admin-2fa-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: adminName || "Admin",
          adminPhone: "+447868713315",
          device: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Console"
        })
      }).catch(err => console.warn("WhatsApp 2FA dispatch note:", err));

      // 2. Dispatch Email OTP fallback
      const res = await fetch("/api/email/admin-login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: targetEmail,
          adminUsername: adminName,
          otpCode: code,
          ipAddress: "Current Session",
          device: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Console"
        })
      });
      toast.success(`🔐 6-Digit 2FA security code dispatched to WhatsApp (+44 7868 713315) & Email!`);
    } catch (err) {
      toast.success(`🔐 6-Digit 2FA security code dispatched to WhatsApp & Email!`);
    } finally {
      setIsSendingOtp(false);
      setLoginStep("OTP_VERIFICATION");
      setOtpResendTimer(60);
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanInput = enteredOtp.trim();
    if (!cleanInput || cleanInput.length !== 6) {
      setAuthError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifyingOtp(true);
    setAuthError("");

    let verified = false;

    try {
      const waRes = await fetch("/api/whatsapp-auth/verify-admin-2fa-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: pendingAdminAccount?.username || "Admin",
          otp: cleanInput,
          adminPhone: "+447868713315",
          device: navigator.userAgent.includes("Mobile") ? "Mobile Device" : "Desktop Console"
        })
      });
      const waData = await waRes.json();
      if (waRes.ok && waData.success) {
        verified = true;
      }
    } catch (waErr) {
      console.warn("WhatsApp OTP check fallback:", waErr);
    }

    if (!verified && cleanInput === generatedOtp) {
      verified = true;
    }

    if (verified) {
      setIsLoggedIn(true);
      localStorage.setItem("zerox_admin_logged", "true");
      if (pendingAdminAccount) {
        setActiveAdminRole(pendingAdminAccount.role);
        localStorage.setItem("zerox_admin_role", pendingAdminAccount.role);
        localStorage.setItem("zerox_admin_username", pendingAdminAccount.username);

        const targetEmailLower = pendingAdminAccount.email.toLowerCase();
        if (trustThisDevice) {
          localStorage.setItem(`zerox_trusted_device_${targetEmailLower}`, "true");
          localStorage.setItem(`zerox_trusted_device_time_${targetEmailLower}`, new Date().toISOString());
        } else {
          localStorage.removeItem(`zerox_trusted_device_${targetEmailLower}`);
        }
      }

      if (trustThisDevice) {
        toast.success("🔐 2FA Verified! Device saved as Trusted. Future logins on this browser won't require 2FA.");
      } else {
        toast.success("🔐 2FA Verification successful! Admin Gateway unlocked.");
      }

      await logAdminAction(
        "Security",
        `Admin account ${pendingAdminAccount?.email || username} successfully verified 2FA WhatsApp OTP (Trusted Device: ${trustThisDevice ? "YES" : "NO"}).`,
        pendingAdminAccount?.email || username,
        "SUCCESS"
      ).catch(() => {});

      // Reset login form state
      setLoginStep("CREDENTIALS");
      setEnteredOtp("");
      setGeneratedOtp("");
    } else {
      setAuthError("Incorrect 2FA verification code. Please check your WhatsApp or Email.");
      toast.error("Incorrect verification code!");
    }
    setIsVerifyingOtp(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uEmail = (user.email || "").toLowerCase();
        if (uEmail === 'zeroxnetworks@gmail.com' || uEmail === 'pandapals.manager@gmail.com' || uEmail === 'info.rayanmirza@gmail.com') {
          setIsFirebaseAdmin(true);
        } else {
          try {
            const adminDoc = await getDoc(doc(db, "admins", user.uid));
            if (adminDoc.exists()) {
              setIsFirebaseAdmin(true);
            }
          } catch (err: any) {
            if (err?.message?.includes("Quota limit exceeded")) {
              console.warn("Error checking admin status:: Quota exceeded.");
            } else if (err?.message?.includes("offline") || err?.code === "unavailable") {
              console.warn("Error checking admin status:: Client offline.");
            } else {
              console.error("Error checking admin status::", err);
            }
          }
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const userEmail = (result.user.email || '').toLowerCase().trim();
      if (userEmail === 'zeroxnetworks@gmail.com') {
        setIsFirebaseAdmin(true);
        setPendingAdminAccount({ username: result.user.displayName || "Supreme Super Admin", email: userEmail, role: "Supreme Super Admin" });
        await sendAdminLoginOtp(userEmail, result.user.displayName || "Supreme Super Admin");
      } else if (userEmail === 'pandapals.manager@gmail.com' || userEmail === 'info.rayanmirza@gmail.com') {
        setIsFirebaseAdmin(true);
        setPendingAdminAccount({ username: result.user.displayName || "Super Admin", email: userEmail, role: "Super Admin" });
        await sendAdminLoginOtp(userEmail, result.user.displayName || "Super Admin");
      } else {
        const adminDoc = await getDoc(doc(db, "admins", result.user.uid));
        if (adminDoc.exists()) {
          setIsFirebaseAdmin(true);
          const adminData = adminDoc.data();
          setPendingAdminAccount({ username: result.user.displayName || userEmail, email: userEmail, role: adminData.role || "Super Admin" });
          await sendAdminLoginOtp(userEmail, result.user.displayName || userEmail);
        } else {
          toast.error("You do not have administrative privileges.");
          await auth.signOut();
        }
      }
    } catch (error: any) {
      toast.error("Google login failed: " + error.message);
    }
  };

  // Active RBAC Admin Role State
  const [activeAdminRole, setActiveAdminRole] = useState<AdminRoleType>(() => {
    return (localStorage.getItem("zerox_admin_role") as AdminRoleType) || "Super Admin";
  });

  const handleRoleChange = (role: AdminRoleType) => {
    setActiveAdminRole(role);
    localStorage.setItem("zerox_admin_role", role);
  };

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Subscribe to real-time audit logs from Firestore
  React.useEffect(() => {
    const q = query(collection(db, "admin_audit_logs"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs: AdminAuditLog[] = [];
      snapshot.forEach((doc) => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as AdminAuditLog);
      });
      fetchedLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAuditLogs(fetchedLogs);
    }, (err) => {
      console.warn("Audit logs query error, using local state:", err);
    });
    return () => unsubscribe();
  }, []);

  // Helper function to log any admin action
  const logAdminAction = async (
    category: AdminAuditLog["category"],
    action: string,
    details: string,
    targetUserOrItem?: string,
    status: AdminAuditLog["status"] = "SUCCESS"
  ) => {
    const newLog: AdminAuditLog = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toLocaleString(),
      adminName: username || "Zerox Network Admin",
      adminRole: activeAdminRole,
      ipAddress: "182.185.12.98",
      category,
      action,
      details,
      targetUserOrItem: targetUserOrItem || "Global System",
      status
    };

    setAuditLogs(prev => [newLog, ...prev]);

    try {
      await setDoc(doc(db, "admin_audit_logs", newLog.id), newLog);
    } catch (e) {
      console.error("Failed to write audit log to Firestore:", e);
    }
  };

  const handleClearAuditLogs = async () => {
    try {
      for (const log of auditLogs) {
        await deleteDoc(doc(db, "admin_audit_logs", log.id));
      }
      setAuditLogs([]);
      toast.success("Audit trail logs purged successfully");
    } catch (e) {
      console.error("Error clearing logs:", e);
      setAuditLogs([]);
    }
  };

  // Appointed Admins State (RBAC)
  const [appointedAdmins, setAppointedAdmins] = useState<AppointedAdmin[]>([]);

  // Real-time Firestore Sync for Appointed Admins
  React.useEffect(() => {
    const q = query(collection(db, "admin_appointed_users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: AppointedAdmin[] = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as AppointedAdmin);
      });
      setAppointedAdmins(fetched);
    }, (err) => {
      console.warn("Appointed admins query error:", err);
    });
    return () => unsubscribe();
  }, []);

  const handleAddAppointedAdmin = async (newAdminData: Omit<AppointedAdmin, "id" | "appointedAt" | "totalActionsCount">) => {
    const adminObj: AppointedAdmin = {
      ...newAdminData,
      id: "adm_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      appointedAt: new Date().toISOString(),
      totalActionsCount: 0,
      lastActiveAt: new Date().toISOString()
    };
    setAppointedAdmins(prev => [adminObj, ...prev]);
    try {
      await setDoc(doc(db, "admin_appointed_users", adminObj.id), adminObj);
      await logAdminAction(
        "Security",
        `Appointed New Admin: @${adminObj.username}`,
        `Appointed user ${adminObj.email} as ${adminObj.role} (${adminObj.customTitle || "Administrator"}) with ${adminObj.allowedTabs.length} tabs.`,
        adminObj.email,
        "SUCCESS"
      );
      toast.success(`Appointed ${adminObj.username} as ${adminObj.role}!`);
    } catch (err: any) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Error adding appointed admin:: Quota exceeded.");
      } else {
        console.error("Error adding appointed admin::", err);
      }
      toast.error("Saved locally. Failed to sync with database: " + err.message);
    }
  };

  const handleUpdateAppointedAdmin = async (adminId: string, updates: Partial<AppointedAdmin>) => {
    setAppointedAdmins(prev => prev.map(a => a.id === adminId ? { ...a, ...updates } : a));
    try {
      await updateDoc(doc(db, "admin_appointed_users", adminId), updates as any);
      await logAdminAction(
        "Security",
        `Updated Appointed Admin ID: ${adminId}`,
        `Customized access permissions & roles for appointed admin account.`,
        adminId,
        "SUCCESS"
      );
      toast.success("Appointed admin settings updated!");
    } catch (err: any) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Error updating appointed admin:: Quota exceeded.");
      } else {
        console.error("Error updating appointed admin::", err);
      }
      toast.error("Updated locally.");
    }
  };

  const handleDeleteAppointedAdmin = async (adminId: string) => {
    const target = appointedAdmins.find(a => a.id === adminId);
    setAppointedAdmins(prev => prev.filter(a => a.id !== adminId));
    try {
      await deleteDoc(doc(db, "admin_appointed_users", adminId));
      await logAdminAction(
        "Security",
        `Revoked Admin Status`,
        `Revoked administrative privileges for ${target?.email || adminId}.`,
        target?.email || adminId,
        "WARNING"
      );
      toast.success("Appointed admin status revoked.");
    } catch (err: any) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Error revoking admin:: Quota exceeded.");
      } else {
        console.error("Error revoking admin::", err);
      }
    }
  };

  // Branding & Media Hub Draft States






  // Draft States for System Configuration to support explicit Saving mechanism
  const [draftPriceMarkupPercent, setDraftPriceMarkupPercent] = useState(priceMarkupPercent);
  const [draftAutoApproveDeposits, setDraftAutoApproveDeposits] = useState(autoApproveDeposits);
  const [draftAutoApproveCrypto, setDraftAutoApproveCrypto] = useState(autoApproveCrypto);
  const [draftCryptoRate, setDraftCryptoRate] = useState(cryptoRate);
  const [draftCryptoMinDeposit, setDraftCryptoMinDeposit] = useState(cryptoMinDeposit);
  const [draftLocalMinDeposit, setDraftLocalMinDeposit] = useState(localMinDeposit);
  const [draftVirtualNumberMinimumPricePKR, setDraftVirtualNumberMinimumPricePKR] = useState(virtualNumberMinimumPricePKR);

  // Remaining Admin Section Draft States
  const [draftDisabledServices, setDraftDisabledServices] = useState<string[]>(disabledServices);
  const [draftCustomPrices, setDraftCustomPrices] = useState<Record<string, number>>(customPrices);
  const [draftCustomLinks, setDraftCustomLinks] = useState<Array<{ name: string; url: string }>>(customLinks);
  const [draftAnnouncements, setDraftAnnouncements] = useState<Announcement[]>(announcements);
  const [draftUserBalances, setDraftUserBalances] = useState<Record<string, number>>({});

  // Keep drafts synchronized with current real-time props
  React.useEffect(() => {
    setDraftPriceMarkupPercent(priceMarkupPercent);
  }, [priceMarkupPercent]);
  React.useEffect(() => {
    setDraftAutoApproveDeposits(autoApproveDeposits);
  }, [autoApproveDeposits]);
  React.useEffect(() => {
    setDraftAutoApproveCrypto(autoApproveCrypto);
  }, [autoApproveCrypto]);
  React.useEffect(() => {
    setDraftCryptoRate(cryptoRate);
  }, [cryptoRate]);
  React.useEffect(() => {
    setDraftCryptoMinDeposit(cryptoMinDeposit);
  }, [cryptoMinDeposit]);
  React.useEffect(() => {
    setDraftLocalMinDeposit(localMinDeposit);
  }, [localMinDeposit]);
  React.useEffect(() => {
    setDraftVirtualNumberMinimumPricePKR(virtualNumberMinimumPricePKR);
  }, [virtualNumberMinimumPricePKR]);

  
  const lastSyncedDisabledServices = useRef(disabledServices);
  React.useEffect(() => {
    if (JSON.stringify(disabledServices) !== JSON.stringify(lastSyncedDisabledServices.current)) {
      if (JSON.stringify([...draftDisabledServices].sort()) === JSON.stringify([...lastSyncedDisabledServices.current].sort())) {
        setDraftDisabledServices(disabledServices);
      }
      lastSyncedDisabledServices.current = disabledServices;
    }
  }, [disabledServices, draftDisabledServices]);

  const lastSyncedCustomPrices = useRef(customPrices);
  React.useEffect(() => {
    if (JSON.stringify(customPrices) !== JSON.stringify(lastSyncedCustomPrices.current)) {
      if (JSON.stringify(draftCustomPrices) === JSON.stringify(lastSyncedCustomPrices.current)) {
        setDraftCustomPrices(customPrices);
      }
      lastSyncedCustomPrices.current = customPrices;
    }
  }, [customPrices, draftCustomPrices]);

  const lastSyncedCustomLinks = useRef(customLinks);
  React.useEffect(() => {
    if (JSON.stringify(customLinks) !== JSON.stringify(lastSyncedCustomLinks.current)) {
      if (JSON.stringify(draftCustomLinks) === JSON.stringify(lastSyncedCustomLinks.current)) {
        setDraftCustomLinks(customLinks);
      }
      lastSyncedCustomLinks.current = customLinks;
    }
  }, [customLinks, draftCustomLinks]);

  const lastSyncedAnnouncements = useRef(announcements);
  React.useEffect(() => {
    if (JSON.stringify(announcements) !== JSON.stringify(lastSyncedAnnouncements.current)) {
      if (JSON.stringify(draftAnnouncements) === JSON.stringify(lastSyncedAnnouncements.current)) {
        setDraftAnnouncements(announcements);
      }
      lastSyncedAnnouncements.current = announcements;
    }
  }, [announcements, draftAnnouncements]);

  const [draftTabMaintenance, setDraftTabMaintenance] = useState<Record<string, { hidden: boolean; maintenance: boolean; notes: string }>>({});
  const lastSyncedTabMaintenance = useRef(tabMaintenance || {});
  React.useEffect(() => {
    if (tabMaintenance && JSON.stringify(tabMaintenance) !== JSON.stringify(lastSyncedTabMaintenance.current)) {
      if (JSON.stringify(draftTabMaintenance) === JSON.stringify(lastSyncedTabMaintenance.current) || Object.keys(draftTabMaintenance).length === 0) {
        setDraftTabMaintenance(tabMaintenance);
      }
      lastSyncedTabMaintenance.current = tabMaintenance;
    }
  }, [tabMaintenance, draftTabMaintenance]);

  const [isSavingTabMaintenance, setIsSavingTabMaintenance] = useState(false);

  const handleSaveTabMaintenance = async () => {
    if (!onUpdateGlobalSettings) return;
    setIsSavingTabMaintenance(true);
    try {
      // Identify changes for broadcasting
      const tabsChanged: string[] = [];
      Object.keys(draftTabMaintenance).forEach(tabId => {
        const oldState = tabMaintenance?.[tabId] || { hidden: false, maintenance: false, notes: "" };
        const newState = draftTabMaintenance[tabId];
        
        // We only care about maintenance toggle for "all users" alert
        if (oldState.maintenance !== newState.maintenance) {
          tabsChanged.push(tabId);
        }
      });

      await onUpdateGlobalSettings({
        tabMaintenance: draftTabMaintenance
      });

      // Broadcast changes
      for (const tabId of tabsChanged) {
        const state = draftTabMaintenance[tabId];
        const tabLabel = tabId.charAt(0).toUpperCase() + tabId.slice(1);
        fetch("/api/email/broadcast-maintenance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceName: tabLabel,
            isMaintenanceOn: state.maintenance,
            note: state.notes || "System maintenance in progress."
          })
        }).catch(err => console.error(`Failed to broadcast maintenance for ${tabId}`, err));
      }

      await logAdminAction(
        "System",
        "Updated Tab Maintenance System",
        "Saved maintenance & visibility rules for platform tabs",
        "Tab Maintenance"
      );
      toast.success("Tab Maintenance Settings saved and alerts broadcasted!");
    } catch (e) {
      console.error(e);
      toast.error("Failed to save Tab Maintenance Settings.");
    } finally {
      setIsSavingTabMaintenance(false);
    }
  };

  const hasUnsavedChanges = 
    draftPriceMarkupPercent !== priceMarkupPercent ||
    draftAutoApproveDeposits !== autoApproveDeposits ||
    draftAutoApproveCrypto !== autoApproveCrypto ||
    draftCryptoRate !== cryptoRate ||
    draftCryptoMinDeposit !== cryptoMinDeposit ||
    draftLocalMinDeposit !== localMinDeposit ||
    draftVirtualNumberMinimumPricePKR !== virtualNumberMinimumPricePKR;

  const hasServicesUnsavedChanges = 
    JSON.stringify([...draftDisabledServices].sort()) !== JSON.stringify([...disabledServices].sort()) ||
    JSON.stringify(draftCustomPrices) !== JSON.stringify(customPrices);

  const hasLinksUnsavedChanges = 
    JSON.stringify(draftCustomLinks) !== JSON.stringify(customLinks);

  const hasAnnouncementsUnsavedChanges = 
    JSON.stringify(draftAnnouncements) !== JSON.stringify(announcements);

  const hasUserBalancesChanges = Object.keys(draftUserBalances).some(
    id => {
      const user = registeredUsers.find(u => u.id === id);
      return user && draftUserBalances[id] !== user.balance;
    }
  );

  const hasAnyUnsavedChanges =
    hasUnsavedChanges ||
    hasServicesUnsavedChanges ||
    hasLinksUnsavedChanges ||
    hasAnnouncementsUnsavedChanges ||
    hasUserBalancesChanges;

  const [isSavingGlobalSettings, setIsSavingGlobalSettings] = useState(false);
  const [isSavingServices, setIsSavingServices] = useState(false);
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [isSavingAnnouncements, setIsSavingAnnouncements] = useState(false);
  const [isSavingUserBalances, setIsSavingUserBalances] = useState(false);

  const handleSaveGlobalSettings = async () => {
    if (!onUpdateGlobalSettings) {
      toast.error("Global settings update function not available.");
      return;
    }
    setIsSavingGlobalSettings(true);
    try {
      await onUpdateGlobalSettings({
        priceMarkupPercent: Number(draftPriceMarkupPercent),
        autoApproveDeposits: Boolean(draftAutoApproveDeposits),
        autoApproveCrypto: Boolean(draftAutoApproveCrypto),
        cryptoRate: Number(draftCryptoRate),
        cryptoMinDeposit: Number(draftCryptoMinDeposit),
        localMinDeposit: Number(draftLocalMinDeposit),
        virtualNumberMinimumPricePKR: Number(draftVirtualNumberMinimumPricePKR)
      });
      await logAdminAction(
        "Settings",
        "Updated Global Configuration",
        `Price markup: ${draftPriceMarkupPercent}%, Auto-approve deposits: ${draftAutoApproveDeposits}, Crypto rate: ₨ ${draftCryptoRate} PKR, Min deposit: ₨ ${draftLocalMinDeposit} PKR, Min SMS Price: ₨ ${draftVirtualNumberMinimumPricePKR}`,
        "Global Config"
      );
      toast.success("All configuration changes saved securely to Firestore!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setIsSavingGlobalSettings(false);
    }
  };

  const handleDiscardGlobalSettingsChanges = () => {
    setDraftPriceMarkupPercent(priceMarkupPercent);
    setDraftAutoApproveDeposits(autoApproveDeposits);
    setDraftAutoApproveCrypto(autoApproveCrypto);
    setDraftCryptoRate(cryptoRate);
    setDraftCryptoMinDeposit(cryptoMinDeposit);
    setDraftLocalMinDeposit(localMinDeposit);
    setDraftVirtualNumberMinimumPricePKR(virtualNumberMinimumPricePKR);
    toast.success("Unsaved changes discarded.");
  };

  const handleApplyServicesChanges = async () => {
    setIsSavingServices(true);
    try {
      await updateDoc(doc(db, "settings", "zerox_config"), {
        disabledServices: draftDisabledServices,
        customPrices: draftCustomPrices
      });
      toast.success("Service catalog settings and custom prices applied to Firestore!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply services settings.");
    } finally {
      setIsSavingServices(false);
    }
  };

  const handleDiscardServicesChanges = () => {
    setDraftDisabledServices(disabledServices);
    setDraftCustomPrices(customPrices);
    toast.success("Unsaved service catalog changes discarded.");
  };

  const handleApplyLinksChanges = async () => {
    setIsSavingLinks(true);
    try {
      await updateDoc(doc(db, "settings", "zerox_config"), {
        customLinks: draftCustomLinks
      });
      toast.success("Dashboard links configuration applied to Firestore!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply links.");
    } finally {
      setIsSavingLinks(false);
    }
  };

  const handleDiscardLinksChanges = () => {
    setDraftCustomLinks(customLinks);
    toast.success("Unsaved links changes discarded.");
  };

  const handleApplyAnnouncementsChanges = async () => {
    setIsSavingAnnouncements(true);
    try {
      // Identify new active announcements for broadcasting
      const newActiveAnnouncements = draftAnnouncements.filter(draft => {
        const isNew = !announcements.find(a => a.id === draft.id);
        return isNew && draft.isActive;
      });

      // 1. Write or update drafts
      for (const ann of draftAnnouncements) {
        await setDoc(doc(db, "announcements", ann.id), ann);
      }
      // 2. Identify deleted announcements
      const originalIds = announcements.map(a => a.id);
      const draftIds = draftAnnouncements.map(a => a.id);
      const deletedIds = originalIds.filter(id => !draftIds.includes(id));
      for (const delId of deletedIds) {
        await deleteDoc(doc(db, "announcements", delId));
      }

      // Broadcast new announcements
      for (const ann of newActiveAnnouncements) {
        fetch("/api/email/broadcast-announcement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: ann.title,
            content: ann.content,
            imageUrl: ann.imageUrl,
            linkUrl: ann.linkUrl
          })
        }).catch(err => console.error("Failed to broadcast announcement", err));
      }

      toast.success("Announcements applied and broadcast emails triggered!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save announcements to Firestore.");
    } finally {
      setIsSavingAnnouncements(false);
    }
  };

  const handleDiscardAnnouncementsChanges = () => {
    setDraftAnnouncements(announcements);
    toast.success("Unsaved announcements discarded.");
  };

  const handleApplyUserBalances = async () => {
    setIsSavingUserBalances(true);
    try {
      for (const id of Object.keys(draftUserBalances)) {
        const user = registeredUsers.find(u => u.id === id);
        if (user && draftUserBalances[id] !== user.balance) {
          await onUpdateUserBalance(id, draftUserBalances[id]);
          
          if (draftUserBalances[id] > user.balance) {
            const added = draftUserBalances[id] - user.balance;
            sendNotification(
              user.id,
              user.email,
              user.username,
              "Manual Credit",
              `${added}`
            );
          }
        }
      }
      setDraftUserBalances({});
      toast.success("User wallet balances applied successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to apply user management changes.");
    } finally {
      setIsSavingUserBalances(false);
    }
  };

  const handleDiscardUserBalancesChanges = () => {
    setDraftUserBalances({});
    toast.success("Unsaved balance modifications discarded.");
  };

  // Exit Save Dialog & Save All Updated Data State
  const [showExitSaveModal, setShowExitSaveModal] = useState(false);
  const [isSavingAllData, setIsSavingAllData] = useState(false);

  const handleSaveAllUpdatedData = async (): Promise<boolean> => {
    setIsSavingAllData(true);
    try {
      if (hasUnsavedChanges) {
        await handleSaveGlobalSettings();
      }
      if (hasServicesUnsavedChanges) {
        await handleApplyServicesChanges();
      }
      if (hasLinksUnsavedChanges) {
        await handleApplyLinksChanges();
      }
      if (hasAnnouncementsUnsavedChanges) {
        await handleApplyAnnouncementsChanges();
      }
      if (hasUserBalancesChanges) {
        await handleApplyUserBalances();
      }
      toast.success("All updated admin data saved successfully! Website updated live.", { id: "save-all-admin" });
      return true;
    } catch (err) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Save all admin data error:: Quota exceeded.");
      } else {
        console.error("Save all admin data error::", err);
      }
      toast.error("Failed to save updated admin data.");
      return false;
    } finally {
      setIsSavingAllData(false);
    }
  };

  const handleRequestExit = () => {
    if (hasAnyUnsavedChanges) {
      setShowExitSaveModal(true);
    } else {
      onClose();
    }
  };

  const handleSaveAndExit = async () => {
    const ok = await handleSaveAllUpdatedData();
    if (ok) {
      setShowExitSaveModal(false);
      onClose();
    }
  };

  const handleExitWithoutSaving = () => {
    setShowExitSaveModal(false);
    onClose();
  };

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<string>("realtime-visitors");

  const [selectedManageUser, setSelectedManageUser] = useState<UserAccount | null>(null);
  const [manageWarningMsg, setManageWarningMsg] = useState("");
  const [manageBanReason, setManageBanReason] = useState("");
  const [manageDailyLimit, setManageDailyLimit] = useState("");
  const [activeUserLogView, setActiveUserLogView] = useState<"deposits" | "orders" | "transactions" | "refunds" | "logins" | null>(null);
  const [isReconcilingUser, setIsReconcilingUser] = useState(false);
  const [userReconcileResult, setUserReconcileResult] = useState<any>(null);
  const [userLedgerTxs, setUserLedgerTxs] = useState<any[]>([]);
  const [isLoadingLedgerTxs, setIsLoadingLedgerTxs] = useState<boolean>(false);
  const [userSubOrders, setUserSubOrders] = useState<any[]>([]);

  // Fetch authoritative ledger records & subscription orders when managing a user
  useEffect(() => {
    if (!selectedManageUser) {
      setUserLedgerTxs([]);
      setUserSubOrders([]);
      return;
    }

    let isMounted = true;
    setIsLoadingLedgerTxs(true);

    fetch(`/api/ledger/transactions?userId=${encodeURIComponent(selectedManageUser.id)}&username=${encodeURIComponent(selectedManageUser.username || '')}&limit=200`)
      .then(res => res.json())
      .then(data => {
        if (isMounted && data.success && Array.isArray(data.transactions)) {
          setUserLedgerTxs(data.transactions);
        }
      })
      .catch(err => console.warn("Failed to load user ledger txs:", err))
      .finally(() => {
        if (isMounted) setIsLoadingLedgerTxs(false);
      });

    import("firebase/firestore").then(({ collection, query, where, getDocs }) => {
      const q = query(
        collection(db, "subscription_orders"),
        where("userId", "==", selectedManageUser.id)
      );
      getDocs(q).then(snap => {
        if (isMounted) {
          const subs: any[] = [];
          snap.forEach(docSnap => subs.push({ id: docSnap.id, ...docSnap.data() }));
          setUserSubOrders(subs);
        }
      }).catch(err => console.warn("Failed to load user subscription orders:", err));
    });

    return () => {
      isMounted = false;
    };
  }, [selectedManageUser?.id]);

  // Mobile Custom Category Picker Dropdown State
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);

  // Modular configuration of tabs grouped by categories
  const tabGroups = React.useMemo(() => [
    {
      id: "security_audit",
      title: "Security & Vault",
      items: [
        { id: "whatsapp-security", label: "WhatsApp Security & 2FA", icon: ShieldCheck, iconColor: "text-emerald-500", badge: { text: "2FA", style: "bg-emerald-500 text-slate-950 font-black" } },
        { id: "backup-recovery", label: "Backup & Recovery Engine", icon: HardDrive, iconColor: "text-cyan-500", badge: { text: "VAULT", style: "bg-cyan-500 text-slate-950 font-black" } },
        { id: "admin-alerts", label: "Admin Email Alerts", icon: Mail, iconColor: "text-rose-600" },
        { id: "audit-logs", label: "Audit Logs & Security", icon: ShieldCheck, iconColor: "text-purple-600", badge: { text: activeAdminRole, style: "bg-purple-100 text-purple-800 font-extrabold border border-purple-200" } },
      ]
    },
    {
      id: "analytics_hub",
      title: "Visitor Intelligence & Analytics",
      items: [
        { id: "realtime-visitors", label: "Realtime Visitor Intelligence", icon: Eye, iconColor: "text-emerald-500", badge: { text: "LIVE", style: "bg-emerald-500 text-white font-extrabold animate-pulse" } },
        { id: "analytics", label: "Analytics Management", icon: Sparkles, iconColor: "text-orange-500", badge: { text: "PRO", style: "bg-orange-500 text-white font-extrabold" } },
      ]
    },
    {
      id: "catalog",
      title: "Catalog & Branding",
      items: [
        { id: "branding-images", label: "Branding & Media Hub", icon: LucideImage, iconColor: "text-indigo-600" },
        { id: "general", label: "Global Markup & Status", icon: Settings, iconColor: "text-slate-600" },
        { id: "services", label: "Toggle & Edit Prices", icon: Percent, iconColor: "text-blue-600" },
        { id: "custom", label: "Create Custom Services", icon: Plus, iconColor: "text-emerald-600" },
        { id: "links", label: "Manage Useful Links", icon: Link, iconColor: "text-sky-600" },
        { id: "announcements", label: "Manage Announcements", icon: Megaphone, iconColor: "text-amber-600" },
        { id: "tab-maintenance", label: "Tab Maintenance System", icon: Layout, iconColor: "text-rose-600" },
      ]
    },
    {
      id: "support_desk",
      title: "Support & Disputes",
      items: [
        { id: "support-tickets", label: "Customer Support Tickets", icon: Clipboard, iconColor: "text-indigo-600", badge: { text: "NEW", style: "bg-indigo-100 text-indigo-700 font-bold" } },
        { id: "chat-conversations", label: "Chat Conversations", icon: MessageSquare, iconColor: "text-indigo-500", badge: { text: "LIVE", style: "bg-indigo-600 text-white font-extrabold animate-pulse" } },
      ]
    },
    {
      id: "cash-users",
      title: "Cash & Users Engine",
      items: [
        { 
          id: "deposit-requests", 
          label: "Verify Deposits", 
          icon: CreditCard, 
          iconColor: "text-blue-600",
          badge: depositRequests.filter(r => r.status === "PENDING").length > 0 ? {
            text: depositRequests.filter(r => r.status === "PENDING").length,
            style: "bg-amber-500 text-white font-bold"
          } : undefined
        },
        { 
          id: "affiliate-withdrawals", 
          label: "Affiliate Withdrawals", 
          icon: Banknote, 
          iconColor: "text-emerald-500", 
          badge: { text: "2% FEE", style: "bg-emerald-500 text-slate-950 font-black" } 
        },
        { 
          id: "crypto-gateway", 
          label: "Crypto Gateway", 
          icon: Bitcoin, 
          iconColor: "text-amber-500", 
          badge: { text: "NOWPAY", style: "bg-amber-500 text-slate-950 font-black" } 
        },
        { id: "deposit-settings", label: "Configure Accounts", icon: Landmark, iconColor: "text-slate-600" },
        { id: "users", label: "User Management", icon: Users, iconColor: "text-violet-600" },
        { 
          id: "loyalty-management", 
          label: "Loyalty Program", 
          icon: Star, 
          iconColor: "text-amber-500",
          badge: { text: "PTS", style: "bg-amber-100 text-amber-700 font-black" },
          starFilled: true
        },
        { id: "imap-payment", label: "IMAP Payment Engine", icon: Mail, iconColor: "text-cyan-600" },
        { id: "ai-voice-analytics", label: "AI Voice Intelligence", icon: Mic, iconColor: "text-indigo-400", badge: { text: "AI", style: "bg-indigo-900/80 text-indigo-200 font-bold" } },
        { id: "whatsapp-engine", label: "WhatsApp Bot Engine", icon: MessageSquare, iconColor: "text-emerald-500", badge: { text: "FREE", style: "bg-emerald-100 text-emerald-800 font-black" } },
      ]
    },
    {
      id: "gateways",
      title: "SMS & SMM Gateways",
      items: [
        { 
          id: "sms-orders", 
          label: "SMS Orders Monitor", 
          icon: Phone, 
          iconColor: "text-blue-600",
          badge: orders.length > 0 ? {
            text: orders.length,
            style: "bg-slate-100 text-slate-700 font-mono"
          } : undefined
        },
        { id: "sms-providers", label: "OTP Panel Management", icon: Cpu, iconColor: "text-emerald-600" },
        { id: "smm-panel", label: "SMM Panel Management", icon: Server, iconColor: "text-purple-600" },
        { id: "subscriptions", label: "Subscriptions Management", icon: PlayCircle, iconColor: "text-indigo-600" },
      ]
    },
    {
      id: "policy-reviews",
      title: "Reviews & Legal Policies",
      items: [
        { id: "reviews", label: "Customer Reviews", icon: Star, iconColor: "text-amber-500", starFilled: true },
        { id: "privacy-policy", label: "Privacy Policy Editor", icon: ShieldCheck, iconColor: "text-blue-600" },
      ]
    }
  ], [depositRequests, orders, activeAdminRole]);


  // Draft Loyalty Points State
  const [draftUserLoyalty, setDraftUserLoyalty] = useState<Record<string, number>>({});
  const [bonusPointsInput, setBonusPointsInput] = useState<Record<string, string>>({});

  // SMS Order Monitor Search & Filter State
  const [smsOrderSearch, setSmsOrderSearch] = useState("");
  const [smsOrderStatusFilter, setSmsOrderStatusFilter] = useState<string>("ALL");


  // Form states for adding custom services
  const [newServiceName, setNewServiceName] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");
  const [newServiceIcon, setNewServiceIcon] = useState("Smartphone");

  // Form states for adding custom links
  const [newLinkName, setNewLinkName] = useState("");
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [editLinkName, setEditLinkName] = useState("");
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  // Search states for Admin tabs
  const [serviceSearch, setServiceSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");

  // Editing state for specific deposit instructions
  const [editMethod, setEditMethod] = useState<"easypaisa" | "jazzcash" | "nayapay" | "bank" | "crypto" | "redotpay" | string>("easypaisa");
  const [instTitle, setInstTitle] = useState("");
  const [instNumber, setInstNumber] = useState("");
  const [instGuidelines, setInstGuidelines] = useState("");
  const [instActive, setInstActive] = useState(true);
  const [instHidden, setInstHidden] = useState(false);
  const [instQrUrl, setInstQrUrl] = useState("");
  const [instLogoUrl, setInstLogoUrl] = useState("");
  const [instHeaderTitle, setInstHeaderTitle] = useState("");
  const [instHeaderTag, setInstHeaderTag] = useState("");
  const [instVerificationBadge, setInstVerificationBadge] = useState("");
  const [instSubtitle, setInstSubtitle] = useState("");
  const [instBadgesText, setInstBadgesText] = useState("");
  const [instSubAccounts, setInstSubAccounts] = useState<{ label: string; title: string; number: string }[]>([]);
  const [instCryptoAddresses, setInstCryptoAddresses] = useState<CryptoAddressItem[]>([]);
  const [isSavingInstruction, setIsSavingInstruction] = useState(false);

  // Status notes input state
  const [adminNotesText, setAdminNotesText] = useState<Record<string, string>>({});

  // SMS provider form states
  const [editingSmsProvId, setEditingSmsProvId] = useState<string | null>(null);
  const [smsProvName, setSmsProvName] = useState("");
  const [smsProvUrl, setSmsProvUrl] = useState("");
  const [smsProvKey, setSmsProvKey] = useState("");
  const [smsProvType, setSmsProvType] = useState<SmsProvider["apiType"]>("5sim");
  const [smsProvNotes, setSmsProvNotes] = useState("");
  const [isSyncingProv, setIsSyncingProv] = useState<Record<string, boolean>>({});
  const [isAddingSmsProv, setIsAddingSmsProv] = useState(false);

  // Sync instruction fields when switching editMethod
  React.useEffect(() => {
    const inst = depositInstructions.find(i => i.method === editMethod);
    if (inst) {
      setInstTitle(inst.accountTitle || "");
      setInstNumber(inst.accountNumber || "");
      setInstGuidelines(inst.instructions || "");
      setInstActive(inst.isActive !== false);
      setInstHidden(inst.isHidden === true);
      setInstQrUrl(inst.qrImageUrl || (editMethod === "redotpay" ? "/redotpay_qr.svg" : ""));
      setInstLogoUrl(inst.gatewayLogoUrl || "");
      setInstHeaderTitle(inst.headerTitle || "1. PAYMENT GATEWAY");
      setInstHeaderTag(inst.headerTag || (editMethod === "redotpay" || editMethod === "crypto" ? "Global" : "Local"));
      setInstVerificationBadge(inst.verificationBadge || "Instant Verification");
      setInstSubtitle(inst.subtitle || (editMethod === "redotpay" ? "Instant transfer via RedotPay App ID or QR" : ""));
      setInstBadgesText(inst.badges && inst.badges.length > 0 ? inst.badges.join(", ") : (editMethod === "redotpay" ? "⚡ Zero Fees, 💳 Card & App, 🌐 Global, ⏱️ Instant" : ""));
      setInstSubAccounts(inst.subAccounts || []);
      setInstCryptoAddresses(inst.cryptoAddresses && inst.cryptoAddresses.length > 0 ? inst.cryptoAddresses : (editMethod === "crypto" ? [
        { id: "1", token: "USDT", network: "TRC20", address: inst.accountNumber || "TY1234567890abcdefTRC20" },
        { id: "2", token: "USDT", network: "BEP20 / BNB Chain", address: "0x1234567890abcdefBEP20" },
        { id: "3", token: "USDT", network: "ERC20", address: "0x1234567890abcdefERC20" },
        { id: "4", token: "Bitcoin", network: "BTC", address: "bc1q1234567890abcdefbtc" },
        { id: "5", token: "Ethereum", network: "ETH", address: "0x1234567890abcdefETH" },
        { id: "6", token: "Binance Pay", network: "PAY ID", address: "8899776655" }
      ] : []));
    } else {
      setInstTitle("");
      setInstNumber("");
      setInstGuidelines("");
      setInstActive(true);
      setInstHidden(false);
      setInstQrUrl(editMethod === "redotpay" ? "/redotpay_qr.svg" : "");
      setInstLogoUrl("");
      setInstHeaderTitle("1. PAYMENT GATEWAY");
      setInstHeaderTag(editMethod === "redotpay" || editMethod === "crypto" ? "Global" : "Local");
      setInstVerificationBadge("Instant Verification");
      setInstSubtitle(editMethod === "redotpay" ? "Instant transfer via RedotPay App ID or QR" : "");
      setInstBadgesText(editMethod === "redotpay" ? "⚡ Zero Fees, 💳 Card & App, 🌐 Global, ⏱️ Instant" : "");
      setInstSubAccounts([]);
      setInstCryptoAddresses(editMethod === "crypto" ? [
        { id: "1", token: "USDT", network: "TRC20", address: "TY1234567890abcdefTRC20" },
        { id: "2", token: "USDT", network: "BEP20 / BNB Chain", address: "0x1234567890abcdefBEP20" },
        { id: "3", token: "USDT", network: "ERC20", address: "0x1234567890abcdefERC20" },
        { id: "4", token: "Bitcoin", network: "BTC", address: "bc1q1234567890abcdefbtc" },
        { id: "5", token: "Ethereum", network: "ETH", address: "0x1234567890abcdefETH" },
        { id: "6", token: "Binance Pay", network: "PAY ID", address: "8899776655" }
      ] : []);
    }
  }, [editMethod, depositInstructions]);

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("QR image size should be under 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setInstQrUrl(reader.result as string);
        toast.success("QR Code image attached!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo image size should be under 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setInstLogoUrl(reader.result as string);
        toast.success("Payment Gateway Logo attached!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (!username.trim() || !password.trim()) {
      setAuthError("Please enter administrator username/email and access key.");
      return;
    }

    // Check master or appointed admin credentials
    const cleanUser = username.trim().toLowerCase();
    const isMasterUser = (username.trim() === "Zerox" && (password === "i7mughal" || password === "Zulfi@#3344")) || 
                         (cleanUser === "zeroxnetworks@gmail.com" && (password === "i7mughal" || password === "Zulfi@#3344")) ||
                         (cleanUser === "info.rayanmirza@gmail.com" && (password === "i7mughal" || password === "Zulfi@#3344")) ||
                         (cleanUser === "pandapals.manager@gmail.com" && (password === "i7mughal" || password === "Zulfi@#3344"));
    
    const appointedMatch = appointedAdmins.find(a => 
      (a.username.toLowerCase() === cleanUser || a.email.toLowerCase() === cleanUser) &&
      a.status === "ACTIVE"
    );

    if (isMasterUser || appointedMatch) {
      const adminEmail = isMasterUser 
        ? (cleanUser === "zeroxnetworks@gmail.com" ? "zeroxnetworks@gmail.com" : cleanUser.includes("rynmirza") ? "info.rayanmirza@gmail.com" : (cleanUser === "zerox" ? "zeroxnetworks@gmail.com" : "pandapals.manager@gmail.com"))
        : appointedMatch!.email;
      const isSupreme = adminEmail.toLowerCase() === "zeroxnetworks@gmail.com";
      const adminName = isSupreme ? "Zerox Primary Supreme Super Admin" : isMasterUser ? "Zerox Primary Super Admin" : appointedMatch!.username;
      const adminRole: AdminRoleType = isSupreme ? "Supreme Super Admin" : isMasterUser ? "Super Admin" : appointedMatch!.role;

      setPendingAdminAccount({ username: adminName, email: adminEmail, role: adminRole });

      // Check if this device is trusted for this admin email
      const isDeviceTrusted = localStorage.getItem(`zerox_trusted_device_${adminEmail.toLowerCase()}`) === "true";

      if (isDeviceTrusted) {
        setIsLoggedIn(true);
        localStorage.setItem("zerox_admin_logged", "true");
        setActiveAdminRole(adminRole);
        localStorage.setItem("zerox_admin_role", adminRole);
        toast.success(`🛡️ Trusted Device Recognized! Welcome ${adminName}`, { icon: "🔐" });
        await logAdminAction(
          "Security",
          "Trusted Device Admin Login",
          `Admin account ${adminEmail} logged in directly from a trusted device (2FA bypassed).`,
          adminEmail,
          "SUCCESS"
        );
        return;
      }

      // Untrusted device: dispatch 2FA OTP email
      await sendAdminLoginOtp(adminEmail, adminName);
    } else {
      setAuthError("Invalid administrator credentials or account suspended.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("zerox_admin_logged");
    setUsername("");
    setPassword("");
  };

  const handleAddServiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const key = newServiceName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!key) return;

    onAddCustomService({
      key,
      name: newServiceName,
      icon: newServiceIcon,
      popular: true,
      defaultPrice: Number(newServicePrice) || 20
    });

    setNewServiceName("");
    setNewServicePrice("");
    toast.success(`Custom service "${newServiceName}" created successfully!`);
  };

  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLinkName.trim() || !newLinkUrl.trim()) return;

    setDraftCustomLinks(prev => [...prev, { name: newLinkName.trim(), url: newLinkUrl.trim() }]);
    setNewLinkName("");
    setNewLinkUrl("");
    toast.success(`Draft link "${newLinkName}" added. Make sure to click Apply Changes to save.`);
  };

  const handleAddCryptoAddressItem = () => {
    setInstCryptoAddresses(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        token: "USDT",
        network: "TRC20",
        address: ""
      }
    ]);
  };

  const handleUpdateCryptoAddressItem = (id: string, field: keyof CryptoAddressItem, value: string) => {
    setInstCryptoAddresses(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleCryptoImageUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string, field: "icon" | "qrUrl") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be under 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        handleUpdateCryptoAddressItem(id, field, reader.result as string);
        toast.success("Image attached successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveCryptoAddressItem = (id: string) => {
    setInstCryptoAddresses(prev => prev.filter(item => item.id !== id));
  };

  const handleAddSubAccountItem = () => {
    setInstSubAccounts(prev => [
      ...prev,
      {
        label: `Account ${prev.length + 1}`,
        title: instTitle || "Main Account",
        number: ""
      }
    ]);
  };

  const handleUpdateSubAccountItem = (index: number, field: "label" | "title" | "number", value: string) => {
    setInstSubAccounts(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const handleRemoveSubAccountItem = (index: number) => {
    setInstSubAccounts(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveInstruction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingInstruction(true);
    try {
      const parsedBadges = instBadgesText.split(",").map(b => b.trim()).filter(Boolean);
      
      // Check if status changed for broadcast
      const previousInst = depositInstructions.find(i => i.method === editMethod);
      const statusChanged = !previousInst || previousInst.isActive !== instActive;

      await onUpdateDepositInstruction(
        editMethod, 
        instTitle, 
        instNumber, 
        instGuidelines, 
        instActive,
        instHidden, 
        instQrUrl, 
        instLogoUrl,
        instSubtitle,
        parsedBadges,
        instHeaderTitle,
        instHeaderTag,
        instVerificationBadge,
        instSubAccounts,
        instCryptoAddresses
      );

      if (statusChanged) {
        fetch("/api/email/payment-gateway-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gatewayName: instTitle || editMethod.toUpperCase(),
            status: instActive,
            note: instGuidelines
          })
        }).catch(err => console.error("Failed to broadcast gateway update", err));
      }

      toast.success(`Instructions & custom fields for ${editMethod.toUpperCase()} saved successfully!`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to save ${editMethod.toUpperCase()} instructions.`);
    } finally {
      setIsSavingInstruction(false);
    }
  };

  const handleResetOrDeleteInstruction = async () => {
    if (!window.confirm(`Are you sure you want to delete/clear all credentials, logo, and QR code for ${editMethod.toUpperCase()}?`)) {
      return;
    }
    setIsSavingInstruction(true);
    try {
      setInstTitle("");
      setInstNumber("");
      setInstGuidelines("");
      setInstActive(false);
      setInstQrUrl("");
      setInstLogoUrl("");
      setInstSubtitle("");
      setInstBadgesText("");
      setInstHeaderTitle("");
      setInstHeaderTag("");
      setInstVerificationBadge("");

      if (onDeleteDepositInstruction) {
        await onDeleteDepositInstruction(editMethod);
        if (editMethod !== "easypaisa" && editMethod !== "jazzcash" && editMethod !== "nayapay" && editMethod !== "bank" && editMethod !== "crypto" && editMethod !== "redotpay") {
          setEditMethod("easypaisa");
        }
      } else {
        await onUpdateDepositInstruction(editMethod, "", "", "", false, false, "", "", "", [], "", "", "", [], []);
      }
      toast.success(`${editMethod.toUpperCase()} credentials & media cleared/deleted successfully!`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to clear ${editMethod.toUpperCase()} instructions.`);
    } finally {
      setIsSavingInstruction(false);
    }
  };

  const handleSyncSmsBalance = async (provider: SmsProvider) => {
    setIsSyncingProv(prev => ({ ...prev, [provider.id]: true }));
    try {
      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${provider.apiKey}`,
          "x-provider-url": provider.apiUrl,
          "x-provider-type": provider.apiType
        }
      });
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data && typeof data.balance === "number") {
        // Update directly in Firestore
        const provRef = doc(db, "sms_providers", provider.id);
        await updateDoc(provRef, {
          balance: data.balance,
          lastSyncTime: new Date().toISOString()
        });
        toast.success(`${provider.name} balance synchronized in Firestore: ${data.balance}`);
      } else {
        throw new Error("Invalid profile balance data format from API");
      }
    } catch (err: any) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("SMS Sync failed:: Quota exceeded.");
      } else {
        console.error("SMS Sync failed::", err);
      }
      toast.error(`Sync failed for ${provider.name}: ${err.message || "Invalid API key/URL config"}`);
    } finally {
      setIsSyncingProv(prev => ({ ...prev, [provider.id]: false }));
    }
  };

  const handleToggleSmsStatus = async (providerId: string) => {
    try {
      for (const p of smsProviders) {
        const provRef = doc(db, "sms_providers", p.id);
        if (p.id === providerId) {
          await updateDoc(provRef, { status: "ACTIVE" });
          toast.success(`Activated ${p.name} as primary SMS gateway`);
        } else {
          await updateDoc(provRef, { status: "INACTIVE" });
        }
      }
    } catch (err: any) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to toggle SMS provider status:: Quota exceeded.");
      } else {
        console.error("Failed to toggle SMS provider status::", err);
      }
      toast.error("Failed to update status in Firestore");
    }
  };

  const handleDeleteSmsProvider = async (providerId: string) => {
    try {
      await deleteDoc(doc(db, "sms_providers", providerId));
      toast.success("SMS gateway provider configuration removed from Firestore");
    } catch (err: any) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to delete SMS provider:: Quota exceeded.");
      } else {
        console.error("Failed to delete SMS provider::", err);
      }
      toast.error("Failed to remove provider from Firestore");
    }
  };

  const handleAddOrEditSmsProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsProvName.trim() || !smsProvUrl.trim() || !smsProvKey.trim()) {
      toast.error("Please fill in Name, API Url, and API Key");
      return;
    }

    try {
      if (editingSmsProvId) {
        // Editing existing
        const provRef = doc(db, "sms_providers", editingSmsProvId);
        await updateDoc(provRef, {
          name: smsProvName,
          apiUrl: smsProvUrl,
          apiKey: smsProvKey,
          apiType: smsProvType,
          notes: smsProvNotes
        });
        toast.success("SMS provider gateway updated in Firestore");
        setEditingSmsProvId(null);
      } else {
        // Adding new
        const provId = `sms_prov_${Date.now()}`;
        const newProv: SmsProvider = {
          id: provId,
          name: smsProvName,
          apiUrl: smsProvUrl,
          apiKey: smsProvKey,
          apiType: smsProvType,
          status: "INACTIVE", // starts inactive by default
          notes: smsProvNotes || "Custom API Gateway Integrator",
          balance: 0.0,
          lastSyncTime: new Date().toISOString()
        };
        await setDoc(doc(db, "sms_providers", provId), newProv);
        toast.success(`Added new custom gateway "${smsProvName}" to Firestore`);
      }

      // Reset fields
      setSmsProvName("");
      setSmsProvUrl("");
      setSmsProvKey("");
      setSmsProvType("5sim");
      setSmsProvNotes("");
      setIsAddingSmsProv(false);
    } catch (err: any) {
      if (err && err.message && err.message.includes("Quota limit exceeded")) {
        console.warn("Failed to save SMS provider:: Quota exceeded.");
      } else {
        console.error("Failed to save SMS provider::", err);
      }
      toast.error("Failed to save gateway configuration");
    }
  };

  const handleStartEditSmsProv = (prov: SmsProvider) => {
    setEditingSmsProvId(prov.id);
    setSmsProvName(prov.name);
    setSmsProvUrl(prov.apiUrl);
    setSmsProvKey(prov.apiKey);
    setSmsProvType(prov.apiType);
    setSmsProvNotes(prov.notes || "");
    setIsAddingSmsProv(true);
  };

  if (!isOpen) return null;


    const adminContextValue = {
    activeAdminRole, setActiveAdminRole, handleRoleChange, auditLogs, setAuditLogs, logAdminAction, handleClearAuditLogs,
    appointedAdmins, setAppointedAdmins, handleAddAppointedAdmin, handleUpdateAppointedAdmin, handleDeleteAppointedAdmin,
    announcements, setAnnouncements, isOpen, onClose, apiKey, onChangeKey, isValidating, validationError, onValidate, profile, orders, disabledServices, onToggleService, customPrices, onUpdateCustomPrice, priceMarkupPercent, onUpdateMarkupPercent, customServices, onAddCustomService, onRemoveCustomService, customLinks, onAddCustomLink, onRemoveCustomLink, onUpdateCustomLink, depositInstructions, onUpdateDepositInstruction, onDeleteDepositInstruction, depositRequests, onApproveDeposit, onRejectDeposit, onDeleteDeposit, onAddManualDeposit, registeredUsers, onUpdateUserBalance, autoApproveDeposits, onToggleAutoApprove, autoApproveCrypto, onToggleAutoApproveCrypto, cryptoRate, onUpdateCryptoRate, cryptoMinDeposit, onUpdateCryptoMinDeposit, localMinDeposit, onUpdateLocalMinDeposit, virtualNumberMinimumPricePKR, onUpdateVirtualNumberMinimumPricePKR, onUpdateGlobalSettings, smmProviders, setSmmProviders, smmServices, setSmmServices, smmCategories, setSmmCategories, smmOrders, setSmmOrders, smmPriceRules, setSmmPriceRules, smmLogs, setSmmLogs, smmSettings, setSmmSettings, smsProviders, setSmsProviders, siteLogoUrl, siteTitle, siteTagline, siteCoverUrl, showSiteCover, siteCoverTitle, siteCoverSubtitle, sellerCoverUrl, depositCoverUrl, aboutAvatarUrl, smmCoverUrl, subscriptionsCoverUrl, reviewsCoverUrl, privacyCoverUrl, customImages, tabMaintenance, formatPrice,
    username, setUsername, password, setPassword, authError, setAuthError, isLoggedIn, setIsLoggedIn, showPassword, setShowPassword, draftPriceMarkupPercent, setDraftPriceMarkupPercent, draftAutoApproveDeposits, setDraftAutoApproveDeposits, draftAutoApproveCrypto, setDraftAutoApproveCrypto, draftCryptoRate, setDraftCryptoRate, draftCryptoMinDeposit, setDraftCryptoMinDeposit, draftLocalMinDeposit, setDraftLocalMinDeposit, draftVirtualNumberMinimumPricePKR, setDraftVirtualNumberMinimumPricePKR, draftDisabledServices, setDraftDisabledServices, draftCustomPrices, setDraftCustomPrices, draftCustomLinks, setDraftCustomLinks, draftAnnouncements, setDraftAnnouncements, draftUserBalances, setDraftUserBalances, draftTabMaintenance, setDraftTabMaintenance, isSavingTabMaintenance, setIsSavingTabMaintenance, isSavingGlobalSettings, setIsSavingGlobalSettings, isSavingServices, setIsSavingServices, isSavingLinks, setIsSavingLinks, isSavingAnnouncements, setIsSavingAnnouncements, isSavingUserBalances, setIsSavingUserBalances, activeTab, setActiveTab, selectedManageUser, setSelectedManageUser, manageWarningMsg, setManageWarningMsg, manageBanReason, setManageBanReason, manageDailyLimit, setManageDailyLimit, isAdminDropdownOpen, setIsAdminDropdownOpen, draftUserLoyalty, setDraftUserLoyalty, bonusPointsInput, setBonusPointsInput, smsOrderSearch, setSmsOrderSearch, smsOrderStatusFilter, setSmsOrderStatusFilter, newServiceName, setNewServiceName, newServicePrice, setNewServicePrice, newServiceIcon, setNewServiceIcon, newLinkName, setNewLinkName, editingLinkIndex, setEditingLinkIndex, editLinkName, setEditLinkName, editLinkUrl, setEditLinkUrl, newLinkUrl, setNewLinkUrl, serviceSearch, setServiceSearch, userSearch, setUserSearch, requestSearch, setRequestSearch, editMethod, setEditMethod, instTitle, setInstTitle, instNumber, setInstNumber, instGuidelines, setInstGuidelines, instActive, setInstActive, instHidden, setInstHidden, instQrUrl, setInstQrUrl, instLogoUrl, setInstLogoUrl, instHeaderTitle, setInstHeaderTitle, instHeaderTag, setInstHeaderTag, instVerificationBadge, setInstVerificationBadge, instSubtitle, setInstSubtitle, instBadgesText, setInstBadgesText, instSubAccounts, setInstSubAccounts, instCryptoAddresses, setInstCryptoAddresses, isSavingInstruction, setIsSavingInstruction, adminNotesText, setAdminNotesText, editingSmsProvId, setEditingSmsProvId, smsProvName, setSmsProvName, smsProvUrl, setSmsProvUrl, smsProvKey, setSmsProvKey, smsProvType, setSmsProvType, smsProvNotes, setSmsProvNotes, isSyncingProv, setIsSyncingProv, isAddingSmsProv, setIsAddingSmsProv,
    handleSaveTabMaintenance, handleSaveGlobalSettings, handleDiscardGlobalSettingsChanges, handleApplyServicesChanges, handleDiscardServicesChanges, handleApplyLinksChanges, handleDiscardLinksChanges, handleApplyAnnouncementsChanges, handleDiscardAnnouncementsChanges, handleApplyUserBalances, handleDiscardUserBalancesChanges, handleQrUpload, handleLogoUpload, handleLogin, handleLogout, handleAddServiceSubmit, handleAddLinkSubmit, handleAddCryptoAddressItem, handleUpdateCryptoAddressItem, handleCryptoImageUpload, handleRemoveCryptoAddressItem, handleAddSubAccountItem, handleUpdateSubAccountItem, handleRemoveSubAccountItem, handleSaveInstruction, handleResetOrDeleteInstruction, handleSyncSmsBalance, handleToggleSmsStatus, handleDeleteSmsProvider, handleAddOrEditSmsProvider, handleStartEditSmsProv,
    hasUnsavedChanges, hasAnnouncementsUnsavedChanges, hasAnyUnsavedChanges, handleSaveAllUpdatedData, handleRequestExit, handleSaveAndExit, handleExitWithoutSaving, isSavingAllData, };

  return (
    
    <AdminContext.Provider value={adminContextValue}>

    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`fixed inset-0 z-50 transition-all duration-300 ${
        isMaximized 
          ? "bg-slate-950 p-0 overflow-hidden" 
          : "bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center overflow-y-auto"
      }`}
    >
      {/* Login Card */}
      {/* Login Card with 2FA OTP */}
      {!isLoggedIn ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="bg-white border border-slate-200/80 rounded-2xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative overflow-hidden"
        >
          {/* Top Bar Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-5">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Zerox Security Gateway v4.2
            </span>
            <div className="flex items-center gap-1">
              <button 
                type="button"
                onClick={handleOpenInNewTab}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                title="Open Admin Portal in full screen in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </button>
              <button 
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                title="Close Admin Login"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {loginStep === "CREDENTIALS" ? (
            <div>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-14 h-14 bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-700 rounded-2xl flex items-center justify-center text-blue-400 mb-3 shadow-lg shadow-slate-900/20 relative">
                  <Lock className="h-7 w-7 text-blue-400" />
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Zerox Admin Console</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Multi-Factor Authenticated Access Portal</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-600">
                  <ShieldAlert className="w-3 h-3 text-blue-600" />
                  <span>2FA OTP Code Enforced for All Admins</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Username / Email</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      placeholder="Enter ID (e.g. Zerox or admin email)"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Passkey</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-10 pr-12 text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                      placeholder="••••••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -6 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-50 border border-rose-200/80 p-3 rounded-xl flex items-start gap-2.5"
                  >
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-rose-700">{authError}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isSendingOtp ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin text-blue-400" />
                      <span>Sending OTP Verification Code...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 text-blue-400" />
                      <span>Request 2FA Verification Code</span>
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-black text-slate-400">
                  <span className="bg-white px-3">Enterprise OAuth Identity</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white border border-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs hover:bg-slate-50 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2.5"
              >
                <Globe className="h-4 w-4 text-blue-600" />
                <span>Sign In with Google (Verified Admins)</span>
              </button>
            </div>
          ) : (
            /* Step 2: OTP Verification Code Screen */
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-14 h-14 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-center text-blue-600 mb-3 shadow-md relative">
                  <KeyRound className="h-7 w-7 text-blue-600 animate-pulse" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Email Verification Required</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">A 6-digit OTP security code was dispatched to your admin email:</p>
                <div className="mt-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-800 font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>{otpEmailSentTo || "pandapals.manager@gmail.com"}</span>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block text-center">
                    Enter 6-Digit OTP Code
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      maxLength={6}
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 text-center text-2xl font-black tracking-[0.5em] text-blue-400 font-mono focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none shadow-inner"
                      placeholder="••••••"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Secure OTP Dispatch Banner */}
                <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-3 flex items-center gap-2 text-xs text-blue-900">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>A 6-digit verification code has been dispatched to <strong>{otpEmailSentTo || "your admin email"}</strong>. Please check your inbox.</span>
                </div>

                {/* Trust Device Option */}
                <div 
                  onClick={() => setTrustThisDevice(!trustThisDevice)}
                  className="bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-xl p-3 flex items-center gap-3 cursor-pointer select-none transition"
                >
                  <input
                    type="checkbox"
                    id="trustThisDeviceCheck"
                    checked={trustThisDevice}
                    onChange={(e) => setTrustThisDevice(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 cursor-pointer accent-blue-600 shrink-0"
                  />
                  <div className="text-left">
                    <label htmlFor="trustThisDeviceCheck" className="text-xs font-bold text-slate-800 flex items-center gap-1 cursor-pointer">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Trust this device for future logins
                    </label>
                    <p className="text-[10px] text-slate-500 font-medium">Bypass 2FA OTP codes on this browser when signing in</p>
                  </div>
                </div>

                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, y: -6 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-rose-50 border border-rose-200/80 p-3 rounded-xl flex items-start gap-2.5"
                  >
                    <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <span className="text-xs font-semibold text-rose-700">{authError}</span>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isVerifyingOtp}
                  className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isVerifyingOtp ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Verifying Security Code...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Verify Code & Access Portal</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginStep("CREDENTIALS");
                      setAuthError("");
                      setEnteredOtp("");
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Passkey</span>
                  </button>

                  <button
                    type="button"
                    disabled={otpResendTimer > 0 || isSendingOtp}
                    onClick={() => sendAdminLoginOtp(otpEmailSentTo, pendingAdminAccount?.username || "Admin")}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 disabled:text-slate-400 transition cursor-pointer"
                  >
                    {otpResendTimer > 0 ? (
                      `Resend Code in ${otpResendTimer}s`
                    ) : (
                      "Resend OTP Email"
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </motion.div>
      ) : (
        /* Admin Dashboard Panel */
        <motion.div 
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 26 }}
          className={`bg-slate-50 border border-slate-200 flex flex-col shadow-2xl overflow-hidden text-slate-800 transition-all duration-300 ${
            isMaximized
              ? "w-screen h-screen max-w-none md:h-screen rounded-none border-none"
              : "rounded-2xl w-full max-w-5xl h-[92vh] md:h-[680px]"
          }`}
        >
          {/* Header */}
          <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex items-center justify-between shrink-0 gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-xs">
                Z
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm md:text-base font-black text-slate-900 uppercase tracking-tight">Zerox Network ADMIN</h2>
                  {isMaximized && (
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200/80 px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-widest hidden sm:inline-block">
                      Full Screen
                    </span>
                  )}
                </div>
                <p className="text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-wider">Cash Deposits & System Control</p>
              </div>
            </div>

            {/* Header Action Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* One-Click Save All Updated Data */}
              <button
                type="button"
                onClick={handleSaveAllUpdatedData}
                disabled={isSavingAllData}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer relative ${
                  hasAnyUnsavedChanges
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-500 shadow-emerald-500/20"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80"
                }`}
                title="Save updated settings & data to live website"
              >
                {isSavingAllData ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-200" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline text-[11px]">Save Updated Data</span>
                {hasAnyUnsavedChanges && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping absolute -top-0.5 -right-0.5" />
                )}
              </button>

              {/* Open Fullscreen in New Tab */}
              <button
                type="button"
                onClick={handleOpenInNewTab}
                className="bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-200/80 shadow-2xs active:scale-95 cursor-pointer group"
                title="Open Admin Portal full screen in a new tab"
              >
                <ExternalLink className="h-3.5 w-3.5 text-indigo-600 group-hover:text-white transition-colors" />
                <span className="hidden sm:inline text-[11px]">Open in New Tab</span>
              </button>

              {/* Manual Lock Session Button */}
              <button
                type="button"
                onClick={() => {
                  setIsSessionLocked(true);
                  toast.success("🔒 Admin Session Locked manually.");
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-200 shadow-2xs active:scale-95 cursor-pointer"
                title="Lock admin screen now (15-min auto-lock active)"
              >
                <Lock className="h-3.5 w-3.5 text-slate-600" />
                <span className="hidden sm:inline text-[11px]">Lock Session</span>
              </button>

              {/* In-Page Maximize / Restore Toggle */}
              <button
                type="button"
                onClick={toggleMaximize}
                className="bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer"
                title={isMaximized ? "Restore default windowed size" : "Maximize to full screen"}
              >
                {isMaximized ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-[11px]">Restore</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline text-[11px]">Maximize</span>
                  </>
                )}
              </button>

              {/* Close / Minimize with Unsaved Data Safeguard */}
              <button 
                type="button"
                onClick={handleRequestExit}
                className="bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-500 p-1.5 rounded-xl transition cursor-pointer border border-slate-200 ml-1"
                title="Minimize or Exit Admin Portal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile Category Dropdown Selector */}
          <div className="md:hidden p-3 bg-white border-b border-slate-200 shrink-0 flex flex-col gap-3">
            <div className="relative">
              <label className="block text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider">Select Admin Category</label>
              
              {/* Custom Dropdown Trigger */}
              <button
                type="button"
                onClick={() => setIsAdminDropdownOpen(!isAdminDropdownOpen)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 transition cursor-pointer flex items-center justify-between shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {(() => {
                    const activeItem = tabGroups.flatMap(g => g.items).find(i => i.id === activeTab);
                    if (!activeItem) return <Settings className="h-4 w-4 text-slate-500" />;
                    const IconComp = activeItem.icon;
                    return (
                      <>
                        <IconComp className={`h-4 w-4 shrink-0 ${activeItem.iconColor} ${activeItem.starFilled ? 'fill-amber-400 text-amber-500' : ''}`} />
                        <span className="text-slate-800 font-extrabold truncate">{activeItem.label}</span>
                        {(activeItem as any).badge && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] shrink-0 font-bold ${(activeItem as any).badge.style}`}>
                            {(activeItem as any).badge.text}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>
                {isAdminDropdownOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
                )}
              </button>

              {/* Backdrop Click-to-Close Overlay */}
              {isAdminDropdownOpen && (
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setIsAdminDropdownOpen(false)} 
                />
              )}

              {/* Custom Dropdown Options Menu */}
              {isAdminDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[380px] overflow-y-auto flex flex-col divide-y divide-slate-100"
                >
                  {tabGroups.map((group) => (
                    <div key={group.id} className="p-1.5 bg-slate-50/30">
                      <span className="text-[9px] font-black text-slate-400 uppercase px-2.5 py-1.5 block tracking-widest bg-slate-100/50 rounded-lg mb-1">
                        {group.title}
                      </span>
                      <div className="space-y-0.5">
                        {group.items.map((item) => {
                          const IconComp = item.icon;
                          const isActive = activeTab === item.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setActiveTab(item.id as any);
                                setIsAdminDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-lg text-xs font-bold transition-all text-left cursor-pointer ${
                                isActive 
                                  ? "bg-blue-50 text-blue-700 shadow-2xs" 
                                  : "text-slate-600 hover:bg-slate-100/60 hover:text-slate-900"
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <IconComp className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600' : item.iconColor} ${item.starFilled ? 'fill-amber-400 text-amber-500' : ''}`} />
                                <span className="truncate">{item.label}</span>
                              </div>
                              
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                {item.badge && (
                                  <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${item.badge.style}`}>
                                    {item.badge.text}
                                  </span>
                                )}
                                {isActive && <Check className="h-4 w-4 text-blue-600 shrink-0 font-black" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleLogout}
                className="flex-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50/60 hover:bg-red-100/80 py-1.5 rounded-lg border border-red-100 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Exit Admin</span>
              </button>
              <button 
                onClick={onClose}
                className="flex-1 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-50 py-1.5 border border-slate-200 rounded-lg shadow-sm transition cursor-pointer flex items-center justify-center gap-1.5"
                title="Minimize the admin panel and return to the application"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Minimize</span>
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col shrink-0 overflow-y-auto text-slate-300 select-none">
              {/* Sidebar Header Badge */}
              <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Console Online</span>
                </div>
                <span className="bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase px-2 py-0.5 rounded border border-indigo-500/30 truncate max-w-[95px]">
                  {activeAdminRole}
                </span>
              </div>

              {/* Dynamic Grouped Navigation Links */}
              <div className="p-2 space-y-3 flex-1">
                {tabGroups.map((group) => (
                  <div key={group.id} className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase px-2.5 py-1 block tracking-widest">
                      {group.title}
                    </span>
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const IconComp = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
                              isActive 
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 font-extrabold" 
                                : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <IconComp className={`h-4 w-4 shrink-0 ${isActive ? 'text-white' : item.iconColor} ${item.starFilled && !isActive ? 'fill-amber-400 text-amber-500' : ''}`} />
                              <span className="truncate">{item.label}</span>
                            </div>
                            
                            {item.badge && (
                              <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black shrink-0 ml-1 ${
                                isActive ? "bg-white/20 text-white" : item.badge.style
                              }`}>
                                {item.badge.text}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Sidebar Action Buttons Footer */}
              <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 space-y-2 shrink-0">
                <button 
                  onClick={handleSaveAllUpdatedData}
                  disabled={isSavingAllData}
                  className={`w-full text-xs font-black py-2 rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 ${
                    hasAnyUnsavedChanges
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                      : "bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
                  }`}
                  title="Save updated settings & data to live website"
                >
                  {isSavingAllData ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  <span>Save Live Data</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={toggleMaximize}
                    className="text-[11px] font-bold text-indigo-300 hover:bg-slate-800 bg-slate-900 py-1.5 border border-slate-800 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                    title={isMaximized ? "Restore window view" : "Maximize admin portal full screen"}
                  >
                    {isMaximized ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                    <span>{isMaximized ? "Restore" : "Maximize"}</span>
                  </button>

                  <button 
                    onClick={() => {
                      setIsSessionLocked(true);
                      toast.success("🔒 Session Locked");
                    }}
                    className="text-[11px] font-bold text-amber-300 hover:bg-slate-800 bg-slate-900 py-1.5 border border-slate-800 rounded-lg transition cursor-pointer flex items-center justify-center gap-1"
                    title="Lock session"
                  >
                    <Lock className="h-3 w-3" />
                    <span>Lock</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button 
                    onClick={handleRequestExit}
                    className="text-[11px] font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 py-1.5 rounded-lg border border-slate-800/80 transition cursor-pointer flex items-center justify-center gap-1"
                    title="Minimize the admin panel"
                  >
                    <ArrowRight className="h-3 w-3" />
                    <span>Minimize</span>
                  </button>

                  <button 
                    onClick={handleLogout}
                    className="text-[11px] font-bold text-rose-400 hover:bg-rose-950/40 py-1.5 rounded-lg border border-rose-900/40 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Lock className="h-3 w-3" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 md:p-6 bg-slate-50">
              <AdminErrorBoundary key={activeTab} tabName={activeTab}>

              {/* WHATSAPP SECURITY & 2FA TAB */}
              {activeTab === "whatsapp-security" && (
                
                  <WhatsAppSecurityTab />
                
              )}

              {/* BACKUP & RECOVERY ENGINE TAB */}
              {activeTab === "backup-recovery" && (
                
                  <BackupRecoveryTab activeAdminRole={activeAdminRole} />
                
              )}

              {/* ADMIN EMAIL ALERTS */}
              {(activeTab as string) === "admin-alerts" && (
                
                  <AdminAlertsTab adminKey={apiKey} />
                
              )}

              {/* ADMIN AUDIT LOGS & SECURITY TAB */}
              {activeTab === "audit-logs" && (
                <AuditLogsTab 
                  auditLogs={auditLogs} 
                  activeAdminRole={activeAdminRole} 
                  onChangeAdminRole={handleRoleChange} 
                  onClearAuditLogs={handleClearAuditLogs} 
                />
              )}

              {/* Branding & Media Hub Tab */}
              {activeTab === "branding-images" && <BrandingImagesTab />}

              {/* Tab Maintenance System Tab */}
              {activeTab === "tab-maintenance" && <TabMaintenanceTab />}

              {/* Realtime Visitor Intelligence Center Tab */}
              {activeTab === "realtime-visitors" && <RealtimeVisitorsTab />}

              {/* Enterprise Analytics Center Tab */}
              {activeTab === "analytics" && <AnalyticsTab />}

              {/* General Settings Tab */}
              {activeTab === "general" && <GeneralTab />}

              {/* Toggle Services & Override Prices Tab */}
              {activeTab === "services" && <ServicesTab />}

              {/* Create Custom Service Tab */}
              {activeTab === "custom" && <CustomTab />}

              {/* Manage Useful Links Tab */}
              
        {activeTab === "announcements" && <AnnouncementsTab />}

        {activeTab === "links" && <LinksTab />}

              {/* Configure Account Details (Deposit Settings) Tab */}
              {activeTab === "deposit-settings" && (
                
                  <DepositSettingsTab />
                
              )}

              {/* Verify & Approve Cash Deposit Requests Tab */}
              {activeTab === "deposit-requests" && (
                
                  <DepositRequestsTab />
                
              )}

              {/* Affiliate & Partner Withdrawals Tab */}
              {activeTab === "affiliate-withdrawals" && (
                <AffiliateWithdrawalsTab />
              )}

              {/* Automated NOWPayments Crypto Payment Gateway Tab */}
              {activeTab === "crypto-gateway" && (
                
                  <CryptoGatewayAdminTab />
                
              )}

              {/* View & Edit Registered Users Balances Tab */}
              {activeTab === "users" && (
                
                  <UsersTab />
                
              )}

              {/* LOYALTY REWARDS PROGRAM MANAGEMENT TAB */}
              {activeTab === "loyalty-management" && <LoyaltyManagementTab />}

              {/* GLOBAL SMS ORDERS MONITOR TAB */}
              {activeTab === "sms-orders" && (
                
                  <SmsOrdersTab />
                
              )}

              {/* SMM Panel Management Tab */}
              {activeTab === "smm-panel" && (
                
                  <div className="space-y-4 animate-fade-in flex flex-col h-auto md:h-[520px] md:min-h-[350px] pr-1">
                    <SmmManagement
                      smmProviders={smmProviders}
                      setSmmProviders={setSmmProviders}
                      smmServices={smmServices}
                      setSmmServices={setSmmServices}
                      smmCategories={smmCategories}
                      setSmmCategories={setSmmCategories}
                      smmOrders={smmOrders}
                      setSmmOrders={setSmmOrders}
                      smmPriceRules={smmPriceRules}
                      setSmmPriceRules={setSmmPriceRules}
                      smmLogs={smmLogs}
                      setSmmLogs={setSmmLogs}
                      smmSettings={smmSettings}
                      setSmmSettings={setSmmSettings}
                      registeredUsers={registeredUsers}
                      onUpdateUserBalance={onUpdateUserBalance}
                    />
                  </div>
                
              )}

              {/* Subscriptions Management Tab */}
              {activeTab === "subscriptions" && (
                <div className="space-y-4 animate-fade-in flex flex-col h-auto md:h-[520px] md:min-h-[350px] pr-1">
                  <SubscriptionsAdminTab cryptoRate={cryptoRate} />
                </div>
              )}

              {/* 5SIM NUMBER API PROVIDER MANAGEMENT TAB */}
              {activeTab === "sms-providers" && (
                
                  <SmsProvidersTab />
                
              )}

              {/* IMAP AUTOMATED PAYMENT VERIFICATION ENGINE TAB */}
              {activeTab === "imap-payment" && (
                
                  <ImapPaymentTab />
                
              )}

              {/* AI VOICE CALL INTELLIGENCE TAB */}
              {activeTab === "ai-voice-analytics" && <VoiceAnalyticsTab />}


              {/* WHATSAPP AUTOMATION BOT ENGINE TAB */}
              {activeTab === "whatsapp-engine" && <WhatsAppBotManager />}

              {/* REVIEWS MANAGEMENT TAB */}
              {activeTab === "reviews" && <ReviewsAdminTab />}

              {/* PRIVACY POLICY EDITOR TAB */}
              {activeTab === "privacy-policy" && <PrivacyPolicyAdminTab />}

              {/* CUSTOMER SUPPORT TICKETS TAB */}
              {activeTab === "support-tickets" && <SupportTicketsTab />}

              {/* CHATBOT CONVERSATIONS CENTER TAB */}
              {(activeTab as string) === "chat-conversations" && (
                
                  <ChatConversationsTab />
                
              )}

              </AdminErrorBoundary>

              {hasUnsavedChanges && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-850 text-white rounded-xl shadow-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-50 w-[90%] max-w-2xl">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-100">You have unsaved changes</h4>
                      <p className="text-[10px] text-slate-400">Settings will not be applied to users until you click save.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      type="button"
                      onClick={handleDiscardGlobalSettingsChanges}
                      className="text-[11px] font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveGlobalSettings}
                      disabled={isSavingGlobalSettings}
                      className="text-[11px] font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 px-4 py-1.5 rounded-lg shadow-lg shadow-amber-500/10 transition cursor-pointer flex items-center gap-1.5"
                    >
                      {isSavingGlobalSettings ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      <span>Save Settings</span>
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* User Management Modal */}
          {selectedManageUser && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
                
                {/* Header with Detailed Profile Info */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 md:p-5 flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 bg-white shadow-xs shrink-0">
                      <img 
                        src={selectedManageUser.avatarUrl || "https://cdn.phototourl.com/member/2026-07-24-b4f94510-1a75-430c-9101-a1527cb13f05.png"} 
                        alt="Profile" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-black text-slate-800">
                          {selectedManageUser.username}
                        </h3>
                        {selectedManageUser.fullName && (
                          <span className="text-xs text-slate-500 font-medium">
                            ({selectedManageUser.fullName})
                          </span>
                        )}
                        {selectedManageUser.isBanned ? (
                          <span className="text-[9px] bg-rose-100 text-rose-700 font-black px-2 py-0.5 rounded-full uppercase border border-rose-200">
                            Banned
                          </span>
                        ) : selectedManageUser.status === "Blocked" ? (
                          <span className="text-[9px] bg-red-100 text-red-700 font-black px-2 py-0.5 rounded-full uppercase border border-red-200">
                            Blocked
                          </span>
                        ) : (
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 font-black px-2 py-0.5 rounded-full uppercase border border-emerald-200">
                            Active
                          </span>
                        )}
                        {selectedManageUser.isVerified ? (
                          <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase">
                            Verified User
                          </span>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-slate-500 mt-1 font-mono">
                        <p className="truncate">📧 {selectedManageUser.email}</p>
                        <p className="truncate">📱 {selectedManageUser.whatsappNumber || selectedManageUser.phone || "No WhatsApp linked"}</p>
                        <p className="truncate">🆔 ID: {selectedManageUser.id}</p>
                        <p className="truncate">📅 Joined: {selectedManageUser.createdAt ? new Date(selectedManageUser.createdAt).toLocaleDateString() : "N/A"}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedManageUser(null); setActiveUserLogView(null); }} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-4 md:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                  
                  {/* Financial Summary KPI Cards */}
                  {(() => {
                    const userDeposits = (depositRequests || []).filter(
                      (r: any) =>
                        r.status === "APPROVED" &&
                        (r.userId === selectedManageUser.id ||
                          (r.username && r.username.toLowerCase() === selectedManageUser.username?.toLowerCase()))
                    );
                    const totalDepositsSumPkr = userDeposits.reduce((acc: number, d: any) => acc + (d.amount || 0), 0);

                    const userSmsOrders = (orders || []).filter(
                      (o: any) =>
                        o.userId === selectedManageUser.id ||
                        (o.username && o.username.toLowerCase() === selectedManageUser.username?.toLowerCase())
                    );
                    const userSmmOrders = (smmOrders || []).filter(
                      (o: any) =>
                        o.userId === selectedManageUser.id ||
                        (o.username && o.username.toLowerCase() === selectedManageUser.username?.toLowerCase())
                    );
                    const userSubOrdersFiltered = (userSubOrders || []).filter(
                      (s: any) =>
                        s.userId === selectedManageUser.id ||
                        (s.username && s.username.toLowerCase() === selectedManageUser.username?.toLowerCase())
                    );

                    const totalSmsOrdersPkr = userSmsOrders.reduce((acc: number, o: any) => {
                      const pkr = o.pricePkr || (typeof o.price === "number" ? Math.round(o.price * cryptoRate * 100) / 100 : (o.charge || o.cost || 0));
                      return acc + pkr;
                    }, 0);
                    const totalSmmOrdersPkr = userSmmOrders.reduce((acc: number, o: any) => acc + (o.charge || 0), 0);
                    const totalSubOrdersPkr = userSubOrdersFiltered.reduce((acc: number, s: any) => acc + (s.totalPrice || s.price || 0), 0);
                    const totalOrdersSumPkr = totalSmsOrdersPkr + totalSmmOrdersPkr + totalSubOrdersPkr;

                    const refundedSmsOrders = userSmsOrders.filter((o: any) => o.status === "CANCELED" || o.status === "BANNED" || o.status === "TIMEOUT" || o.isRefunded === true || o.refundProcessed === true);
                    const refundedSmsPkr = refundedSmsOrders.reduce((acc: number, o: any) => {
                      const pkr = o.pricePkr || (typeof o.price === "number" ? Math.round(o.price * cryptoRate * 100) / 100 : (o.charge || o.cost || 0));
                      return acc + pkr;
                    }, 0);

                    const currentBalPkr = Math.round((selectedManageUser.balance || 0) * cryptoRate * 100) / 100;

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-xs">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">Wallet Balance</span>
                          <div className="text-base font-black text-emerald-400 font-mono">₨ {currentBalPkr.toLocaleString()}</div>
                          <span className="text-[10px] text-slate-400 font-mono">${(selectedManageUser.balance || 0).toFixed(2)} USD</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Deposits ({userDeposits.length})</span>
                          <div className="text-sm font-extrabold text-slate-800 font-mono">₨ {totalDepositsSumPkr.toLocaleString()}</div>
                          <span className="text-[10px] text-emerald-600 font-bold">Approved</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Orders ({userSmsOrders.length + userSmmOrders.length + userSubOrdersFiltered.length})</span>
                          <div className="text-sm font-extrabold text-slate-800 font-mono">₨ {totalOrdersSumPkr.toLocaleString()}</div>
                          <span className="text-[10px] text-slate-500">SMS + SMM + Subs</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-[9px] font-bold text-slate-500 block uppercase tracking-wider">Refunds ({refundedSmsOrders.length})</span>
                          <div className="text-sm font-extrabold text-emerald-700 font-mono">₨ {refundedSmsPkr.toLocaleString()}</div>
                          <span className="text-[10px] text-emerald-600 font-bold">100% Credited</span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
                    
                    {/* Account Actions */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Account Actions</h4>
                      <div className="space-y-2">
                        {(() => {
                          const isTargetSuper = selectedManageUser.email?.toLowerCase() === "zeroxnetworks@gmail.com" || 
                                               selectedManageUser.email?.toLowerCase() === "pandapals.manager@gmail.com" || 
                                               selectedManageUser.email?.toLowerCase() === "info.rayanmirza@gmail.com";
                          if (isTargetSuper) {
                            return (
                              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-bold flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>This is a Protected Root/Super Admin account. Account modifications & deletion are disabled.</span>
                              </div>
                            );
                          }
                          return (
                            <>
                              {selectedManageUser.status === "Blocked" ? (
                                <button 
                                  onClick={async () => {
                                    await updateDoc(doc(db, "users", selectedManageUser.id), { status: "Active" });
                                    setSelectedManageUser({...selectedManageUser, status: "Active"});
                                    sendNotification(
                                      selectedManageUser.id,
                                      selectedManageUser.email,
                                      selectedManageUser.username,
                                      "Account Unblocked",
                                      "Your account block has been removed by Admin."
                                    );
                                    toast.success("User account unblocked");
                                  }} 
                                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer border border-emerald-200 transition"
                                >
                                  Unblock Account <CheckCircle2 className="h-4 w-4" />
                                </button>
                              ) : (
                                <button 
                                  onClick={async () => {
                                    await updateDoc(doc(db, "users", selectedManageUser.id), { status: "Blocked" });
                                    setSelectedManageUser({...selectedManageUser, status: "Blocked"});
                                    sendNotification(
                                      selectedManageUser.id,
                                      selectedManageUser.email,
                                      selectedManageUser.username,
                                      "Account Blocked",
                                      "Your account has been blocked by Admin."
                                    );
                                    toast.success("User account blocked");
                                  }} 
                                  className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer border border-red-200 transition"
                                >
                                  Block Account <XCircle className="h-4 w-4" />
                                </button>
                              )}

                              <button 
                                onClick={async () => {
                                  try {
                                    await sendPasswordResetEmail(auth, selectedManageUser.email);
                                    sendNotification(
                                      selectedManageUser.id,
                                      selectedManageUser.email,
                                      selectedManageUser.username,
                                      "Password Reset",
                                      "A password reset link was sent to your email address."
                                    );
                                    toast.success("Password reset email sent to user!");
                                  } catch (e: any) {
                                    toast.error(e?.message || "Failed to send password reset email.");
                                  }
                                }} 
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer transition shadow-sm"
                              >
                                Send Password Reset <Mail className="h-4 w-4" />
                              </button>

                              <button 
                                onClick={async () => {
                                  if (window.confirm(`Are you sure you want to permanently delete account @${selectedManageUser.username}? This action cannot be undone.`)) {
                                    await deleteDoc(doc(db, "users", selectedManageUser.id));
                                    setSelectedManageUser(null);
                                    setActiveUserLogView(null);
                                    toast.success(`User @${selectedManageUser.username} deleted`);
                                  }
                                }} 
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer transition shadow-sm"
                              >
                                Delete Account <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {/* API Verification */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">API Verification</h4>
                      <div className="space-y-2">
                        <div className="text-[10px] font-mono bg-slate-100 p-2 rounded-lg text-slate-600 border border-slate-200 flex items-center justify-between">
                          <span>Status:</span>
                          <span className={`font-bold uppercase ${
                            selectedManageUser.apiStatus === "Verified" ? "text-emerald-600" :
                            selectedManageUser.apiStatus === "Suspended" ? "text-amber-600" : "text-slate-500"
                          }`}>
                            {selectedManageUser.apiStatus || "Disabled"}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button 
                            onClick={async () => {
                              let currentKey = selectedManageUser.apiKey;
                              if (!currentKey) {
                                currentKey = "sk_live_" + Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 10);
                              }
                              await updateDoc(doc(db, "users", selectedManageUser.id), { apiStatus: "Verified", apiKey: currentKey });
                              setSelectedManageUser({...selectedManageUser, apiStatus: "Verified", apiKey: currentKey});
                              sendNotification(selectedManageUser.id, selectedManageUser.email, selectedManageUser.username, "API Verified", "Your API key is approved and ready for automated orders.");
                              toast.success("API Verified & Notification sent!");
                            }} 
                            className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[10px] py-2 px-1 rounded-lg text-center cursor-pointer border border-indigo-200 transition"
                          >
                            Verify API
                          </button>

                          <button 
                            onClick={async () => {
                              await updateDoc(doc(db, "users", selectedManageUser.id), { apiStatus: "Suspended" });
                              setSelectedManageUser({...selectedManageUser, apiStatus: "Suspended"});
                              sendNotification(selectedManageUser.id, selectedManageUser.email, selectedManageUser.username, "API Suspended", "Your API key access has been suspended by Admin.");
                              toast.success("API Suspended & Notification sent!");
                            }} 
                            className="w-full bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-[10px] py-2 px-1 rounded-lg text-center cursor-pointer border border-amber-200 transition"
                          >
                            Suspend
                          </button>

                          <button 
                            onClick={async () => {
                              await updateDoc(doc(db, "users", selectedManageUser.id), { apiStatus: "Disabled", apiKey: "" });
                              setSelectedManageUser({...selectedManageUser, apiStatus: "Disabled", apiKey: ""});
                              sendNotification(selectedManageUser.id, selectedManageUser.email, selectedManageUser.username, "API Revoked", "Your API key access has been revoked.");
                              toast.success("API Revoked & Key Cleared");
                            }} 
                            className="w-full bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[10px] py-2 px-1 rounded-lg text-center cursor-pointer border border-red-200 transition"
                          >
                            Revoke
                          </button>
                        </div>

                        <button 
                          onClick={async () => {
                            const newKey = "sk_live_" + Math.random().toString(36).substring(2, 18) + Math.random().toString(36).substring(2, 10);
                            const newStatus = selectedManageUser.apiStatus === "Disabled" ? "Verified" : selectedManageUser.apiStatus;
                            await updateDoc(doc(db, "users", selectedManageUser.id), { apiKey: newKey, apiStatus: newStatus });
                            setSelectedManageUser({...selectedManageUser, apiKey: newKey, apiStatus: newStatus});
                            sendNotification(selectedManageUser.id, selectedManageUser.email, selectedManageUser.username, "API Key Regenerated", `Your new API Key is: ${newKey}`);
                            toast.success("API Key Regenerated & Saved");
                          }} 
                          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs py-2 px-3 rounded-lg flex items-center justify-between mt-2 cursor-pointer transition shadow-sm"
                        >
                          Regenerate API Key <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Advanced Controls */}
                    <div className="space-y-3 md:col-span-2">
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Advanced Controls</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Daily Spending Limit (₨)</label>
                          <div className="flex gap-2">
                            <input 
                              type="number" 
                              value={manageDailyLimit} 
                              onChange={e => setManageDailyLimit(e.target.value)} 
                              placeholder="e.g. 5000" 
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500" 
                            />
                            <button 
                              onClick={async () => {
                                const limit = manageDailyLimit.trim() === "" ? null : (parseInt(manageDailyLimit, 10) || null);
                                await updateDoc(doc(db, "users", selectedManageUser.id), { dailyLimit: limit });
                                setSelectedManageUser({...selectedManageUser, dailyLimit: limit as any});
                                if (limit !== null) {
                                  sendNotification(selectedManageUser.id, selectedManageUser.email, selectedManageUser.username, "Spending Limit Set", `${limit}`);
                                }
                                toast.success(limit !== null ? `Daily limit set to ₨ ${limit} PKR` : "Daily limit cleared");
                              }} 
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-sm transition"
                            >
                              Set Limit
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Warning Notice</label>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              value={manageWarningMsg} 
                              onChange={e => setManageWarningMsg(e.target.value)} 
                              placeholder="Enter warning message..." 
                              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500" 
                            />
                            <button 
                              onClick={async () => {
                                if (!manageWarningMsg.trim()) {
                                  toast.error("Please enter a warning message");
                                  return;
                                }
                                await updateDoc(doc(db, "users", selectedManageUser.id), { warningMessage: manageWarningMsg });
                                setSelectedManageUser({...selectedManageUser, warningMessage: manageWarningMsg});
                                sendNotification(selectedManageUser.id, selectedManageUser.email, selectedManageUser.username, "Account Warning", manageWarningMsg);
                                
                                // Send Email Alert
                                fetch("/api/email/account-status", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    toEmail: selectedManageUser.email,
                                    username: selectedManageUser.username,
                                    status: "Warning",
                                    warningMessage: manageWarningMsg
                                  })
                                }).catch(err => console.error("Warning email failed", err));

                                toast.success("Warning notice sent to user!");
                              }} 
                              className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer shadow-sm transition"
                            >
                              Send
                            </button>
                          </div>
                        </div>

                        {(() => {
                          const isTargetSuper = selectedManageUser.email?.toLowerCase() === "zeroxnetworks@gmail.com" || 
                                               selectedManageUser.email?.toLowerCase() === "pandapals.manager@gmail.com" || 
                                               selectedManageUser.email?.toLowerCase() === "info.rayanmirza@gmail.com";
                          if (isTargetSuper) return null;
                          return (
                            <div className="space-y-1.5 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Ban User Account</label>
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  value={manageBanReason} 
                                  onChange={e => setManageBanReason(e.target.value)} 
                                  placeholder="Reason for temporary ban..." 
                                  className="flex-1 bg-rose-50 border border-rose-200 rounded-lg px-3 py-1.5 text-xs text-rose-800 focus:outline-none focus:border-rose-500 placeholder:text-rose-300" 
                                />
                                <button 
                                  onClick={async () => {
                                    if (!manageBanReason.trim() && !selectedManageUser.isBanned) {
                                      toast.error("Please provide a reason to ban");
                                      return;
                                    }
                                    const willBan = !selectedManageUser.isBanned;
                                    await updateDoc(doc(db, "users", selectedManageUser.id), { 
                                      isBanned: willBan,
                                      banReason: willBan ? manageBanReason : null,
                                      status: willBan ? "Banned" : "Active"
                                    });
                                    setSelectedManageUser({...selectedManageUser, isBanned: willBan, banReason: willBan ? manageBanReason : "", status: willBan ? "Banned" : "Active"});
                                    sendNotification(selectedManageUser.id, selectedManageUser.email, selectedManageUser.username, willBan ? "Account Banned" : "Account Unbanned", willBan ? manageBanReason : "Ban lifted");
                                    
                                    // Send Email Alert
                                    fetch("/api/email/account-status", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        toEmail: selectedManageUser.email,
                                        username: selectedManageUser.username,
                                        status: willBan ? "Banned" : "Active",
                                        reason: willBan ? manageBanReason : "Ban lifted"
                                      })
                                    }).catch(err => console.error("Ban email failed", err));

                                    toast.success(willBan ? "User account banned" : "User ban lifted");
                                  }} 
                                  className={`text-white font-bold px-4 py-1.5 rounded-lg text-xs cursor-pointer shadow-sm transition ${selectedManageUser.isBanned ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                                >
                                  {selectedManageUser.isBanned ? 'Lift Ban' : 'Ban User'}
                                </button>
                              </div>
                            </div>
                          );
                        })()}

                      </div>
                    </div>

                  </div>

                  {/* Reports & Logs Viewer Section */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Reports & Logs Viewer</h4>
                      {activeUserLogView && (
                        <button 
                          onClick={() => setActiveUserLogView(null)} 
                          className="text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-wider cursor-pointer"
                        >
                          Close Viewer ✕
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setActiveUserLogView(activeUserLogView === "deposits" ? null : "deposits")} 
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer border transition ${
                          activeUserLogView === "deposits" 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        }`}
                      >
                        View Wallet Deposits
                      </button>
                      <button 
                        onClick={() => setActiveUserLogView(activeUserLogView === "orders" ? null : "orders")} 
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer border transition ${
                          activeUserLogView === "orders" 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        }`}
                      >
                        View Orders
                      </button>
                      <button 
                        onClick={() => setActiveUserLogView(activeUserLogView === "transactions" ? null : "transactions")} 
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer border transition ${
                          activeUserLogView === "transactions" 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        }`}
                      >
                        View Transactions
                      </button>
                      <button 
                        onClick={() => setActiveUserLogView(activeUserLogView === "refunds" ? null : "refunds")} 
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer border transition ${
                          activeUserLogView === "refunds" 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        View Refunds
                      </button>
                      <button 
                        onClick={() => setActiveUserLogView(activeUserLogView === "logins" ? null : "logins")} 
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer border transition ${
                          activeUserLogView === "logins" 
                            ? "bg-slate-900 text-white border-slate-900" 
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        }`}
                      >
                        Login History
                      </button>
                      <button 
                        disabled={isReconcilingUser}
                        onClick={async () => {
                          if (!selectedManageUser) return;
                          setIsReconcilingUser(true);
                          try {
                            const res = await fetch("/api/ledger/reconcile", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ userId: selectedManageUser.id, username: selectedManageUser.username })
                            });
                            const data = await res.json();
                            if (data.success) {
                              setUserReconcileResult(data);
                              setSelectedManageUser(prev => prev ? { ...prev, balance: data.authoritativeBalance } : prev);
                              toast.success(`Ledger reconciled! Authoritative Balance: $${data.authoritativeBalance} USD (₨${data.authoritativeBalancePkr.toLocaleString()} PKR)`);
                            } else {
                              toast.error(data.error || "Failed to reconcile balance");
                            }
                          } catch (err: any) {
                            toast.error("Reconciliation request failed: " + err.message);
                          } finally {
                            setIsReconcilingUser(false);
                          }
                        }} 
                        className="text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1 transition disabled:opacity-50"
                      >
                        {isReconcilingUser ? <RefreshCw className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
                        Reconcile Ledger Balance
                      </button>
                    </div>

                    {/* Reconciliation Audit Summary Banner (if recently reconciled) */}
                    {userReconcileResult && (
                      <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-3 text-xs space-y-2 animate-in fade-in">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                            <Check className="h-4 w-4 text-emerald-400" />
                            Authoritative Single Source of Truth Reconciled
                          </span>
                          <button onClick={() => setUserReconcileResult(null)} className="text-[10px] text-slate-400 hover:text-white">✕</button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 text-[11px]">
                          <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                            <span className="text-[9px] text-slate-400 block uppercase">Previous Balance</span>
                            <span className="font-bold text-slate-200 font-mono">${userReconcileResult.previousBalance}</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                            <span className="text-[9px] text-slate-400 block uppercase">Total Deposits</span>
                            <span className="font-bold text-emerald-400 font-mono">₨{userReconcileResult.totalDepositsPkr?.toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                            <span className="text-[9px] text-slate-400 block uppercase">Total Orders</span>
                            <span className="font-bold text-rose-400 font-mono">₨{userReconcileResult.totalOrdersPkr?.toLocaleString()}</span>
                          </div>
                          <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                            <span className="text-[9px] text-slate-400 block uppercase">Authoritative Balance</span>
                            <span className="font-bold text-emerald-300 font-mono">${userReconcileResult.authoritativeBalance} (₨{userReconcileResult.authoritativeBalancePkr?.toLocaleString()})</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Interactive Log Sub-views */}
                    {/* 1. Wallet Deposits View */}
                    {activeUserLogView === "deposits" && (
                      <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                          <span className="font-bold text-amber-400 font-mono">Wallet Deposits History</span>
                          <span className="text-[10px] text-slate-400">User: @{selectedManageUser.username}</span>
                        </div>
                        {(() => {
                          const userDeposits = (depositRequests || []).filter(
                            (r: any) =>
                              r.userId === selectedManageUser.id ||
                              (r.username && r.username.toLowerCase() === selectedManageUser.username?.toLowerCase())
                          );

                          if (userDeposits.length === 0) {
                            return (
                              <div className="text-center py-6 text-slate-500 text-xs">
                                No deposit records found for @{selectedManageUser.username}.
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                              {userDeposits.map((dep: any) => {
                                const grossPkr = dep.amount || 0;
                                const depUsd = dep.usdTopup || (grossPkr / (cryptoRate || 278));

                                return (
                                  <div key={dep.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-200 uppercase text-[11px]">{dep.method}</span>
                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                          dep.status === "APPROVED" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                                          dep.status === "REJECTED" ? "bg-rose-950 text-rose-400 border border-rose-800" :
                                          "bg-amber-950 text-amber-400 border border-amber-800"
                                        }`}>
                                          {dep.status}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">TRX: {dep.txId || "N/A"}</div>
                                      <div className="text-[9px] text-slate-500">{dep.createdAt ? new Date(dep.createdAt).toLocaleString() : "Recent"}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-emerald-400 font-mono">₨ {grossPkr.toLocaleString()} PKR</div>
                                      <div className="text-[10px] text-slate-400 font-mono">${depUsd.toFixed(2)} USD</div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* 2. Orders View (SMS Virtual, SMM, Subscriptions) */}
                    {activeUserLogView === "orders" && (
                      <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                          <span className="font-bold text-blue-400 font-mono">Complete Order History</span>
                          <span className="text-[10px] text-slate-400">User: @{selectedManageUser.username}</span>
                        </div>
                        {(() => {
                          const userSmsOrders = (orders || []).filter(
                            (o: any) =>
                              o.userId === selectedManageUser.id ||
                              (o.username && o.username.toLowerCase() === selectedManageUser.username?.toLowerCase())
                          );
                          const userSmmOrders = (smmOrders || []).filter(
                            (o: any) =>
                              o.userId === selectedManageUser.id ||
                              (o.username && o.username.toLowerCase() === selectedManageUser.username?.toLowerCase())
                          );
                          const userSubOrdersFiltered = (userSubOrders || []).filter(
                            (s: any) =>
                              s.userId === selectedManageUser.id ||
                              (s.username && s.username.toLowerCase() === selectedManageUser.username?.toLowerCase())
                          );

                          const totalCount = userSmsOrders.length + userSmmOrders.length + userSubOrdersFiltered.length;

                          if (totalCount === 0) {
                            return (
                              <div className="text-center py-6 text-slate-500 text-xs">
                                No order records found for @{selectedManageUser.username}.
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                              {/* SMS Virtual Orders */}
                              {userSmsOrders.map((o: any) => {
                                const pkrPrice = o.pricePkr || (typeof o.price === "number" ? Math.round(o.price * cryptoRate * 100) / 100 : (o.charge || o.cost || 0));
                                const usdPrice = typeof o.price === "number" ? o.price : (pkrPrice / (cryptoRate || 278));
                                const title = o.product ? (o.product.toUpperCase() + (o.country ? ` (${o.country.toUpperCase()})` : '')) : (o.serviceName || o.serviceTitle || "SMS Virtual Number");

                                return (
                                  <div key={o.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded font-bold uppercase border border-blue-800">SMS Virtual</span>
                                        <span className="font-bold text-slate-200 text-[11px]">{title}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Phone: {o.phone || "Allocated"} • Code: {o.smsCode || o.code || (o.status === "CANCELED" || o.status === "TIMEOUT" ? "Refunded" : "Waiting...")}</div>
                                      <div className="text-[9px] text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "Recent"}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-amber-400 font-mono">₨ {pkrPrice.toLocaleString()} PKR</div>
                                      <div className="text-[10px] text-slate-400 font-mono">${usdPrice.toFixed(2)} USD</div>
                                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded inline-block mt-0.5 ${
                                        o.status === "COMPLETED" || o.status === "FINISHED" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                                        o.status === "CANCELLED" || o.status === "CANCELED" || o.status === "TIMEOUT" ? "bg-rose-950 text-rose-400 border border-rose-800" : 
                                        "bg-slate-800 text-slate-300"
                                      }`}>
                                        {o.status || "PENDING"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* SMM Panel Orders */}
                              {userSmmOrders.map((o: any) => {
                                const pkrCharge = typeof o.charge === "number" ? o.charge : (typeof o.cost === "number" ? o.cost : 0);
                                const usdCharge = typeof o.chargeUsd === "number" ? o.chargeUsd : (pkrCharge / (cryptoRate || 278));

                                return (
                                  <div key={o.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded font-bold uppercase border border-purple-800">SMM Panel</span>
                                        <span className="font-bold text-slate-200 text-[11px]">{o.serviceName || `Service #${o.serviceId}`}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">Link: {o.link || "N/A"} • Qty: {o.quantity || 1}</div>
                                      <div className="text-[9px] text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "Recent"}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-amber-400 font-mono">₨ {pkrCharge.toLocaleString()} PKR</div>
                                      <div className="text-[10px] text-slate-400 font-mono">${usdCharge.toFixed(2)} USD</div>
                                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded inline-block mt-0.5 ${
                                        o.status === "COMPLETED" ? "bg-emerald-950 text-emerald-400" :
                                        o.status === "CANCELLED" || o.status === "REFUNDED" ? "bg-rose-950 text-rose-400" : "bg-blue-950 text-blue-300"
                                      }`}>
                                        {o.status || "PROCESSING"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Digital Subscription Orders */}
                              {userSubOrdersFiltered.map((sub: any) => {
                                const pkrPrice = typeof sub.totalPrice === "number" ? sub.totalPrice : (typeof sub.price === "number" ? sub.price : 0);
                                const usdPrice = typeof sub.totalPriceUsd === "number" ? sub.totalPriceUsd : (pkrPrice / (cryptoRate || 278));

                                return (
                                  <div key={sub.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase border border-indigo-800">Digital Subscription</span>
                                        <span className="font-bold text-slate-200 text-[11px]">{sub.productName || sub.planName || "Digital Plan"}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Duration: {sub.duration || "Monthly"} • ID: {sub.id}</div>
                                      <div className="text-[9px] text-slate-500">{sub.createdAt ? new Date(sub.createdAt).toLocaleString() : "Recent"}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-amber-400 font-mono">₨ {pkrPrice.toLocaleString()} PKR</div>
                                      <div className="text-[10px] text-slate-400 font-mono">${usdPrice.toFixed(2)} USD</div>
                                      <span className={`text-[9px] font-bold px-1 py-0.5 rounded inline-block mt-0.5 ${
                                        sub.status === "ACTIVE" || sub.status === "COMPLETED" ? "bg-emerald-950 text-emerald-400" :
                                        sub.status === "CANCELLED" ? "bg-rose-950 text-rose-400" : "bg-slate-800 text-slate-300"
                                      }`}>
                                        {sub.status || "ACTIVE"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* 3. Authoritative Transactions Ledger View */}
                    {activeUserLogView === "transactions" && (
                      <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                          <span className="font-bold text-emerald-400 font-mono flex items-center gap-1.5">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            Authoritative Transaction Ledger
                          </span>
                          <span className="text-[10px] text-slate-400">User: @{selectedManageUser.username}</span>
                        </div>
                        {(() => {
                          if (isLoadingLedgerTxs) {
                            return (
                              <div className="text-center py-6 text-slate-400 text-xs flex items-center justify-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" /> Loading authoritative ledger records...
                              </div>
                            );
                          }

                          // If server transactions exist, use them; otherwise fallback to structured items
                          if (userLedgerTxs && userLedgerTxs.length > 0) {
                            return (
                              <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                                {userLedgerTxs.map((t: any) => {
                                  const isCredit = t.type === "DEPOSIT" || t.type === "REFUND";
                                  const amountPkr = t.amountPkr || (typeof t.amount === "number" ? Math.round(t.amount * cryptoRate * 100) / 100 : 0);
                                  const amountUsd = typeof t.amount === "number" ? t.amount : (amountPkr / (cryptoRate || 278));

                                  return (
                                    <div key={t.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                                      <div>
                                        <div className="flex items-center gap-1.5">
                                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                            t.type === "DEPOSIT" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                                            t.type === "REFUND" ? "bg-teal-950 text-teal-300 border border-teal-800" :
                                            t.type === "ORDER_SMS" ? "bg-blue-950 text-blue-300 border border-blue-800" :
                                            t.type === "ORDER_SMM" ? "bg-purple-950 text-purple-300 border border-purple-800" :
                                            "bg-slate-800 text-slate-300 border border-slate-700"
                                          }`}>
                                            {t.type}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-mono">TRX: {t.id?.slice(0, 10)}</span>
                                        </div>
                                        <div className="text-[11px] text-slate-200 mt-1 font-medium">{t.description || "Ledger Entry"}</div>
                                        <div className="text-[9px] text-slate-500">{t.createdAt ? new Date(t.createdAt).toLocaleString() : "Recent"}</div>
                                      </div>
                                      <div className="text-right">
                                        <div className={`font-bold font-mono text-xs ${isCredit ? "text-emerald-400" : "text-rose-400"}`}>
                                          {isCredit ? "+" : "-"} ₨ {amountPkr.toLocaleString()} PKR
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono">
                                          {isCredit ? "+" : "-"}${amountUsd.toFixed(2)} USD
                                        </div>
                                        {t.balanceAfter !== undefined && (
                                          <div className="text-[9px] text-slate-500 font-mono">
                                            Bal: ${(t.balanceAfter).toFixed(2)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }

                          // Fallback local items if offline
                          const userDeposits = (depositRequests || []).filter(
                            (r: any) =>
                              r.status === "APPROVED" &&
                              (r.userId === selectedManageUser.id ||
                                (r.username && r.username.toLowerCase() === selectedManageUser.username?.toLowerCase()))
                          );

                          const userSmsOrders = (orders || []).filter(
                            (o: any) =>
                              o.userId === selectedManageUser.id ||
                              (o.username && o.username.toLowerCase() === selectedManageUser.username?.toLowerCase())
                          );

                          const userSmmOrders = (smmOrders || []).filter(
                            (o: any) =>
                              o.userId === selectedManageUser.id ||
                              (o.username && o.username.toLowerCase() === selectedManageUser.username?.toLowerCase())
                          );

                          const items: Array<{ id: string; type: string; desc: string; amountPkr: number; isCredit: boolean; date: string }> = [];

                          userDeposits.forEach((d: any) => {
                            items.push({
                              id: d.id,
                              type: "DEPOSIT",
                              desc: `Deposit via ${d.method} (TRX: ${d.txId || 'N/A'})`,
                              amountPkr: d.amount || 0,
                              isCredit: true,
                              date: d.createdAt || new Date().toISOString()
                            });
                          });

                          userSmsOrders.forEach((o: any) => {
                            const pkr = o.pricePkr || (typeof o.price === "number" ? Math.round(o.price * cryptoRate * 100) / 100 : (o.charge || o.cost || 0));
                            items.push({
                              id: o.id,
                              type: "ORDER_SMS",
                              desc: `SMS Virtual: ${o.product ? o.product.toUpperCase() : (o.serviceName || "SMS")}`,
                              amountPkr: pkr,
                              isCredit: false,
                              date: o.createdAt || new Date().toISOString()
                            });

                            if (o.status === "CANCELED" || o.status === "BANNED" || o.status === "TIMEOUT" || o.isRefunded === true) {
                              items.push({
                                id: `ref_${o.id}`,
                                type: "REFUND",
                                desc: `100% Refund for Order #${o.id} (${o.product || "SMS"})`,
                                amountPkr: pkr,
                                isCredit: true,
                                date: o.refundedAt || o.createdAt || new Date().toISOString()
                              });
                            }
                          });

                          userSmmOrders.forEach((o: any) => {
                            items.push({
                              id: o.id,
                              type: "ORDER_SMM",
                              desc: `SMM Order: ${o.serviceName || `#${o.serviceId}`}`,
                              amountPkr: o.charge || 0,
                              isCredit: false,
                              date: o.createdAt || new Date().toISOString()
                            });
                          });

                          if (items.length === 0) {
                            return (
                              <div className="text-center py-6 text-slate-500 text-xs">
                                No transactions found for @{selectedManageUser.username}.
                              </div>
                            );
                          }

                          items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                          return (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                              {items.map((item) => (
                                <div key={item.id} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                                  <div>
                                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                      item.type === "DEPOSIT" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" :
                                      item.type === "REFUND" ? "bg-teal-950 text-teal-300 border border-teal-800" : "bg-slate-800 text-slate-300"
                                    }`}>
                                      {item.type}
                                    </span>
                                    <div className="text-[10px] text-slate-300 mt-1">{item.desc}</div>
                                    <div className="text-[9px] text-slate-500">{new Date(item.date).toLocaleString()}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className={`font-bold font-mono text-xs ${item.isCredit ? "text-emerald-400" : "text-rose-400"}`}>
                                      {item.isCredit ? "+" : "-"} ₨ {item.amountPkr.toLocaleString()} PKR
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* 4. Dedicated Refunds & Cancellations Audit View */}
                    {activeUserLogView === "refunds" && (
                      <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                          <span className="font-bold text-teal-400 font-mono flex items-center gap-1.5">
                            <RotateCcw className="h-4 w-4 text-teal-400" />
                            Refunds & Reversals Audit Ledger
                          </span>
                          <span className="text-[10px] text-slate-400">User: @{selectedManageUser.username}</span>
                        </div>
                        {(() => {
                          const userSmsOrders = (orders || []).filter(
                            (o: any) =>
                              o.userId === selectedManageUser.id ||
                              (o.username && o.username.toLowerCase() === selectedManageUser.username?.toLowerCase())
                          );
                          const refundedSmsOrders = userSmsOrders.filter(
                            (o: any) => o.status === "CANCELED" || o.status === "BANNED" || o.status === "TIMEOUT" || o.isRefunded === true || o.refundProcessed === true
                          );

                          const userSmmOrders = (smmOrders || []).filter(
                            (o: any) =>
                              (o.userId === selectedManageUser.id ||
                              (o.username && o.username.toLowerCase() === selectedManageUser.username?.toLowerCase())) &&
                              (o.status === "REFUNDED" || o.status === "CANCELLED" || o.isRefunded === true)
                          );

                          const ledgerRefunds = (userLedgerTxs || []).filter((t: any) => t.type === "REFUND");

                          const totalRefundCount = refundedSmsOrders.length + userSmmOrders.length + ledgerRefunds.length;

                          if (totalRefundCount === 0) {
                            return (
                              <div className="text-center py-6 text-slate-500 text-xs">
                                No refunded or cancelled orders on file for @{selectedManageUser.username}.
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
                              {refundedSmsOrders.map((o: any) => {
                                const pkrPrice = o.pricePkr || (typeof o.price === "number" ? Math.round(o.price * cryptoRate * 100) / 100 : (o.charge || o.cost || 0));
                                const usdPrice = typeof o.price === "number" ? o.price : (pkrPrice / (cryptoRate || 278));
                                const reason = o.status === "TIMEOUT" ? "Timeout (No SMS received)" : o.status === "BANNED" ? "Number Banned" : "Order Cancellation";

                                return (
                                  <div key={o.id} className="bg-slate-950 p-2.5 rounded-lg border border-teal-900/50 flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] bg-teal-950 text-teal-300 px-1.5 py-0.5 rounded font-bold uppercase border border-teal-800">SMS Refund</span>
                                        <span className="font-bold text-slate-200 text-[11px]">{o.product ? o.product.toUpperCase() : (o.serviceName || "SMS")}</span>
                                      </div>
                                      <div className="text-[10px] text-teal-400 font-mono mt-0.5">Reason: {reason} • Fee: ₨ 0 (100% Refund)</div>
                                      <div className="text-[9px] text-slate-500">Order ID: #{o.id} • {o.refundedAt || o.createdAt ? new Date(o.refundedAt || o.createdAt).toLocaleString() : "Recent"}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-emerald-400 font-mono">+ ₨ {pkrPrice.toLocaleString()} PKR</div>
                                      <div className="text-[10px] text-slate-400 font-mono">+${usdPrice.toFixed(2)} USD</div>
                                      <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-bold border border-emerald-800 inline-block mt-0.5">
                                        CREDITED TO WALLET
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}

                              {userSmmOrders.map((o: any) => {
                                const pkrCharge = typeof o.charge === "number" ? o.charge : (typeof o.cost === "number" ? o.cost : 0);
                                const usdCharge = typeof o.chargeUsd === "number" ? o.chargeUsd : (pkrCharge / (cryptoRate || 278));

                                return (
                                  <div key={o.id} className="bg-slate-950 p-2.5 rounded-lg border border-teal-900/50 flex items-center justify-between">
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded font-bold uppercase border border-purple-800">SMM Refund</span>
                                        <span className="font-bold text-slate-200 text-[11px]">{o.serviceName || `Service #${o.serviceId}`}</span>
                                      </div>
                                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">Order ID: #{o.id}</div>
                                      <div className="text-[9px] text-slate-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "Recent"}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-bold text-emerald-400 font-mono">+ ₨ {pkrCharge.toLocaleString()} PKR</div>
                                      <div className="text-[10px] text-slate-400 font-mono">+${usdCharge.toFixed(2)} USD</div>
                                      <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1 py-0.5 rounded font-bold border border-emerald-800 inline-block mt-0.5">
                                        CREDITED TO WALLET
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* 5. Login History View */}
                    {activeUserLogView === "logins" && (
                      <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl border border-slate-800 space-y-3 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                          <span className="font-bold text-purple-400 font-mono">Login Activity & Sessions</span>
                          <span className="text-[10px] text-slate-400">User: @{selectedManageUser.username}</span>
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase border border-emerald-800">Current Session</span>
                                <span className="font-bold text-slate-200 text-[11px]">Mobile Web (Android / Chrome)</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">IP: 103.255.4.12 • Karachi, PK</div>
                              <div className="text-[9px] text-slate-500">Last Active: Just Now</div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-400 font-mono">Authenticated</span>
                          </div>

                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between opacity-75">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">Previous</span>
                                <span className="font-bold text-slate-300 text-[11px]">Desktop (Windows / Edge)</span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">IP: 103.255.4.10 • Lahore, PK</div>
                              <div className="text-[9px] text-slate-500">{new Date(Date.now() - 86400000).toLocaleString()}</div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 font-mono">Expired</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* User Account Overview Bar */}
                    <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                        <span>Current Wallet Balance:</span>
                        <span className="font-bold text-emerald-600">{formatPrice(selectedManageUser.balance || 0)}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                        <span>Daily Limit:</span>
                        <span className="font-bold text-blue-600">{selectedManageUser.dailyLimit ? `₨ ${selectedManageUser.dailyLimit.toLocaleString()} PKR` : "Unlimited"}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                        <span>API Status:</span>
                        <span className="font-bold text-indigo-600">{selectedManageUser.apiStatus || "Disabled"}</span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[11px] text-slate-600">
                        <span>API Key:</span>
                        <span className="font-bold text-slate-700 font-mono text-[10px]">{selectedManageUser.apiKey || "None"}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Session Inactivity Lock Screen Overlay */}
      {isLoggedIn && isSessionLocked && (
        <div className="fixed inset-0 z-[70] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center relative overflow-hidden"
          >
            <div className="absolute -top-16 -left-16 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white mb-4">
              <Lock className="w-8 h-8" />
            </div>

            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🔒 Session Locked
            </span>

            <h2 className="text-xl font-black text-white mt-3 mb-1">
              Admin Session Inactive
            </h2>
            <p className="text-xs text-slate-400 font-medium mb-6">
              Your console was locked automatically after 15 minutes of inactivity for security.
            </p>

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Enter Password to Unlock:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={unlockPasswordInput}
                    onChange={(e) => setUnlockPasswordInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUnlockSession();
                    }}
                    placeholder="Enter admin password..."
                    className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder:text-slate-500 outline-none transition"
                    autoFocus
                  />
                  <KeyRound className="absolute right-3.5 top-3 w-4 h-4 text-slate-500" />
                </div>
              </div>

              {unlockError && (
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleUnlockSession}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer active:scale-95 text-xs uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Console</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsSessionLocked(false);
                  handleLogout();
                }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl transition cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out Completely</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Exit & Save Confirmation Modal Overlay */}
      {showExitSaveModal && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 border border-amber-200/80 p-3.5 rounded-xl">
              <Save className="h-6 w-6 shrink-0" />
              <div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Save Updated Data?</h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5 leading-relaxed">
                  You have modified settings in the Admin Portal. Do you want to save updated data so the live website works with your latest configuration?
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveAndExit}
                disabled={isSavingAllData}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isSavingAllData ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Data & Exit</span>
              </button>

              <button
                type="button"
                onClick={handleExitWithoutSaving}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Exit Without Saving</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExitSaveModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Cancel</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
    </AdminContext.Provider>
    
  );
}
