import React, { useState } from "react";
import { 
  User, Lock, RefreshCw, Key, Check, Mail, Award, Star, Gift, Sparkles, TrendingUp, 
  ArrowRightLeft, Coins, Image, ShieldCheck, Globe, Languages, Wallet, CreditCard, 
  Bell, ShoppingCart, Repeat, HelpCircle, BookOpen, Settings, LogOut, ChevronLeft, 
  ChevronRight, Search, X, Shield, ChevronDown, CheckCircle2, ArrowUpRight, Zap, ExternalLink,
  LayoutDashboard, Copy, Code2, Users, Share2
} from "lucide-react";
import { UNIQUE_CURRENCIES } from "../data/currencies";
import { UNIQUE_LANGUAGES } from "../data/languages";
import { UserAccount, ActivationOrder } from "../types";
import { auth, db } from "../lib/firebase";
import { updatePassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { toast } from "react-hot-toast";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import { evaluatePasswordStrength } from "../lib/passwordUtils";
import ProfileWalletCard from "./ProfileWalletCard";

interface UserProfilePopoverProps {
  cryptoRate?: number;
  currentUser: UserAccount;
  userOrders?: ActivationOrder[];
  onClose: () => void;
  onLogout?: () => void;
  formatPrice: (baseUnits: number) => string;
  selectedCurrency: string;
  setSelectedCurrency: (code: string) => void;
  selectedLanguageCode: string;
  setSelectedLanguageCode: (code: string) => void;
  onNavigate?: (tabId: string) => void;
  isAdmin?: boolean;
  adminRole?: string;
  onOpenAdminPortal?: () => void;
}

export default function UserProfilePopover({
  cryptoRate, 
  currentUser, 
  userOrders = [], 
  onClose, 
  onLogout,
  formatPrice,
  selectedCurrency,
  setSelectedCurrency,
  selectedLanguageCode,
  setSelectedLanguageCode,
  onNavigate,
  isAdmin = false,
  adminRole,
  onOpenAdminPortal
}: UserProfilePopoverProps) {
  const [activeTab, setActiveTab] = useState<"menu" | "profile" | "security" | "loyalty" | "currency" | "language" | "api" | "support" | "privacy">("menu");
  const [searchQuery, setSearchQuery] = useState("");
  
  const handleNavigation = (tabId: string) => {
    const targetTabMap: Record<string, string> = {
      orders: "dashboard",
      support: "tickets",
      help: "tickets",
    };
    const finalTab = targetTabMap[tabId] || tabId;
    onNavigate?.(finalTab);
    onClose();
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  const selectedCurrencyData = UNIQUE_CURRENCIES.find(c => c.code === selectedCurrency) || UNIQUE_CURRENCIES[0];
  const selectedLanguageData = UNIQUE_LANGUAGES.find(l => l.code === selectedLanguageCode) || UNIQUE_LANGUAGES[0];

  const [newUsername, setNewUsername] = useState(currentUser.username);
  const [newAvatarUrl, setNewAvatarUrl] = useState(currentUser.avatarUrl || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingUsername, setUpdatingUsername] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [resetEmailSentMessage, setResetEmailSentMessage] = useState<string | null>(null);

  // Loyalty points exchange state
  const [pointsToExchange, setPointsToExchange] = useState<string>("5");
  const [redeemingPoints, setRedeemingPoints] = useState(false);

  // Calculate total PKR spent on virtual numbers and earned loyalty points
  const validOrders = userOrders.filter(o => o.status !== "CANCELED" && o.status !== "BANNED");
  const totalSpentPkr = validOrders.reduce((sum, o) => sum + ((o.price || 0) * (cryptoRate || 278)), 0);
  const calculatedPoints = Math.floor(totalSpentPkr / 100);
  const pointsBalance = Math.max(currentUser.loyaltyPoints || 0, calculatedPoints);
  const progressToNextPoint = Math.min(100, Math.round(totalSpentPkr % 100));

  const handleRedeemPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    const pts = parseInt(pointsToExchange, 10);
    if (isNaN(pts) || pts <= 0) {
      toast.error("Please enter a valid number of points to exchange");
      return;
    }
    if (pts > pointsBalance) {
      toast.error(`You only have ${pointsBalance} loyalty points available`);
      return;
    }

    setRedeemingPoints(true);
    try {
      const userRef = doc(db, "users", currentUser.id);
      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        toast.error("User record not found");
        return;
      }

      const userData = userDoc.data();
      const currentBal = userData.balance || 0;
      const currentPts = userData.loyaltyPoints !== undefined ? userData.loyaltyPoints : pointsBalance;

      // 1 Point = 1 PKR credit. Convert PKR to base balance units (1 unit = (cryptoRate || 278) PKR)
      const creditUsd = pts / (cryptoRate || 278);
      const updatedBalance = Number((currentBal + creditUsd).toFixed(2));
      const updatedPoints = Math.max(0, currentPts - pts);

      await updateDoc(userRef, {
        balance: updatedBalance,
        loyaltyPoints: updatedPoints
      });

      toast.success(`🎉 Exchanged ${pts} Points for ₨ ${pts} PKR Wallet Credit!`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to exchange points");
    } finally {
      setRedeemingPoints(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    
    const usernameChanged = newUsername.trim() !== currentUser.username;
    const avatarChanged = (newAvatarUrl || "") !== (currentUser.avatarUrl || "");
    
    if (!usernameChanged && !avatarChanged) {
      toast.error("No changes made");
      return;
    }

    setUpdatingUsername(true);
    try {
      let isNSFW = false;
      if (avatarChanged && newAvatarUrl.trim()) {
        const res = await fetch("/api/moderate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: currentUser.id, url: newAvatarUrl.trim() })
        });
        const data = await res.json();
        
        if (res.ok && data.isNSFW) {
           isNSFW = true;
           toast.error("Inappropriate content detected! Your account has been banned.");
           setUpdatingUsername(false);
           return;
        } else if (!res.ok) {
           toast.error("Failed to verify image. Please try again.");
           setUpdatingUsername(false);
           return;
        }
      }
      
      if (!isNSFW) {
        const userRef = doc(db, "users", currentUser.id);
        await updateDoc(userRef, {
          username: newUsername.trim(),
          avatarUrl: newAvatarUrl.trim() || null
        });
        toast.success("Profile updated successfully!");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update profile");
    } finally {
      setUpdatingUsername(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("Please enter a new password");
      return;
    }

    const passEval = evaluatePasswordStrength(newPassword);
    if (!passEval.isValid) {
      toast.error(passEval.feedback);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setUpdatingPassword(true);
    try {
      // 1. Update password on server via secure PBKDF2 hashing
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, newPassword })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update password.");
      }

      // 2. Also update Firebase Auth if active
      if (auth.currentUser) {
        updatePassword(auth.currentUser, newPassword).catch(() => {});
      }

      toast.success("Password changed successfully!");
      
      fetch("/api/email/password-changed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: currentUser.email,
          username: currentUser.username,
          time: new Date().toLocaleString(),
          device: navigator.userAgent.includes("Windows") ? "Windows Browser" : 
                  navigator.userAgent.includes("Mac") ? "Mac OS Browser" :
                  navigator.userAgent.includes("Android") ? "Android Device" :
                  navigator.userAgent.includes("iPhone") ? "iPhone Device" : "Web Browser"
        })
      }).catch(err => console.error("Password email failed", err));

      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to change password");
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!currentUser.email) {
      toast.error("No valid email address found for account");
      return;
    }
    setSendingReset(true);
    setResetEmailSentMessage(null);
    try {
      const res = await fetch("/api/auth/send-reset-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: currentUser.email, userId: currentUser.id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to send reset email");
      }
      setResetEmailSentMessage(data.message || `We've sent a secure password reset link to: ${currentUser.email}. Please check your inbox and follow the link to create a new password.`);
      toast.success("Password reset email sent to " + currentUser.email);
    } catch (err: any) {
      console.error("Send Reset Email error:", err);
      // Fallback to standard firebase reset if endpoint has issues
      try {
        await sendPasswordResetEmail(auth, currentUser.email);
        setResetEmailSentMessage(`We've sent a secure password reset link to: ${currentUser.email}. Please check your inbox and follow the link to create a new password.`);
        toast.success("Password reset email sent to " + currentUser.email);
      } catch (fbErr: any) {
        toast.error(err.message || fbErr.message || "Failed to send reset email");
      }
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 text-slate-800 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Drawer Header Bar - Minimal White & Blue Theme */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shadow-2xs">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              Account & Settings
            </h2>
            <p className="text-xs text-slate-500 font-medium">Manage profile, security, currency, and preferences</p>
          </div>
        </div>

        {/* Close Drawer Button */}
        <button
          onClick={onClose}
          type="button"
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-200 transition-all cursor-pointer shadow-2xs"
          title="Close Settings Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Hero User Card */}
      <div className="px-6 pt-5 pb-2">
        <ProfileWalletCard
          currentUser={currentUser}
          cryptoRate={cryptoRate}
          formatPrice={formatPrice}
          isAdmin={isAdmin}
          adminRole={adminRole}
          onOpenAdminPortal={() => {
            onOpenAdminPortal?.();
            onClose();
          }}
          onTopUp={() => handleNavigation("wallet")}
        />
      </div>

      {/* Navigation Tabs Bar - Clean Blue & White Switcher */}
      <div className="px-6 py-2 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {[
            { id: "menu", label: "Overview", icon: LayoutDashboard },
            { id: "profile", label: "Profile", icon: User },
            { id: "security", label: "Security", icon: ShieldCheck },
            { id: "loyalty", label: "Loyalty Points", icon: Star },
            { id: "currency", label: "Currency", icon: Coins },
            { id: "language", label: "Language", icon: Globe },
            { id: "api", label: "Developer API", icon: Key },
            { id: "support", label: "Support", icon: HelpCircle },
            { id: "privacy", label: "Privacy & Terms", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setSearchQuery(""); }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive 
                    ? "bg-blue-600 text-white shadow-xs" 
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Drawer Scrollable View Content */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

        {/* TAB 1: OVERVIEW / QUICK MENU */}
        {activeTab === "menu" && (
          <div className="space-y-6">

            {/* Admin Management Portal Launcher (Admin Only) */}
            {isAdmin && (
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-400/60 rounded-2xl p-4.5 shadow-xl text-white relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 rounded-2xl bg-amber-400 text-slate-950 font-black shadow-lg shadow-amber-400/20 shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-black text-white tracking-tight">Admin Gateway Console</h3>
                        <span className="text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          {adminRole || "ADMINISTRATOR"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium mt-0.5">
                        Direct administrator access to control orders, deposits, users, SMM, and site settings.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      onOpenAdminPortal?.();
                      onClose();
                    }}
                    type="button"
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-lg shadow-amber-400/20 transition-all active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer uppercase tracking-wider"
                  >
                    <span>Launch Admin Portal</span>
                    <ArrowRightLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between text-blue-600 mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Balance</span>
                  <Wallet className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-base font-black text-slate-900 font-mono">{formatPrice(currentUser.balance)}</p>
                <button 
                  onClick={() => handleNavigation("wallet")}
                  className="mt-2 text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                >
                  Deposit Funds <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs hover:border-blue-300 transition-all">
                <div className="flex items-center justify-between text-amber-500 mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Loyalty Points</span>
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                </div>
                <p className="text-base font-black text-slate-900 font-mono">{pointsBalance} PTS</p>
                <button 
                  onClick={() => setActiveTab("loyalty")}
                  className="mt-2 text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 cursor-pointer"
                >
                  Redeem PKR <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs hover:border-blue-300 transition-all col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-indigo-600 mb-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Orders</span>
                  <ShoppingCart className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-base font-black text-slate-900 font-mono">{validOrders.length} Orders</p>
                <button 
                  onClick={() => handleNavigation("orders")}
                  className="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  View History <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Regional Preferences Preview Box */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-blue-600" />
                Regional Preferences
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("currency")}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{selectedCurrencyData.flag}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        Currency ({selectedCurrency})
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{selectedCurrencyData.currency}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#00AEEF] neon-arrow-horizontal" />
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("language")}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition-all text-left cursor-pointer group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{selectedLanguageData.flag}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        Language ({selectedLanguageCode.toUpperCase()})
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{selectedLanguageData.nativeName}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#00AEEF] neon-arrow-horizontal" />
                </button>
              </div>
            </div>

            {/* Comprehensive Options Menu */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-600" />
                Account Management & Quick Shortcuts
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: "My Profile Settings", icon: User, onClick: () => setActiveTab("profile"), desc: "Edit name & avatar" },
                  { label: "Affiliate & Referrals", icon: Users, onClick: () => handleNavigation("affiliate"), desc: "Earn 5% on friend top-ups" },
                  { label: "Security & Passwords", icon: ShieldCheck, onClick: () => setActiveTab("security"), desc: "Manage password & reset" },
                  { label: "Loyalty Points & Rewards", icon: Star, onClick: () => setActiveTab("loyalty"), desc: "Exchange points for PKR" },
                  { label: "Wallet & Deposits", icon: Wallet, onClick: () => handleNavigation("wallet"), desc: "Top up via JazzCash/EasyPaisa" },
                  { label: "My Orders & History", icon: ShoppingCart, onClick: () => handleNavigation("orders"), desc: "View all SMS numbers" },
                  { label: "Subscriptions Store", icon: Repeat, onClick: () => handleNavigation("subscriptions"), desc: "Streaming & OTT accounts" },
                  { label: "Developer API Keys", icon: Key, onClick: () => setActiveTab("api"), desc: "REST API integration" },
                  { label: "Help & Support Tickets", icon: HelpCircle, onClick: () => setActiveTab("support"), desc: "Contact support team" },
                  { label: "Privacy Policy & Terms", icon: Shield, onClick: () => setActiveTab("privacy"), desc: "View terms & policies" },
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={item.onClick}
                      type="button"
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50/80 border border-slate-200/60 hover:border-blue-200 transition-all text-left cursor-pointer group"
                    >
                      <div className="p-2 rounded-lg bg-white border border-slate-200 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{item.label}</p>
                        <p className="text-[10px] text-slate-500 truncate">{item.desc}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#00AEEF] neon-arrow-horizontal" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout Action Card */}
            <div className="pt-2">
              <button
                onClick={() => {
                  if (onLogout) {
                    onLogout();
                  } else {
                    localStorage.removeItem("zerox_user_account");
                    localStorage.removeItem("zerox_local_user_id");
                    auth.signOut().catch(() => {});
                  }
                  onClose();
                }}
                type="button"
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 px-4 rounded-2xl border border-red-200 transition-all cursor-pointer flex items-center justify-center gap-2 text-xs shadow-2xs hover:shadow-xs active:scale-98"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: PROFILE EDIT */}
        {activeTab === "profile" && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Edit Profile Details
              </h3>
              <p className="text-xs text-slate-500">Update your account username and avatar picture URL.</p>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Profile Picture URL
                </label>
                <div className="flex gap-3 items-center">
                  <img 
                    src={newAvatarUrl || "https://cdn.phototourl.com/member/2026-07-24-b4f94510-1a75-430c-9101-a1527cb13f05.png"} 
                    alt="Preview" 
                    className="w-12 h-12 rounded-full object-cover border border-slate-200 bg-slate-100 shrink-0 shadow-2xs"
                  />
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Image className="h-4 w-4" />
                    </span>
                    <input
                      type="url"
                      value={newAvatarUrl}
                      onChange={(e) => setNewAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.png"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">Direct image link (PNG, JPG, WEBP). Images are automatically moderated for safety.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Display Username
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={updatingUsername}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  {updatingUsername ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{updatingUsername ? "Saving Profile..." : "Save Profile Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 3: SECURITY & PASSWORD */}
        {activeTab === "security" && (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Change Password
                </h3>
                <p className="text-xs text-slate-500">Ensure your account is using a strong password.</p>
              </div>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="e.g. Abcdef7!"
                      required
                    />
                  </div>

                  {newPassword && (
                    <PasswordStrengthIndicator password={newPassword} showDetails={true} />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-400">
                      <Key className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                      placeholder="Repeat new password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold py-2.5 rounded-xl shadow-md shadow-blue-500/10 transition cursor-pointer flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                >
                  {updatingPassword ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  <span>{updatingPassword ? "Updating Password..." : "Update Password"}</span>
                </button>
              </form>
            </div>

            {/* Email Reset Link Card */}
            <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-blue-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Reset Password via Email
                  </h4>
                  <p className="text-xs text-blue-800/80 leading-relaxed mt-0.5">
                    Send a secure password reset link directly to <strong className="text-blue-900">{currentUser.email}</strong>.
                  </p>
                </div>
              </div>

              {resetEmailSentMessage ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Password Reset Email Sent</span>
                  </div>
                  <p className="text-emerald-700 leading-relaxed text-[11px]">
                    We've sent a secure password reset link to: <strong className="text-emerald-900">{currentUser.email}</strong>. Please check your inbox and follow the link to create a new password.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-emerald-600 font-medium">Link valid for 1 hour &bull; Single-use</span>
                    <button
                      type="button"
                      onClick={handleSendResetEmail}
                      disabled={sendingReset}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-700 underline cursor-pointer"
                    >
                      {sendingReset ? "Resending..." : "Resend Link"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={sendingReset}
                  className="mt-1 bg-white hover:bg-blue-100 text-blue-700 font-bold py-2 px-4 rounded-xl text-xs border border-blue-200 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-2xs active:scale-[0.99]"
                >
                  {sendingReset ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  <span>{sendingReset ? "Sending Email..." : "Send Password Reset Email"}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: LOYALTY POINTS */}
        {activeTab === "loyalty" && (
          <div className="space-y-5">
            {/* Points Balance Banner */}
            <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white rounded-2xl p-5 shadow-md shadow-amber-500/10 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
              
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-xs mb-2">
                <Star className="h-6 w-6 text-white fill-white" />
              </div>
              <h3 className="text-3xl font-black text-white">{pointsBalance} PTS</h3>
              <p className="text-xs font-bold uppercase tracking-widest text-amber-100">Loyalty Rewards Balance</p>
              
              <div className="mt-4 bg-black/20 rounded-xl p-2.5 border border-white/20 flex items-center gap-3">
                <div className="flex-1 bg-white/20 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-white h-full rounded-full transition-all duration-300" 
                    style={{ width: `${progressToNextPoint}%` }}
                  />
                </div>
                <span className="text-[11px] font-bold text-amber-100 whitespace-nowrap">
                  {progressToNextPoint}% to next point
                </span>
              </div>
            </div>

            {/* Exchange Form */}
            <form onSubmit={handleRedeemPoints} className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3 shadow-2xs">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <Gift className="h-4 w-4 text-blue-600" />
                Convert Loyalty Points to PKR Credit
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Exchange points for PKR wallet credit. <strong className="text-slate-900">1 Point = ₨ 1 PKR</strong> credit instantly added to your wallet.
              </p>
              
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <input 
                    type="number"
                    min="1"
                    max={pointsBalance}
                    value={pointsToExchange}
                    onChange={(e) => setPointsToExchange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Points to redeem"
                  />
                </div>
                <button
                  type="submit"
                  disabled={redeemingPoints || pointsBalance <= 0}
                  className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer uppercase tracking-wider whitespace-nowrap"
                >
                  {redeemingPoints ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  Redeem Now
                </button>
              </div>
            </form>

            {/* Loyalty Rules */}
            <div className="bg-slate-100/80 border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                How to Earn Points
              </h4>
              <ul className="text-xs text-slate-600 space-y-1.5 ml-5 list-disc">
                <li>Earn <strong className="text-slate-800">1 Point</strong> for every ₨ 100 PKR spent.</li>
                <li>Points are automatically added after orders complete.</li>
                <li>Redeem anytime with zero expiration fees.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 5: CURRENCY SELECTOR */}
        {activeTab === "currency" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Select Currency</h3>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {UNIQUE_CURRENCIES.length} Currencies
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search currency, code, or country..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1">
              {UNIQUE_CURRENCIES.filter(c => 
                c.currency.toLowerCase().includes(searchQuery.toLowerCase()) || 
                c.code.toLowerCase().includes(searchQuery.toLowerCase()) || 
                c.country.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((c) => {
                const isSelected = selectedCurrency === c.code;
                return (
                  <button
                    key={c.code}
                    onClick={() => { setSelectedCurrency(c.code); setActiveTab("menu"); }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-blue-50 border-blue-500 text-blue-900 shadow-2xs font-bold" 
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl shrink-0 leading-none">{c.flag}</span>
                      <div className="text-left min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? "text-blue-700" : "text-slate-900"}`}>
                          {c.currency}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{c.country} • {c.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-mono font-bold ${isSelected ? "text-blue-700" : "text-slate-500"}`}>
                        {c.symbol}
                      </span>
                      {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: LANGUAGE SELECTOR */}
        {activeTab === "language" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Select Display Language</h3>
              <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                {UNIQUE_LANGUAGES.length} Languages
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language name or code..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-8 text-xs font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1">
              {UNIQUE_LANGUAGES.filter(l => 
                l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                l.nativeName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                l.code.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((l) => {
                const isSelected = selectedLanguageCode === l.code;
                return (
                  <button
                    key={l.code}
                    onClick={() => { setSelectedLanguageCode(l.code); setActiveTab("menu"); }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected 
                        ? "bg-blue-50 border-blue-500 text-blue-900 shadow-2xs font-bold" 
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl shrink-0 leading-none">{l.flag}</span>
                      <div className="text-left min-w-0">
                        <p className={`text-xs font-bold truncate ${isSelected ? "text-blue-700" : "text-slate-900"}`}>
                          {l.nativeName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{l.name} • {l.code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {l.direction === "rtl" && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200">
                          RTL
                        </span>
                      )}
                      {isSelected && <Check className="h-4 w-4 text-blue-600 shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 7: DEVELOPER API */}
        {activeTab === "api" && (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Key className="w-4 h-4 text-blue-600" />
                    Developer REST API Key
                  </h3>
                  <p className="text-xs text-slate-500">Integrate virtual SMS activations and SMM orders into your software.</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  LIVE API ACTIVE
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Your Personal API Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={currentUser.apiKey || `zx_live_${currentUser.id.substring(0, 16)}_key`}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-800 outline-none select-all"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentUser.apiKey || `zx_live_${currentUser.id.substring(0, 16)}_key`);
                      toast.success("API key copied to clipboard!");
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">Keep your API key private. Do not share it in public repositories.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">REST Endpoints Quick Reference</p>
                <div className="space-y-1.5 font-mono text-[9px] sm:text-[10.5px] text-slate-700 leading-snug">
                  <p className="bg-white p-2 rounded-lg border border-slate-200 break-all">
                    <span className="font-bold text-blue-600 mr-1">GET</span>/api/v1/get-number?api_key=YOUR_KEY&service=wa&country=pakistan
                  </p>
                  <p className="bg-white p-2 rounded-lg border border-slate-200 break-all">
                    <span className="font-bold text-emerald-600 mr-1">GET</span>/api/v1/get-sms?api_key=YOUR_KEY&id=ORDER_ID
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleNavigation("api")}
                  className="w-full bg-slate-100 hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-200 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Code2 className="w-4 h-4" />
                  <span>Open Full API Console & Documentation</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 8: HELP & SUPPORT */}
        {activeTab === "support" && (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  24/7 Customer Support Center
                </h3>
                <p className="text-xs text-slate-500">Need help with activations, wallet deposits, or subscriptions? We are here for you!</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-blue-900 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Direct Email Support
                  </h4>
                  <p className="text-xs text-blue-800/80 font-mono font-semibold">zeroxnetworks@gmail.com</p>
                  <p className="text-[11px] text-blue-700/70">Response time: Within 15 minutes</p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
                  <h4 className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Guaranteed Refunds
                  </h4>
                  <p className="text-xs text-emerald-800/80">If an SMS verification code is not received within 10 minutes, your funds are 100% refunded automatically.</p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleNavigation("tickets")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-md shadow-blue-500/10 text-xs transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider"
                >
                  <HelpCircle className="w-4 h-4" />
                  <span>Open Support Ticket</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 9: PRIVACY POLICY & TRANSPARENCY */}
        {activeTab === "privacy" && (
          <div className="space-y-5">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    ZeroX Network Privacy Policy & Terms
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Official transparency, cryptographic safeguards, and operational terms.</p>
                </div>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  REVISED AUGUST 2026
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-blue-600" /> 1. Ephemeral SMS & Zero Password Requests
                  </h4>
                  <p>Inbound SMS verification OTPs are strictly non-persistent and auto-purged from server memory after completion. We never ask for your social media passwords or private account PINs.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" /> 2. Transparent Deposit Fees &amp; 0% SMS Auto-Refund
                  </h4>
                  <p>Transparent fee structure: 2.0% on Local Gateways (Easypaisa, JazzCash, NayaPay, Raast) and 0.5% on Automated Crypto. Unreceived SMS verification requests are 100% refunded instantly to wallet with 0% penalty.</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" /> 3. Responsible Usage &amp; Injazify Guarantee
                  </h4>
                  <p>ZeroX Network is a project of Injazify (<a href="https://www.injazify.com/" target="_blank" rel="noopener noreferrer" className="text-[#00AEEF] hover:underline font-semibold">injazify.com</a>) with guaranteed 99.99% server uptime, full-term warranty on digital subscriptions, and 24/7 dedicated support via ticket &amp; WhatsApp (+44 7868 713315).</p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
                >
                  Back to Overview
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigation("privacy")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer shadow-sm"
                >
                  View Full Portal Policy
                </button>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Drawer Footer Bar */}
      <div className="sticky bottom-0 z-20 bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold text-slate-600">ZEROX NETWORK © 2026</span>
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => setActiveTab("support")} 
            className="hover:text-blue-600 transition-colors font-semibold cursor-pointer"
          >
            Support
          </button>
          <span>•</span>
          <button 
            type="button"
            onClick={() => setActiveTab("privacy")} 
            className="hover:text-blue-600 transition-colors font-semibold cursor-pointer"
          >
            Privacy
          </button>
        </div>
      </div>

    </div>
  );
}
