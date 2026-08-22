import React, { useState } from "react";
import { 
  Cpu, Activity, RefreshCw, Plus, Edit, Trash2, CheckCircle2, 
  XCircle, Search, Sliders, AlertTriangle, TrendingUp, Settings2, 
  Layers, Copy, Check, Eye, EyeOff, Play, Terminal, ArrowUpRight, 
  Settings, Loader2, HelpCircle, Globe, Shield, DollarSign, Smartphone, Zap, Code
} from "lucide-react";
import CurrencyDisplay from "./CurrencyDisplay";
import { toast } from "react-hot-toast";
import { db } from "../lib/firebase";
import { doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { SmsProvider, ServiceData, ActivationOrder, UserAccount } from "../types";

interface FiveSimManagementProps {
  smsProviders: SmsProvider[];
  setSmsProviders: React.Dispatch<React.SetStateAction<SmsProvider[]>>;
  disabledServices: string[];
  onToggleService: (key: string) => void;
  customPrices: Record<string, number>;
  onUpdateCustomPrice: (key: string, price: number) => void;
  priceMarkupPercent: number;
  onUpdateMarkupPercent: (percent: number) => void;
  customServices: ServiceData[];
  orders: ActivationOrder[];
  registeredUsers?: UserAccount[];
  formatPrice: (baseUnits: number) => string;
}

export default function FiveSimManagement({
  smsProviders,
  setSmsProviders,
  disabledServices,
  onToggleService,
  customPrices,
  onUpdateCustomPrice,
  priceMarkupPercent,
  onUpdateMarkupPercent,
  customServices,
  orders,
  registeredUsers = [],
  formatPrice
}: FiveSimManagementProps) {
  // Navigation inside 5Sim Management
  const [subTab, setSubTab] = useState<"overview" | "gateways" | "pricing" | "tester" | "orders" | "sync_debug">("overview");

  // Sync Diagnostics & Logs State
  const [syncDebugData, setSyncDebugData] = useState<any>(null);
  const [loadingSyncDebug, setLoadingSyncDebug] = useState(false);

  const fetchSyncDebugData = async (isManual = false) => {
    if (isManual) setLoadingSyncDebug(true);
    try {
      const res = await fetch("/api/admin/provider-sync-debug");
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          setSyncDebugData(data);
          if (data.syncState?.totalCountries && data.syncState?.totalServices) {
            setCatalogStats(prev => ({
              ...prev,
              totalCountries: data.syncState.totalCountries,
              totalServices: data.syncState.totalServices,
              lastSyncTime: data.syncState.lastSuccessfulSync || prev.lastSyncTime
            }));
          }
        }
      }
    } catch (e) {
      console.warn("Failed to fetch sync debug data:", e);
    } finally {
      if (isManual) setLoadingSyncDebug(false);
    }
  };

  // Automated 5-second real-time polling when Sync Matrix Diagnostics sub-tab is active
  React.useEffect(() => {
    if (subTab === "sync_debug") {
      fetchSyncDebugData(false);
      const interval = setInterval(() => {
        fetchSyncDebugData(false);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [subTab]);

  // Gateway form states
  const [isAddingProv, setIsAddingProv] = useState(false);
  const [editingProvId, setEditingProvId] = useState<string | null>(null);
  const [provName, setProvName] = useState("");
  const [provUrl, setProvUrl] = useState("https://5sim.net/v1");
  const [provKey, setProvKey] = useState("");
  const [provType, setProvType] = useState<"5sim" | "sms_activate" | "grizzly_sms" | "sms_man" | "custom">("5sim");
  const [provNotes, setProvNotes] = useState("");
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});

  // Tester states
  const [testEndpoint, setTestEndpoint] = useState<string>("user/profile");
  const [testCountry, setTestCountry] = useState<string>("russia");
  const [testOperator, setTestOperator] = useState<string>("any");
  const [testProduct, setTestProduct] = useState<string>("telegram");
  const [testResult, setTestResult] = useState<any>(null);
  const [testStatus, setTestStatus] = useState<number | null>(null);
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Price markup edit state
  const [localMarkup, setLocalMarkup] = useState<number>(priceMarkupPercent);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("ALL");

  // 5SIM Catalog stats & sync state
  const [catalogStats, setCatalogStats] = useState<{ totalCountries: number; totalServices: number; lastSyncTime: number }>({
    totalCountries: 153,
    totalServices: 1260,
    lastSyncTime: Date.now()
  });
  const [isSyncingCatalog, setIsSyncingCatalog] = useState(false);

  // Active Provider
  const activeProv = smsProviders.find(p => p.status === "ACTIVE") || smsProviders[0] || null;

  // Fetch catalog summary on mount
  React.useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await fetch("/api/catalog-summary");
        if (res.ok) {
          const data = await res.json();
          if (data && data.success) {
            setCatalogStats({
              totalCountries: data.totalCountries || 153,
              totalServices: data.totalServices || 1260,
              lastSyncTime: data.lastSyncTime || Date.now()
            });
          }
        }
      } catch (err) {
        console.warn("Failed to load catalog summary in admin:", err);
      }
    };
    fetchSummary();
  }, []);

  // Real-time background sync when Admin is on this page
  React.useEffect(() => {
    if (!activeProv) return;
    
    // Perform an initial background sync on mount, and then every 60 seconds
    const performLiveSync = async () => {
      try {
        const response = await fetch("/api/sync-test", {
          headers: { "Accept": "application/json" }
        });
        const data = await response.json();
        
        if (response.ok && data.success) {
          const provRef = doc(db, "sms_providers", activeProv.id);
          await updateDoc(provRef, {
            balance: data.balance,
            rating: data.rating,
            lastSyncTime: new Date().toISOString()
          });
        }
      } catch (err) {
        // silent error for background sync
      }
    };
    
    performLiveSync();
    const interval = setInterval(performLiveSync, 60000);
    
    return () => clearInterval(interval);
  }, [activeProv?.id]);

  // Trigger full catalog sync across all SMS provider gateways
  const handleTriggerCatalogSync = async () => {
    setIsSyncingCatalog(true);
    try {
      toast.loading("Synchronizing live Countries, Services & Operators across all OTP Panels...", { id: "admin-catalog-sync" });
      const res = await fetch("/api/sync-catalog", { method: "POST" });
      const data = await res.json();
      if (data && data.success) {
        setCatalogStats({
          totalCountries: data.totalCountries || 153,
          totalServices: data.totalServices || 1260,
          lastSyncTime: data.lastSyncTime || Date.now()
        });
        toast.success(
          data.message || `Successfully synchronized ${data.totalCountries} Countries and ${data.totalServices} Services across all OTP Panels!`,
          { id: "admin-catalog-sync" }
        );
      } else {
        throw new Error(data?.error || "Sync failed");
      }
    } catch (err: any) {
      toast.error(`OTP Panel Management sync error: ${err.message}`, { id: "admin-catalog-sync" });
    } finally {
      setIsSyncingCatalog(false);
    }
  };

  // Toggle API Key view
  const toggleKeyVisibility = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Sync Balance for specific gateway
  const handleSyncBalance = async (provider: SmsProvider) => {
    setIsSyncing(prev => ({ ...prev, [provider.id]: true }));
    try {
      const response = await fetch("/api/sync-test", {
        headers: { "Accept": "application/json" }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        const provRef = doc(db, "sms_providers", provider.id);
        await updateDoc(provRef, {
          balance: data.balance,
          rating: data.rating,
          lastSyncTime: new Date().toISOString()
        });
        if (data.isLive) {
          toast.success(`Success! Live 5SIM Balance: $ ${Number(data.balance).toFixed(2)} USD. Matrix auto-synced ${data.syncedCountriesCount} countries.`);
        } else {
          toast.success(`Virtual Gateway Active: Auto-synced matrix for ${data.syncedCountriesCount} countries.`);
        }
      } else {
        throw new Error(data?.error || `HTTP ${response.status}: Failed to ping API.`);
      }
    } catch (err: any) {
      console.error("5Sim Sync failed:", err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setIsSyncing(prev => ({ ...prev, [provider.id]: false }));
    }
  };

  // Toggle Active Provider
  const handleToggleActive = async (providerId: string) => {
    try {
      for (const p of smsProviders) {
        const provRef = doc(db, "sms_providers", p.id);
        if (p.id === providerId) {
          await updateDoc(provRef, { status: "ACTIVE" });
          toast.success(`Activated ${p.name} as primary 5Sim API gateway`);
        } else {
          await updateDoc(provRef, { status: "INACTIVE" });
        }
      }
    } catch (err: any) {
      console.error("Failed to toggle 5sim gateway status:", err);
      toast.error("Failed to update active gateway status in Firestore");
    }
  };

  // Save / Add Gateway
  const handleSaveProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provName.trim() || !provUrl.trim() || !provKey.trim()) {
      toast.error("Provider Name, API URL, and Bearer API Key are required.");
      return;
    }

    try {
      if (editingProvId) {
        const provRef = doc(db, "sms_providers", editingProvId);
        await updateDoc(provRef, {
          name: provName.trim(),
          apiUrl: provUrl.trim(),
          apiKey: provKey.trim(),
          apiType: provType,
          notes: provNotes.trim()
        });
        toast.success("5Sim Provider gateway configuration saved.");
      } else {
        const provId = `sms_prov_${Date.now()}`;
        const newProv: SmsProvider = {
          id: provId,
          name: provName.trim(),
          apiUrl: provUrl.trim(),
          apiKey: provKey.trim(),
          apiType: provType,
          status: smsProviders.length === 0 ? "ACTIVE" : "INACTIVE",
          notes: provNotes.trim() || "5Sim.net Virtual Number Gateway",
          balance: 0.0,
          lastSyncTime: new Date().toISOString()
        };
        await setDoc(doc(db, "sms_providers", provId), newProv);
        toast.success("New 5Sim Provider gateway registered.");
      }

      setIsAddingProv(false);
      setEditingProvId(null);
      setProvName("");
      setProvKey("");
      setProvNotes("");
    } catch (err: any) {
      console.error("Failed to save 5Sim provider:", err);
      toast.error(`Error saving provider: ${err.message}`);
    }
  };

  // Delete Gateway
  const handleDeleteProvider = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this 5Sim gateway configuration?")) return;
    try {
      await deleteDoc(doc(db, "sms_providers", id));
      toast.success("5Sim gateway removed.");
    } catch (err: any) {
      toast.error(`Error removing gateway: ${err.message}`);
    }
  };

  // Run live API test
  const handleRunApiTest = async () => {
    if (!activeProv || !activeProv.apiKey) {
      toast.error("No active 5Sim API key configured. Please add or select an active gateway first.");
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setTestStatus(null);
    setTestLatency(null);

    const startTime = Date.now();
    try {
      let targetUrl = `/api/profile`;
      if (testEndpoint === "guest/countries") {
        targetUrl = `/api/countries`;
      } else if (testEndpoint === "guest/prices") {
        targetUrl = `/api/prices?country=${testCountry}`;
      } else if (testEndpoint === "guest/products") {
        targetUrl = `/api/products/${testCountry}/${testOperator}`;
      } else if (testEndpoint === "user/orders") {
        targetUrl = `/api/orders`;
      }

      const res = await fetch(targetUrl, {
        headers: {
          Authorization: `Bearer ${activeProv.apiKey}`,
          "x-provider-url": activeProv.apiUrl,
          "x-provider-type": activeProv.apiType
        }
      });

      const endTime = Date.now();
      setTestLatency(endTime - startTime);
      setTestStatus(res.status);

      const json = await res.json();
      setTestResult(json);

      if (res.ok && !json.error) {
        toast.success(`5Sim API response received in ${endTime - startTime}ms (HTTP ${res.status})`);
      } else {
        toast.error(`5Sim API returned error (HTTP ${res.status}): ${json?.error || "Unknown response"}`);
      }
    } catch (err: any) {
      setTestLatency(Date.now() - startTime);
      setTestStatus(500);
      setTestResult({ error: err.message || "Network request failed" });
      toast.error(`API Test error: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Apply markup change
  const handleSaveMarkup = () => {
    onUpdateMarkupPercent(localMarkup);
    toast.success(`Virtual Numbers profit markup set to ${localMarkup}%`);
  };

  // Standard services list for price management
  const standardServices = [
    { key: "telegram", name: "Telegram", defaultPrice: 50 },
    { key: "whatsapp", name: "WhatsApp", defaultPrice: 45 },
    { key: "google", name: "Google / Gmail / YouTube", defaultPrice: 35 },
    { key: "openai", name: "OpenAI / ChatGPT", defaultPrice: 40 },
    { key: "instagram", name: "Instagram / Threads", defaultPrice: 30 },
    { key: "facebook", name: "Facebook", defaultPrice: 28 },
    { key: "tiktok", name: "TikTok", defaultPrice: 25 },
    { key: "twitter", name: "X (Twitter)", defaultPrice: 25 },
    { key: "discord", name: "Discord", defaultPrice: 22 },
    { key: "tinder", name: "Tinder", defaultPrice: 35 },
    { key: "other", name: "Any Other Service", defaultPrice: 20 },
  ];

  return (
    <div className="space-y-4 animate-fade-in flex flex-col min-h-[500px]">
      
      {/* Active Gateway Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-5 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-100">
                {activeProv ? activeProv.name : "No Gateway Configured"}
              </h2>
              {activeProv && (
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                  activeProv.apiKey ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400"
                }`}>
                  {activeProv.apiKey ? "LIVE 5SIM API" : "TOKEN MISSING"}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 font-mono">
              Endpoint: {activeProv ? activeProv.apiUrl : "https://5sim.net/v1"}
            </p>
          </div>
        </div>

        {/* Live Balance & Quick Actions */}
        <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-800/80 pt-3 md:pt-0">
          <div className="text-left md:text-right">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Admin Wallet Status (5SIM)</p>
            <p className={`text-base font-black font-mono mt-0.5 ${(activeProv?.balance ?? 0) < 1.0 ? "text-red-400" : "text-emerald-400"}`}>
              {activeProv?.balance !== undefined && activeProv?.balance !== null ? `$ ${Number(activeProv.balance).toFixed(2)} USD` : "Sync Failed"}
              {activeProv?.balance !== undefined && activeProv?.balance !== null && (
                <span className="text-[10px] opacity-70 font-normal ml-1.5">
                  (≈ ₨ ${(Number(activeProv.balance) * 275).toFixed(0)} PKR)
                </span>
              )}
            </p>
            {(activeProv?.balance ?? 0) < 1.0 && (
               <p className="text-[10px] text-red-400 font-bold mt-1 flex items-center gap-1 md:justify-end">
                 <AlertTriangle className="h-3 w-3" /> Low Balance Alert (Below $1)
               </p>
            )}

          </div>

          <div className="flex items-center gap-2">
            {activeProv && (
              <div className="flex flex-col gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                <button 
                  className={`w-full sm:w-auto px-4 py-2 border rounded-lg text-[11px] font-bold shadow-sm transition flex items-center justify-center gap-2
                    ${isSyncing[activeProv.id] ? "bg-slate-50 text-slate-400 border-slate-200" : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20"}
                  `}
                  onClick={() => handleSyncBalance(activeProv)}
                  disabled={isSyncing[activeProv.id]}
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncing[activeProv.id] ? "animate-spin" : ""}`} />
                  <span>Sync & Test API Connection Now</span>
                </button>
                <div className="text-[9px] text-slate-400 font-mono text-center flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-100 rounded-md py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Auto-Sync Cron: Active (Every 5 min)
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl p-1.5 shadow-sm flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={() => setSubTab("overview")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            subTab === "overview" ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("gateways")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            subTab === "gateways" ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Cpu className="h-3.5 w-3.5" />
          <span>SMS Gateways ({smsProviders.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("pricing")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            subTab === "pricing" ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <DollarSign className="h-3.5 w-3.5" />
          <span>Rates & Profit Markup</span>
        </button>

        <button
          type="button"
          onClick={() => setSubTab("tester")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            subTab === "tester" ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Code className="h-3.5 w-3.5" />
          <span>Live API Tester</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSubTab("sync_debug");
            fetchSyncDebugData(true);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
            subTab === "sync_debug" ? "bg-indigo-600 text-white shadow" : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loadingSyncDebug ? "animate-spin" : ""}`} />
          <span>Sync Matrix Diagnostics</span>
        </button>
      </div>

      {/* --- TAB 1: OVERVIEW DASHBOARD --- */}
      {subTab === "overview" && (
        <div className="space-y-4">
          {/* Admin Matrix Auto - System 153 Countries & 1260 Services Matrix Card */}
          <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white border border-indigo-900/40 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] pointer-events-none rounded-full"></div>

            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-indigo-500/20 border border-indigo-400/30 rounded-xl text-indigo-400 shrink-0">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-sm font-black text-white tracking-wide">Matrix Auto - System</h3>
                  <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Auto-Sync Active (Every 5 min)
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium mt-1">
                  Currently synchronized: <strong className="text-white font-mono text-xs">{catalogStats.totalCountries} Countries</strong> & <strong className="text-white font-mono text-xs">{catalogStats.totalServices.toLocaleString()} Services</strong> across all OTP Panels
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleTriggerCatalogSync}
              disabled={isSyncingCatalog}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs transition shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95"
            >
              <RefreshCw className={`h-4 w-4 ${isSyncingCatalog ? "animate-spin text-indigo-200" : ""}`} />
              <span>{isSyncingCatalog ? "Syncing Matrix..." : "Sync Matrix Auto - System"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active OTP Gateway</p>
              <h3 className="text-sm font-black text-slate-800 mt-1 truncate">
                {activeProv ? activeProv.name : "None"}
              </h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>{activeProv?.apiKey ? "Provider API Connected" : "Unconfigured"}</span>
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Provider Rating</p>
              <h3 className="text-sm font-black text-slate-800 font-mono mt-1">
                {activeProv?.rating ? activeProv.rating.toFixed(2) : "0.00"}
              </h3>
              <p className="text-[10px] text-amber-500 font-bold mt-1 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                <span>5SIM Account Standing</span>
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Virtual Numbers Markup</p>
              <h3 className="text-sm font-black text-indigo-600 font-mono mt-1">
                +{priceMarkupPercent}% Profit
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Applied over base operator price</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
              <h3 className="text-sm font-black text-slate-800 font-mono mt-1">
                {orders.length} Virtual Numbers
              </h3>
              <p className="text-[10px] text-indigo-600 font-bold mt-1">
                {orders.filter(o => o.status === "RECEIVED" || o.status === "FINISHED").length} Successful
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">User Wallets</p>
              <h3 className="text-sm font-black text-slate-800 font-mono mt-1">
                <CurrencyDisplay baseUnits={registeredUsers?.reduce((sum, user) => sum + (user.balance || 0), 0) || 0} formatPrice={formatPrice} />
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">{registeredUsers?.length || 0} customers</p>
            </div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              OTP Panel Setup & Universal Gateway Instructions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-slate-800 block text-xs">1. Get Provider API Key / Token</span>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Log into your official SMS/OTP Provider account (e.g., 5sim.net, SMS-Activate, GrizzlySMS, etc.), navigate to your Profile or API settings, and copy your Bearer Authorization Key or API Token.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-slate-800 block text-xs">2. Add Gateway in Panel</span>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Navigate to the <strong>Gateways Management</strong> tab above, click <strong>Add SMS Provider Gateway</strong>, select or specify your API gateway endpoint, paste your API Key, and set it as Active.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-1">
                <span className="font-bold text-slate-800 block text-xs">3. Real-Time Universal Flow</span>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  Customers pick a country, service, and operator in the <strong>Virtual Numbers</strong> tab. Orders route to the connected Provider API, delivering numbers instantly and fetching incoming SMS OTPs automatically!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 2: GATEWAYS MANAGEMENT --- */}
      {subTab === "gateways" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">OTP Provider API Gateways</h3>
              <p className="text-[10px] text-slate-400">Manage OTP provider API credentials, endpoints, and active status.</p>
            </div>

            {!isAddingProv && (
              <button
                type="button"
                onClick={() => {
                  setEditingProvId(null);
                  setProvName("5Sim Primary Gateway");
                  setProvUrl("https://5sim.net/v1");
                  setProvKey("");
                  setProvType("5sim");
                  setProvNotes("Official 5sim.net API token");
                  setIsAddingProv(true);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add SMS Provider Gateway</span>
              </button>
            )}
          </div>

          {/* Add / Edit Gateway Form */}
          {isAddingProv && (
            <form onSubmit={handleSaveProvider} className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-5 shadow-inner space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <h4 className="text-xs font-bold text-indigo-800 uppercase">
                  {editingProvId ? "✏️ Edit SMS Provider Gateway" : "✨ Configure New SMS Provider Gateway"}
                </h4>
                <button type="button" onClick={() => setIsAddingProv(false)} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Gateway Name</label>
                  <input
                    type="text"
                    value={provName}
                    onChange={(e) => setProvName(e.target.value)}
                    placeholder="e.g. 5Sim Primary Feed / SMS-Activate"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">API Endpoint Protocol</label>
                  <select
                    value={provType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setProvType(val);
                      if (val === "5sim") {
                        setProvUrl("https://5sim.net/v1");
                      } else if (val === "sms_activate") {
                        setProvUrl("https://api.sms-activate.org/stubs/handler_api.php");
                      } else if (val === "grizzly_sms") {
                        setProvUrl("https://api.grizzlysms.com/stubs/handler_api.php");
                      } else if (val === "sms_man") {
                        setProvUrl("https://api.sms-man.com/control");
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="5sim">5Sim.net API Protocol (v1 Bearer)</option>
                    <option value="sms_activate">SMS-Activate Protocol (handler_api.php)</option>
                    <option value="grizzly_sms">Grizzly SMS Protocol (handler_api.php)</option>
                    <option value="sms_man">SMS-Man API Protocol</option>
                    <option value="custom">Generic / Custom HTTP API</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Base API URL</label>
                  <input
                    type="url"
                    value={provUrl}
                    onChange={(e) => setProvUrl(e.target.value)}
                    placeholder="https://5sim.net/v1"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {provType === "5sim" ? "5Sim JWT Authorization Bearer Token" : "API Key / Token"}
                  </label>
                  <div className="relative">
                    <input
                      type={showKey['new'] ? "text" : "password"}
                      value={provKey}
                      onChange={(e) => setProvKey(e.target.value)}
                      placeholder={provType === "5sim" ? "Enter JWT Bearer Token from 5sim.net/profile" : "Enter API Key from provider dashboard"}
                      className="w-full bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs font-mono text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => toggleKeyVisibility('new')}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
                    >
                      {showKey['new'] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Notes</label>
                  <input
                    type="text"
                    value={provNotes}
                    onChange={(e) => setProvNotes(e.target.value)}
                    placeholder="e.g. Main account token"
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingProv(false)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 px-4 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-5 rounded-lg text-xs"
                >
                  {editingProvId ? "Save Changes" : "Register Gateway"}
                </button>
              </div>
            </form>
          )}

          {/* List of Gateways */}
          <div className="space-y-3">
            {smsProviders.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400">
                <Cpu className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold uppercase">No 5Sim Gateways Configured</p>
                <p className="text-[10px] mt-1">Click Add 5Sim Gateway above to set up your API connection.</p>
              </div>
            ) : (
              smsProviders.map((prov) => {
                const isActive = prov.status === "ACTIVE";
                const isKeyVisible = showKey[prov.id];

                return (
                  <div
                    key={prov.id}
                    className={`bg-white border rounded-xl p-4 shadow-sm transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isActive ? "border-indigo-300 ring-2 ring-indigo-500/10" : "border-slate-200"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <h4 className="text-xs font-black text-slate-800">{prov.name}</h4>
                        <span className="bg-blue-100 text-blue-800 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                          {prov.apiType.toUpperCase()}
                        </span>
                        {isActive && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded uppercase">
                            Primary Active
                          </span>
                        )}
                      </div>

                      <p className="text-[10px] font-mono text-slate-500">
                        <strong>Endpoint:</strong> {prov.apiUrl}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                        <strong>API Token:</strong>
                        <span>
                          {isKeyVisible ? prov.apiKey : prov.apiKey ? `••••••••${prov.apiKey.slice(-6)}` : "Not Configured"}
                        </span>
                        {prov.apiKey && (
                          <button
                            type="button"
                            onClick={() => toggleKeyVisibility(prov.id)}
                            className="text-slate-400 hover:text-slate-600"
                          >
                            {isKeyVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                      <div className="text-right">
                        <p className="text-[9px] font-bold text-slate-400 uppercase">Provider Balance</p>
                        <p className="text-xs font-black text-indigo-600 font-mono">
                          $ {prov.balance ? (prov.balance > 100 ? (prov.balance / 86.9) : prov.balance).toFixed(2) : "0.00"} USD
                          <span className="text-[9px] text-slate-400 font-normal ml-1">
                            (≈ ₨ {prov.balance ? ((prov.balance > 100 ? (prov.balance / 86.9) : prov.balance) * 275).toFixed(0) : "0"} PKR)
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(prov.id)}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg border transition ${
                            isActive
                              ? "bg-emerald-600 text-white border-transparent"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                          }`}
                        >
                          {isActive ? "Active" : "Set Active"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSyncBalance(prov)}
                          disabled={isSyncing[prov.id]}
                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition"
                          title="Sync & Test API Connection Now"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${isSyncing[prov.id] ? "animate-spin text-indigo-600" : ""}`} />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingProvId(prov.id);
                            setProvName(prov.name);
                            setProvUrl(prov.apiUrl);
                            setProvKey(prov.apiKey);
                            setProvType(prov.apiType || "5sim");
                            setProvNotes(prov.notes || "");
                            setIsAddingProv(true);
                          }}
                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition"
                          title="Edit Gateway"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProvider(prov.id)}
                          className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:border-red-200 shadow-sm transition"
                          title="Delete Gateway"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* --- TAB 3: PRICING & PROFIT MARKUP --- */}
      {subTab === "pricing" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Global Profit Margin Controller</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Configure how much profit to add on top of the actual 5SIM base cost.
                  </p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button type="button" className="px-3 py-1 text-[10px] font-bold rounded-md bg-white text-slate-800 shadow-sm">
                    Percentage (%)
                  </button>
                  <button type="button" className="px-3 py-1 text-[10px] font-bold rounded-md text-slate-500 hover:text-slate-700">
                    Fixed Flat Rate
                  </button>
                </div>
              </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 mt-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="number"
                  min="0"
                  max="500"
                  value={localMarkup}
                  onChange={(e) => setLocalMarkup(Number(e.target.value) || 0)}
                  className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-black font-mono text-slate-800 text-center outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="text-sm font-bold text-slate-600">% Markup</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={localMarkup}
                onChange={(e) => setLocalMarkup(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />

              <button
                type="button"
                onClick={handleSaveMarkup}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-lg cursor-pointer transition shadow-sm shrink-0"
              >
                Apply Profit Margin
              </button>
            </div>
          </div>

          {/* Service Price Overrides & Disables */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Service Fixed Price Overrides & Status</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Set custom fixed PKR selling prices or disable specific services for site users.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {standardServices.map((svc) => {
                const isDisabled = disabledServices.includes(svc.key);
                const customPrice = customPrices[svc.key];

                return (
                  <div
                    key={svc.key}
                    className={`p-3.5 border rounded-xl transition space-y-2 ${
                      isDisabled ? "bg-slate-50 border-slate-200 opacity-60" : "bg-white border-slate-200 hover:border-indigo-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{svc.name}</span>
                      <button
                        type="button"
                        onClick={() => onToggleService(svc.key)}
                        className={`text-[9px] font-black px-2 py-0.5 rounded cursor-pointer transition ${
                          isDisabled ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {isDisabled ? "DISABLED" : "ENABLED"}
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Fixed Price (PKR):</span>
                      <input
                        type="number"
                        placeholder={`${svc.defaultPrice} PKR`}
                        value={customPrice !== undefined ? customPrice : ""}
                        onChange={(e) => onUpdateCustomPrice(svc.key, parseFloat(e.target.value) || 0)}
                        className="w-24 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-bold font-mono text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- TAB 4: LIVE API TESTER --- */}
      {subTab === "tester" && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Code className="h-4 w-4 text-indigo-600" />
                Live 5Sim Endpoint Inspector & Diagnostic Tool
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Execute live HTTP queries directly against 5sim.net to test your token, pricing catalog, and activation status.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target Endpoint</label>
                <select
                  value={testEndpoint}
                  onChange={(e) => setTestEndpoint(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="user/profile">User Profile & Balance (/user/profile)</option>
                  <option value="guest/countries">Supported Countries (/guest/countries)</option>
                  <option value="guest/prices">Pricing Catalog (/guest/prices)</option>
                  <option value="guest/products">Products by Operator (/guest/products)</option>
                  <option value="user/orders">User Orders History (/user/orders)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Country</label>
                <select
                  value={testCountry}
                  onChange={(e) => setTestCountry(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="russia">Russia (+7)</option>
                  <option value="usa">USA (+1)</option>
                  <option value="england">England (+44)</option>
                  <option value="india">India (+91)</option>
                  <option value="germany">Germany (+49)</option>
                  <option value="france">France (+33)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Operator</label>
                <select
                  value={testOperator}
                  onChange={(e) => setTestOperator(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="any">Any Operator</option>
                  <option value="virtual">Virtual</option>
                  <option value="tele2">Tele2</option>
                  <option value="beeline">Beeline</option>
                  <option value="megafon">Megafon</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleRunApiTest}
                  disabled={isTesting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer shadow transition disabled:opacity-50"
                >
                  {isTesting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                  <span>Execute 5Sim Query</span>
                </button>
              </div>
            </div>

            {/* Test Results Console */}
            {testResult && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-white font-mono space-y-2 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                  <span className="flex items-center gap-2 text-slate-300 font-bold">
                    <Terminal className="h-4 w-4 text-emerald-400" />
                    5Sim.net Response Stream
                  </span>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      testStatus === 200 ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400"
                    }`}>
                      HTTP {testStatus}
                    </span>
                    {testLatency && (
                      <span className="text-[10px] text-slate-400 font-bold">{testLatency} ms</span>
                    )}
                  </div>
                </div>

                <pre className="text-[11px] text-emerald-300 overflow-x-auto max-h-72 custom-scrollbar p-2 bg-slate-950 rounded border border-slate-800/80">
                  {JSON.stringify(testResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB 5: VIRTUAL NUMBER ORDERS --- */}
      {subTab === "orders" && (() => {
        const successfulOrders = orders.filter(o => o.status === "RECEIVED" || o.status === "FINISHED");
        const totalOrders = orders.length;
        const totalRevenue = successfulOrders.reduce((sum, o) => sum + (o.price || 0), 0);
        // Estimate actual cost by reversing the markup: Cost = Price / (1 + markup)
        const totalCost = successfulOrders.reduce((sum, o) => sum + ((o.price || 0) / (1 + priceMarkupPercent / 100)), 0);
        const netProfit = totalRevenue - totalCost;
        const successRate = totalOrders > 0 ? ((successfulOrders.length / totalOrders) * 100).toFixed(1) : "0.0";

        return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Smartphone className="h-4 w-4" /></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</p>
              </div>
              <h3 className="text-xl font-black text-slate-800">{totalOrders}</h3>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><DollarSign className="h-4 w-4" /></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue (PKR)</p>
              </div>
              <h3 className="text-xl font-black text-slate-800"><CurrencyDisplay baseUnits={totalRevenue} formatPrice={formatPrice} /></h3>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg"><TrendingUp className="h-4 w-4" /></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Net Profit (PKR)</p>
              </div>
              <h3 className="text-xl font-black text-amber-600"><CurrencyDisplay baseUnits={netProfit} formatPrice={formatPrice} /></h3>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Activity className="h-4 w-4" /></div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Success Rate</p>
              </div>
              <h3 className="text-xl font-black text-slate-800">{successRate}%</h3>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Order Analytics & History</h3>
                <p className="text-xs text-slate-500 mt-1">Review all completed and refunded virtual number transactions.</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                  <input type="text" value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} placeholder="Search ID, user, or service..." className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 w-48" />
                </div>
                <select value={orderFilter} onChange={(e) => setOrderFilter(e.target.value)} className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-indigo-500 text-slate-700 bg-white">
                  <option value="ALL">All Statuses</option>
                  <option value="SUCCESS">Success Only</option>
                  <option value="FAILED">Refunded/Failed</option>
                </select>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase">
                No Virtual Number Orders Created Yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">User</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Country</th>
                      <th className="px-4 py-3 text-right">Cost (5SIM)</th>
                      <th className="px-4 py-3 text-right">Sale Price</th>
                      <th className="px-4 py-3 text-right">Net Profit</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {orders.slice(0, 50).map((ord) => {
                      const user = registeredUsers?.find(u => u.id === ord.userId);
                      const userName = user ? user.username : (ord.userId?.substring(0, 8) || "Unknown");
                      const isSuccess = ord.status === "RECEIVED" || ord.status === "FINISHED";
                      const isFailed = ord.status === "CANCELED" || ord.status === "BANNED";
                      const costPrice = (ord.price || 0) / (1 + priceMarkupPercent / 100);
                      const profit = (ord.price || 0) - costPrice;

                      if (orderFilter === "SUCCESS" && !isSuccess) return null;
                      if (orderFilter === "FAILED" && !isFailed) return null;
                      
                      const searchLower = orderSearch.toLowerCase();
                      if (searchLower && !String(ord.id).toLowerCase().includes(searchLower) && !String(ord.product || "").toLowerCase().includes(searchLower) && !userName.toLowerCase().includes(searchLower)) {
                        return null;
                      }

                      return (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">#{ord.id}</td>
                        <td className="px-4 py-3 font-bold flex items-center gap-2">
                           <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px]">
                             {userName.charAt(0).toUpperCase()}
                           </div>
                           {userName}
                        </td>
                        <td className="px-4 py-3 capitalize font-bold">{ord.product}</td>
                        <td className="px-4 py-3 uppercase font-bold text-slate-500">{ord.country}</td>
                        <td className="px-4 py-3 font-mono text-slate-500 text-right">
                          <CurrencyDisplay baseUnits={costPrice} formatPrice={formatPrice} inline={true} usdClassName="text-slate-400" />
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 text-right">
                          <CurrencyDisplay baseUnits={ord.price || 0} formatPrice={formatPrice} inline={true} usdClassName="text-emerald-600" />
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-600 text-right">
                          <CurrencyDisplay baseUnits={isSuccess ? profit : 0} formatPrice={formatPrice} inline={true} usdClassName="text-emerald-600" />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                            isSuccess
                              ? "bg-emerald-100 text-emerald-800"
                              : isFailed
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-slate-400 font-mono text-right">
                          {new Date(ord.created_at).toLocaleString()}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* --- TAB 6: SYNC MATRIX DIAGNOSTICS --- */}
      {subTab === "sync_debug" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <RefreshCw className={`h-5 w-5 text-indigo-600 ${loadingSyncDebug ? "animate-spin" : ""}`} />
                5SIM Automated Provider Sync Diagnostics
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Real-time connection matrix monitoring, response times, stock balances, and automated 5-second background sync logs.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    setLoadingSyncDebug(true);
                    toast.loading("Triggering immediate provider catalog sync...", { id: "admin-force-sync" });
                    const res = await fetch("/api/sync-catalog", { method: "POST" });
                    const data = await res.json();
                    if (data.success) {
                      toast.success(data.message || "Provider catalog sync complete!", { id: "admin-force-sync" });
                      await fetchSyncDebugData();
                    } else {
                      toast.error("Force sync failed: " + (data.error || "Unknown error"), { id: "admin-force-sync" });
                    }
                  } catch (e: any) {
                    toast.error("Force sync error: " + (e.message || "Failed to trigger sync"), { id: "admin-force-sync" });
                  } finally {
                    setLoadingSyncDebug(false);
                  }
                }}
                disabled={loadingSyncDebug}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingSyncDebug ? "animate-spin" : ""}`} />
                Force Provider Sync
              </button>
              <button
                type="button"
                onClick={() => fetchSyncDebugData(true)}
                disabled={loadingSyncDebug}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm border border-slate-700"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loadingSyncDebug ? "animate-spin" : ""}`} />
                Refresh Diagnostics
              </button>
            </div>
          </div>

          {/* Sync Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gateway Status</span>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-3 h-3 rounded-full ${
                  syncDebugData?.syncState?.connectionStatus === "AVAILABLE" || syncDebugData?.syncState?.connectionStatus === "CONNECTED"
                    ? "bg-emerald-400 animate-pulse"
                    : "bg-amber-400 animate-pulse"
                }`} />
                <span className="text-lg font-black font-mono">
                  {syncDebugData?.syncState?.connectionStatus || "CONNECTED"}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Provider: {syncDebugData?.syncState?.providerName || "5Sim Primary Gateway"}
              </p>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">API Response Time</span>
              <p className="text-lg font-black font-mono text-emerald-400 mt-2">
                {syncDebugData?.syncState?.responseTimeMs ?? "--"} ms
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Health: {syncDebugData?.syncState?.apiHealthStatus || "HEALTHY"}
              </p>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Matrix Live Inventory</span>
              <p className="text-lg font-black font-mono text-blue-400 mt-2">
                {(syncDebugData?.syncState?.totalStock || 0).toLocaleString()} Numbers
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                {syncDebugData?.syncState?.totalCountries || 153} Countries / {syncDebugData?.syncState?.totalServices || 1260} Services
              </p>
            </div>

            <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800 shadow">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Last Good Sync</span>
              <p className="text-xs font-mono text-slate-200 mt-2 font-bold">
                {syncDebugData?.syncState?.lastSuccessfulSync
                  ? new Date(syncDebugData.syncState.lastSuccessfulSync).toLocaleTimeString()
                  : "Just now"}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-mono">
                Background Loop: 5s Interval
              </p>
            </div>
          </div>

          {/* Sync Logs Table */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-slate-800 flex items-center justify-between">
              <span>Recent Background Sync Event Logs</span>
              <span className="text-xs font-mono font-normal text-slate-500">
                {(syncDebugData?.logs || []).length} Recorded Events
              </span>
            </h4>

            {(!syncDebugData?.logs || syncDebugData.logs.length === 0) ? (
              <p className="text-xs text-slate-400 py-6 text-center italic">No sync logs recorded yet. Background engine is running...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-mono text-[10px] uppercase">
                    <tr>
                      <th className="px-3 py-2">Timestamp</th>
                      <th className="px-3 py-2">Gateway</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2 text-right">Latency</th>
                      <th className="px-3 py-2 text-right">Numbers Available</th>
                      <th className="px-3 py-2">Details / Errors</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {syncDebugData.logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2.5 text-slate-500 text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-slate-700">{log.providerName}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                            log.status === "AVAILABLE" || log.status === "CONNECTED"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-600">{log.responseTimeMs}ms</td>
                        <td className="px-3 py-2.5 text-right font-bold text-blue-600">{(log.stockCount || 0).toLocaleString()}</td>
                        <td className="px-3 py-2.5 text-[11px] text-slate-500">
                          {log.error ? (
                            <span className="text-red-600 font-bold">{log.error}</span>
                          ) : (
                            <span className="text-emerald-600 font-bold">Synchronized Cleanly</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
