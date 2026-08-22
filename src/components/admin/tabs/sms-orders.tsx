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


export default function SmsOrdersTab() {
  const ctx = useAdminContext();
  const { 
  announcements, setAnnouncements, isOpen, onClose, apiKey, onChangeKey, isValidating, validationError, onValidate, profile, orders, disabledServices, onToggleService, customPrices, onUpdateCustomPrice, priceMarkupPercent, onUpdateMarkupPercent, customServices, onAddCustomService, onRemoveCustomService, customLinks, onAddCustomLink, onRemoveCustomLink, onUpdateCustomLink, depositInstructions, onUpdateDepositInstruction, onDeleteDepositInstruction, depositRequests, onApproveDeposit, onRejectDeposit, registeredUsers, onUpdateUserBalance, autoApproveDeposits, onToggleAutoApprove, autoApproveCrypto, onToggleAutoApproveCrypto, cryptoRate, onUpdateCryptoRate, cryptoMinDeposit, onUpdateCryptoMinDeposit, localMinDeposit, onUpdateLocalMinDeposit, onUpdateGlobalSettings, smmProviders, setSmmProviders, smmServices, setSmmServices, smmCategories, setSmmCategories, smmOrders, setSmmOrders, smmPriceRules, setSmmPriceRules, smmLogs, setSmmLogs, smmSettings, setSmmSettings, smsProviders, setSmsProviders, siteLogoUrl, siteTitle, siteTagline, siteCoverUrl, showSiteCover, siteCoverTitle, siteCoverSubtitle, sellerCoverUrl, depositCoverUrl, aboutAvatarUrl, smmCoverUrl, customImages, tabMaintenance,
  username, setUsername, password, setPassword, authError, setAuthError, isLoggedIn, setIsLoggedIn, showPassword, setShowPassword, draftPriceMarkupPercent, setDraftPriceMarkupPercent, draftAutoApproveDeposits, setDraftAutoApproveDeposits, draftAutoApproveCrypto, setDraftAutoApproveCrypto, draftCryptoRate, setDraftCryptoRate, draftCryptoMinDeposit, setDraftCryptoMinDeposit, draftLocalMinDeposit, setDraftLocalMinDeposit, draftDisabledServices, setDraftDisabledServices, draftCustomPrices, setDraftCustomPrices, draftCustomLinks, setDraftCustomLinks, draftAnnouncements, setDraftAnnouncements, draftUserBalances, setDraftUserBalances, draftTabMaintenance, setDraftTabMaintenance, isSavingTabMaintenance, setIsSavingTabMaintenance, isSavingGlobalSettings, setIsSavingGlobalSettings, isSavingServices, setIsSavingServices, isSavingLinks, setIsSavingLinks, isSavingAnnouncements, setIsSavingAnnouncements, isSavingUserBalances, setIsSavingUserBalances, activeTab, setActiveTab, selectedManageUser, setSelectedManageUser, manageWarningMsg, setManageWarningMsg, manageBanReason, setManageBanReason, manageDailyLimit, setManageDailyLimit, isAdminDropdownOpen, setIsAdminDropdownOpen, draftUserLoyalty, setDraftUserLoyalty, bonusPointsInput, setBonusPointsInput, smsOrderSearch, setSmsOrderSearch, smsOrderStatusFilter, setSmsOrderStatusFilter, newServiceName, setNewServiceName, newServicePrice, setNewServicePrice, newServiceIcon, setNewServiceIcon, newLinkName, setNewLinkName, editingLinkIndex, setEditingLinkIndex, editLinkName, setEditLinkName, editLinkUrl, setEditLinkUrl, newLinkUrl, setNewLinkUrl, serviceSearch, setServiceSearch, userSearch, setUserSearch, requestSearch, setRequestSearch, editMethod, setEditMethod, instTitle, setInstTitle, instNumber, setInstNumber, instGuidelines, setInstGuidelines, instActive, setInstActive, instQrUrl, setInstQrUrl, instLogoUrl, setInstLogoUrl, instHeaderTitle, setInstHeaderTitle, instHeaderTag, setInstHeaderTag, instVerificationBadge, setInstVerificationBadge, instSubtitle, setInstSubtitle, instBadgesText, setInstBadgesText, instSubAccounts, setInstSubAccounts, instCryptoAddresses, setInstCryptoAddresses, isSavingInstruction, setIsSavingInstruction, adminNotesText, setAdminNotesText, editingSmsProvId, setEditingSmsProvId, smsProvName, setSmsProvName, smsProvUrl, setSmsProvUrl, smsProvKey, setSmsProvKey, smsProvType, setSmsProvType, smsProvNotes, setSmsProvNotes, isSyncingProv, setIsSyncingProv, isAddingSmsProv, setIsAddingSmsProv,
  handleSaveTabMaintenance, handleSaveGlobalSettings, handleDiscardGlobalSettingsChanges, handleApplyServicesChanges, handleDiscardServicesChanges, handleApplyLinksChanges, handleDiscardLinksChanges, handleApplyAnnouncementsChanges, handleDiscardAnnouncementsChanges, handleApplyUserBalances, handleDiscardUserBalancesChanges, handleQrUpload, handleLogoUpload, handleLogin, handleLogout, handleAddServiceSubmit, handleAddLinkSubmit, handleAddCryptoAddressItem, handleUpdateCryptoAddressItem, handleCryptoImageUpload, handleRemoveCryptoAddressItem, handleAddSubAccountItem, handleUpdateSubAccountItem, handleRemoveSubAccountItem, handleSaveInstruction, handleResetOrDeleteInstruction, handleSyncSmsBalance, handleToggleSmsStatus, handleDeleteSmsProvider, handleAddOrEditSmsProvider, handleStartEditSmsProv,
  hasUnsavedChanges, } = ctx;

  return (
    <React.Fragment>
      
                <div className="space-y-4 animate-fade-in flex flex-col h-auto md:h-[520px] md:min-h-[350px] pr-1">
                  {/* Summary Stats Header */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total Orders</div>
                      <div className="text-base font-black text-slate-800 font-mono mt-0.5">{orders.length}</div>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 shadow-2xs">
                      <div className="text-[10px] font-bold text-amber-600 uppercase">Waiting SMS</div>
                      <div className="text-base font-black text-amber-800 font-mono mt-0.5">
                        {orders.filter(o => o.status === "PENDING").length}
                      </div>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 shadow-2xs">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase">Code Received / Done</div>
                      <div className="text-base font-black text-emerald-800 font-mono mt-0.5">
                        {orders.filter(o => o.status === "RECEIVED" || o.status === "FINISHED").length}
                      </div>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 shadow-2xs">
                      <div className="text-[10px] font-bold text-red-600 uppercase">Canceled / Refunded</div>
                      <div className="text-base font-black text-red-800 font-mono mt-0.5">
                        {orders.filter(o => o.status === "CANCELED" || o.status === "BANNED").length}
                      </div>
                    </div>
                  </div>

                  {/* Search and Filters */}
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-1 flex flex-col overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3 shrink-0">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-blue-600" />
                        <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">SMS Activations Real-Time Feed</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={smsOrderStatusFilter}
                          onChange={(e) => setSmsOrderStatusFilter(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-700 focus:outline-none"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="PENDING">Pending SMS</option>
                          <option value="RECEIVED">Code Received</option>
                          <option value="FINISHED">Finished</option>
                          <option value="CANCELED">Canceled</option>
                        </select>

                        <input
                          type="text"
                          placeholder="Filter by Phone, Service, Email..."
                          value={smsOrderSearch}
                          onChange={(e) => setSmsOrderSearch(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {(() => {
                        const filtered = orders.filter(o => {
                          const matchesStatus = smsOrderStatusFilter === "ALL" || o.status === smsOrderStatusFilter;
                          const userAcc = registeredUsers.find(u => u.id === o.userId);
                          const userText = userAcc ? `${userAcc.username} ${userAcc.email}` : (o.userId || "");
                          const matchesSearch = 
                            (o.phone || "").toLowerCase().includes(smsOrderSearch.toLowerCase()) ||
                            (o.product || "").toLowerCase().includes(smsOrderSearch.toLowerCase()) ||
                            userText.toLowerCase().includes(smsOrderSearch.toLowerCase()) ||
                            String(o.id).includes(smsOrderSearch);
                          return matchesStatus && matchesSearch;
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="text-center py-12 text-slate-400">
                              <Phone className="h-8 w-8 mx-auto stroke-1 mb-2 text-slate-300" />
                              <p className="text-xs font-bold uppercase">No SMS Orders Found</p>
                            </div>
                          );
                        }

                        return filtered.map((ord) => {
                          const userAcc = registeredUsers.find(u => u.id === ord.userId);
                          const smsCode = Array.isArray(ord.sms) && ord.sms.length > 0 
                            ? ord.sms[ord.sms.length - 1].code 
                            : (typeof ord.sms === "string" ? ord.sms : null);

                          return (
                            <div key={ord.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-black text-slate-800 font-mono">#{ord.id}</span>
                                  <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                                    {ord.product || "SMS Service"}
                                  </span>
                                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    ord.status === "PENDING" ? "bg-amber-100 text-amber-800" :
                                    ord.status === "RECEIVED" ? "bg-emerald-100 text-emerald-800" :
                                    ord.status === "FINISHED" ? "bg-blue-100 text-blue-800" :
                                    "bg-red-100 text-red-800"
                                  }`}>
                                    {ord.status}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-3 text-xs">
                                  <span className="font-mono font-bold text-slate-700 flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-slate-400" />
                                    +{ord.phone}
                                  </span>
                                  {smsCode && (
                                    <span className="bg-emerald-500 text-white font-mono font-black px-2 py-0.5 rounded text-xs animate-pulse">
                                      CODE: {smsCode}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    User: {userAcc ? `${userAcc.username} (${userAcc.email})` : (ord.userId || "Guest")}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(`+${ord.phone}`);
                                    toast.success("Phone number copied!");
                                  }}
                                  className="text-[10px] font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1"
                                >
                                  <Clipboard className="h-3 w-3" />
                                  Copy Number
                                </button>

                                {ord.status === "PENDING" && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, "orders", String(ord.id)), { status: "CANCELED" });
                                        
                                        // Trigger Order Refunded Email Alert
                                        if (userAcc) {
                                          fetch("/api/email/order-refunded", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({
                                              toEmail: userAcc.email,
                                              username: userAcc.username,
                                              orderId: ord.id,
                                              serviceName: ord.product || "SMS Activation",
                                              amount: ord.price || "15", // Default or actual price
                                              reason: "Order Cancelled by Admin"
                                            })
                                          }).catch(err => console.error("Refund email failed", err));
                                        }

                                        toast.success(`Order #${ord.id} canceled & refunded`);
                                      } catch (e) {
                                        toast.error("Failed to cancel order");
                                      }
                                    }}
                                    className="text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white px-2.5 py-1 rounded-lg transition cursor-pointer"
                                  >
                                    Cancel & Refund
                                  </button>
                                )}

                                {ord.status === "RECEIVED" && (
                                  <button
                                    onClick={async () => {
                                      try {
                                        await updateDoc(doc(db, "orders", String(ord.id)), { status: "FINISHED" });
                                        toast.success(`Order #${ord.id} marked as Finished`);
                                      } catch (e) {
                                        toast.error("Failed to finish order");
                                      }
                                    }}
                                    className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg transition cursor-pointer"
                                  >
                                    Finish
                                  </button>
                                )}
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
