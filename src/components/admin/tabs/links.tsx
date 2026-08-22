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


export default function LinksTab() {
  const ctx = useAdminContext();
  const { 
  announcements, setAnnouncements, isOpen, onClose, apiKey, onChangeKey, isValidating, validationError, onValidate, profile, orders, disabledServices, onToggleService, customPrices, onUpdateCustomPrice, priceMarkupPercent, onUpdateMarkupPercent, customServices, onAddCustomService, onRemoveCustomService, customLinks, onAddCustomLink, onRemoveCustomLink, onUpdateCustomLink, depositInstructions, onUpdateDepositInstruction, onDeleteDepositInstruction, depositRequests, onApproveDeposit, onRejectDeposit, registeredUsers, onUpdateUserBalance, autoApproveDeposits, onToggleAutoApprove, autoApproveCrypto, onToggleAutoApproveCrypto, cryptoRate, onUpdateCryptoRate, cryptoMinDeposit, onUpdateCryptoMinDeposit, localMinDeposit, onUpdateLocalMinDeposit, onUpdateGlobalSettings, smmProviders, setSmmProviders, smmServices, setSmmServices, smmCategories, setSmmCategories, smmOrders, setSmmOrders, smmPriceRules, setSmmPriceRules, smmLogs, setSmmLogs, smmSettings, setSmmSettings, smsProviders, setSmsProviders, siteLogoUrl, siteTitle, siteTagline, siteCoverUrl, showSiteCover, siteCoverTitle, siteCoverSubtitle, sellerCoverUrl, depositCoverUrl, aboutAvatarUrl, smmCoverUrl, customImages, tabMaintenance,
  username, setUsername, password, setPassword, authError, setAuthError, isLoggedIn, setIsLoggedIn, showPassword, setShowPassword, draftPriceMarkupPercent, setDraftPriceMarkupPercent, draftAutoApproveDeposits, setDraftAutoApproveDeposits, draftAutoApproveCrypto, setDraftAutoApproveCrypto, draftCryptoRate, setDraftCryptoRate, draftCryptoMinDeposit, setDraftCryptoMinDeposit, draftLocalMinDeposit, setDraftLocalMinDeposit, draftDisabledServices, setDraftDisabledServices, draftCustomPrices, setDraftCustomPrices, draftCustomLinks, setDraftCustomLinks, draftAnnouncements, setDraftAnnouncements, draftUserBalances, setDraftUserBalances, draftTabMaintenance, setDraftTabMaintenance, isSavingTabMaintenance, setIsSavingTabMaintenance, isSavingGlobalSettings, setIsSavingGlobalSettings, isSavingServices, setIsSavingServices, isSavingLinks, setIsSavingLinks, isSavingAnnouncements, setIsSavingAnnouncements, isSavingUserBalances, setIsSavingUserBalances, activeTab, setActiveTab, selectedManageUser, setSelectedManageUser, manageWarningMsg, setManageWarningMsg, manageBanReason, setManageBanReason, manageDailyLimit, setManageDailyLimit, isAdminDropdownOpen, setIsAdminDropdownOpen, draftUserLoyalty, setDraftUserLoyalty, bonusPointsInput, setBonusPointsInput, smsOrderSearch, setSmsOrderSearch, smsOrderStatusFilter, setSmsOrderStatusFilter, newServiceName, setNewServiceName, newServicePrice, setNewServicePrice, newServiceIcon, setNewServiceIcon, newLinkName, setNewLinkName, editingLinkIndex, setEditingLinkIndex, editLinkName, setEditLinkName, editLinkUrl, setEditLinkUrl, newLinkUrl, setNewLinkUrl, serviceSearch, setServiceSearch, userSearch, setUserSearch, requestSearch, setRequestSearch, editMethod, setEditMethod, instTitle, setInstTitle, instNumber, setInstNumber, instGuidelines, setInstGuidelines, instActive, setInstActive, instQrUrl, setInstQrUrl, instLogoUrl, setInstLogoUrl, instHeaderTitle, setInstHeaderTitle, instHeaderTag, setInstHeaderTag, instVerificationBadge, setInstVerificationBadge, instSubtitle, setInstSubtitle, instBadgesText, setInstBadgesText, instSubAccounts, setInstSubAccounts, instCryptoAddresses, setInstCryptoAddresses, isSavingInstruction, setIsSavingInstruction, adminNotesText, setAdminNotesText, editingSmsProvId, setEditingSmsProvId, smsProvName, setSmsProvName, smsProvUrl, setSmsProvUrl, smsProvKey, setSmsProvKey, smsProvType, setSmsProvType, smsProvNotes, setSmsProvNotes, isSyncingProv, setIsSyncingProv, isAddingSmsProv, setIsAddingSmsProv,
  handleSaveTabMaintenance, handleSaveGlobalSettings, handleDiscardGlobalSettingsChanges, handleApplyServicesChanges, handleDiscardServicesChanges, handleApplyLinksChanges, handleDiscardLinksChanges, handleApplyAnnouncementsChanges, handleDiscardAnnouncementsChanges, handleApplyUserBalances, handleDiscardUserBalancesChanges, handleQrUpload, handleLogoUpload, handleLogin, handleLogout, handleAddServiceSubmit, handleAddLinkSubmit, handleAddCryptoAddressItem, handleUpdateCryptoAddressItem, handleCryptoImageUpload, handleRemoveCryptoAddressItem, handleAddSubAccountItem, handleUpdateSubAccountItem, handleRemoveSubAccountItem, handleSaveInstruction, handleResetOrDeleteInstruction, handleSyncSmsBalance, handleToggleSmsStatus, handleDeleteSmsProvider, handleAddOrEditSmsProvider, handleStartEditSmsProv,
  hasUnsavedChanges, } = ctx;

  return (
    <React.Fragment>
      
          <div className="space-y-6 animate-fade-in">
            {hasUnsavedChanges && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                  <div>
                    <h4 className="text-xs font-black text-amber-800">Unsaved Dashboard Links Changes</h4>
                    <p className="text-[10px] font-bold text-amber-600 uppercase">You have modified the list of custom useful links</p>
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={handleDiscardLinksChanges}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyLinksChanges}
                    disabled={isSavingLinks}
                    className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-1.5 rounded-lg shadow-md shadow-blue-500/10 transition cursor-pointer flex items-center gap-1.5"
                  >
                    {isSavingLinks ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    <span>Apply Links Changes</span>
                  </button>
                </div>
              </div>
            )}

            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                <Link className="h-4 w-4 text-blue-600" />
                Add Useful Dashboard Link
              </h3>

              <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 mb-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">Quick Links Navigation</p>
                <p className="text-xs text-blue-800/80 leading-relaxed mb-2">
                  Create convenient access points for your users by adding external or internal links. These appear prominently in the user dashboard sidebar.
                </p>
                <ul className="text-xs text-blue-800/80 space-y-1.5 list-disc list-inside">
                  <li><strong>Anchor Text:</strong> The visible text the user will click (e.g., "Join our Telegram", "Terms of Service").</li>
                  <li><strong>Destination URL:</strong> The full web address (e.g., https://t.me/zeroxnetwork). Must include https:// or http://.</li>
                  <li><strong>Management:</strong> You can edit or delete existing links from the list below. Be sure to hit "Apply Links Changes" after modifying the list.</li>
                </ul>
              </div>

              <form onSubmit={handleAddLinkSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Link Anchor Text</label>
                    <input 
                      type="text" 
                      value={newLinkName}
                      onChange={(e) => setNewLinkName(e.target.value)}
                      placeholder="e.g. Support Channel, Terms of Use" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Destination URL</label>
                    <input 
                      type="url" 
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://t.me/your_channel" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg text-xs shadow-md shadow-blue-200 transition cursor-pointer"
                >
                  Add Link
                </button>
              </form>
            </div>

            {/* List of custom links */}
            {draftCustomLinks.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Useful Links List</h4>
                <div className="space-y-2">
                  {draftCustomLinks.map((link, idx) => (
                    <div 
                      key={idx} 
                      className="flex flex-col gap-2 p-3 border border-slate-100 rounded-xl bg-slate-50"
                    >
                      {editingLinkIndex === idx ? (
                        <div className="flex flex-col gap-2 w-full">
                          <input
                            type="text"
                            value={editLinkName}
                            onChange={(e) => setEditLinkName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Link Name"
                          />
                          <input
                            type="url"
                            value={editLinkUrl}
                            onChange={(e) => setEditLinkUrl(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="URL"
                          />
                          <div className="flex gap-2 justify-end mt-1">
                            <button
                              type="button"
                              onClick={() => setEditingLinkIndex(null)}
                              className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (editLinkName.trim() && editLinkUrl.trim()) {
                                  setDraftCustomLinks(prev => {
                                    const updated = [...prev];
                                    updated[idx] = { name: editLinkName.trim(), url: editLinkUrl.trim() };
                                    return updated;
                                  });
                                  setEditingLinkIndex(null);
                                  toast.success("Draft link updated. Remember to save changes.");
                                }
                              }}
                              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1 rounded-md cursor-pointer"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-700">
                              {link.name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono truncate max-w-[120px] md:max-w-xs">{link.url}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLinkIndex(idx);
                                setEditLinkName(link.name);
                                setEditLinkUrl(link.url);
                              }}
                              className="text-blue-600 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Link"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDraftCustomLinks(prev => prev.filter((_, i) => i !== idx));
                                toast.success("Draft link removed. Remember to save changes.");
                              }}
                              className="text-red-600 hover:text-red-700 p-1.5 hover:bg-red-50 rounded-lg transition"
                              title="Delete Link"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleApplyLinksChanges}
                disabled={isSavingLinks}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                {isSavingLinks ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save Useful Links to Firestore</span>
              </button>
            </div>
          </div>
        
    </React.Fragment>
  );
}
