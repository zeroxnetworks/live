

import React, { useState, useEffect } from 'react';
import { useAdminContext } from '../AdminContext';
import { toast } from "react-hot-toast";
import { GatewayBrandIcon } from "../../GatewayBrandIcon";
import { db } from "../../../lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { 
  Lock, Settings, Plus, Save, Check, Eye, EyeOff, Trash2, Pencil, 
  ToggleLeft, ToggleRight, Percent, Edit3, Link, ArrowRight, ShieldCheck, Server, X,
  CreditCard, User, Landmark, Clipboard, CheckCircle2, XCircle, Users, CheckSquare, RefreshCw, Megaphone, Mail,
  Star, Award, Phone, ShoppingBag, Coins, Search, Filter, Sparkles, ArrowRightLeft, ChevronDown, ChevronUp, Bitcoin,
  ImageIcon, LinkIcon, Cpu, Image as LucideImage, Upload, Camera, Palette, Layers, Copy, RotateCcw, Layout,
  Gift, Trophy, Crown, Flame
} from "lucide-react";
import { format } from "date-fns";
import BrandingImages from "../../admin/BrandingImages";
import SmmManagement from "../../SmmManagement";
import FiveSimManagement from "../../FiveSimManagement";
import ImapPaymentManager from "../../ImapPaymentManager";
import EnterpriseAnalytics from "../../EnterpriseAnalytics";


export default function DepositSettingsTab() {
  const ctx = useAdminContext();
  const [activeIconMethod, setActiveIconMethod] = useState<string>("easypaisa");
  const [customIconInput, setCustomIconInput] = useState<string>("");
  const [isUpdatingIcon, setIsUpdatingIcon] = useState<boolean>(false);

  // Affiliate & Referral Settings
  const [referralRate, setReferralRate] = useState<number>(5);
  const [isSavingReferralRate, setIsSavingReferralRate] = useState<boolean>(false);
  const [affiliateStats, setAffiliateStats] = useState<any>(null);

  useEffect(() => {
    // Load zerox_config referral rate
    const loadConfig = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "zerox_config"));
        if (snap.exists() && typeof snap.data().referralCommissionRate === "number") {
          setReferralRate(snap.data().referralCommissionRate);
        }
      } catch (err) {
        console.warn("Could not load referral commission rate:", err);
      }
    };
    loadConfig();

    // Fetch Admin Affiliate Stats from API
    fetch("/api/admin/affiliate/stats")
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAffiliateStats(data.stats);
        }
      })
      .catch(err => console.warn("Admin affiliate stats fetch error:", err));
  }, []);

  const handleSaveReferralRate = async () => {
    setIsSavingReferralRate(true);
    try {
      const configRef = doc(db, "settings", "zerox_config");
      await setDoc(configRef, { referralCommissionRate: Number(referralRate) }, { merge: true });
      toast.success(`Affiliate Base Commission Rate updated to ${referralRate}%! Live across platform.`);
    } catch (err) {
      console.error("Failed to update referral rate:", err);
      toast.error("Failed to save referral rate to database.");
    } finally {
      setIsSavingReferralRate(false);
    }
  };

  const { 
  announcements, setAnnouncements, isOpen, onClose, apiKey, onChangeKey, isValidating, validationError, onValidate, profile, orders, disabledServices, onToggleService, customPrices, onUpdateCustomPrice, priceMarkupPercent, onUpdateMarkupPercent, customServices, onAddCustomService, onRemoveCustomService, customLinks, onAddCustomLink, onRemoveCustomLink, onUpdateCustomLink, depositInstructions, onUpdateDepositInstruction, onDeleteDepositInstruction, depositRequests, onApproveDeposit, onRejectDeposit, registeredUsers, onUpdateUserBalance, autoApproveDeposits, onToggleAutoApprove, autoApproveCrypto, onToggleAutoApproveCrypto, cryptoRate, onUpdateCryptoRate, cryptoMinDeposit, onUpdateCryptoMinDeposit, localMinDeposit, onUpdateLocalMinDeposit, onUpdateGlobalSettings, smmProviders, setSmmProviders, smmServices, setSmmServices, smmCategories, setSmmCategories, smmOrders, setSmmOrders, smmPriceRules, setSmmPriceRules, smmLogs, setSmmLogs, smmSettings, setSmmSettings, smsProviders, setSmsProviders, siteLogoUrl, siteTitle, siteTagline, siteCoverUrl, showSiteCover, siteCoverTitle, siteCoverSubtitle, sellerCoverUrl, depositCoverUrl, aboutAvatarUrl, smmCoverUrl, customImages, tabMaintenance,
  username, setUsername, password, setPassword, authError, setAuthError, isLoggedIn, setIsLoggedIn, showPassword, setShowPassword, draftPriceMarkupPercent, setDraftPriceMarkupPercent, draftAutoApproveDeposits, setDraftAutoApproveDeposits, draftAutoApproveCrypto, setDraftAutoApproveCrypto, draftCryptoRate, setDraftCryptoRate, draftCryptoMinDeposit, setDraftCryptoMinDeposit, draftLocalMinDeposit, setDraftLocalMinDeposit, draftDisabledServices, setDraftDisabledServices, draftCustomPrices, setDraftCustomPrices, draftCustomLinks, setDraftCustomLinks, draftAnnouncements, setDraftAnnouncements, draftUserBalances, setDraftUserBalances, draftTabMaintenance, setDraftTabMaintenance, isSavingTabMaintenance, setIsSavingTabMaintenance, isSavingGlobalSettings, setIsSavingGlobalSettings, isSavingServices, setIsSavingServices, isSavingLinks, setIsSavingLinks, isSavingAnnouncements, setIsSavingAnnouncements, isSavingUserBalances, setIsSavingUserBalances, activeTab, setActiveTab, selectedManageUser, setSelectedManageUser, manageWarningMsg, setManageWarningMsg, manageBanReason, setManageBanReason, manageDailyLimit, setManageDailyLimit, isAdminDropdownOpen, setIsAdminDropdownOpen, draftUserLoyalty, setDraftUserLoyalty, bonusPointsInput, setBonusPointsInput, smsOrderSearch, setSmsOrderSearch, smsOrderStatusFilter, setSmsOrderStatusFilter, newServiceName, setNewServiceName, newServicePrice, setNewServicePrice, newServiceIcon, setNewServiceIcon, newLinkName, setNewLinkName, editingLinkIndex, setEditingLinkIndex, editLinkName, setEditLinkName, editLinkUrl, setEditLinkUrl, newLinkUrl, setNewLinkUrl, serviceSearch, setServiceSearch, userSearch, setUserSearch, requestSearch, setRequestSearch, editMethod, setEditMethod, instTitle, setInstTitle, instNumber, setInstNumber, instGuidelines, setInstGuidelines, instActive, setInstActive, instHidden, setInstHidden, instQrUrl, setInstQrUrl, instLogoUrl, setInstLogoUrl, instHeaderTitle, setInstHeaderTitle, instHeaderTag, setInstHeaderTag, instVerificationBadge, setInstVerificationBadge, instSubtitle, setInstSubtitle, instBadgesText, setInstBadgesText, instSubAccounts, setInstSubAccounts, instCryptoAddresses, setInstCryptoAddresses, isSavingInstruction, setIsSavingInstruction, adminNotesText, setAdminNotesText, editingSmsProvId, setEditingSmsProvId, smsProvName, setSmsProvName, smsProvUrl, setSmsProvUrl, smsProvKey, setSmsProvKey, smsProvType, setSmsProvType, smsProvNotes, setSmsProvNotes, isSyncingProv, setIsSyncingProv, isAddingSmsProv, setIsAddingSmsProv,
  handleSaveTabMaintenance, handleSaveGlobalSettings, handleDiscardGlobalSettingsChanges, handleApplyServicesChanges, handleDiscardServicesChanges, handleApplyLinksChanges, handleDiscardLinksChanges, handleApplyAnnouncementsChanges, handleDiscardAnnouncementsChanges, handleApplyUserBalances, handleDiscardUserBalancesChanges, handleQrUpload, handleLogoUpload, handleLogin, handleLogout, handleAddServiceSubmit, handleAddLinkSubmit, handleAddCryptoAddressItem, handleUpdateCryptoAddressItem, handleCryptoImageUpload, handleRemoveCryptoAddressItem, handleAddSubAccountItem, handleUpdateSubAccountItem, handleRemoveSubAccountItem, handleSaveInstruction, handleResetOrDeleteInstruction, handleSyncSmsBalance, handleToggleSmsStatus, handleDeleteSmsProvider, handleAddOrEditSmsProvider, handleStartEditSmsProv,
  hasUnsavedChanges, } = ctx;

  return (
    <React.Fragment>
      
                <div className="space-y-6 animate-fade-in">
                  {/* Deposit Automation & Gateways Controls */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-2 mb-2 gap-3">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-purple-600" />
                        Deposit Automation & Gateways Controls
                      </h3>
                      {hasUnsavedChanges && (
                        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-amber-50 border border-amber-200 rounded-lg p-1 px-2 animate-pulse">
                          <span className="text-[10px] font-bold text-amber-700 uppercase">Unsaved Changes pending</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Local Automation Toggle */}
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                        <div>
                          <h4 className="text-xs font-black text-slate-700 uppercase">Auto-Approve Local Deposits</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Instantly credit PKR deposit requests</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDraftAutoApproveDeposits(!draftAutoApproveDeposits)}
                          className="cursor-pointer"
                        >
                          {draftAutoApproveDeposits ? (
                            <ToggleRight className="h-8 w-8 text-blue-600" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 text-slate-300" />
                          )}
                        </button>
                      </div>

                      {/* Crypto Automation Toggle */}
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-150 rounded-xl">
                        <div>
                          <h4 className="text-xs font-black text-amber-700 uppercase">Auto-Approve Crypto Deposits</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Instantly credit USDT deposits</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDraftAutoApproveCrypto(!draftAutoApproveCrypto)}
                          className="cursor-pointer"
                        >
                          {draftAutoApproveCrypto ? (
                            <ToggleRight className="h-8 w-8 text-amber-500" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 text-slate-300" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">USDT to PKR Exchange Rate</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={draftCryptoRate || 278}
                            onChange={(e) => setDraftCryptoRate(Number(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">PKR</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 mt-1 block">Value of 1 USDT in PKR.</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Crypto Min Deposit (USDT)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={draftCryptoMinDeposit || 5}
                            onChange={(e) => setDraftCryptoMinDeposit(Number(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">USDT</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 mt-1 block">Minimum allowed crypto deposit.</span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Local Min Deposit (PKR)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            value={draftLocalMinDeposit || 100}
                            onChange={(e) => setDraftLocalMinDeposit(Number(e.target.value) || 0)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">PKR</span>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 mt-1 block">Minimum allowed PKR deposit.</span>
                      </div>
                    </div>

                    {hasUnsavedChanges && (
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
                        <button
                          type="button"
                          onClick={handleDiscardGlobalSettingsChanges}
                          className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 px-3.5 py-2 rounded-lg transition"
                        >
                          Discard
                        </button>
                        <button
                          type="button"
                          onClick={handleSaveGlobalSettings}
                          disabled={isSavingGlobalSettings}
                          className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded-lg transition flex items-center gap-1.5 shadow-md shadow-blue-500/10"
                        >
                          {isSavingGlobalSettings ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          Save Controls Settings
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Affiliate & Referral Program Controls */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Gift className="h-4 w-4 text-emerald-600" />
                          Affiliate &amp; Referral Program Settings
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Manage base commission rates and review system-wide referral network performance.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                        Tiered Scaler Active (5% - 12.5%)
                      </span>
                    </div>

                    {affiliateStats && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs">
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Total Referrals</p>
                          <p className="text-base font-black text-slate-900 font-mono">{affiliateStats.totalReferredUsers || 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Active Affiliates</p>
                          <p className="text-base font-black text-indigo-600 font-mono">{affiliateStats.activeAffiliates || 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Total Paid Out</p>
                          <p className="text-base font-black text-emerald-600 font-mono">${(affiliateStats.totalCommissionsPaidUsd || 0).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-slate-400">Payout Events</p>
                          <p className="text-base font-black text-amber-600 font-mono">{affiliateStats.totalCommissionLogs || 0}</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1.5">
                          Base Referral Commission Rate (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="1"
                            max="50"
                            step="0.5"
                            value={referralRate}
                            onChange={(e) => setReferralRate(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                          <span className="absolute right-3 top-2 text-[10px] font-bold text-slate-400">%</span>
                        </div>
                        <span className="text-[9px] font-medium text-slate-400 mt-1 block">
                          Starter Tier rate. Silver (+2.5%), Gold (+5%), Diamond (+7.5%) scale automatically from this base.
                        </span>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={handleSaveReferralRate}
                          disabled={isSavingReferralRate}
                          className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                        >
                          {isSavingReferralRate ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          <span>Save Affiliate Commission Rate</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Gateway Icons & Logos Manager */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 gap-2">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                          <Palette className="h-4 w-4 text-blue-600" />
                          Payment Gateway Icons &amp; Logos Manager
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Update and customize logos for each payment method displayed in the user wallet.
                        </p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                        Live Sync to User Wallet
                      </span>
                    </div>

                    {/* Gateway Switcher Bar */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {[
                        { id: "easypaisa", name: "Easypaisa" },
                        { id: "jazzcash", name: "JazzCash" },
                        { id: "nayapay", name: "NayaPay" },
                        { id: "bank", name: "Bank Transfer" },
                        { id: "crypto", name: "Crypto (USDT/BTC)" },
                        { id: "redotpay", name: "RedotPay" },
                        { id: "card", name: "Card Pay" }
                      ].map((gw) => {
                        const isSel = activeIconMethod === gw.id;
                        const inst = depositInstructions.find(i => i.method === gw.id);
                        const hasCustomLogo = Boolean(inst?.gatewayLogoUrl);

                        return (
                          <button
                            key={gw.id}
                            type="button"
                            onClick={() => {
                              setActiveIconMethod(gw.id);
                              setCustomIconInput(inst?.gatewayLogoUrl || "");
                            }}
                            className={`px-3 py-2 rounded-xl text-xs font-extrabold transition flex items-center gap-2 cursor-pointer border ${
                              isSel
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm scale-[1.02]"
                                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            <GatewayBrandIcon 
                              methodId={gw.id} 
                              logoUrl={inst?.gatewayLogoUrl} 
                              className="w-5 h-5 !rounded-md" 
                              iconClassName="w-3.5 h-3.5" 
                            />
                            <span>{gw.name}</span>
                            {hasCustomLogo && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Custom Logo Active" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Gateway Icon Editor Card */}
                    {(() => {
                      const currentInst = depositInstructions.find(i => i.method === activeIconMethod);
                      const currentLogo = customIconInput || currentInst?.gatewayLogoUrl || "";

                      const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast.error("Logo file size must be under 5MB");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = () => {
                            const result = reader.result as string;
                            setCustomIconInput(result);
                            toast.success("Logo loaded! Click 'Save Gateway Icon' to apply.");
                          };
                          reader.readAsDataURL(file);
                        }
                      };

                      const handleDirectSaveIcon = async (urlToSave: string) => {
                        setIsUpdatingIcon(true);
                        try {
                          await onUpdateDepositInstruction(
                            activeIconMethod,
                            currentInst?.accountTitle || activeIconMethod.toUpperCase(),
                            currentInst?.accountNumber || "",
                            currentInst?.instructions || "",
                            currentInst?.isActive !== false,
                            currentInst?.isHidden,
                            currentInst?.qrImageUrl,
                            urlToSave,
                            currentInst?.subtitle,
                            currentInst?.badges,
                            currentInst?.headerTitle,
                            currentInst?.headerTag,
                            currentInst?.verificationBadge,
                            currentInst?.subAccounts,
                            currentInst?.cryptoAddresses
                          );
                          toast.success(`✅ Saved new icon for ${activeIconMethod.toUpperCase()} successfully!`);
                        } catch (err) {
                          console.error(err);
                          toast.error("Failed to save gateway icon.");
                        } finally {
                          setIsUpdatingIcon(false);
                        }
                      };

                      return (
                        <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                            <div className="flex items-center gap-3">
                              <GatewayBrandIcon 
                                methodId={activeIconMethod} 
                                logoUrl={currentLogo} 
                                className="w-12 h-12 shadow-sm" 
                                iconClassName="w-7 h-7" 
                              />
                              <div>
                                <h4 className="text-sm font-extrabold text-slate-900">
                                  {activeIconMethod.toUpperCase()} Gateway Icon
                                </h4>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {currentInst?.gatewayLogoUrl ? "Custom Logo Configured" : "Default Brand Vector Icon Active"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {currentInst?.gatewayLogoUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomIconInput("");
                                    handleDirectSaveIcon("");
                                  }}
                                  disabled={isUpdatingIcon}
                                  className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Reset to Default</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDirectSaveIcon(customIconInput)}
                                disabled={isUpdatingIcon}
                                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                              >
                                {isUpdatingIcon ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                <span>Save Gateway Icon</span>
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Upload Image File */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-tight">
                                Option 1: Upload Icon File
                              </label>
                              <p className="text-[11px] text-slate-500">
                                Select any PNG, SVG, JPG, or WebP image from your device.
                              </p>
                              <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition cursor-pointer">
                                <Upload className="w-4 h-4" />
                                <span>Choose Image File</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleUploadFile} 
                                  className="hidden" 
                                />
                              </label>
                            </div>

                            {/* Direct URL */}
                            <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
                              <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-tight">
                                Option 2: Paste Image URL
                              </label>
                              <p className="text-[11px] text-slate-500">
                                Direct image link (HTTPS) for the payment gateway.
                              </p>
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={customIconInput}
                                  onChange={(e) => setCustomIconInput(e.target.value)}
                                  placeholder="https://example.com/logo.png"
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                                {customIconInput && (
                                  <button
                                    type="button"
                                    onClick={() => setCustomIconInput("")}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg"
                                    title="Clear"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Configure Deposit Credentials */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                      <Landmark className="h-4 w-4 text-blue-600" />
                      Configure Deposit Credentials
                    </h3>

                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const defaultMethods = [
                          { id: "card", label: "Card Pay", color: "bg-cyan-400", isDefault: true },
                          { id: "easypaisa", label: "Easypaisa", color: "bg-emerald-500", isDefault: true },
                          { id: "jazzcash", label: "JazzCash", color: "bg-red-500", isDefault: true },
                          { id: "nayapay", label: "NayaPay", color: "bg-[#00AEEF]", isDefault: true },
                          { id: "bank", label: "Bank Account", color: "bg-blue-600", isDefault: true },
                          
                          { id: "redotpay", label: "RedotPay", color: "bg-red-600", isDefault: true }
                        ];
                        const customMethods = depositInstructions
                          .filter(inst => !defaultMethods.some(m => m.id === inst.method))
                          .map(inst => ({
                            id: inst.method,
                            label: inst.method.charAt(0).toUpperCase() + inst.method.slice(1),
                            color: "bg-purple-500",
                            isDefault: false
                          }));
                        const allMethods = [...defaultMethods, ...customMethods];
                        if (editMethod && !allMethods.some(m => m.id === editMethod)) {
                          allMethods.push({
                            id: editMethod,
                            label: editMethod.charAt(0).toUpperCase() + editMethod.slice(1),
                            color: "bg-purple-500",
                            isDefault: false
                          });
                        }
                        
                        return (
                          <>
                            {allMethods.map(method => {
                              const isSel = editMethod === method.id;
                              const hasConfig = depositInstructions.some(i => i.method === method.id && (i.accountNumber || i.accountTitle));
                              const inst = depositInstructions.find(i => i.method === method.id);
                              const isActuallyActive = inst ? inst.isActive !== false : false;
                              return (
                                <button
                                  key={method.id}
                                  type="button"
                                  onClick={() => setEditMethod(method.id as any)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                    isSel 
                                      ? "bg-slate-900 text-white shadow-sm border border-slate-700" 
                                      : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                                  }`}
                                >
                                  <span className={`w-2 h-2 rounded-full ${hasConfig ? (isActuallyActive ? "bg-emerald-500" : "bg-amber-500") : "bg-slate-300"}`} />
                                  <span>{method.label}</span>
                                </button>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => {
                                const newId = window.prompt("Enter new provider ID (e.g. 'paypal', 'skrill'):");
                                if (newId && newId.trim()) {
                                  const formatted = newId.trim().toLowerCase().replace(/\s+/g, "_");
                                  if (!allMethods.some(m => m.id === formatted)) {
                                    setEditMethod(formatted);
                                  }
                                }
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add New</span>
                            </button>
                          </>
                        );
                      })()}
                    </div>

                    <form onSubmit={handleSaveInstruction} className="space-y-4 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Account Title</label>
                          <input
                            type="text"
                            value={instTitle}
                            onChange={(e) => setInstTitle(e.target.value)}
                            placeholder="e.g. RedotPay"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Account / Card Number / ID</label>
                          <input
                            type="text"
                            value={instNumber}
                            onChange={(e) => setInstNumber(e.target.value)}
                            placeholder="e.g. 1397066551 or IBAN"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            required
                          />
                        </div>
                      </div>

                      {/* Header & Verification Customization */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Header Section Title</label>
                          <input
                            type="text"
                            value={instHeaderTitle}
                            onChange={(e) => setInstHeaderTitle(e.target.value)}
                            placeholder="e.g. 1. PAYMENT GATEWAY"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Header Badge Tag</label>
                          <input
                            type="text"
                            value={instHeaderTag}
                            onChange={(e) => setInstHeaderTag(e.target.value)}
                            placeholder="e.g. Global or Local"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Verification Badge Notice</label>
                          <input
                            type="text"
                            value={instVerificationBadge}
                            onChange={(e) => setInstVerificationBadge(e.target.value)}
                            placeholder="e.g. Instant Verification"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Subtitle & Feature Pills Customization */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Sub-Title / Tagline</label>
                          <input
                            type="text"
                            value={instSubtitle}
                            onChange={(e) => setInstSubtitle(e.target.value)}
                            placeholder="e.g. Instant transfer via RedotPay App ID or QR"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Feature Pills (Comma Separated)</label>
                          <input
                            type="text"
                            value={instBadgesText}
                            onChange={(e) => setInstBadgesText(e.target.value)}
                            placeholder="⚡ Zero Fees, 💳 Card & App, 🌐 Global, ⏱️ Instant"
                            className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                          />
                        </div>
                      </div>

                      {/* Crypto Gateway Notice (Automated via NOWPayments) */}
                      {editMethod === "crypto" && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                            <Bitcoin className="h-4 w-4" />
                            <span>Automated NOWPayments Crypto Gateway Active</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Crypto deposits are powered automatically by the <strong>ZeroX Network Crypto Gateway</strong> (NOWPayments API & IPN integration). Static wallet addresses and manual deposit hash submissions are disabled for security and automatic instant crediting.
                          </p>
                          <p className="text-[11px] text-amber-700 font-medium pt-1">
                            To configure API credentials, supported currencies, deposit limits, or view blockchain transaction logs, go to <strong>Admin → Payments → Crypto Gateway</strong>.
                          </p>
                        </div>
                      )}

                      {/* Multiple Sub-Accounts Configurator (For any gateway) */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            Multiple Accounts Management ({editMethod.toUpperCase()})
                          </h4>
                          <button
                            type="button"
                            onClick={handleAddSubAccountItem}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                          >
                            <Plus className="h-3 w-3" />
                            <span>Add Secondary Account</span>
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-600">
                          Optionally add multiple accounts for this gateway (e.g. Account 1, Account 2, Branch IBAN). Users can switch between them easily when depositing.
                        </p>

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {instSubAccounts.length === 0 ? (
                            <div className="text-center py-3 text-xs text-slate-400 font-medium bg-white rounded-lg border border-dashed border-slate-200">
                              Only 1 primary account configured above. Click "Add Secondary Account" if you have multiple accounts for users.
                            </div>
                          ) : (
                            instSubAccounts.map((acc, index) => (
                              <div key={index} className="bg-white border border-slate-200 rounded-lg p-2.5 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center shadow-2xs">
                                <div className="sm:col-span-3">
                                  <label className="block text-[9.5px] font-bold text-slate-500 uppercase mb-0.5">Account Label</label>
                                  <input
                                    type="text"
                                    value={acc.label}
                                    onChange={(e) => handleUpdateSubAccountItem(index, "label", e.target.value)}
                                    placeholder="e.g. Primary / Account 2"
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>

                                <div className="sm:col-span-4">
                                  <label className="block text-[9.5px] font-bold text-slate-500 uppercase mb-0.5">Account Title</label>
                                  <input
                                    type="text"
                                    value={acc.title}
                                    onChange={(e) => handleUpdateSubAccountItem(index, "title", e.target.value)}
                                    placeholder="e.g. Muhammad Ali"
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>

                                <div className="sm:col-span-4">
                                  <label className="block text-[9.5px] font-bold text-slate-500 uppercase mb-0.5">Account / IBAN Number</label>
                                  <input
                                    type="text"
                                    value={acc.number}
                                    onChange={(e) => handleUpdateSubAccountItem(index, "number", e.target.value)}
                                    placeholder="e.g. 03001234567 or IBAN"
                                    className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>

                                <div className="sm:col-span-1 flex justify-end pt-3 sm:pt-0">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubAccountItem(index)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                    title="Remove Sub-Account"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Guidelines & instructions</label>
                        <textarea
                          rows={3}
                          value={instGuidelines}
                          onChange={(e) => setInstGuidelines(e.target.value)}
                          placeholder="Please transfer amount to this account and upload the receipt/TxID below."
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          required
                        />
                      </div>

                      {/* Image & Logo & QR Code Upload Options */}
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Upload className="h-3.5 w-3.5 text-blue-600" />
                            Media & Visual Branding (Logo & QR Code)
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono font-medium">Supports PNG, JPG, SVG, WebP</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* 1. Payment Gateway Logo Upload */}
                          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                <LucideImage className="h-3.5 w-3.5 text-blue-500" />
                                Payment Gateway Logo
                              </label>
                              {instLogoUrl && (
                                <button
                                  type="button"
                                  onClick={() => setInstLogoUrl("")}
                                  className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Remove Logo
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                                {instLogoUrl ? (
                                  <img src={instLogoUrl} alt="Gateway Logo" className="w-full h-full object-contain p-1" />
                                ) : (
                                  <LucideImage className="h-5 w-5 text-slate-400" />
                                )}
                              </div>

                              <div className="flex-1 space-y-2">
                                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition cursor-pointer">
                                  <Upload className="h-3.5 w-3.5" />
                                  <span>Upload Logo File</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoUpload} 
                                    className="hidden" 
                                  />
                                </label>
                                <input
                                  type="text"
                                  value={instLogoUrl}
                                  onChange={(e) => setInstLogoUrl(e.target.value)}
                                  placeholder="Or paste Logo Image URL..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>

                          {/* 2. QR Code Image Upload */}
                          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                                <Camera className="h-3.5 w-3.5 text-emerald-500" />
                                Account QR Code Image
                              </label>
                              {instQrUrl && (
                                <button
                                  type="button"
                                  onClick={() => setInstQrUrl("")}
                                  className="text-[10px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  Remove QR
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-14 h-14 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative">
                                {instQrUrl ? (
                                  <img src={instQrUrl} alt="Account QR Code" className="w-full h-full object-contain p-0.5" />
                                ) : (
                                  <Camera className="h-5 w-5 text-slate-400" />
                                )}
                              </div>

                              <div className="flex-1 space-y-2">
                                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition cursor-pointer">
                                  <Upload className="h-3.5 w-3.5" />
                                  <span>Upload QR Image</span>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleQrUpload} 
                                    className="hidden" 
                                  />
                                </label>
                                <input
                                  type="text"
                                  value={instQrUrl}
                                  onChange={(e) => setInstQrUrl(e.target.value)}
                                  placeholder="Or paste QR Image URL..."
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Live Aesthetic Preview for PC & Mobile */}
                        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3 text-amber-400" />
                              Live Mobile & PC Gateway Card Preview
                            </span>
                            <span className="text-[9px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                              {editMethod.toUpperCase()} ACTIVE
                            </span>
                          </div>

                          <div className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2.5 shadow-inner">
                            {/* Header Section */}
                            <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-800/80 pb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold text-slate-300 uppercase">{instHeaderTitle || "1. PAYMENT GATEWAY"}</span>
                                {instHeaderTag && (
                                  <span className="bg-emerald-950/80 text-emerald-400 text-[8px] px-1.5 py-0.5 rounded-full border border-emerald-500/30 font-bold uppercase">
                                    {instHeaderTag}
                                  </span>
                                )}
                              </div>
                              {instVerificationBadge && (
                                <span className="text-[9px] font-mono text-[#00AEEF] font-bold">
                                  {instVerificationBadge}
                                </span>
                              )}
                            </div>

                            {/* Main Body */}
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 border-b border-slate-800/60 pb-2">
                              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                                {instLogoUrl ? (
                                  <img src={instLogoUrl} alt="Logo" className="w-10 h-10 object-contain rounded-lg bg-slate-900 p-1 border border-slate-800 shrink-0" />
                                ) : (
                                  <div className="w-10 h-10 rounded-lg bg-red-600/20 text-red-400 border border-red-500/30 flex items-center justify-center font-black text-xs shrink-0">
                                    {editMethod.substring(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h5 className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                                    <span>{instTitle || "Account Title"}</span>
                                    {instNumber && (
                                      <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-mono">
                                        ID: {instNumber}
                                      </span>
                                    )}
                                  </h5>
                                  {instSubtitle && (
                                    <p className="text-[9.5px] text-slate-400 font-medium">{instSubtitle}</p>
                                  )}
                                </div>
                              </div>

                              {instQrUrl && (
                                <div className="bg-white p-1 rounded-lg border border-slate-700 shrink-0 flex items-center gap-1 px-2">
                                  <img src={instQrUrl} alt="QR Preview" className="w-8 h-8 object-contain" />
                                  <span className="text-[8px] font-mono font-bold text-slate-900">QR Code</span>
                                </div>
                              )}
                            </div>

                            {/* Feature Pills */}
                            {instBadgesText && (
                              <div className="flex flex-wrap gap-1 text-[8px] font-bold">
                                {instBadgesText.split(",").map((b, i) => b.trim() && (
                                  <span key={i} className="bg-slate-900 text-slate-300 border border-slate-800 px-1.5 py-0.5 rounded-md">
                                    {b.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-150">
                        <div>
                          <h4 className="text-xs font-bold text-slate-700">Service Active Status</h4>
                          <p className="text-[10px] text-slate-400">Toggle on/off to make this payment channel public on deposit page.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInstActive(!instActive)}
                          className="cursor-pointer"
                        >
                          {instActive ? (
                            <ToggleRight className="h-8 w-8 text-blue-600" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 text-slate-300" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <div>
                          <h4 className="text-xs font-bold text-slate-700">Hide Gateway Completely</h4>
                          <p className="text-[10px] text-slate-400">Toggle on to completely remove this gateway from the user selection list.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInstHidden(!instHidden)}
                          className="cursor-pointer"
                        >
                          {instHidden ? (
                            <ToggleRight className="h-8 w-8 text-rose-600" />
                          ) : (
                            <ToggleLeft className="h-8 w-8 text-slate-300" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-3 flex-wrap">
                        <button
                          type="button"
                          onClick={handleResetOrDeleteInstruction}
                          disabled={isSavingInstruction}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 disabled:opacity-50 font-bold py-2 px-3.5 rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                          <span>Delete / Clear {editMethod.toUpperCase()}</span>
                        </button>

                        <button
                          type="submit"
                          disabled={isSavingInstruction}
                          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-5 rounded-lg text-xs shadow-md shadow-blue-200 flex items-center gap-1.5 cursor-pointer"
                        >
                          {isSavingInstruction ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          <span>{isSavingInstruction ? "Saving..." : `Save & Update ${editMethod.toUpperCase()}`}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              
    </React.Fragment>
  );
}
