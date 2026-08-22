import { updateDoc, doc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { toast } from "react-hot-toast";


import React, { useState } from 'react';
import { useAdminContext } from '../AdminContext';
import { 
  Lock, Settings, Plus, Save, Check, Eye, EyeOff, Trash2, Pencil, 
  ToggleLeft, ToggleRight, Percent, Edit3, Link, ArrowRight, ShieldCheck, Server, X,
  CreditCard, User, Landmark, Clipboard, CheckCircle2, XCircle, Users, CheckSquare, RefreshCw, Megaphone, Mail,
  Star, Award, Phone, ShoppingBag, Coins, Search, Filter, Sparkles, ArrowRightLeft, ChevronDown, ChevronUp, Bitcoin,
  ImageIcon, LinkIcon, Cpu, Image as LucideImage, Upload, Camera, Palette, Layers, Copy, RotateCcw, Layout
} from "lucide-react";
import { format } from "date-fns";
import BrandingImages from "../../admin/BrandingImages";
import SmmManagement from "../../SmmManagement";
import FiveSimManagement from "../../FiveSimManagement";
import ImapPaymentManager from "../../ImapPaymentManager";
import EnterpriseAnalytics from "../../EnterpriseAnalytics";


export default function UsersTab() {
  const ctx = useAdminContext();
  const { 
  announcements, setAnnouncements, isOpen, onClose, apiKey, onChangeKey, isValidating, validationError, onValidate, profile, orders, disabledServices, onToggleService, customPrices, onUpdateCustomPrice, priceMarkupPercent, onUpdateMarkupPercent, customServices, onAddCustomService, onRemoveCustomService, customLinks, onAddCustomLink, onRemoveCustomLink, onUpdateCustomLink, depositInstructions, onUpdateDepositInstruction, onDeleteDepositInstruction, depositRequests, onApproveDeposit, onRejectDeposit, registeredUsers, onUpdateUserBalance, autoApproveDeposits, onToggleAutoApprove, autoApproveCrypto, onToggleAutoApproveCrypto, cryptoRate, onUpdateCryptoRate, cryptoMinDeposit, onUpdateCryptoMinDeposit, localMinDeposit, onUpdateLocalMinDeposit, onUpdateGlobalSettings, smmProviders, setSmmProviders, smmServices, setSmmServices, smmCategories, setSmmCategories, smmOrders, setSmmOrders, smmPriceRules, setSmmPriceRules, smmLogs, setSmmLogs, smmSettings, setSmmSettings, smsProviders, setSmsProviders, siteLogoUrl, siteTitle, siteTagline, siteCoverUrl, showSiteCover, siteCoverTitle, siteCoverSubtitle, sellerCoverUrl, depositCoverUrl, aboutAvatarUrl, smmCoverUrl, customImages, tabMaintenance,
  username, setUsername, password, setPassword, authError, setAuthError, isLoggedIn, setIsLoggedIn, showPassword, setShowPassword, draftPriceMarkupPercent, setDraftPriceMarkupPercent, draftAutoApproveDeposits, setDraftAutoApproveDeposits, draftAutoApproveCrypto, setDraftAutoApproveCrypto, draftCryptoRate, setDraftCryptoRate, draftCryptoMinDeposit, setDraftCryptoMinDeposit, draftLocalMinDeposit, setDraftLocalMinDeposit, draftDisabledServices, setDraftDisabledServices, draftCustomPrices, setDraftCustomPrices, draftCustomLinks, setDraftCustomLinks, draftAnnouncements, setDraftAnnouncements, draftUserBalances, setDraftUserBalances, draftTabMaintenance, setDraftTabMaintenance, isSavingTabMaintenance, setIsSavingTabMaintenance, isSavingGlobalSettings, setIsSavingGlobalSettings, isSavingServices, setIsSavingServices, isSavingLinks, setIsSavingLinks, isSavingAnnouncements, setIsSavingAnnouncements, isSavingUserBalances, setIsSavingUserBalances, activeTab, setActiveTab, selectedManageUser, setSelectedManageUser, manageWarningMsg, setManageWarningMsg, manageBanReason, setManageBanReason, manageDailyLimit, setManageDailyLimit, isAdminDropdownOpen, setIsAdminDropdownOpen, draftUserLoyalty, setDraftUserLoyalty, bonusPointsInput, setBonusPointsInput, smsOrderSearch, setSmsOrderSearch, smsOrderStatusFilter, setSmsOrderStatusFilter, newServiceName, setNewServiceName, newServicePrice, setNewServicePrice, newServiceIcon, setNewServiceIcon, newLinkName, setNewLinkName, editingLinkIndex, setEditingLinkIndex, editLinkName, setEditLinkName, editLinkUrl, setEditLinkUrl, newLinkUrl, setNewLinkUrl, serviceSearch, setServiceSearch, userSearch, setUserSearch, requestSearch, setRequestSearch, editMethod, setEditMethod, instTitle, setInstTitle, instNumber, setInstNumber, instGuidelines, setInstGuidelines, instActive, setInstActive, instQrUrl, setInstQrUrl, instLogoUrl, setInstLogoUrl, instHeaderTitle, setInstHeaderTitle, instHeaderTag, setInstHeaderTag, instVerificationBadge, setInstVerificationBadge, instSubtitle, setInstSubtitle, instBadgesText, setInstBadgesText, instSubAccounts, setInstSubAccounts, instCryptoAddresses, setInstCryptoAddresses, isSavingInstruction, setIsSavingInstruction, adminNotesText, setAdminNotesText, editingSmsProvId, setEditingSmsProvId, smsProvName, setSmsProvName, smsProvUrl, setSmsProvUrl, smsProvKey, setSmsProvKey, smsProvType, setSmsProvType, smsProvNotes, setSmsProvNotes, isSyncingProv, setIsSyncingProv, isAddingSmsProv, setIsAddingSmsProv,
  handleSaveTabMaintenance, handleSaveGlobalSettings, handleDiscardGlobalSettingsChanges, handleApplyServicesChanges, handleDiscardServicesChanges, handleApplyLinksChanges, handleDiscardLinksChanges, handleApplyAnnouncementsChanges, handleDiscardAnnouncementsChanges, handleApplyUserBalances, handleDiscardUserBalancesChanges, handleQrUpload, handleLogoUpload, handleLogin, handleLogout, handleAddServiceSubmit, handleAddLinkSubmit, handleAddCryptoAddressItem, handleUpdateCryptoAddressItem, handleCryptoImageUpload, handleRemoveCryptoAddressItem, handleAddSubAccountItem, handleUpdateSubAccountItem, handleRemoveSubAccountItem, handleSaveInstruction, handleResetOrDeleteInstruction, handleSyncSmsBalance, handleToggleSmsStatus, handleDeleteSmsProvider, handleAddOrEditSmsProvider, handleStartEditSmsProv,
  hasUnsavedChanges, } = ctx;

  // --- BULK OPERATIONS & FILTERING STATES ---
  const [balanceFilter, setBalanceFilter] = useState<"ALL" | "LOW" | "MEDIUM" | "HIGH">("ALL");
  const [activityFilter, setActivityFilter] = useState<"ALL" | "ACTIVE" | "IDLE">("ALL");
  const [loyaltyFilter, setLoyaltyFilter] = useState<"ALL" | "BRONZE" | "SILVER" | "GOLD" | "PLATINUM">("ALL");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Bulk Modals / Action States
  const [bulkActionType, setBulkActionType] = useState<"NONE" | "BONUS" | "NOTIFICATION" | "DAILY_LIMIT" | "LOYALTY_TIER">("NONE");
  const [batchBonusAmount, setBatchBonusAmount] = useState<number>(100); // ₨ or PTS
  const [batchBonusType, setBatchBonusType] = useState<"BALANCE" | "LOYALTY_PTS">("BALANCE");
  const [batchNotifTitle, setBatchNotifTitle] = useState<string>("Important Account Update");
  const [batchNotifBody, setBatchNotifBody] = useState<string>("Dear Valued User, you have received a targeted message from Admin.");
  const [batchDailyLimit, setBatchDailyLimit] = useState<number>(5000);
  const [batchLoyaltyPts, setBatchLoyaltyPts] = useState<number>(500);
  const [isExecutingBulk, setIsExecutingBulk] = useState<boolean>(false);
  const [isBackfilling, setIsBackfilling] = useState<boolean>(false);

  const handleBackfillWelcomeEmails = async () => {
    if (!window.confirm(`Are you sure you want to send a professional Welcome Email to all ${registeredUsers.length} users? This will ensure everyone has received their initial login credentials and platform guide.`)) {
      return;
    }
    setIsBackfilling(true);
    try {
      const response = await fetch("/api/email/backfill-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          users: registeredUsers.map(u => ({ email: u.email, username: u.username }))
        })
      });
      const data = await response.json();
      if (data.success) {
        toast.success(`Backfill started! ${registeredUsers.length} users will receive welcome emails.`);
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to start backfill: " + err.message);
    } finally {
      setIsBackfilling(false);
    }
  };

  // Filter Logic
  const filteredUsers = registeredUsers.filter(u => {
    // 1. Search Query
    const matchesSearch = 
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    if (!matchesSearch) return false;

    // 2. Balance Filter (PKR: < 500 = Low, 500-5000 = Med, > 5000 = High)
    const currentVal = draftUserBalances[u.id] !== undefined ? draftUserBalances[u.id] : u.balance;
    const pkrVal = currentVal * ctx.cryptoRate;
    if (balanceFilter === "LOW" && pkrVal >= 500) return false;
    if (balanceFilter === "MEDIUM" && (pkrVal < 500 || pkrVal > 5000)) return false;
    if (balanceFilter === "HIGH" && pkrVal <= 5000) return false;

    // 3. Loyalty Level
    const pts = draftUserLoyalty[u.id] !== undefined ? draftUserLoyalty[u.id] : (u.loyaltyPoints || 0);
    if (loyaltyFilter === "BRONZE" && pts >= 500) return false;
    if (loyaltyFilter === "SILVER" && (pts < 500 || pts >= 2000)) return false;
    if (loyaltyFilter === "GOLD" && (pts < 2000 || pts >= 5000)) return false;
    if (loyaltyFilter === "PLATINUM" && pts < 5000) return false;

    // 4. Activity Filter (Order history presence)
    const userOrderCount = orders.filter(o => o.username === u.username || o.userEmail === u.email).length;
    if (activityFilter === "ACTIVE" && userOrderCount === 0) return false;
    if (activityFilter === "IDLE" && userOrderCount > 0) return false;

    return true;
  });

  // Toggle Select All
  const isAllSelected = filteredUsers.length > 0 && filteredUsers.every(u => selectedUserIds.includes(u.id));
  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    }
  };

  const handleToggleSelectUser = (id: string) => {
    setSelectedUserIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Execute Bulk Action Workflow
  const handleExecuteBulkAction = async () => {
    if (selectedUserIds.length === 0) {
      toast.error("Please select at least one user for bulk operations.");
      return;
    }

    setIsExecutingBulk(true);
    try {
      if (bulkActionType === "BONUS") {
        if (batchBonusType === "BALANCE") {
          // Batch Balance Credit
          const updatedDrafts = { ...draftUserBalances };
          selectedUserIds.forEach(id => {
            const current = updatedDrafts[id] !== undefined ? updatedDrafts[id] : (registeredUsers.find(u => u.id === id)?.balance || 0);
            updatedDrafts[id] = current + batchBonusAmount;
          });
          setDraftUserBalances(updatedDrafts);
          toast.success(`Applied batch bonus of +₨${(batchBonusAmount * ctx.cryptoRate).toFixed(0)} (${batchBonusAmount} Base) to ${selectedUserIds.length} users! Click "Apply User Management" to persist.`);
        } else {
          // Batch Loyalty Points
          for (const id of selectedUserIds) {
            const usr = registeredUsers.find(u => u.id === id);
            if (usr) {
              const currentPts = draftUserLoyalty[id] !== undefined ? draftUserLoyalty[id] : (usr.loyaltyPoints || 0);
              const newPts = currentPts + batchBonusAmount;
              await updateDoc(doc(db, "users", id), { loyaltyPoints: newPts });
            }
          }
          toast.success(`Dispatched +${batchBonusAmount} Loyalty Points to ${selectedUserIds.length} users!`);
        }
      } else if (bulkActionType === "NOTIFICATION") {
        // 1. UI Alert
        const newNotif = {
          id: `bulk_notif_${Date.now()}`,
          title: batchNotifTitle,
          content: batchNotifBody,
          targetUserIds: selectedUserIds,
          createdAt: new Date().toISOString(),
          type: "targeted_alert",
          active: true
        };
        setAnnouncements(prev => [newNotif, ...prev]);

        // 2. Email Notification
        const targetUserEmails = registeredUsers
          .filter(u => selectedUserIds.includes(u.id))
          .map(u => u.email)
          .filter(Boolean);

        if (targetUserEmails.length > 0) {
          fetch("/api/email/bulk-custom", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              subject: batchNotifTitle,
              message: batchNotifBody,
              targetEmails: targetUserEmails
            })
          }).catch(err => console.error("Bulk email broadcast failed", err));
        }

        toast.success(`Targeted notification & emails broadcasted to ${selectedUserIds.length} users!`);
      } else if (bulkActionType === "DAILY_LIMIT") {
        // Update Daily Limits for selected users
        for (const id of selectedUserIds) {
          await updateDoc(doc(db, "users", id), { dailyLimit: batchDailyLimit });
        }
        toast.success(`Updated daily limits to ₨${batchDailyLimit.toLocaleString()} for ${selectedUserIds.length} users!`);
      } else if (bulkActionType === "LOYALTY_TIER") {
        // Bulk Loyalty Points tier set
        for (const id of selectedUserIds) {
          await updateDoc(doc(db, "users", id), { loyaltyPoints: batchLoyaltyPts });
        }
        toast.success(`Set loyalty points to ${batchLoyaltyPts} PTS for ${selectedUserIds.length} users!`);
      }

      setBulkActionType("NONE");
    } catch (err) {
      console.error(err);
      toast.error("Failed to execute bulk operation.");
    } finally {
      setIsExecutingBulk(false);
    }
  };

  return (
    <React.Fragment>
      
                <div className="space-y-4 animate-fade-in flex flex-col h-auto md:h-[520px] md:min-h-[350px]">
                  {hasUnsavedChanges && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-sm shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                        <div>
                          <h4 className="text-xs font-black text-amber-800">Unsaved User Management pending</h4>
                          <p className="text-[10px] font-bold text-amber-600 uppercase">You have modified user wallet balances</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={handleDiscardUserBalancesChanges}
                          className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                        >
                          Discard
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyUserBalances}
                          disabled={isSavingUserBalances}
                          className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-1.5 rounded-lg shadow-md shadow-blue-500/10 transition cursor-pointer flex items-center gap-1.5"
                        >
                          {isSavingUserBalances ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          <span>Apply User Management</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex-1 flex flex-col overflow-hidden space-y-3">
                    {/* Header & Search */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-3 shrink-0 gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          User Management & Bulk Operations
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Filter users by balance, activity, loyalty & execute batch actions</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleBackfillWelcomeEmails}
                          disabled={isBackfilling}
                          className="bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-[10px] font-extrabold px-3 py-1.5 rounded-lg border border-emerald-200 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          {isBackfilling ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Mail className="h-3 w-3" />}
                          Backfill Welcome Emails
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const emails = filteredUsers.map(u => u.email).filter(Boolean).join(", ");
                            navigator.clipboard.writeText(emails);
                            toast.success(`Copied ${filteredUsers.length} emails to clipboard!`);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-extrabold px-3 py-1.5 rounded-lg border border-slate-200 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="h-3 w-3" />
                          Copy All Emails
                        </button>
                        <div className="relative w-full sm:w-auto">
                          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search Username/Email..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full sm:w-[220px] bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Filter Controls Bar */}
                    <div className="bg-slate-50/80 border border-slate-200 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase flex items-center gap-1">
                          <Filter className="h-3 w-3 text-slate-400" /> Filters:
                        </span>

                        {/* Balance Filter */}
                        <select
                          value={balanceFilter}
                          onChange={(e) => setBalanceFilter(e.target.value as any)}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">All Balances</option>
                          <option value="LOW">Low Balance (&lt; ₨500 PKR)</option>
                          <option value="MEDIUM">Medium (₨500-5,000 PKR)</option>
                          <option value="HIGH">High Balance (&gt; ₨5,000 PKR)</option>
                        </select>

                        {/* Activity Filter */}
                        <select
                          value={activityFilter}
                          onChange={(e) => setActivityFilter(e.target.value as any)}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">All Activity</option>
                          <option value="ACTIVE">Active (Has Orders)</option>
                          <option value="IDLE">Idle / Inactive Users</option>
                        </select>

                        {/* Loyalty Filter */}
                        <select
                          value={loyaltyFilter}
                          onChange={(e) => setLoyaltyFilter(e.target.value as any)}
                          className="bg-white border border-slate-200 rounded px-2 py-1 text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="ALL">All Loyalty Tiers</option>
                          <option value="BRONZE">Bronze Tier (&lt;500 PTS)</option>
                          <option value="SILVER">Silver Tier (500-2,000 PTS)</option>
                          <option value="GOLD">Gold Tier (2,000-5,000 PTS)</option>
                          <option value="PLATINUM">Platinum Tier (&gt;5,000 PTS)</option>
                        </select>
                      </div>

                      {/* Select All Checkbox & Counter */}
                      <div className="flex items-center gap-2.5">
                        <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={isAllSelected}
                            onChange={handleToggleSelectAll}
                            className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          Select All ({filteredUsers.length})
                        </label>
                        <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {selectedUserIds.length} Selected
                        </span>
                      </div>
                    </div>

                    {/* Bulk Action Toolbar Bar (Visible when users selected) */}
                    {selectedUserIds.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-2.5 rounded-lg flex flex-wrap items-center justify-between gap-2 shadow-sm animate-fade-in">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-amber-400 animate-pulse" />
                          <span className="text-xs font-black">
                            Batch Actions for {selectedUserIds.length} Users:
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Batch Bonus */}
                          <button
                            type="button"
                            onClick={() => setBulkActionType("BONUS")}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded cursor-pointer transition flex items-center gap-1 shadow-2xs"
                          >
                            <Coins className="h-3 w-3" /> Apply Batch Bonus
                          </button>

                          {/* Targeted Notification */}
                          <button
                            type="button"
                            onClick={() => setBulkActionType("NOTIFICATION")}
                            className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded cursor-pointer transition flex items-center gap-1 shadow-2xs"
                          >
                            <Megaphone className="h-3 w-3" /> Targeted Broadcast
                          </button>

                          {/* Update Daily Limits */}
                          <button
                            type="button"
                            onClick={() => setBulkActionType("DAILY_LIMIT")}
                            className="bg-purple-500 hover:bg-purple-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded cursor-pointer transition flex items-center gap-1 shadow-2xs"
                          >
                            <Lock className="h-3 w-3" /> Update Daily Limits
                          </button>

                          {/* Set Loyalty Tier */}
                          <button
                            type="button"
                            onClick={() => setBulkActionType("LOYALTY_TIER")}
                            className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded cursor-pointer transition flex items-center gap-1 shadow-2xs"
                          >
                            <Star className="h-3 w-3" /> Set Loyalty PTS
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedUserIds([])}
                            className="text-[10px] font-bold text-slate-300 hover:text-white px-1.5 py-1"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Users List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {(() => {
                        if (filteredUsers.length === 0) {
                          return (
                            <div className="text-center py-12 text-slate-400">
                              <Users className="h-8 w-8 mx-auto stroke-1 mb-2" />
                              <p className="text-xs font-bold uppercase">No User Accounts Match Selected Filters</p>
                            </div>
                          );
                        }

                        return filteredUsers.map((usr) => {
                          const currentVal = draftUserBalances[usr.id] !== undefined ? draftUserBalances[usr.id] : usr.balance;
                          const isModified = draftUserBalances[usr.id] !== undefined && draftUserBalances[usr.id] !== usr.balance;
                          const isSelected = selectedUserIds.includes(usr.id);

                          return (
                            <div 
                              key={usr.id}
                              className={`p-3 md:p-4 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3.5 transition-all ${
                                isSelected ? "bg-blue-50/60 border-blue-300 shadow-2xs" : isModified ? "bg-amber-50/40 border-amber-200 shadow-xs" : "bg-slate-50 border-slate-150"
                              }`}
                            >
                              <div className="flex items-center gap-3 w-full md:w-auto">
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectUser(usr.id)}
                                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer shrink-0"
                                />

                                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                                  {usr.avatarUrl ? <img src={usr.avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : <img src="https://cdn.phototourl.com/member/2026-07-24-b4f94510-1a75-430c-9101-a1527cb13f05.png" alt="Profile" className="w-full h-full object-cover" />}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-black text-slate-800 block truncate">
                                      {usr.username}
                                    </span>
                                    {usr.dailyLimit && (
                                      <span className="text-[9px] font-extrabold bg-slate-200 text-slate-700 px-1 rounded">
                                        Limit: ₨{usr.dailyLimit.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono block truncate">
                                    {usr.email}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 pt-2.5 md:pt-0">
                                <div className="text-right text-[10px] font-mono pr-2 border-r border-slate-100 hidden sm:block">
                                  <div className="font-extrabold text-blue-600">₨ {(currentVal * ctx.cryptoRate).toFixed(1)}</div>
                                  <div className="text-emerald-600 font-bold">${(currentVal ).toFixed(2)}</div>
                                </div>
                                <div className={`flex items-center gap-1.5 bg-white border px-2.5 py-1.5 rounded-lg shadow-sm transition-colors ${
                                  isModified ? "border-amber-300" : "border-slate-200"
                                }`}>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">PKR:</span>
                                  <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={(currentVal * ctx.cryptoRate).toFixed(1)}
                                    onChange={(e) => {
                                      const pkrVal = Number(e.target.value);
                                      const baseVal = pkrVal / (cryptoRate || 278);
                                      setDraftUserBalances(prev => ({
                                        ...prev,
                                        [usr.id]: isNaN(baseVal) ? 0 : baseVal
                                      }));
                                    }}
                                    className="w-20 bg-transparent border-none text-xs text-slate-800 text-right focus:outline-none font-bold font-mono"
                                  />
                                </div>

                                {/* Loyalty Points Editor */}
                                <div className="flex items-center gap-1.5 bg-amber-50/80 border border-amber-200 px-2.5 py-1.5 rounded-lg shadow-sm">
                                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500 shrink-0" />
                                  <span className="text-[9px] font-bold text-amber-800 uppercase">PTS:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={draftUserLoyalty[usr.id] !== undefined ? draftUserLoyalty[usr.id] : (usr.loyaltyPoints || 0)}
                                    onChange={(e) => {
                                      const pts = parseInt(e.target.value, 10);
                                      setDraftUserLoyalty(prev => ({ ...prev, [usr.id]: isNaN(pts) ? 0 : pts }));
                                    }}
                                    className="w-12 bg-transparent border-none text-xs text-amber-900 text-right focus:outline-none font-bold font-mono"
                                  />
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const newPts = draftUserLoyalty[usr.id] !== undefined ? draftUserLoyalty[usr.id] : (usr.loyaltyPoints || 0);
                                      try {
                                        await updateDoc(doc(db, "users", usr.id), { loyaltyPoints: newPts });
                                        toast.success(`Updated ${usr.username}'s loyalty points to ${newPts} PTS!`);
                                      } catch (err) {
                                        toast.error("Failed to update loyalty points.");
                                      }
                                    }}
                                    className="text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded transition cursor-pointer"
                                    title="Save Points to Firestore"
                                  >
                                    Save
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => { setSelectedManageUser(usr); setManageWarningMsg(usr.warningMessage || ""); setManageBanReason(usr.banReason || ""); setManageDailyLimit(usr.dailyLimit ? usr.dailyLimit.toString() : ""); }}
                                  className="ml-2 text-[10px] font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-2 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                                >
                                  <Settings className="w-3.5 h-3.5" />
                                  Manage
                                </button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>

      {/* --- BULK ACTION MODAL DIALOG --- */}
      {bulkActionType !== "NONE" && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {bulkActionType === "BONUS" && "Batch Bonus Allocation"}
                    {bulkActionType === "NOTIFICATION" && "Targeted Broadcast Message"}
                    {bulkActionType === "DAILY_LIMIT" && "Update Daily Deposit Limits"}
                    {bulkActionType === "LOYALTY_TIER" && "Bulk Loyalty Points Elevation"}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    Executing action on {selectedUserIds.length} selected user accounts
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setBulkActionType("NONE")} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body depending on Action */}
            {bulkActionType === "BONUS" && (
              <div className="space-y-3">
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setBatchBonusType("BALANCE")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer transition ${
                      batchBonusType === "BALANCE" ? "bg-white text-blue-600 shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    Wallet Balance Bonus
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchBonusType("LOYALTY_PTS")}
                    className={`flex-1 py-1.5 text-xs font-bold rounded cursor-pointer transition ${
                      batchBonusType === "LOYALTY_PTS" ? "bg-white text-amber-600 shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    Loyalty Points (PTS)
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    Bonus Value ({batchBonusType === "BALANCE" ? "PKR" : "PTS"})
                  </label>
                  <input 
                    type="number"
                    min="1"
                    value={batchBonusType === "BALANCE" ? Number((batchBonusAmount * ctx.cryptoRate).toFixed(0)) : batchBonusAmount}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      setBatchBonusAmount(batchBonusType === "BALANCE" ? val / (cryptoRate || 278) : val);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {batchBonusType === "BALANCE" ? `Equivalent to ~₨ ${((batchBonusType === "BALANCE" ? batchBonusAmount : 0) * ctx.cryptoRate).toFixed(0)} PKR per user.` : `Adds ${batchBonusAmount} PTS to each user.`}
                  </p>
                </div>
              </div>
            )}

            {bulkActionType === "NOTIFICATION" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    Notification Subject / Headline
                  </label>
                  <input 
                    type="text"
                    value={batchNotifTitle}
                    onChange={(e) => setBatchNotifTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    Message Body Content
                  </label>
                  <textarea 
                    rows={3}
                    value={batchNotifBody}
                    onChange={(e) => setBatchNotifBody(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>
            )}

            {bulkActionType === "DAILY_LIMIT" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    New Max Daily Transaction Limit (₨ PKR)
                  </label>
                  <input 
                    type="number"
                    step="500"
                    value={batchDailyLimit}
                    onChange={(e) => setBatchDailyLimit(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Applies daily cap to all {selectedUserIds.length} selected accounts.
                  </p>
                </div>
              </div>
            )}

            {bulkActionType === "LOYALTY_TIER" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    Target Loyalty Points (PTS)
                  </label>
                  <input 
                    type="number"
                    step="100"
                    value={batchLoyaltyPts}
                    onChange={(e) => setBatchLoyaltyPts(Number(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <div className="flex gap-1.5 mt-2">
                    {[
                      { name: "Bronze", pts: 0 },
                      { name: "Silver", pts: 500 },
                      { name: "Gold", pts: 2000 },
                      { name: "Platinum", pts: 5000 }
                    ].map(t => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => setBatchLoyaltyPts(t.pts)}
                        className="text-[10px] font-extrabold bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-800 px-2 py-1 rounded border border-slate-200 cursor-pointer"
                      >
                        {t.name} ({t.pts})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBulkActionType("NONE")}
                className="px-3.5 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkAction}
                disabled={isExecutingBulk}
                className="px-4 py-1.5 text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-md shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
              >
                {isExecutingBulk ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Execute for {selectedUserIds.length} Users
              </button>
            </div>
          </div>
        </div>
      )}
              
    </React.Fragment>
  );
}
