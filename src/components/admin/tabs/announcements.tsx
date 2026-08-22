import { Announcement } from "../../../types";


import React, { useState } from 'react';
import { useAdminContext } from '../AdminContext';
import { 
  Lock, Settings, Plus, Save, Check, Eye, EyeOff, Trash2, Pencil, 
  ToggleLeft, ToggleRight, Percent, Edit3, Link, ArrowRight, ShieldCheck, Server, X,
  CreditCard, User, Landmark, Clipboard, CheckCircle2, XCircle, Users, CheckSquare, RefreshCw, Megaphone, Mail,
  Star, Award, Phone, ShoppingBag, Coins, Search, Filter, Sparkles, ArrowRightLeft, ChevronDown, ChevronUp, Bitcoin,
  ImageIcon, LinkIcon, Cpu, Image as LucideImage, Upload, Camera, Palette, Layers, Copy, RotateCcw, Layout, Youtube
} from "lucide-react";
import { format } from "date-fns";
import BrandingImages from "../../admin/BrandingImages";
import SmmManagement from "../../SmmManagement";
import FiveSimManagement from "../../FiveSimManagement";
import ImapPaymentManager from "../../ImapPaymentManager";
import EnterpriseAnalytics from "../../EnterpriseAnalytics";


export default function AnnouncementsTab() {
  const ctx = useAdminContext();
  const { 
  announcements, setAnnouncements, isOpen, onClose, apiKey, onChangeKey, isValidating, validationError, onValidate, profile, orders, disabledServices, onToggleService, customPrices, onUpdateCustomPrice, priceMarkupPercent, onUpdateMarkupPercent, customServices, onAddCustomService, onRemoveCustomService, customLinks, onAddCustomLink, onRemoveCustomLink, onUpdateCustomLink, depositInstructions, onUpdateDepositInstruction, onDeleteDepositInstruction, depositRequests, onApproveDeposit, onRejectDeposit, registeredUsers, onUpdateUserBalance, autoApproveDeposits, onToggleAutoApprove, autoApproveCrypto, onToggleAutoApproveCrypto, cryptoRate, onUpdateCryptoRate, cryptoMinDeposit, onUpdateCryptoMinDeposit, localMinDeposit, onUpdateLocalMinDeposit, onUpdateGlobalSettings, smmProviders, setSmmProviders, smmServices, setSmmServices, smmCategories, setSmmCategories, smmOrders, setSmmOrders, smmPriceRules, setSmmPriceRules, smmLogs, setSmmLogs, smmSettings, setSmmSettings, smsProviders, setSmsProviders, siteLogoUrl, siteTitle, siteTagline, siteCoverUrl, showSiteCover, siteCoverTitle, siteCoverSubtitle, sellerCoverUrl, depositCoverUrl, aboutAvatarUrl, smmCoverUrl, customImages, tabMaintenance,
  username, setUsername, password, setPassword, authError, setAuthError, isLoggedIn, setIsLoggedIn, showPassword, setShowPassword, draftPriceMarkupPercent, setDraftPriceMarkupPercent, draftAutoApproveDeposits, setDraftAutoApproveDeposits, draftAutoApproveCrypto, setDraftAutoApproveCrypto, draftCryptoRate, setDraftCryptoRate, draftCryptoMinDeposit, setDraftCryptoMinDeposit, draftLocalMinDeposit, setDraftLocalMinDeposit, draftDisabledServices, setDraftDisabledServices, draftCustomPrices, setDraftCustomPrices, draftCustomLinks, setDraftCustomLinks, draftAnnouncements, setDraftAnnouncements, draftUserBalances, setDraftUserBalances, draftTabMaintenance, setDraftTabMaintenance, isSavingTabMaintenance, setIsSavingTabMaintenance, isSavingGlobalSettings, setIsSavingGlobalSettings, isSavingServices, setIsSavingServices, isSavingLinks, setIsSavingLinks, isSavingAnnouncements, setIsSavingAnnouncements, isSavingUserBalances, setIsSavingUserBalances, activeTab, setActiveTab, selectedManageUser, setSelectedManageUser, manageWarningMsg, setManageWarningMsg, manageBanReason, setManageBanReason, manageDailyLimit, setManageDailyLimit, isAdminDropdownOpen, setIsAdminDropdownOpen, draftUserLoyalty, setDraftUserLoyalty, bonusPointsInput, setBonusPointsInput, smsOrderSearch, setSmsOrderSearch, smsOrderStatusFilter, setSmsOrderStatusFilter, newServiceName, setNewServiceName, newServicePrice, setNewServicePrice, newServiceIcon, setNewServiceIcon, newLinkName, setNewLinkName, editingLinkIndex, setEditingLinkIndex, editLinkName, setEditLinkName, editLinkUrl, setEditLinkUrl, newLinkUrl, setNewLinkUrl, serviceSearch, setServiceSearch, userSearch, setUserSearch, requestSearch, setRequestSearch, editMethod, setEditMethod, instTitle, setInstTitle, instNumber, setInstNumber, instGuidelines, setInstGuidelines, instActive, setInstActive, instQrUrl, setInstQrUrl, instLogoUrl, setInstLogoUrl, instHeaderTitle, setInstHeaderTitle, instHeaderTag, setInstHeaderTag, instVerificationBadge, setInstVerificationBadge, instSubtitle, setInstSubtitle, instBadgesText, setInstBadgesText, instSubAccounts, setInstSubAccounts, instCryptoAddresses, setInstCryptoAddresses, isSavingInstruction, setIsSavingInstruction, adminNotesText, setAdminNotesText, editingSmsProvId, setEditingSmsProvId, smsProvName, setSmsProvName, smsProvUrl, setSmsProvUrl, smsProvKey, setSmsProvKey, smsProvType, setSmsProvType, smsProvNotes, setSmsProvNotes, isSyncingProv, setIsSyncingProv, isAddingSmsProv, setIsAddingSmsProv,
  handleSaveTabMaintenance, handleSaveGlobalSettings, handleDiscardGlobalSettingsChanges, handleApplyServicesChanges, handleDiscardServicesChanges, handleApplyLinksChanges, handleDiscardLinksChanges, handleApplyAnnouncementsChanges, handleDiscardAnnouncementsChanges, handleApplyUserBalances, handleDiscardUserBalancesChanges, handleQrUpload, handleLogoUpload, handleLogin, handleLogout, handleAddServiceSubmit, handleAddLinkSubmit, handleAddCryptoAddressItem, handleUpdateCryptoAddressItem, handleCryptoImageUpload, handleRemoveCryptoAddressItem, handleAddSubAccountItem, handleUpdateSubAccountItem, handleRemoveSubAccountItem, handleSaveInstruction, handleResetOrDeleteInstruction, handleSyncSmsBalance, handleToggleSmsStatus, handleDeleteSmsProvider, handleAddOrEditSmsProvider, handleStartEditSmsProv,
  hasAnnouncementsUnsavedChanges, } = ctx;

  return (
    <React.Fragment>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
        {hasAnnouncementsUnsavedChanges && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
              <div>
                <h4 className="text-xs font-black text-amber-800">Unsaved Announcements Changes</h4>
                <p className="text-[10px] font-bold text-amber-600 uppercase">You have modified the announcements configuration</p>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleDiscardAnnouncementsChanges}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleApplyAnnouncementsChanges}
                disabled={isSavingAnnouncements}
                className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-1.5 rounded-lg shadow-md shadow-blue-500/10 transition cursor-pointer flex items-center gap-1.5"
              >
                {isSavingAnnouncements ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                <span>Apply Announcements Changes</span>
              </button>
            </div>
          </div>
        )}

        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
          <p className="text-sm font-semibold text-blue-900 mb-1">Manage Platform Announcements & Offers</p>
          <p className="text-xs text-blue-800/80 leading-relaxed mb-3">
            Create updates, important news, or time-limited offers. Announcements are displayed on the platform to keep your users informed.
          </p>
          <ul className="text-xs text-blue-800/80 space-y-1.5 list-disc list-inside">
            <li><strong>Standard Announcements:</strong> Useful for general updates or news.</li>
            <li><strong>Limited Time Offers:</strong> Toggle "Is Offer" and set an expiration date to create urgency. These will be highlighted to users.</li>
            <li><strong>Visibility:</strong> Use the "Visible on Website" toggle to hide announcements without deleting them entirely.</li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Platform Announcements</h3>
          </div>
          <div className="flex items-center gap-2">
            {hasAnnouncementsUnsavedChanges && (
              <button
                type="button"
                onClick={handleApplyAnnouncementsChanges}
                disabled={isSavingAnnouncements}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-sm animate-pulse-slow"
              >
                {isSavingAnnouncements ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span className="hidden sm:inline">Save Changes</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const newAnn: Announcement = {
                  id: "ann_" + Date.now().toString(),
                  title: "New Platform Update",
                  content: "Details about this update...",
                  isActive: true,
                  createdAt: new Date().toISOString()
                };
                setDraftAnnouncements([newAnn, ...draftAnnouncements]);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Add Announcement</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {draftAnnouncements.map((ann, idx) => (
            <div key={ann.id} className={`rounded-xl shadow-sm border p-5 space-y-4 transition-colors ${ann.isOffer ? 'bg-indigo-50/30 border-indigo-200' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-start gap-2">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Title</label>
                  <input
                    type="text"
                    value={ann.title}
                    onChange={(e) => {
                      const updated = [...draftAnnouncements];
                      updated[idx].title = e.target.value;
                      setDraftAnnouncements(updated);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  onClick={() => {
                    if(confirm("Are you sure you want to delete this announcement?")) {
                      setDraftAnnouncements(draftAnnouncements.filter(a => a.id !== ann.id));
                    }
                  }}
                  className="text-red-500 hover:text-red-700 p-1.5 bg-red-50 hover:bg-red-100 rounded-md transition-colors shrink-0"
                  title="Delete Announcement"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Content</label>
                <textarea
                  value={ann.content}
                  onChange={(e) => {
                    const updated = [...draftAnnouncements];
                    updated[idx].content = e.target.value;
                    setDraftAnnouncements(updated);
                  }}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Image URL</label>
                  <input
                    type="text"
                    value={ann.imageUrl || ""}
                    onChange={(e) => {
                      const updated = [...draftAnnouncements];
                      updated[idx].imageUrl = e.target.value;
                      setDraftAnnouncements(updated);
                    }}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><LinkIcon className="w-3 h-3" /> Link URL</label>
                  <input
                    type="text"
                    value={ann.linkUrl || ""}
                    onChange={(e) => {
                      const updated = [...draftAnnouncements];
                      updated[idx].linkUrl = e.target.value;
                      setDraftAnnouncements(updated);
                    }}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5 col-span-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Youtube className="w-3 h-3 text-red-500" /> YouTube Video URL</label>
                  <input
                    type="text"
                    value={ann.youtubeUrl || ""}
                    onChange={(e) => {
                      const updated = [...draftAnnouncements];
                      updated[idx].youtubeUrl = e.target.value;
                      setDraftAnnouncements(updated);
                    }}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor={`offer-${ann.id}`} className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    Limited Time Offer
                  </label>
                  <input
                    type="checkbox"
                    id={`offer-${ann.id}`}
                    checked={!!ann.isOffer}
                    onChange={(e) => {
                      const updated = [...draftAnnouncements];
                      updated[idx].isOffer = e.target.checked;
                      setDraftAnnouncements(updated);
                    }}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
                
                {ann.isOffer && (
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">Offer Expiration (Optional)</label>
                    <input
                      type="datetime-local"
                      value={ann.offerEndTime || ""}
                      onChange={(e) => {
                        const updated = [...draftAnnouncements];
                        updated[idx].offerEndTime = e.target.value;
                        setDraftAnnouncements(updated);
                      }}
                      className="w-full bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <input
                  type="checkbox"
                  id={`active-${ann.id}`}
                  checked={ann.isActive}
                  onChange={(e) => {
                    const updated = [...draftAnnouncements];
                    updated[idx].isActive = e.target.checked;
                    setDraftAnnouncements(updated);
                  }}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor={`active-${ann.id}`} className="text-sm font-bold text-slate-700 cursor-pointer">
                  Visible on Website
                </label>
              </div>
            </div>
          ))}

          {draftAnnouncements.length === 0 && (
            <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-xl">
              <div className="flex flex-col items-center justify-center">
                <Megaphone className="w-10 h-10 text-slate-300 mb-3" />
                <h4 className="text-sm font-bold text-slate-700">No Announcements</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">Create an announcement or promotional offer to display it on the customer portal.</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={handleApplyAnnouncementsChanges}
            disabled={isSavingAnnouncements || !hasAnnouncementsUnsavedChanges}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              hasAnnouncementsUnsavedChanges
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSavingAnnouncements ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Announcements to Firestore</span>
          </button>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 mt-6">
          <button
            type="button"
            onClick={handleApplyAnnouncementsChanges}
            disabled={isSavingAnnouncements || !hasAnnouncementsUnsavedChanges}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              hasAnnouncementsUnsavedChanges
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-slate-100 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSavingAnnouncements ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save All Announcements to Firestore</span>
          </button>
        </div>
      </div>
    </React.Fragment>
  );
}
