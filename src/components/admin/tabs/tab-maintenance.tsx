import React, { useState, useMemo } from 'react';
import { useAdminContext } from '../AdminContext';
import { 
  Settings, Save, RefreshCw, Eye, EyeOff, Wrench, ShieldAlert, Check, Search, Filter, 
  Sparkles, AlertTriangle, ShieldCheck, Gem, Star, ShoppingBag, Share2, LayoutDashboard, 
  Wallet, Store, Code, MessageSquare, Info, CheckCircle2, XCircle, RotateCcw, Copy, 
  Layers, ChevronDown, HelpCircle, Radio, Play, CheckSquare, Square, Coins, ArrowRightLeft
} from "lucide-react";
import { TabMaintenanceView } from '../../TabMaintenanceView';

interface TabConfig {
  id: string;
  label: string;
  desc: string;
  icon: React.ElementType;
  category: "Core Commerce" | "User Account" | "Information & Legal";
  defaultNote: string;
}

const ALL_TAB_CONFIGS: TabConfig[] = [
  { 
    id: "store", 
    label: "SMS Store (Virtual Numbers)", 
    desc: "Main catalog interface to order virtual SMS verification codes",
    icon: ShoppingBag,
    category: "Core Commerce",
    defaultNote: "SMS Store is temporarily undergoing maintenance for provider node optimization. Normal service will resume shortly."
  },
  { 
    id: "smm", 
    label: "SMM Panel Integration", 
    desc: "SMM social media marketing services and orders catalog",
    icon: Share2,
    category: "Core Commerce",
    defaultNote: "SMM Panel services are temporarily offline for automated API provider sync. Please check back soon."
  },
  { 
    id: "subscriptions", 
    label: "Subscriptions & Digital Accounts", 
    desc: "Streaming, VPNs, AI tools, and premium digital licenses store",
    icon: Gem,
    category: "Core Commerce",
    defaultNote: "Digital Subscriptions catalog is currently under scheduled inventory maintenance."
  },
  { 
    id: "reviews", 
    label: "Customer Reviews & Ratings", 
    desc: "User feedback, verified ratings, and testimonial submissions",
    icon: Star,
    category: "Information & Legal",
    defaultNote: "Customer Reviews portal is temporarily offline for review verification and database maintenance."
  },
  { 
    id: "privacy", 
    label: "Privacy Policy & Legal Terms", 
    desc: "Legal transparency, compliance terms, and user data privacy rules",
    icon: ShieldCheck,
    category: "Information & Legal",
    defaultNote: "Privacy Policy and Terms section is briefly being updated for legal compliance."
  },
  { 
    id: "dashboard", 
    label: "User Activation Dashboard", 
    desc: "Users active phone numbers, remaining timers, and SMS history",
    icon: LayoutDashboard,
    category: "User Account",
    defaultNote: "User Dashboard is undergoing scheduled server updates. Your active SMS numbers remain valid."
  },
  { 
    id: "wallet", 
    label: "Wallet & Cash Deposits", 
    desc: "Local Easypaisa, JazzCash, Bank Transfer, and Crypto payment top-ups",
    icon: Wallet,
    category: "User Account",
    defaultNote: "Cash deposit gateways are undergoing temporary maintenance. Automated approvals will resume shortly."
  },
  { 
    id: "seller", 
    label: "Become a Seller (Vendor Portal)", 
    desc: "Section explaining vendor account upgrades and API resale options",
    icon: Store,
    category: "Core Commerce",
    defaultNote: "Seller portal onboarding is undergoing scheduled maintenance for account structure upgrades."
  },
  { 
    id: "api", 
    label: "Developer API Documentation", 
    desc: "API specification and parameters for programmatic reselling",
    icon: Code,
    category: "Information & Legal",
    defaultNote: "Developer API documentation is temporarily offline for endpoint updates and rate limit revisions."
  },
  { 
    id: "tickets", 
    label: "Support Tickets Center", 
    desc: "Customer care messaging thread and request lodging",
    icon: MessageSquare,
    category: "User Account",
    defaultNote: "Support ticket system is briefly offline for helpdesk database maintenance."
  },
  { 
    id: "about", 
    label: "About & System Guidelines", 
    desc: "Terms of service, contact coordinates, and basic FAQ guidelines",
    icon: Info,
    category: "Information & Legal",
    defaultNote: "About portal is briefly under maintenance."
  }
];

const PRESET_DOWNTIME_NOTES = [
  "Scheduled server upgrades in progress. Service expected to resume in 30 minutes.",
  "Provider node sync maintenance. API connections are being refreshed.",
  "System security hardening and speed optimizations underway.",
  "Database maintenance in progress. No data will be lost.",
  "Emergency maintenance triggered for automated gateway sync."
];

export default function TabMaintenanceTab() {
  const ctx = useAdminContext();
  const { 
    tabMaintenance,
    draftTabMaintenance, 
    setDraftTabMaintenance, 
    isSavingTabMaintenance, 
    handleSaveTabMaintenance
  } = ctx;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "maintenance" | "hidden">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [previewTabId, setPreviewTabId] = useState<string | null>(null);
  const [batchNoteModalOpen, setBatchNoteModalOpen] = useState(false);
  const [selectedBatchNote, setSelectedBatchNote] = useState(PRESET_DOWNTIME_NOTES[0]);

  // Compute live stats
  const stats = useMemo(() => {
    let total = ALL_TAB_CONFIGS.length;
    let active = 0;
    let maintenance = 0;
    let hidden = 0;

    ALL_TAB_CONFIGS.forEach(cfg => {
      const state = draftTabMaintenance[cfg.id] || { hidden: false, maintenance: false, notes: "" };
      if (state.hidden) {
        hidden++;
      } else if (state.maintenance) {
        maintenance++;
      } else {
        active++;
      }
    });

    return { total, active, maintenance, hidden };
  }, [draftTabMaintenance]);

  // Check if draft has unsaved changes compared to stored tabMaintenance
  const isDirty = useMemo(() => {
    return JSON.stringify(draftTabMaintenance) !== JSON.stringify(tabMaintenance);
  }, [draftTabMaintenance, tabMaintenance]);

  // Filter tab list
  const filteredTabs = useMemo(() => {
    return ALL_TAB_CONFIGS.filter(tab => {
      const state = draftTabMaintenance[tab.id] || { hidden: false, maintenance: false, notes: "" };
      
      // Search matches
      const matchesSearch = 
        tab.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tab.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tab.desc.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      // Category matches
      if (selectedCategory !== "all" && tab.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === "active" && (state.hidden || state.maintenance)) return false;
      if (statusFilter === "maintenance" && !state.maintenance) return false;
      if (statusFilter === "hidden" && !state.hidden) return false;

      return true;
    });
  }, [draftTabMaintenance, searchQuery, statusFilter, selectedCategory]);

  const updateTab = (tabId: string, fields: Partial<{ hidden: boolean; maintenance: boolean; notes: string }>) => {
    setDraftTabMaintenance(prev => {
      const current = prev[tabId] || { hidden: false, maintenance: false, notes: "" };
      return {
        ...prev,
        [tabId]: {
          ...current,
          ...fields
        }
      };
    });
  };

  // Batch actions
  const handleEnableAllMaintenance = () => {
    setDraftTabMaintenance(prev => {
      const next = { ...prev };
      ALL_TAB_CONFIGS.forEach(t => {
        const curr = next[t.id] || { hidden: false, maintenance: false, notes: "" };
        next[t.id] = {
          ...curr,
          maintenance: true,
          notes: curr.notes || t.defaultNote
        };
      });
      return next;
    });
  };

  const handleDisableAllMaintenance = () => {
    setDraftTabMaintenance(prev => {
      const next = { ...prev };
      ALL_TAB_CONFIGS.forEach(t => {
        const curr = next[t.id] || { hidden: false, maintenance: false, notes: "" };
        next[t.id] = { ...curr, maintenance: false };
      });
      return next;
    });
  };

  const handleShowAllTabs = () => {
    setDraftTabMaintenance(prev => {
      const next = { ...prev };
      ALL_TAB_CONFIGS.forEach(t => {
        const curr = next[t.id] || { hidden: false, maintenance: false, notes: "" };
        next[t.id] = { ...curr, hidden: false };
      });
      return next;
    });
  };

  const handleApplyBatchNote = (noteText: string) => {
    setDraftTabMaintenance(prev => {
      const next = { ...prev };
      ALL_TAB_CONFIGS.forEach(t => {
        const curr = next[t.id] || { hidden: false, maintenance: false, notes: "" };
        next[t.id] = { ...curr, notes: noteText };
      });
      return next;
    });
    setBatchNoteModalOpen(false);
  };

  const handleResetToSaved = () => {
    setDraftTabMaintenance(JSON.parse(JSON.stringify(tabMaintenance || {})));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-emerald-200 border border-white/15">
            <Settings className="w-3.5 h-3.5 text-emerald-300" />
            <span>Navigation & System Maintenance Engine</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Tab Visibility & Maintenance Control
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium leading-relaxed">
            Manage live accessibility, lock tabs into custom maintenance modes, or hide navigation items across Subscriptions, Customer Reviews, Privacy Policy, SMS Store, Wallet, and SMM tools.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
          {isDirty && (
            <button
              onClick={handleResetToSaved}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer border border-white/20 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Unsaved</span>
            </button>
          )}

          <button
            onClick={handleSaveTabMaintenance}
            disabled={isSavingTabMaintenance}
            className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-black px-6 py-3 rounded-xl text-xs sm:text-sm transition cursor-pointer shadow-xl flex items-center gap-2 border border-emerald-300"
          >
            {isSavingTabMaintenance ? (
              <RefreshCw className="h-4 w-4 animate-spin text-slate-950" />
            ) : (
              <Save className="h-4 w-4 text-slate-950" />
            )}
            <span>{isSavingTabMaintenance ? "Saving Settings..." : "Save Visibility & Maintenance"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Tabs</span>
            <span className="text-xl font-black text-slate-800">{stats.total} Modules</span>
          </div>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600/80 block">Fully Live</span>
            <span className="text-xl font-black text-emerald-700">{stats.active} Active</span>
          </div>
        </div>

        <div className="bg-white border border-amber-100 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600/80 block">In Maintenance</span>
            <span className="text-xl font-black text-amber-700">{stats.maintenance} Locked</span>
          </div>
        </div>

        <div className="bg-white border border-red-100 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <EyeOff className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-red-600/80 block">Hidden Navigation</span>
            <span className="text-xl font-black text-red-700">{stats.hidden} Hidden</span>
          </div>
        </div>
      </div>

      {/* Control Toolbar & Filters */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        
        {/* Search & Filter Header */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tabs (e.g., Subscriptions, Reviews, Wallet)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                All ({ALL_TAB_CONFIGS.length})
              </button>
              <button
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === "active" ? "bg-emerald-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Live ({stats.active})
              </button>
              <button
                onClick={() => setStatusFilter("maintenance")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === "maintenance" ? "bg-amber-500 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Maintenance ({stats.maintenance})
              </button>
              <button
                onClick={() => setStatusFilter("hidden")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${statusFilter === "hidden" ? "bg-red-600 text-white shadow-2xs" : "text-slate-500 hover:text-slate-800"}`}
              >
                Hidden ({stats.hidden})
              </button>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="Core Commerce">Core Commerce</option>
              <option value="User Account">User Account</option>
              <option value="Information & Legal">Information & Legal</option>
            </select>
          </div>
        </div>

        {/* Global Batch Controls Bar */}
        <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Batch Quick Actions:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleEnableAllMaintenance}
              className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-extrabold transition cursor-pointer flex items-center gap-1.5"
            >
              <Wrench className="w-3 h-3 text-amber-600" />
              <span>Maintenance All</span>
            </button>

            <button
              onClick={handleDisableAllMaintenance}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-extrabold transition cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Make All Live</span>
            </button>

            <button
              onClick={handleShowAllTabs}
              className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 font-extrabold transition cursor-pointer flex items-center gap-1.5"
            >
              <Eye className="w-3 h-3 text-blue-600" />
              <span>Unhide All</span>
            </button>

            <button
              onClick={() => setBatchNoteModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 font-extrabold transition cursor-pointer flex items-center gap-1.5"
            >
              <Copy className="w-3 h-3 text-slate-500" />
              <span>Apply Notice Preset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tab Cards List */}
      <div className="space-y-4">
        {filteredTabs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-3">
            <Filter className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-base font-bold text-slate-700">No Tabs Match Your Search Filters</h4>
            <p className="text-xs text-slate-400">Try clearing your search query or changing the filter options above.</p>
            <button 
              onClick={() => { setSearchQuery(""); setStatusFilter("all"); setSelectedCategory("all"); }}
              className="text-xs font-bold text-emerald-600 hover:underline pt-2 inline-block cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredTabs.map((tab) => {
            const current = draftTabMaintenance[tab.id] || { hidden: false, maintenance: false, notes: "" };
            const TabIcon = tab.icon;

            const isCurrentlyHidden = current.hidden;
            const isCurrentlyMaintenance = current.maintenance;

            return (
              <div 
                key={tab.id}
                className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all duration-200 ${
                  isCurrentlyHidden
                    ? "border-red-200 bg-red-50/20"
                    : isCurrentlyMaintenance
                    ? "border-amber-200 bg-amber-50/20"
                    : "border-slate-200/90 hover:border-slate-300"
                }`}
              >
                <div className="flex flex-col lg:flex-row gap-6 lg:items-start justify-between">
                  
                  {/* Left Column: Tab Info & Badges */}
                  <div className="space-y-3 lg:w-72 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl border ${
                        isCurrentlyHidden
                          ? "bg-red-100 border-red-200 text-red-600"
                          : isCurrentlyMaintenance
                          ? "bg-amber-100 border-amber-200 text-amber-700"
                          : "bg-emerald-50 border-emerald-200 text-emerald-600"
                      }`}>
                        <TabIcon className="w-5 h-5 stroke-[2]" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-base">{tab.label}</h4>
                        </div>
                        <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 mt-0.5 inline-block rounded-md font-bold">
                          key: {tab.id}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                      {tab.desc}
                    </p>

                    {/* Status Badges */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {isCurrentlyHidden ? (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-md border border-red-200">
                          <EyeOff className="w-3 h-3" /> Hidden from Nav
                        </span>
                      ) : isCurrentlyMaintenance ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-md border border-amber-200">
                          <Wrench className="w-3 h-3" /> Maintenance Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Fully Operational
                        </span>
                      )}

                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1 rounded-md">
                        {tab.category}
                      </span>
                    </div>
                  </div>

                  {/* Middle Column: Switches & Controls */}
                  <div className="flex-1 space-y-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      
                      {/* Hide Tab Switch */}
                      <div className={`p-3.5 rounded-xl border transition ${
                        current.hidden 
                          ? "bg-red-50 border-red-200 text-red-900" 
                          : "bg-slate-50 border-slate-200/80 text-slate-700"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-black block flex items-center gap-1.5">
                              <EyeOff className={`w-3.5 h-3.5 ${current.hidden ? "text-red-600" : "text-slate-400"}`} />
                              Hide Tab completely
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight">
                              Removes link from header menu
                            </span>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input 
                              type="checkbox" 
                              checked={current.hidden} 
                              onChange={(e) => updateTab(tab.id, { hidden: e.target.checked })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                          </label>
                        </div>
                      </div>

                      {/* Maintenance Mode Switch */}
                      <div className={`p-3.5 rounded-xl border transition ${
                        current.maintenance 
                          ? "bg-amber-50 border-amber-200 text-amber-900" 
                          : "bg-slate-50 border-slate-200/80 text-slate-700"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-xs font-black block flex items-center gap-1.5">
                              <Wrench className={`w-3.5 h-3.5 ${current.maintenance ? "text-amber-600" : "text-slate-400"}`} />
                              Maintenance Mode
                            </span>
                            <span className="text-[10px] text-slate-500 block leading-tight">
                              Locks tab with downtime popup block
                            </span>
                          </div>

                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input 
                              type="checkbox" 
                              checked={current.maintenance} 
                              onChange={(e) => updateTab(tab.id, { maintenance: e.target.checked })}
                              className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Custom Downtime Note Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <span>Custom Downtime Notice / Admin Notes:</span>
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateTab(tab.id, { notes: tab.defaultNote })}
                            className="text-[10px] font-extrabold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                          >
                            Fill Default Note
                          </button>
                          <span className="text-slate-300">|</span>
                          <button
                            onClick={() => setPreviewTabId(tab.id)}
                            className="text-[10px] font-extrabold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Preview View
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={current.notes || ""}
                        onChange={(e) => updateTab(tab.id, { notes: e.target.value })}
                        placeholder={`E.g., ${tab.defaultNote}`}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed font-medium"
                        rows={2}
                      />

                      {/* Quick Presets row */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                        <span className="text-[10px] font-bold text-slate-400">Quick Fill:</span>
                        {PRESET_DOWNTIME_NOTES.slice(0, 3).map((note, idx) => (
                          <button
                            key={idx}
                            onClick={() => updateTab(tab.id, { notes: note })}
                            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-medium truncate max-w-[180px] cursor-pointer"
                            title={note}
                          >
                            {note}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Save Bar when dirty */}
      {isDirty && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-center gap-4">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <AlertTriangle className="w-4 h-4" />
              <span>You have unsaved tab maintenance changes</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetToSaved}
                className="px-3 py-1.5 text-xs text-slate-300 hover:text-white font-bold cursor-pointer"
              >
                Discard
              </button>
              <button
                onClick={handleSaveTabMaintenance}
                disabled={isSavingTabMaintenance}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                {isSavingTabMaintenance ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5" />
                )}
                <span>Save Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Preview Modal */}
      {previewTabId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                <Eye className="w-3.5 h-3.5" />
                <span>Live Maintenance View Preview</span>
              </div>

              <button 
                onClick={() => setPreviewTabId(null)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Render TabMaintenanceView directly */}
            {(() => {
              const cfg = ALL_TAB_CONFIGS.find(t => t.id === previewTabId);
              const current = draftTabMaintenance[previewTabId] || { hidden: false, maintenance: false, notes: "" };
              return (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                  <TabMaintenanceView 
                    tabId={previewTabId} 
                    tabLabel={cfg?.label || previewTabId} 
                    notes={current.notes || cfg?.defaultNote} 
                  />
                </div>
              );
            })()}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewTabId(null)}
                className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl text-xs cursor-pointer hover:bg-slate-800"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Preset Note Modal */}
      {batchNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Copy className="w-4 h-4 text-emerald-600" />
                Apply Batch Downtime Note to All Tabs
              </h3>
              <button 
                onClick={() => setBatchNoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Select a preset downtime note below to overwrite custom notes across all 11 portal tabs:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {PRESET_DOWNTIME_NOTES.map((note, idx) => (
                <label 
                  key={idx}
                  onClick={() => setSelectedBatchNote(note)}
                  className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                    selectedBatchNote === note 
                      ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold" 
                      : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <input 
                    type="radio" 
                    name="batchNote" 
                    checked={selectedBatchNote === note}
                    onChange={() => setSelectedBatchNote(note)}
                    className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{note}</span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setBatchNoteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApplyBatchNote(selectedBatchNote)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Apply To All Tabs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
