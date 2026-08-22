

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
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


export default function GeneralTab() {
  const ctx = useAdminContext();
  const { 
  announcements, setAnnouncements, isOpen, onClose, apiKey, onChangeKey, isValidating, validationError, onValidate, profile, orders, disabledServices, onToggleService, customPrices, onUpdateCustomPrice, priceMarkupPercent, onUpdateMarkupPercent, customServices, onAddCustomService, onRemoveCustomService, customLinks, onAddCustomLink, onRemoveCustomLink, onUpdateCustomLink, depositInstructions, onUpdateDepositInstruction, onDeleteDepositInstruction, depositRequests, onApproveDeposit, onRejectDeposit, registeredUsers, onUpdateUserBalance, autoApproveDeposits, onToggleAutoApprove, autoApproveCrypto, onToggleAutoApproveCrypto, cryptoRate, onUpdateCryptoRate, cryptoMinDeposit, onUpdateCryptoMinDeposit, localMinDeposit, onUpdateLocalMinDeposit, virtualNumberMinimumPricePKR, onUpdateVirtualNumberMinimumPricePKR, onUpdateGlobalSettings, smmProviders, setSmmProviders, smmServices, setSmmServices, smmCategories, setSmmCategories, smmOrders, setSmmOrders, smmPriceRules, setSmmPriceRules, smmLogs, setSmmLogs, smmSettings, setSmmSettings, smsProviders, setSmsProviders, siteLogoUrl, siteTitle, siteTagline, siteCoverUrl, showSiteCover, siteCoverTitle, siteCoverSubtitle, sellerCoverUrl, depositCoverUrl, aboutAvatarUrl, smmCoverUrl, customImages, tabMaintenance,
  username, setUsername, password, setPassword, authError, setAuthError, isLoggedIn, setIsLoggedIn, showPassword, setShowPassword, draftPriceMarkupPercent, setDraftPriceMarkupPercent, draftAutoApproveDeposits, setDraftAutoApproveDeposits, draftAutoApproveCrypto, setDraftAutoApproveCrypto, draftCryptoRate, setDraftCryptoRate, draftCryptoMinDeposit, setDraftCryptoMinDeposit, draftLocalMinDeposit, setDraftLocalMinDeposit, draftVirtualNumberMinimumPricePKR, setDraftVirtualNumberMinimumPricePKR, draftDisabledServices, setDraftDisabledServices, draftCustomPrices, setDraftCustomPrices, draftCustomLinks, setDraftCustomLinks, draftAnnouncements, setDraftAnnouncements, draftUserBalances, setDraftUserBalances, draftTabMaintenance, setDraftTabMaintenance, isSavingTabMaintenance, setIsSavingTabMaintenance, isSavingGlobalSettings, setIsSavingGlobalSettings, isSavingServices, setIsSavingServices, isSavingLinks, setIsSavingLinks, isSavingAnnouncements, setIsSavingAnnouncements, isSavingUserBalances, setIsSavingUserBalances, activeTab, setActiveTab, selectedManageUser, setSelectedManageUser, manageWarningMsg, setManageWarningMsg, manageBanReason, setManageBanReason, manageDailyLimit, setManageDailyLimit, isAdminDropdownOpen, setIsAdminDropdownOpen, draftUserLoyalty, setDraftUserLoyalty, bonusPointsInput, setBonusPointsInput, smsOrderSearch, setSmsOrderSearch, smsOrderStatusFilter, setSmsOrderStatusFilter, newServiceName, setNewServiceName, newServicePrice, setNewServicePrice, newServiceIcon, setNewServiceIcon, newLinkName, setNewLinkName, editingLinkIndex, setEditingLinkIndex, editLinkName, setEditLinkName, editLinkUrl, setEditLinkUrl, newLinkUrl, setNewLinkUrl, serviceSearch, setServiceSearch, userSearch, setUserSearch, requestSearch, setRequestSearch, editMethod, setEditMethod, instTitle, setInstTitle, instNumber, setInstNumber, instGuidelines, setInstGuidelines, instActive, setInstActive, instQrUrl, setInstQrUrl, instLogoUrl, setInstLogoUrl, instHeaderTitle, setInstHeaderTitle, instHeaderTag, setInstHeaderTag, instVerificationBadge, setInstVerificationBadge, instSubtitle, setInstSubtitle, instBadgesText, setInstBadgesText, instSubAccounts, setInstSubAccounts, instCryptoAddresses, setInstCryptoAddresses, isSavingInstruction, setIsSavingInstruction, adminNotesText, setAdminNotesText, editingSmsProvId, setEditingSmsProvId, smsProvName, setSmsProvName, smsProvUrl, setSmsProvUrl, smsProvKey, setSmsProvKey, smsProvType, setSmsProvType, smsProvNotes, setSmsProvNotes, isSyncingProv, setIsSyncingProv, isAddingSmsProv, setIsAddingSmsProv,
  handleSaveTabMaintenance, handleSaveGlobalSettings, handleDiscardGlobalSettingsChanges, handleApplyServicesChanges, handleDiscardServicesChanges, handleApplyLinksChanges, handleDiscardLinksChanges, handleApplyAnnouncementsChanges, handleDiscardAnnouncementsChanges, handleApplyUserBalances, handleDiscardUserBalancesChanges, handleQrUpload, handleLogoUpload, handleLogin, handleLogout, handleAddServiceSubmit, handleAddLinkSubmit, handleAddCryptoAddressItem, handleUpdateCryptoAddressItem, handleCryptoImageUpload, handleRemoveCryptoAddressItem, handleAddSubAccountItem, handleUpdateSubAccountItem, handleRemoveSubAccountItem, handleSaveInstruction, handleResetOrDeleteInstruction, handleSyncSmsBalance, handleToggleSmsStatus, handleDeleteSmsProvider, handleAddOrEditSmsProvider, handleStartEditSmsProv,
  hasUnsavedChanges, } = ctx;

  return (
    <React.Fragment>
      
                <div className="space-y-6 animate-fade-in">
                  {/* Percentage Markup Card */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-2 mb-2">
                      <Percent className="h-4 w-4 text-blue-600" />
                      Global Price Markup Percentage
                    </h3>
                    
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 mb-4">
                      <p className="text-sm font-semibold text-blue-900 mb-1">How Pricing Works</p>
                      <p className="text-xs text-blue-800/80 leading-relaxed mb-3">
                        The Global Price Markup determines the final price your customers pay. It acts as an automatic multiplier over the base cost retrieved from your supplier APIs (e.g., 5SIM).
                      </p>
                      <ul className="text-xs text-blue-800/80 space-y-1.5 list-disc list-inside">
                        <li><strong>Example:</strong> A 20% markup changes a base price of $1.00 to $1.20.</li>
                        <li><strong>Profit Margin:</strong> This percentage represents your gross profit margin across all automated services.</li>
                        <li><strong>Instant Sync:</strong> Changes made here reflect immediately across the customer portal without requiring a page refresh.</li>
                      </ul>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <div className="relative max-w-[150px]">
                            <input
                              type="number"
                              min="0"
                              max="1000"
                              placeholder="e.g. 20"
                              value={draftPriceMarkupPercent}
                              onChange={(e) => setDraftPriceMarkupPercent(Number(e.target.value) || 0)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold"
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400 font-bold font-mono text-sm">%</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-500">
                            Pending Pricing: Base Price + {draftPriceMarkupPercent}% Markup
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="relative max-w-[150px]">
                            <input
                              type="number"
                              min="0"
                              max="10000"
                              placeholder="e.g. 50"
                              value={draftVirtualNumberMinimumPricePKR || 0}
                              onChange={(e) => setDraftVirtualNumberMinimumPricePKR(Number(e.target.value) || 0)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-10 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold"
                            />
                            <span className="absolute right-3 top-2.5 text-slate-400 font-bold font-mono text-xs">PKR</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-500">
                            Min Price limit strictly for Virtual Numbers
                          </span>
                        </div>
                      </div>

                      {hasUnsavedChanges && (
                        <div className="flex items-center gap-2 self-end sm:self-auto">
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
                            Save Settings
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              
    </React.Fragment>
  );
}
