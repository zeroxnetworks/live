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


export default function LoyaltyManagementTab() {
  const ctx = useAdminContext();
  const { 
  announcements, setAnnouncements, isOpen, onClose, apiKey, onChangeKey, isValidating, validationError, onValidate, profile, orders, disabledServices, onToggleService, customPrices, onUpdateCustomPrice, priceMarkupPercent, onUpdateMarkupPercent, customServices, onAddCustomService, onRemoveCustomService, customLinks, onAddCustomLink, onRemoveCustomLink, onUpdateCustomLink, depositInstructions, onUpdateDepositInstruction, onDeleteDepositInstruction, depositRequests, onApproveDeposit, onRejectDeposit, registeredUsers, onUpdateUserBalance, autoApproveDeposits, onToggleAutoApprove, autoApproveCrypto, onToggleAutoApproveCrypto, cryptoRate, onUpdateCryptoRate, cryptoMinDeposit, onUpdateCryptoMinDeposit, localMinDeposit, onUpdateLocalMinDeposit, onUpdateGlobalSettings, smmProviders, setSmmProviders, smmServices, setSmmServices, smmCategories, setSmmCategories, smmOrders, setSmmOrders, smmPriceRules, setSmmPriceRules, smmLogs, setSmmLogs, smmSettings, setSmmSettings, smsProviders, setSmsProviders, siteLogoUrl, siteTitle, siteTagline, siteCoverUrl, showSiteCover, siteCoverTitle, siteCoverSubtitle, sellerCoverUrl, depositCoverUrl, aboutAvatarUrl, smmCoverUrl, customImages, tabMaintenance,
  username, setUsername, password, setPassword, authError, setAuthError, isLoggedIn, setIsLoggedIn, showPassword, setShowPassword, draftPriceMarkupPercent, setDraftPriceMarkupPercent, draftAutoApproveDeposits, setDraftAutoApproveDeposits, draftAutoApproveCrypto, setDraftAutoApproveCrypto, draftCryptoRate, setDraftCryptoRate, draftCryptoMinDeposit, setDraftCryptoMinDeposit, draftLocalMinDeposit, setDraftLocalMinDeposit, draftDisabledServices, setDraftDisabledServices, draftCustomPrices, setDraftCustomPrices, draftCustomLinks, setDraftCustomLinks, draftAnnouncements, setDraftAnnouncements, draftUserBalances, setDraftUserBalances, draftTabMaintenance, setDraftTabMaintenance, isSavingTabMaintenance, setIsSavingTabMaintenance, isSavingGlobalSettings, setIsSavingGlobalSettings, isSavingServices, setIsSavingServices, isSavingLinks, setIsSavingLinks, isSavingAnnouncements, setIsSavingAnnouncements, isSavingUserBalances, setIsSavingUserBalances, activeTab, setActiveTab, selectedManageUser, setSelectedManageUser, manageWarningMsg, setManageWarningMsg, manageBanReason, setManageBanReason, manageDailyLimit, setManageDailyLimit, isAdminDropdownOpen, setIsAdminDropdownOpen, draftUserLoyalty, setDraftUserLoyalty, bonusPointsInput, setBonusPointsInput, smsOrderSearch, setSmsOrderSearch, smsOrderStatusFilter, setSmsOrderStatusFilter, newServiceName, setNewServiceName, newServicePrice, setNewServicePrice, newServiceIcon, setNewServiceIcon, newLinkName, setNewLinkName, editingLinkIndex, setEditingLinkIndex, editLinkName, setEditLinkName, editLinkUrl, setEditLinkUrl, newLinkUrl, setNewLinkUrl, serviceSearch, setServiceSearch, userSearch, setUserSearch, requestSearch, setRequestSearch, editMethod, setEditMethod, instTitle, setInstTitle, instNumber, setInstNumber, instGuidelines, setInstGuidelines, instActive, setInstActive, instQrUrl, setInstQrUrl, instLogoUrl, setInstLogoUrl, instHeaderTitle, setInstHeaderTitle, instHeaderTag, setInstHeaderTag, instVerificationBadge, setInstVerificationBadge, instSubtitle, setInstSubtitle, instBadgesText, setInstBadgesText, instSubAccounts, setInstSubAccounts, instCryptoAddresses, setInstCryptoAddresses, isSavingInstruction, setIsSavingInstruction, adminNotesText, setAdminNotesText, editingSmsProvId, setEditingSmsProvId, smsProvName, setSmsProvName, smsProvUrl, setSmsProvUrl, smsProvKey, setSmsProvKey, smsProvType, setSmsProvType, smsProvNotes, setSmsProvNotes, isSyncingProv, setIsSyncingProv, isAddingSmsProv, setIsAddingSmsProv,
  handleSaveTabMaintenance, handleSaveGlobalSettings, handleDiscardGlobalSettingsChanges, handleApplyServicesChanges, handleDiscardServicesChanges, handleApplyLinksChanges, handleDiscardLinksChanges, handleApplyAnnouncementsChanges, handleDiscardAnnouncementsChanges, handleApplyUserBalances, handleDiscardUserBalancesChanges, handleQrUpload, handleLogoUpload, handleLogin, handleLogout, handleAddServiceSubmit, handleAddLinkSubmit, handleAddCryptoAddressItem, handleUpdateCryptoAddressItem, handleCryptoImageUpload, handleRemoveCryptoAddressItem, handleAddSubAccountItem, handleUpdateSubAccountItem, handleRemoveSubAccountItem, handleSaveInstruction, handleResetOrDeleteInstruction, handleSyncSmsBalance, handleToggleSmsStatus, handleDeleteSmsProvider, handleAddOrEditSmsProvider, handleStartEditSmsProv,
  hasUnsavedChanges, } = ctx;

  return (
    <React.Fragment>
      
                <div className="space-y-4 animate-fade-in flex flex-col h-auto md:h-[520px] md:min-h-[350px] pr-1">
                  <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 rounded-xl p-5 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 fill-amber-200 text-amber-100 animate-pulse" />
                        <h3 className="text-base font-black uppercase tracking-wide">Loyalty Points & Rewards Exchange</h3>
                      </div>
                      <p className="text-xs text-amber-100 font-medium">
                        Auto Earn Rule: 1 PTS for every 100 PKR spent. Redeem Rule: 1 PTS = 1 PKR Cash Credit.
                      </p>
                    </div>

                    <div className="flex gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-amber-100">Total Issued PTS</div>
                        <div className="text-lg font-black font-mono">
                          {registeredUsers.reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0)} PTS
                        </div>
                      </div>
                      <div className="w-px bg-white/20 my-1" />
                      <div>
                        <div className="text-[10px] uppercase font-bold text-amber-100">PKR Credit Value</div>
                        <div className="text-lg font-black font-mono text-emerald-300">
                          ₨ {registeredUsers.reduce((sum, u) => sum + (u.loyaltyPoints || 0), 0)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3 shrink-0">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Award className="h-4 w-4 text-amber-500" />
                          User Loyalty Points Accounts
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Award or deduct reward points manually</p>
                      </div>

                      <input
                        type="text"
                        placeholder="Search users..."
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="max-w-[200px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
                      {(() => {
                        const filtered = registeredUsers.filter(u => 
                          u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
                          u.email.toLowerCase().includes(userSearch.toLowerCase())
                        );

                        if (filtered.length === 0) {
                          return (
                            <div className="text-center py-12 text-slate-400">
                              <Star className="h-8 w-8 mx-auto stroke-1 mb-2 text-slate-300" />
                              <p className="text-xs font-bold uppercase">No Users Found</p>
                            </div>
                          );
                        }

                        return filtered.map((usr) => {
                          const currentPts = draftUserLoyalty[usr.id] !== undefined ? draftUserLoyalty[usr.id] : (usr.loyaltyPoints || 0);

                          return (
                            <div key={usr.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-500" />
                                </div>
                                <div>
                                  <div className="text-xs font-black text-slate-800">{usr.username}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{usr.email}</div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Points:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={currentPts}
                                    onChange={(e) => {
                                      const pts = parseInt(e.target.value, 10);
                                      setDraftUserLoyalty(prev => ({ ...prev, [usr.id]: isNaN(pts) ? 0 : pts }));
                                    }}
                                    className="w-16 text-right font-mono text-xs font-black text-amber-600 bg-transparent focus:outline-none"
                                  />
                                  <span className="text-[10px] font-bold text-amber-600">PTS</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setDraftUserLoyalty(prev => ({ ...prev, [usr.id]: currentPts + 10 }));
                                    }}
                                    className="text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1.5 rounded-lg transition cursor-pointer"
                                  >
                                    +10 PTS
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDraftUserLoyalty(prev => ({ ...prev, [usr.id]: currentPts + 50 }));
                                    }}
                                    className="text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1.5 rounded-lg transition cursor-pointer"
                                  >
                                    +50 PTS
                                  </button>
                                  <button
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, "users", usr.id), { loyaltyPoints: currentPts });
                                        toast.success(`Loyalty points updated for ${usr.username}!`);
                                      } catch (e) {
                                        toast.error("Failed to update points.");
                                      }
                                    }}
                                    className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer flex items-center gap-1"
                                  >
                                    <Save className="h-3 w-3" />
                                    <span>Save</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              
    </React.Fragment>
  );
}
