

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


export default function SmsProvidersTab() {
  const ctx = useAdminContext();
  const { 
  announcements, setAnnouncements, isOpen, onClose, apiKey, onChangeKey, isValidating, validationError, onValidate, profile, orders, disabledServices, onToggleService, customPrices, onUpdateCustomPrice, priceMarkupPercent, onUpdateMarkupPercent, customServices, onAddCustomService, onRemoveCustomService, customLinks, onAddCustomLink, onRemoveCustomLink, onUpdateCustomLink, depositInstructions, onUpdateDepositInstruction, onDeleteDepositInstruction, depositRequests, onApproveDeposit, onRejectDeposit, registeredUsers, onUpdateUserBalance, autoApproveDeposits, onToggleAutoApprove, autoApproveCrypto, onToggleAutoApproveCrypto, cryptoRate, onUpdateCryptoRate, cryptoMinDeposit, onUpdateCryptoMinDeposit, localMinDeposit, onUpdateLocalMinDeposit, onUpdateGlobalSettings, smmProviders, setSmmProviders, smmServices, setSmmServices, smmCategories, setSmmCategories, smmOrders, setSmmOrders, smmPriceRules, setSmmPriceRules, smmLogs, setSmmLogs, smmSettings, setSmmSettings, smsProviders, setSmsProviders, siteLogoUrl, siteTitle, siteTagline, siteCoverUrl, showSiteCover, siteCoverTitle, siteCoverSubtitle, sellerCoverUrl, depositCoverUrl, aboutAvatarUrl, smmCoverUrl, customImages, tabMaintenance, formatPrice,
  username, setUsername, password, setPassword, authError, setAuthError, isLoggedIn, setIsLoggedIn, showPassword, setShowPassword, draftPriceMarkupPercent, setDraftPriceMarkupPercent, draftAutoApproveDeposits, setDraftAutoApproveDeposits, draftAutoApproveCrypto, setDraftAutoApproveCrypto, draftCryptoRate, setDraftCryptoRate, draftCryptoMinDeposit, setDraftCryptoMinDeposit, draftLocalMinDeposit, setDraftLocalMinDeposit, draftDisabledServices, setDraftDisabledServices, draftCustomPrices, setDraftCustomPrices, draftCustomLinks, setDraftCustomLinks, draftAnnouncements, setDraftAnnouncements, draftUserBalances, setDraftUserBalances, draftTabMaintenance, setDraftTabMaintenance, isSavingTabMaintenance, setIsSavingTabMaintenance, isSavingGlobalSettings, setIsSavingGlobalSettings, isSavingServices, setIsSavingServices, isSavingLinks, setIsSavingLinks, isSavingAnnouncements, setIsSavingAnnouncements, isSavingUserBalances, setIsSavingUserBalances, activeTab, setActiveTab, selectedManageUser, setSelectedManageUser, manageWarningMsg, setManageWarningMsg, manageBanReason, setManageBanReason, manageDailyLimit, setManageDailyLimit, isAdminDropdownOpen, setIsAdminDropdownOpen, draftUserLoyalty, setDraftUserLoyalty, bonusPointsInput, setBonusPointsInput, smsOrderSearch, setSmsOrderSearch, smsOrderStatusFilter, setSmsOrderStatusFilter, newServiceName, setNewServiceName, newServicePrice, setNewServicePrice, newServiceIcon, setNewServiceIcon, newLinkName, setNewLinkName, editingLinkIndex, setEditingLinkIndex, editLinkName, setEditLinkName, editLinkUrl, setEditLinkUrl, newLinkUrl, setNewLinkUrl, serviceSearch, setServiceSearch, userSearch, setUserSearch, requestSearch, setRequestSearch, editMethod, setEditMethod, instTitle, setInstTitle, instNumber, setInstNumber, instGuidelines, setInstGuidelines, instActive, setInstActive, instQrUrl, setInstQrUrl, instLogoUrl, setInstLogoUrl, instHeaderTitle, setInstHeaderTitle, instHeaderTag, setInstHeaderTag, instVerificationBadge, setInstVerificationBadge, instSubtitle, setInstSubtitle, instBadgesText, setInstBadgesText, instSubAccounts, setInstSubAccounts, instCryptoAddresses, setInstCryptoAddresses, isSavingInstruction, setIsSavingInstruction, adminNotesText, setAdminNotesText, editingSmsProvId, setEditingSmsProvId, smsProvName, setSmsProvName, smsProvUrl, setSmsProvUrl, smsProvKey, setSmsProvKey, smsProvType, setSmsProvType, smsProvNotes, setSmsProvNotes, isSyncingProv, setIsSyncingProv, isAddingSmsProv, setIsAddingSmsProv,
  handleSaveTabMaintenance, handleSaveGlobalSettings, handleDiscardGlobalSettingsChanges, handleApplyServicesChanges, handleDiscardServicesChanges, handleApplyLinksChanges, handleDiscardLinksChanges, handleApplyAnnouncementsChanges, handleDiscardAnnouncementsChanges, handleApplyUserBalances, handleDiscardUserBalancesChanges, handleQrUpload, handleLogoUpload, handleLogin, handleLogout, handleAddServiceSubmit, handleAddLinkSubmit, handleAddCryptoAddressItem, handleUpdateCryptoAddressItem, handleCryptoImageUpload, handleRemoveCryptoAddressItem, handleAddSubAccountItem, handleUpdateSubAccountItem, handleRemoveSubAccountItem, handleSaveInstruction, handleResetOrDeleteInstruction, handleSyncSmsBalance, handleToggleSmsStatus, handleDeleteSmsProvider, handleAddOrEditSmsProvider, handleStartEditSmsProv,
  hasUnsavedChanges, } = ctx;

  return (
    <React.Fragment>
      
                <FiveSimManagement
                  smsProviders={smsProviders}
                  setSmsProviders={setSmsProviders}
                  disabledServices={disabledServices}
                  onToggleService={onToggleService}
                  customPrices={customPrices}
                  onUpdateCustomPrice={onUpdateCustomPrice}
                  priceMarkupPercent={priceMarkupPercent}
                  onUpdateMarkupPercent={onUpdateMarkupPercent}
                  customServices={customServices}
                  orders={orders} registeredUsers={registeredUsers}
                  formatPrice={formatPrice}
                />
              
    </React.Fragment>
  );
}
