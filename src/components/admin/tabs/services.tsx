import { ServiceData } from "../../../types";


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


export default function ServicesTab() {
  const ctx = useAdminContext();
  const { 
  announcements, setAnnouncements, isOpen, onClose, apiKey, onChangeKey, isValidating, validationError, onValidate, profile, orders, disabledServices, onToggleService, customPrices, onUpdateCustomPrice, priceMarkupPercent, onUpdateMarkupPercent, customServices, onAddCustomService, onRemoveCustomService, customLinks, onAddCustomLink, onRemoveCustomLink, onUpdateCustomLink, depositInstructions, onUpdateDepositInstruction, onDeleteDepositInstruction, depositRequests, onApproveDeposit, onRejectDeposit, registeredUsers, onUpdateUserBalance, autoApproveDeposits, onToggleAutoApprove, autoApproveCrypto, onToggleAutoApproveCrypto, cryptoRate, onUpdateCryptoRate, cryptoMinDeposit, onUpdateCryptoMinDeposit, localMinDeposit, onUpdateLocalMinDeposit, onUpdateGlobalSettings, smmProviders, setSmmProviders, smmServices, setSmmServices, smmCategories, setSmmCategories, smmOrders, setSmmOrders, smmPriceRules, setSmmPriceRules, smmLogs, setSmmLogs, smmSettings, setSmmSettings, smsProviders, setSmsProviders, siteLogoUrl, siteTitle, siteTagline, siteCoverUrl, showSiteCover, siteCoverTitle, siteCoverSubtitle, sellerCoverUrl, depositCoverUrl, aboutAvatarUrl, smmCoverUrl, customImages, tabMaintenance,
  username, setUsername, password, setPassword, authError, setAuthError, isLoggedIn, setIsLoggedIn, showPassword, setShowPassword, draftPriceMarkupPercent, setDraftPriceMarkupPercent, draftAutoApproveDeposits, setDraftAutoApproveDeposits, draftAutoApproveCrypto, setDraftAutoApproveCrypto, draftCryptoRate, setDraftCryptoRate, draftCryptoMinDeposit, setDraftCryptoMinDeposit, draftLocalMinDeposit, setDraftLocalMinDeposit, draftDisabledServices, setDraftDisabledServices, draftCustomPrices, setDraftCustomPrices, draftCustomLinks, setDraftCustomLinks, draftAnnouncements, setDraftAnnouncements, draftUserBalances, setDraftUserBalances, draftTabMaintenance, setDraftTabMaintenance, isSavingTabMaintenance, setIsSavingTabMaintenance, isSavingGlobalSettings, setIsSavingGlobalSettings, isSavingServices, setIsSavingServices, isSavingLinks, setIsSavingLinks, isSavingAnnouncements, setIsSavingAnnouncements, isSavingUserBalances, setIsSavingUserBalances, activeTab, setActiveTab, selectedManageUser, setSelectedManageUser, manageWarningMsg, setManageWarningMsg, manageBanReason, setManageBanReason, manageDailyLimit, setManageDailyLimit, isAdminDropdownOpen, setIsAdminDropdownOpen, draftUserLoyalty, setDraftUserLoyalty, bonusPointsInput, setBonusPointsInput, smsOrderSearch, setSmsOrderSearch, smsOrderStatusFilter, setSmsOrderStatusFilter, newServiceName, setNewServiceName, newServicePrice, setNewServicePrice, newServiceIcon, setNewServiceIcon, newLinkName, setNewLinkName, editingLinkIndex, setEditingLinkIndex, editLinkName, setEditLinkName, editLinkUrl, setEditLinkUrl, newLinkUrl, setNewLinkUrl, serviceSearch, setServiceSearch, userSearch, setUserSearch, requestSearch, setRequestSearch, editMethod, setEditMethod, instTitle, setInstTitle, instNumber, setInstNumber, instGuidelines, setInstGuidelines, instActive, setInstActive, instQrUrl, setInstQrUrl, instLogoUrl, setInstLogoUrl, instHeaderTitle, setInstHeaderTitle, instHeaderTag, setInstHeaderTag, instVerificationBadge, setInstVerificationBadge, instSubtitle, setInstSubtitle, instBadgesText, setInstBadgesText, instSubAccounts, setInstSubAccounts, instCryptoAddresses, setInstCryptoAddresses, isSavingInstruction, setIsSavingInstruction, adminNotesText, setAdminNotesText, editingSmsProvId, setEditingSmsProvId, smsProvName, setSmsProvName, smsProvUrl, setSmsProvUrl, smsProvKey, setSmsProvKey, smsProvType, setSmsProvType, smsProvNotes, setSmsProvNotes, isSyncingProv, setIsSyncingProv, isAddingSmsProv, setIsAddingSmsProv,
  handleSaveTabMaintenance, handleSaveGlobalSettings, handleDiscardGlobalSettingsChanges, handleApplyServicesChanges, handleDiscardServicesChanges, handleApplyLinksChanges, handleDiscardLinksChanges, handleApplyAnnouncementsChanges, handleDiscardAnnouncementsChanges, handleApplyUserBalances, handleDiscardUserBalancesChanges, handleQrUpload, handleLogoUpload, handleLogin, handleLogout, handleAddServiceSubmit, handleAddLinkSubmit, handleAddCryptoAddressItem, handleUpdateCryptoAddressItem, handleCryptoImageUpload, handleRemoveCryptoAddressItem, handleAddSubAccountItem, handleUpdateSubAccountItem, handleRemoveSubAccountItem, handleSaveInstruction, handleResetOrDeleteInstruction, handleSyncSmsBalance, handleToggleSmsStatus, handleDeleteSmsProvider, handleAddOrEditSmsProvider, handleStartEditSmsProv,
  hasUnsavedChanges, } = ctx;

  return (
    <React.Fragment>
      
                <div className="space-y-4 animate-fade-in">
                  {hasUnsavedChanges && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
                        <div>
                          <h4 className="text-xs font-black text-amber-800">Unsaved Service & Price Override Changes</h4>
                          <p className="text-[10px] font-bold text-amber-600 uppercase">You have modified the catalog configuration drafts</p>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={handleDiscardServicesChanges}
                          className="text-xs font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                        >
                          Discard
                        </button>
                        <button
                          type="button"
                          onClick={handleApplyServicesChanges}
                          disabled={isSavingServices}
                          className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-1.5 rounded-lg shadow-md shadow-blue-500/10 transition cursor-pointer flex items-center gap-1.5"
                        >
                          {isSavingServices ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                          <span>Apply Services Changes</span>
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-sm flex flex-col h-auto md:h-[520px] md:min-h-[350px]">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-3 mb-3 gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-1">
                          <Percent className="h-4 w-4 text-blue-600" />
                          Manage Services and Manual Prices
                        </h3>
                        <div className="text-xs text-slate-500 mb-2 max-w-lg mt-2">
                          <p className="mb-2 leading-relaxed">Control visibility and pricing overrides for all automated activation services.</p>
                          <ul className="list-disc list-inside space-y-1 ml-1 text-slate-500">
                            <li><strong>Toggle Services:</strong> Use the switch to enable/disable specific apps. Disabled apps hide from the store.</li>
                            <li><strong>Manual Pricing:</strong> Enter a value in PKR to override the global markup calculation and enforce a fixed price.</li>
                            <li><strong>Reset Price:</strong> Clear the manual price field to revert back to the dynamic global markup cost.</li>
                          </ul>
                        </div>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Filter services by name..."
                        value={serviceSearch}
                        onChange={(e) => setServiceSearch(e.target.value)}
                        className="w-full sm:max-w-[200px] bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                      />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                      {(() => {
                        const defaultServices: ServiceData[] = [
                          { key: "google", name: "Google / YouTube", icon: "Chrome", popular: true },
                          { key: "whatsapp", name: "WhatsApp", icon: "MessageCircle", popular: true },
                          { key: "openai", name: "OpenAI / ChatGPT", icon: "Cpu", popular: true },
                          { key: "instagram", name: "Instagram", icon: "Instagram", popular: true },
                          { key: "facebook", name: "Facebook", icon: "Facebook", popular: true },
                          { key: "twitter", name: "Twitter / X", icon: "Twitter", popular: true },
                          { key: "microsoft", name: "Microsoft", icon: "Laptop", popular: true },
                          { key: "discord", name: "Discord", icon: "MessageSquare", popular: true },
                          { key: "steam", name: "Steam", icon: "Gamepad2", popular: true },
                          { key: "apple", name: "Apple", icon: "Apple", popular: true },
                          { key: "tiktok", name: "TikTok", icon: "Video", popular: true },
                          { key: "netflix", name: "Netflix", icon: "Tv", popular: false },
                          { key: "amazon", name: "Amazon", icon: "ShoppingBag", popular: false },
                          { key: "airbnb", name: "Airbnb", icon: "Home", popular: false },
                          { key: "uber", name: "Uber", icon: "Car", popular: false },
                          { key: "viber", name: "Viber", icon: "Smartphone", popular: false },
                          { key: "snapchat", name: "Snapchat", icon: "Ghost", popular: false },
                          { key: "tinder", name: "Tinder", icon: "Heart", popular: false },
                          { key: "yahoo", name: "Yahoo", icon: "Mail", popular: false },
                          { key: "paypal", name: "PayPal", icon: "CreditCard", popular: false },
                          { key: "spotify", name: "Spotify", icon: "Music", popular: false },
                          { key: "linkedin", name: "LinkedIn", icon: "Linkedin", popular: false },
                          { key: "other", name: "Other (Unlisted Service)", icon: "ShieldQuestion", popular: true }
                        ];

                        const completeList = [...defaultServices, ...customServices];
                        const filtered = completeList.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()));

                        return filtered.map((service) => {
                          const isServiceDisabled = draftDisabledServices.includes(service.key);
                          const manualPrice = draftCustomPrices[service.key] !== undefined ? draftCustomPrices[service.key] : (customPrices[service.key] || "");
                          
                          return (
                            <div 
                              key={service.key} 
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border border-slate-150 rounded-xl bg-slate-50 hover:bg-slate-100/50 transition-colors animate-fade-in"
                            >
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraftDisabledServices(prev => 
                                      prev.includes(service.key) 
                                        ? prev.filter(k => k !== service.key) 
                                        : [...prev, service.key]
                                    );
                                  }}
                                  className="text-slate-500 cursor-pointer shrink-0"
                                  title={isServiceDisabled ? "Activate Service" : "Deactivate Service"}
                                >
                                  {isServiceDisabled ? (
                                    <ToggleLeft className="h-6 w-6 text-slate-300" />
                                  ) : (
                                    <ToggleRight className="h-6 w-6 text-blue-600" />
                                  )}
                                </button>
                                
                                <div className="flex flex-col">
                                  <span className={`text-xs font-bold ${isServiceDisabled ? "text-slate-400 line-through" : "text-slate-800"}`}>
                                    {service.name}
                                  </span>
                                  <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">
                                    Key: {service.key}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between sm:justify-end gap-3.5 border-t sm:border-t-0 pt-2.5 sm:pt-0 w-full sm:w-auto">
                                <div className="text-left sm:text-right text-[9px] font-mono pr-1.5">
                                  <div className="font-extrabold text-blue-600">₨ {(Number(manualPrice) * 3.15).toFixed(1)}</div>
                                  <div className="text-emerald-600 font-bold">${(Number(manualPrice) * 0.0115).toFixed(2)}</div>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shrink-0">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">Manual Price:</span>
                                  <input
                                    type="number"
                                    min="0"
                                    placeholder="Markup"
                                    value={manualPrice}
                                    onChange={(e) => {
                                      setDraftCustomPrices(prev => ({
                                        ...prev,
                                        [service.key]: Number(e.target.value) || 0
                                      }));
                                    }}
                                    className="w-16 bg-transparent border-none text-xs text-slate-800 text-right focus:outline-none font-bold font-mono placeholder-slate-300"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100 mt-4">
                      <button
                        type="button"
                        onClick={handleApplyServicesChanges}
                        disabled={isSavingServices}
                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md"
                      >
                        {isSavingServices ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>Save Service Overrides & Prices to Firestore</span>
                      </button>
                    </div>
                  </div>
                </div>
              
    </React.Fragment>
  );
}
