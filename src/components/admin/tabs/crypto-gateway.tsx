import React, { useState, useEffect } from "react";
import { 
  Bitcoin, ShieldCheck, RefreshCw, Search, Filter, CheckCircle2, XCircle, 
  Clock, AlertTriangle, ExternalLink, Copy, Check, ChevronRight, DollarSign,
  TrendingUp, Activity, Server, Database, Mail, Cpu, Eye, EyeOff, FileText, Download,
  Settings, Zap, Layers, AlertCircle, RotateCcw, Lock, Send, BarChart2, CheckSquare, Globe
} from "lucide-react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "motion/react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function CryptoGatewayAdminTab() {
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "transactions" | "currencies" | "webhooks" | "health" | "reconciliation" | "settings" | "reports" | "audit">("dashboard");

  // Dashboard Stats State
  const [timeframe, setTimeframe] = useState<"today" | "7d" | "30d" | "custom">("7d");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  // Transactions State
  const [depositsLoading, setDepositsLoading] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [depositSearch, setDepositSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currencyFilter, setCurrencyFilter] = useState("ALL");
  const [networkFilter, setNetworkFilter] = useState("ALL");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  // Selected Deposit Drawer State
  const [selectedDepositId, setSelectedDepositId] = useState<string | null>(null);
  const [depositDetailLoading, setDepositDetailLoading] = useState(false);
  const [depositDetail, setDepositDetail] = useState<any>(null);
  const [copiedText, setCopiedText] = useState("");

  // Health State
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);

  // Reconciliation State
  const [reconciliationLoading, setReconciliationLoading] = useState(false);
  const [reconciliationData, setReconciliationData] = useState<any>(null);

  // Settings State
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsData, setSettingsData] = useState<any>({
    enabled: true,
    maintenanceMode: false,
    defaultBaseCurrency: "USD",
    minDepositUSD: 5,
    maxDepositUSD: 10000,
    paymentExpirationMinutes: 30,
    autoCredit: true,
    partialPaymentHandling: "flag_for_review",
    notifyUserEmail: true,
    notifyAdminEmail: true,
    maskedApiKey: "••••••••••••••••",
    maskedIpnSecret: "••••••••••••••••",
    ipnCallbackUrl: "/api/payments/crypto/ipn",
    isSandbox: false
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Reports State
  const [reportTimeframe, setReportTimeframe] = useState("7d");
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Load Dashboard Stats
  const fetchDashboardStats = async () => {
    setStatsLoading(true);
    try {
      let url = `/api/admin/crypto/stats?timeframe=${timeframe}`;
      if (timeframe === "custom") {
        if (customStartDate) url += `&startDate=${customStartDate}`;
        if (customEndDate) url += `&endDate=${customEndDate}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStatsData(data.stats);
        setChartData(data.chartData || []);
      } else {
        toast.error(data.error || "Failed to load dashboard stats");
      }
    } catch (err) {
      console.error("Fetch stats error:", err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Load Filtered Transactions List
  const fetchDepositsList = async () => {
    setDepositsLoading(true);
    try {
      const params = new URLSearchParams();
      if (depositSearch) params.set("search", depositSearch);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (currencyFilter !== "ALL") params.set("currency", currencyFilter);
      if (networkFilter !== "ALL") params.set("network", networkFilter);
      if (dateStart) params.set("startDate", dateStart);
      if (dateEnd) params.set("endDate", dateEnd);
      if (minAmount) params.set("minAmountUSD", minAmount);
      if (maxAmount) params.set("maxAmountUSD", maxAmount);

      const res = await fetch(`/api/admin/crypto/deposits?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDeposits(data.deposits || []);
      }
    } catch (err) {
      console.error("Fetch deposits list error:", err);
    } finally {
      setDepositsLoading(false);
    }
  };

  // Load Deposit Detail
  const fetchDepositDetail = async (id: string) => {
    setDepositDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/crypto/deposit/${id}`);
      const data = await res.json();
      if (data.success) {
        setDepositDetail(data);
      } else {
        toast.error(data.error || "Failed to load deposit details");
      }
    } catch (err) {
      console.error("Fetch detail error:", err);
    } finally {
      setDepositDetailLoading(false);
    }
  };

  // Load Health Status
  const fetchHealthStatus = async () => {
    setHealthLoading(true);
    try {
      const res = await fetch("/api/admin/crypto/health");
      const data = await res.json();
      if (data.success) {
        setHealthData(data.health);
      }
    } catch (err) {
      console.error("Fetch health error:", err);
    } finally {
      setHealthLoading(false);
    }
  };

  // Load Reconciliation
  const fetchReconciliation = async () => {
    setReconciliationLoading(true);
    try {
      const res = await fetch("/api/admin/crypto/reconciliation", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setReconciliationData(data);
        toast.success(`Audit complete: ${data.totalAudited} deposits scanned.`);
      }
    } catch (err) {
      console.error("Reconciliation error:", err);
    } finally {
      setReconciliationLoading(false);
    }
  };

  
  // Currencies State
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(false);

  const fetchCurrencies = async () => {
    setCurrenciesLoading(true);
    try {
      const res = await fetch("/api/crypto/currencies");
      const data = await res.json();
      if (data.success) {
        setCurrencies(data.currencies || []);
      }
    } catch (err) {
      console.error("Currencies error:", err);
    } finally {
      setCurrenciesLoading(false);
    }
  };

  const handleUpdateCurrency = async (curr: string, net: string, updates: any) => {
    try {
      const res = await fetch("/api/admin/crypto/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currency: curr, network: net, updates, adminUser: "Admin" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Currency config updated!");
        fetchCurrencies();
      } else {
        toast.error(data.error || "Update failed");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  // Webhooks State
  const [webhookEvents, setWebhookEvents] = useState<any[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(false);

  const fetchWebhooks = async () => {
    setWebhooksLoading(true);
    try {
      const res = await fetch("/api/admin/crypto/webhooks");
      const data = await res.json();
      if (data.success) {
        setWebhookEvents(data.events || []);
      }
    } catch (err) {
      console.error("Webhooks error:", err);
    } finally {
      setWebhooksLoading(false);
    }
  };

  // Extended Settings State
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [ipnSecretInput, setIpnSecretInput] = useState("");
  const [showIpnSecret, setShowIpnSecret] = useState(false);

  const [isTestingApi, setIsTestingApi] = useState(false);
  const [isTestingIpn, setIsTestingIpn] = useState(false);
  const [isSyncingCurrencies, setIsSyncingCurrencies] = useState(false);
  const [isClearingCredentials, setIsClearingCredentials] = useState(false);

  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);

  // Load Settings
  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch("/api/admin/crypto/settings");
      const data = await res.json();
      if (data.success) {
        setSettingsData(data.settings);
        setApiKeyInput(data.settings.maskedApiKey || "");
        setIpnSecretInput(data.settings.maskedIpnSecret || "");
      }
    } catch (err) {
      console.error("Settings error:", err);
    } finally {
      setSettingsLoading(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async () => {
    setAuditLogsLoading(true);
    try {
      const res = await fetch("/api/admin/crypto/audit-logs");
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error("Audit logs error:", err);
    } finally {
      setAuditLogsLoading(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const payloadSettings = {
        ...settingsData,
        apiKey: apiKeyInput && !apiKeyInput.includes("••••") ? apiKeyInput : undefined,
        ipnSecret: ipnSecretInput && !ipnSecretInput.includes("••••") ? ipnSecretInput : undefined
      };

      const res = await fetch("/api/admin/crypto/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSettings: payloadSettings, adminUser: "Admin" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("NOWPayments Settings saved successfully!");
        fetchSettings();
        fetchAuditLogs();
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (err) {
      toast.error("Network error saving settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Test API Connection
  const handleTestApiConnection = async () => {
    setIsTestingApi(true);
    try {
      const res = await fetch("/api/admin/crypto/test-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUser: "Admin" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`${data.message} (${data.responseTimeMs}ms response time)`);
      } else {
        toast.error(data.message || "Connection test failed");
      }
      fetchSettings();
      fetchAuditLogs();
    } catch (err) {
      toast.error("Network error testing API connection");
    } finally {
      setIsTestingApi(false);
    }
  };

  // Test IPN Webhook
  const handleTestIpnWebhook = async () => {
    setIsTestingIpn(true);
    try {
      const res = await fetch("/api/admin/crypto/test-ipn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUser: "Admin" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message || "IPN Webhook check failed");
      }
      fetchSettings();
      fetchAuditLogs();
    } catch (err) {
      toast.error("Network error testing IPN webhook");
    } finally {
      setIsTestingIpn(false);
    }
  };

  // Sync Supported Currencies
  const handleSyncSupportedCurrencies = async () => {
    setIsSyncingCurrencies(true);
    try {
      const res = await fetch("/api/admin/crypto/sync-currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUser: "Admin" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setSettingsData((prev: any) => ({ ...prev, supportedCurrencies: data.supportedCurrencies }));
      } else {
        toast.error(data.message || "Failed to sync currencies");
      }
      fetchAuditLogs();
    } catch (err) {
      toast.error("Network error syncing currencies");
    } finally {
      setIsSyncingCurrencies(false);
    }
  };

  // Clear Credentials
  const handleClearCredentials = async () => {
    if (!window.confirm("Are you sure you want to wipe NOWPayments API Key & IPN Secret? The gateway status will reset to Not Configured.")) {
      return;
    }
    setIsClearingCredentials(true);
    try {
      const res = await fetch("/api/admin/crypto/clear-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUser: "Admin" })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setApiKeyInput("");
        setIpnSecretInput("");
        fetchSettings();
        fetchAuditLogs();
      } else {
        toast.error(data.message || "Failed to clear credentials");
      }
    } catch (err) {
      toast.error("Network error clearing credentials");
    } finally {
      setIsClearingCredentials(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, [timeframe, customStartDate, customEndDate]);

  useEffect(() => {
    if (activeSubTab === "transactions") fetchDepositsList();
    if (activeSubTab === "health") fetchHealthStatus();
    if (activeSubTab === "reconciliation") fetchReconciliation();
    if (activeSubTab === "currencies") fetchCurrencies();
    if (activeSubTab === "webhooks") fetchWebhooks();
    if (activeSubTab === "audit") fetchAuditLogs();
    if (activeSubTab === "settings") {
      fetchSettings();
      fetchAuditLogs();
    }
  }, [activeSubTab]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    toast.success(`Copied ${label}`);
    setTimeout(() => setCopiedText(""), 2000);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "finished" || s === "confirmed") {
      return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max"><CheckCircle2 className="w-3 h-3" /> Confirmed</span>;
    }
    if (s === "waiting" || s === "confirming" || s === "sending") {
      return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max animate-pulse"><Clock className="w-3 h-3" /> {s}</span>;
    }
    if (s === "partially_paid") {
      return <span className="bg-orange-500/10 text-orange-400 border border-orange-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max"><AlertTriangle className="w-3 h-3" /> Underpaid</span>;
    }
    if (s === "failed" || s === "expired") {
      return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max"><XCircle className="w-3 h-3" /> {s}</span>;
    }
    if (s === "refunded") {
      return <span className="bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 w-max"><RotateCcw className="w-3 h-3" /> Refunded</span>;
    }
    return <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase w-max">{s}</span>;
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!deposits || deposits.length === 0) {
      toast.error("No deposit records available to export");
      return;
    }
    const headers = ["Deposit ID", "User", "Email", "Payment ID", "Asset", "Network", "Requested USD", "Requested PKR", "Actually Paid", "Status", "Tx Hash", "Created At"];
    const rows = deposits.map(d => [
      d.id,
      d.username,
      d.userEmail,
      d.nowpaymentsPaymentId || "",
      d.cryptoCurrency,
      d.network,
      d.requestedAmountUSD,
      d.requestedAmountPKR,
      d.actuallyPaid,
      d.status,
      d.txHash || "",
      d.createdAt
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ZeroX_Crypto_Deposits_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Report downloaded successfully!");
  };

  return (
    <div className="space-y-6 text-slate-100 font-sans pb-12">
      {/* Top Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl text-amber-400 shrink-0">
              <Bitcoin className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-white tracking-tight">Crypto Gateway — Powered by NOWPayments</h2>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest">
                    ZER0X NETWORK
                  </span>
                  <div className="h-3 w-px bg-slate-700"></div>
                  <span className="text-xs font-medium text-slate-400">
                    Real-time multi-network blockchain payment processing & automated balance crediting.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                fetchDashboardStats();
                if (activeSubTab === "transactions") fetchDepositsList();
                if (activeSubTab === "health") fetchHealthStatus();
                if (activeSubTab === "reconciliation") fetchReconciliation();
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${statsLoading ? "animate-spin text-amber-400" : ""}`} />
              <span>Refresh Gateway</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 border-t border-slate-800 pt-4 scrollbar-none">
          {[
            { id: "dashboard", label: "Dashboard", icon: BarChart2 },
            { id: "transactions", label: "Transactions", icon: Layers },
            { id: "currencies", label: "Currencies", icon: Bitcoin },
            { id: "webhooks", label: "IPN/Webhooks", icon: Globe },
            { id: "health", label: "Health", icon: Activity },
            { id: "reconciliation", label: "Reconciliation", icon: ShieldCheck, badge: reconciliationData?.issueCount ? reconciliationData.issueCount : undefined },
            { id: "reports", label: "Reports", icon: FileText },
            { id: "audit", label: "Audit Logs", icon: FileText },
            { id: "settings", label: "Settings", icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 font-black"
                    : "bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-slate-950 font-black" : "text-slate-400"}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-TAB 1: DASHBOARD & VOLUME CHARTS */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6">
          {/* Timeframe Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <span className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">Analytics Range:</span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: "today", label: "Today" },
                { id: "7d", label: "Last 7 Days" },
                { id: "30d", label: "Last 30 Days" },
                { id: "custom", label: "Custom Range" }
              ].map(tf => (
                <button
                  key={tf.id}
                  onClick={() => setTimeframe(tf.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    timeframe === tf.id ? "bg-amber-500 text-slate-950 font-black" : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {tf.label}
                </button>
              ))}

              {timeframe === "custom" && (
                <div className="flex items-center gap-2 ml-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                  />
                  <span className="text-slate-500 text-xs">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                    className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 12 Dashboard Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[
              { title: "Total Crypto Deposits", val: statsData?.totalDeposits ?? 0, sub: "Lifetime requests", icon: Layers, color: "text-blue-400" },
              { title: "Today Deposits", val: statsData?.todayCount ?? 0, sub: `$${Number(statsData?.todayVolumeUSD || 0).toFixed(2)} USD`, icon: Clock, color: "text-amber-400" },
              { title: "This Week", val: statsData?.weekCount ?? 0, sub: `$${Number(statsData?.weekVolumeUSD || 0).toFixed(2)} USD`, icon: TrendingUp, color: "text-emerald-400" },
              { title: "This Month", val: statsData?.monthCount ?? 0, sub: `$${Number(statsData?.monthVolumeUSD || 0).toFixed(2)} USD`, icon: BarChart2, color: "text-purple-400" },
              { title: "Completed Deposits", val: statsData?.completedCount ?? 0, sub: "Successfully confirmed", icon: CheckCircle2, color: "text-emerald-400" },
              { title: "Pending / Waiting", val: statsData?.pendingCount ?? 0, sub: "Awaiting blockchain", icon: Clock, color: "text-amber-400" },
              { title: "Failed / Expired", val: statsData?.failedCount ?? 0, sub: "Expired window / failed", icon: XCircle, color: "text-rose-400" },
              { title: "Partial Payments", val: statsData?.partialCount ?? 0, sub: "Underpaid - held review", icon: AlertTriangle, color: "text-orange-400" },
              { title: "Refunds Issued", val: statsData?.refundCount ?? 0, sub: "Returned to sender", icon: RotateCcw, color: "text-indigo-400" },
              { title: "Total Crypto Volume", val: `$${Number(statsData?.totalVolumeUSD || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`, sub: "USD processed", icon: DollarSign, color: "text-amber-400" },
              { title: "Total Credited Users", val: `Rs ${Number(statsData?.totalCreditedPKR || 0).toLocaleString()}`, sub: "PKR ledger credited", icon: ShieldCheck, color: "text-emerald-400" },
              { title: "Provider / API Errors", val: statsData?.providerErrorsCount ?? 0, sub: "Network / IPN security logs", icon: AlertCircle, color: "text-rose-400" }
            ].map((card, idx) => {
              const CardIcon = card.icon;
              return (
                <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider truncate">{card.title}</span>
                    <CardIcon className={`w-4 h-4 ${card.color} shrink-0`} />
                  </div>
                  <div className="mt-3">
                    <div className="text-2xl font-black text-white tracking-tight">{card.val}</div>
                    <div className="text-[10px] font-semibold text-slate-500 mt-0.5 truncate">{card.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Volume Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-extrabold text-white">Daily Deposit Volume ($ USD)</h3>
                <p className="text-xs text-slate-400">Confirmed automated crypto deposit volume over selected time range</p>
              </div>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold">
                Live Data
              </span>
            </div>

            <div className="h-72 w-full">
              {chartData && chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cryptoVolumeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#020617", borderColor: "#334155", borderRadius: "12px", color: "#fff", fontSize: "12px" }}
                      formatter={(val: any) => [`$${Number(val).toFixed(2)} USD`, "Volume"]}
                    />
                    <Area type="monotone" dataKey="volumeUSD" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#cryptoVolumeGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-500 font-bold border border-dashed border-slate-800 rounded-2xl">
                  No crypto deposit volume data recorded in selected timeframe.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: TRANSACTIONS TABLE */}
      {activeSubTab === "transactions" && (
        <div className="space-y-6">
          {/* Granular Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by Deposit ID, User Email, Payment ID, Address, Tx Hash..."
                  value={depositSearch}
                  onChange={e => setDepositSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <button
                onClick={fetchDepositsList}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Filter className="w-4 h-4" />
                <span>Apply Filters</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Export CSV</span>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 border-t border-slate-800/80">
              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="waiting">Waiting</option>
                  <option value="confirming">Confirming</option>
                  <option value="finished">Finished (Confirmed)</option>
                  <option value="partially_paid">Partially Paid</option>
                  <option value="failed">Failed</option>
                  <option value="expired">Expired</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Currency</label>
                <select
                  value={currencyFilter}
                  onChange={e => setCurrencyFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  <option value="ALL">All Currencies</option>
                  <option value="USDT">USDT</option>
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="BNB">BNB</option>
                  <option value="SOL">Solana (SOL)</option>
                  <option value="TRX">TRON (TRX)</option>
                  <option value="LTC">Litecoin (LTC)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Network</label>
                <select
                  value={networkFilter}
                  onChange={e => setNetworkFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none"
                >
                  <option value="ALL">All Networks</option>
                  <option value="TRC20">TRC20 (TRON)</option>
                  <option value="BEP20">BEP20 (BNB Smart Chain)</option>
                  <option value="ERC20">ERC20 (Ethereum)</option>
                  <option value="Solana">Solana Network</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">From Date</label>
                <input
                  type="date"
                  value={dateStart}
                  onChange={e => setDateStart(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">To Date</label>
                <input
                  type="date"
                  value={dateEnd}
                  onChange={e => setDateEnd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Min $ USD</label>
                <input
                  type="number"
                  placeholder="Min USD"
                  value={minAmount}
                  onChange={e => setMinAmount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Transactions Data Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-4">Deposit ID</th>
                    <th className="py-4 px-4">User Details</th>
                    <th className="py-4 px-4">Payment ID</th>
                    <th className="py-4 px-4">Asset & Network</th>
                    <th className="py-4 px-4">Req. USD / PKR</th>
                    <th className="py-4 px-4">Paid Crypto</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Tx Hash</th>
                    <th className="py-4 px-4">Created At</th>
                    <th className="py-4 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {depositsLoading ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 font-bold">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
                        Loading crypto deposit records...
                      </td>
                    </tr>
                  ) : deposits.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 font-bold">
                        No crypto deposits match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    deposits.map(dep => (
                      <tr key={dep.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                          #{dep.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{dep.username}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">{dep.userEmail}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                          {dep.nowpaymentsPaymentId || "N/A"}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-white flex items-center gap-1">
                            {dep.cryptoCurrency}
                          </div>
                          <div className="text-[10px] text-slate-400 font-semibold">{dep.network}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-emerald-400">${dep.requestedAmountUSD} USD</div>
                          <div className="text-[10px] text-slate-400 font-semibold">Rs {Number(dep.requestedAmountPKR).toLocaleString()} PKR</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                          {dep.payAmount} {dep.cryptoCurrency}
                          {dep.actuallyPaid > 0 && (
                            <div className="text-[9px] text-slate-400 font-normal">Paid: {dep.actuallyPaid}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(dep.status)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[10px] text-slate-400">
                          {dep.txHash ? (
                            <button
                              onClick={() => handleCopy(dep.txHash, "Tx Hash")}
                              className="hover:text-amber-400 flex items-center gap-1 cursor-pointer truncate max-w-[100px]"
                              title={dep.txHash}
                            >
                              <span className="truncate">{dep.txHash}</span>
                              <Copy className="w-3 h-3 shrink-0" />
                            </button>
                          ) : (
                            <span className="text-slate-600">Pending</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-[11px] text-slate-400">
                          {new Date(dep.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedDepositId(dep.id);
                              fetchDepositDetail(dep.id);
                            }}
                            className="bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: HEALTH MONITOR */}
      {activeSubTab === "health" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-xl">
            <div>
              <h3 className="text-base font-extrabold text-white">System Infrastructure & Provider Health</h3>
              <p className="text-xs text-slate-400">Real-time status monitor for NOWPayments API, IPN Webhook, Database & Balance Ledger</p>
            </div>
            <button
              onClick={fetchHealthStatus}
              className="bg-amber-500 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${healthLoading ? "animate-spin" : ""}`} />
              <span>Ping Services</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: "NOWPayments API Status",
                status: healthData?.nowpaymentsApi?.status || "Healthy",
                sub: `Response Time: ${healthData?.nowpaymentsApi?.responseTimeMs || 0}ms`,
                desc: healthData?.nowpaymentsApi?.message || "Connected to api.nowpayments.io",
                icon: Server
              },
              {
                title: "IPN Webhook Listener",
                status: healthData?.ipnWebhook?.status || "Healthy",
                sub: healthData?.ipnWebhook?.secretConfigured ? "HMAC Secret Configured" : "Warning: Secret Missing",
                desc: "Endpoint: /api/payments/crypto/ipn",
                icon: Activity
              },
              {
                title: "Firestore Database",
                status: healthData?.database?.status || "Healthy",
                sub: `Latency: ${healthData?.database?.responseTimeMs || 0}ms`,
                desc: "Deposits & Security logs collection online",
                icon: Database
              },
              {
                title: "Balance Ledger Engine",
                status: "Healthy",
                sub: "Transaction Locks Active",
                desc: "Atomic Firestore transactions & ledger sync enabled",
                icon: ShieldCheck
              },
              {
                title: "Email Alert Service",
                status: "Healthy",
                sub: "Nodemailer Infrastructure",
                desc: "Admin & User deposit email dispatches online",
                icon: Mail
              },
              {
                title: "Overall Gateway Health",
                status: healthData?.gatewayStatus || "Healthy",
                sub: `Checked At: ${new Date(healthData?.lastCheckAt || Date.now()).toLocaleTimeString()}`,
                desc: "Ready for user crypto deposit creations",
                icon: Cpu
              }
            ].map((srv, idx) => {
              const SrvIcon = srv.icon;
              const isOk = srv.status === "Healthy";
              return (
                <div key={idx} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SrvIcon className="w-5 h-5 text-amber-400" />
                      <span className="font-extrabold text-sm text-white">{srv.title}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      isOk ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                    }`}>
                      {srv.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="text-xs font-bold text-slate-300">{srv.sub}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{srv.desc}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: RECONCILIATION */}
      {activeSubTab === "reconciliation" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div>
              <h3 className="text-base font-extrabold text-white">Automated Ledgers & NOWPayments Reconciliation</h3>
              <p className="text-xs text-slate-400">Compares blockchain payments vs internal ZeroX deposit records vs balance transactions ledger.</p>
            </div>
            <button
              onClick={fetchReconciliation}
              disabled={reconciliationLoading}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${reconciliationLoading ? "animate-spin" : ""}`} />
              <span>Run Audit Scan</span>
            </button>
          </div>

          {reconciliationData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase">Total Audited Deposits</div>
                  <div className="text-2xl font-black text-white mt-1">{reconciliationData.totalAudited}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase">Action Required Queue</div>
                  <div className="text-2xl font-black text-rose-400 mt-1">{reconciliationData.issueCount}</div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
                  <div className="text-[10px] font-extrabold text-slate-400 uppercase">Last Scan Timestamp</div>
                  <div className="text-xs font-bold text-slate-300 mt-2">{new Date(reconciliationData.reconciliationDate).toLocaleString()}</div>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
                <h4 className="text-sm font-extrabold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Needs Review Queue
                </h4>

                {reconciliationData.needsReviewQueue && reconciliationData.needsReviewQueue.length > 0 ? (
                  <div className="space-y-3">
                    {reconciliationData.needsReviewQueue.map((item: any) => (
                      <div key={item.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-amber-400 font-bold text-xs">#{item.depositId}</span>
                            <span className="text-xs text-slate-300 font-bold">{item.userEmail}</span>
                            <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-md text-[9px] font-black uppercase">
                              {item.issueType}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{item.description}</p>
                        </div>

                        <button
                          onClick={() => {
                            setSelectedDepositId(item.depositId);
                            fetchDepositDetail(item.depositId);
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
                        >
                          Review Deposit
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-emerald-400 font-bold text-xs bg-slate-950/50 border border-dashed border-emerald-500/30 rounded-2xl">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    All crypto deposits and balance ledger entries match perfectly! Zero discrepancies detected.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 5: GATEWAY SETTINGS & NOWPAYMENTS INTEGRATION */}
      {activeSubTab === "settings" && (
        <div className="space-y-6">
          {/* HEADER & QUICK ACTION TOOLBAR */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Admin → Payments → Crypto Gateway</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">NOWPayments Integration</span>
                </div>
                <h3 className="text-lg font-black text-white mt-1 flex items-center gap-2">
                  <span>NOWPayments Gateway Settings</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Manage API keys, IPN webhook secrets, deposit thresholds, currency toggles & security audit logs.
                </p>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-slate-950 border border-slate-800 text-slate-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-amber-400" />
                  Provider: <strong className="text-white">NOWPayments</strong>
                </span>

                <span className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                  settingsData.apiConnectionStatus === "Connected" 
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : (settingsData.apiConnectionStatus === "Authentication Failed"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                      : (settingsData.apiConnectionStatus === "Provider Unavailable"
                        ? "bg-orange-500/10 text-orange-400 border-orange-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"))
                }`}>
                  {settingsData.apiConnectionStatus === "Connected" && "🟢"}
                  {settingsData.apiConnectionStatus === "Authentication Failed" && "🔴"}
                  {settingsData.apiConnectionStatus === "Provider Unavailable" && "🟠"}
                  {(settingsData.apiConnectionStatus === "Not Configured" || !settingsData.apiConnectionStatus) && "⚠️"}
                  {settingsData.apiConnectionStatus === "Connected" ? "Connected" : 
                   (settingsData.apiConnectionStatus === "Authentication Failed" ? "Authentication Failed" :
                   (settingsData.apiConnectionStatus === "Provider Unavailable" ? "Provider Unavailable" : "Configuration Required"))}
                </span>

                <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                  settingsData.environment === "sandbox"
                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    : "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                }`}>
                  {settingsData.environment === "sandbox" ? "Test/Sandbox Mode" : "Production Environment"}
                </span>

                <span className={`px-3 py-1 rounded-xl text-xs font-bold border uppercase ${
                  settingsData.gatewayStatus === "enabled"
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : (settingsData.gatewayStatus === "maintenance"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                      : "bg-slate-800 text-slate-400 border-slate-700")
                }`}>
                  Status: {settingsData.gatewayStatus || "enabled"}
                </span>
              </div>
            </div>

            {/* ACTION BUTTONS TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleTestApiConnection}
                  disabled={isTestingApi}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-400 ${isTestingApi ? "animate-spin" : ""}`} />
                  <span>{isTestingApi ? "Testing..." : "Test API Connection"}</span>
                </button>

                <button
                  onClick={handleTestIpnWebhook}
                  disabled={isTestingIpn}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <ShieldCheck className={`w-3.5 h-3.5 text-emerald-400 ${isTestingIpn ? "animate-spin" : ""}`} />
                  <span>{isTestingIpn ? "Verifying..." : "Test IPN/Webhook"}</span>
                </button>

                <button
                  onClick={handleSyncSupportedCurrencies}
                  disabled={isSyncingCurrencies}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingCurrencies ? "animate-spin" : ""}`} />
                  <span>{isSyncingCurrencies ? "Syncing..." : "Sync Supported Currencies"}</span>
                </button>

                <button
                  onClick={handleClearCredentials}
                  disabled={isClearingCredentials}
                  className="bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 font-bold px-3.5 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isClearingCredentials ? "animate-spin" : ""}`} />
                  <span>Clear Credentials</span>
                </button>
              </div>

              <button
                onClick={handleSaveSettings}
                disabled={isSavingSettings}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 shrink-0 ml-auto"
              >
                <Check className={`w-4 h-4 ${isSavingSettings ? "animate-spin" : ""}`} />
                <span>{isSavingSettings ? "Saving Settings..." : "Save NOWPayments Settings"}</span>
              </button>
            </div>
          </div>

          {/* GRID 1: CORE CREDENTIALS & ENVIRONMENT SETTINGS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Credentials Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Lock className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-extrabold text-white">Server API Credentials & Webhook Secret</h4>
              </div>

              <div className="space-y-4">
                {/* Provider */}
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">Payment Provider</label>
                  <input
                    type="text"
                    disabled
                    value="NOWPayments (Configured Crypto Payment Gateway)"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-amber-400 font-extrabold cursor-not-allowed"
                  />
                </div>

                {/* API Key Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-extrabold text-slate-300">NOWPayments API Key</label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {settingsData.hasApiKey ? "Status: Stored on Server" : "Status: Not Configured"}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      placeholder="Enter NOWPayments API Key..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    🔒 Secure secret field. Value is masked after saving and never exposed in browser responses, public API calls, or logs.
                  </p>
                </div>

                {/* IPN Secret Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-extrabold text-slate-300">IPN Webhook Secret Key</label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {settingsData.hasIpnSecret ? "HMAC Verification Enabled" : "Secret Missing"}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showIpnSecret ? "text" : "password"}
                      value={ipnSecretInput}
                      onChange={e => setIpnSecretInput(e.target.value)}
                      placeholder="Enter NOWPayments IPN Secret Key..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowIpnSecret(!showIpnSecret)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showIpnSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    🔐 Used server-side for verifying HMAC-SHA512 signatures on incoming webhook dispatches.
                  </p>
                </div>
              </div>
            </div>

            {/* Gateway Mode & Environment Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Settings className="w-5 h-5 text-amber-400" />
                <h4 className="text-sm font-extrabold text-white">Environment & Gateway Controls</h4>
              </div>

              <div className="space-y-4">
                {/* Gateway Status */}
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">Gateway Operational Status</label>
                  <select
                    value={settingsData.gatewayStatus || "enabled"}
                    onChange={e => setSettingsData({ ...settingsData, gatewayStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="enabled">Enabled (Active for User Deposits)</option>
                    <option value="disabled">Disabled (Hidden from Deposit Options)</option>
                    <option value="maintenance">Maintenance Mode (Displays Maintenance Banner)</option>
                  </select>
                </div>

                {/* Environment Mode */}
                <div>
                  <label className="text-xs font-extrabold text-slate-300 block mb-1">NOWPayments API Environment</label>
                  <select
                    value={settingsData.environment || "production"}
                    onChange={e => setSettingsData({ ...settingsData, environment: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold focus:border-amber-500 focus:outline-none cursor-pointer"
                  >
                    <option value="production">Production Environment (https://api.nowpayments.io/v1/)</option>
                    <option value="sandbox">Test / Sandbox Environment (https://api-sandbox.nowpayments.io/v1/)</option>
                  </select>
                </div>

                {/* Toggles */}
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-extrabold text-white">Automated Wallet Credit</div>
                      <div className="text-[10px] text-slate-400">Instantly credit user PKR balance upon payment verification</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsData.autoCredit}
                      onChange={e => setSettingsData({ ...settingsData, autoCredit: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div>
                      <div className="text-xs font-extrabold text-white">Notify User via Email</div>
                      <div className="text-[10px] text-slate-400">Send confirmation email upon successful crypto deposit</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsData.notifyUserEmail}
                      onChange={e => setSettingsData({ ...settingsData, notifyUserEmail: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <div>
                      <div className="text-xs font-extrabold text-white">Notify Admin via Alert</div>
                      <div className="text-[10px] text-slate-400">Dispatch security alert email on large or failed deposits</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settingsData.notifyAdminEmail}
                      onChange={e => setSettingsData({ ...settingsData, notifyAdminEmail: e.target.checked })}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GRID 2: IPN WEBHOOK URL & HEALTH MONITOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  IPN Webhook Listener & Health Diagnostics
                </h4>
                <p className="text-xs text-slate-400">
                  ZeroX Network automated IPN callback URL and live webhook message statistics.
                </p>
              </div>

              <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                settingsData.webhookHealth?.configured
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}>
                {settingsData.webhookHealth?.configured ? "HMAC Verified Listener Online" : "Missing IPN Secret Key"}
              </span>
            </div>

            {/* Callback URL Box */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <label className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block">
                Generated NOWPayments IPN Callback Endpoint URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={settingsData.ipnCallbackUrl}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-amber-300 font-mono"
                />
                <button
                  onClick={() => handleCopy(settingsData.ipnCallbackUrl, "IPN Callback URL")}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Paste this exact URL inside your NOWPayments Dashboard → Store Settings → IPN Callback URL field.
              </p>
            </div>

            {/* Webhook Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Last Received</div>
                <div className="font-bold text-slate-200 text-xs mt-1 truncate">
                  {settingsData.webhookHealth?.lastReceived ? new Date(settingsData.webhookHealth.lastReceived).toLocaleTimeString() : "None"}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Last Successful</div>
                <div className="font-bold text-emerald-400 text-xs mt-1 truncate">
                  {settingsData.webhookHealth?.lastSuccessful ? new Date(settingsData.webhookHealth.lastSuccessful).toLocaleTimeString() : "None"}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Last Failed</div>
                <div className="font-bold text-rose-400 text-xs mt-1 truncate">
                  {settingsData.webhookHealth?.lastFailed ? new Date(settingsData.webhookHealth.lastFailed).toLocaleTimeString() : "None"}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Failed Webhooks</div>
                <div className="font-black text-rose-400 text-base mt-0.5">
                  {settingsData.webhookHealth?.failedCount || 0}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <div className="text-[10px] font-bold text-slate-500 uppercase">Processing Queue</div>
                <div className="font-black text-amber-400 text-base mt-0.5">
                  {settingsData.webhookHealth?.processingQueue || 0}
                </div>
              </div>
            </div>
          </div>

          {/* GRID 3: SUPPORTED CRYPTOCURRENCIES & NETWORKS */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Bitcoin className="w-5 h-5 text-amber-400" />
                  Supported Cryptocurrencies & Blockchains
                </h4>
                <p className="text-xs text-slate-400">
                  Enable or disable specific assets and deposit networks available to ZeroX users.
                </p>
              </div>

              <button
                onClick={handleSyncSupportedCurrencies}
                disabled={isSyncingCurrencies}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isSyncingCurrencies ? "animate-spin" : ""}`} />
                <span>Sync API Assets</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {settingsData.supportedCurrencies && settingsData.supportedCurrencies.map((curr: any, idx: number) => (
                <div key={idx} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">{curr.currency}</span>
                      <span className="text-xs text-slate-400">({curr.name})</span>
                    </div>

                    <input
                      type="checkbox"
                      checked={curr.enabled}
                      onChange={e => {
                        const updated = [...settingsData.supportedCurrencies];
                        updated[idx].enabled = e.target.checked;
                        setSettingsData({ ...settingsData, supportedCurrencies: updated });
                      }}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Available Networks</div>
                    {curr.networks && curr.networks.map((net: any, nIdx: number) => (
                      <div key={nIdx} className="flex items-center justify-between text-xs py-0.5">
                        <span className="text-slate-300 font-mono text-[11px]">{net.name} ({net.network})</span>
                        <input
                          type="checkbox"
                          checked={net.enabled}
                          onChange={e => {
                            const updated = [...settingsData.supportedCurrencies];
                            updated[idx].networks[nIdx].enabled = e.target.checked;
                            setSettingsData({ ...settingsData, supportedCurrencies: updated });
                          }}
                          className="w-3.5 h-3.5 accent-amber-500 rounded cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* GRID 4: DEPOSIT LIMITS & PAYMENT HANDLING RULES */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-extrabold text-white">Deposit Thresholds & Exception Rules</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-extrabold text-slate-300 block mb-1">Minimum Deposit Amount ($ USD)</label>
                <input
                  type="number"
                  value={settingsData.minDepositUSD}
                  onChange={e => setSettingsData({ ...settingsData, minDepositUSD: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-300 block mb-1">Maximum Deposit Amount ($ USD)</label>
                <input
                  type="number"
                  value={settingsData.maxDepositUSD}
                  onChange={e => setSettingsData({ ...settingsData, maxDepositUSD: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-300 block mb-1">Payment Expiration Window (Minutes)</label>
                <input
                  type="number"
                  value={settingsData.paymentExpirationMinutes}
                  onChange={e => setSettingsData({ ...settingsData, paymentExpirationMinutes: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-300 block mb-1">Partial Payment Rule</label>
                <select
                  value={settingsData.partialPaymentHandling || "flag_for_review"}
                  onChange={e => setSettingsData({ ...settingsData, partialPaymentHandling: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold cursor-pointer"
                >
                  <option value="flag_for_review">Flag for Manual Admin Review</option>
                  <option value="credit_partial">Credit Proportional PKR Amount</option>
                  <option value="auto_refund">Reject & Require Full Payment</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-300 block mb-1">Wrong Network Handling</label>
                <select
                  value={settingsData.wrongNetworkHandling || "flag_for_review"}
                  onChange={e => setSettingsData({ ...settingsData, wrongNetworkHandling: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold cursor-pointer"
                >
                  <option value="flag_for_review">Flag for Admin Investigation</option>
                  <option value="contact_support">Prompt User to Contact Support</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-300 block mb-1">Wrong Asset Handling</label>
                <select
                  value={settingsData.wrongAssetHandling || "flag_for_review"}
                  onChange={e => setSettingsData({ ...settingsData, wrongAssetHandling: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold cursor-pointer"
                >
                  <option value="flag_for_review">Flag for Admin Audit</option>
                  <option value="reject">Auto Reject Transaction</option>
                </select>
              </div>
            </div>
          </div>

          {/* GRID 5: ADMIN AUDIT LOG */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-400" />
                  Admin Configuration Security Audit Trail
                </h4>
                <p className="text-xs text-slate-400">
                  Immutable security audit logs for settings modifications, credential updates & connection tests.
                </p>
              </div>

              <button
                onClick={fetchAuditLogs}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${auditLogsLoading ? "animate-spin" : ""}`} />
                <span>Refresh Logs</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Admin</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Details / Setting Changed</th>
                    <th className="py-2.5 px-3">IP Address</th>
                    <th className="py-2.5 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {auditLogs && auditLogs.length > 0 ? (
                    auditLogs.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-950/40">
                        <td className="py-2.5 px-3 font-extrabold text-amber-400">{log.adminUser || "Admin"}</td>
                        <td className="py-2.5 px-3 text-white font-bold">{log.action}</td>
                        <td className="py-2.5 px-3 text-slate-300">{log.settingChanged || log.details}</td>
                        <td className="py-2.5 px-3 text-slate-500">{log.ip || "127.0.0.1"}</td>
                        <td className="py-2.5 px-3 text-right text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-sans font-bold">
                        No admin configuration changes recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              * Note: Zero API keys, passwords, or secret strings are ever recorded in audit logs.
            </p>
          </div>
        </div>
      )}

      
      {/* SUB-TAB: CURRENCIES */}
      {activeSubTab === "currencies" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">Supported Currencies</h3>
                <p className="text-xs text-slate-400">Manage minimum/maximum deposits and enable/disable specific networks.</p>
              </div>
              <button
                onClick={() => { setIsSyncingCurrencies(true); fetch("/api/admin/crypto/sync-currencies", {method:"POST", body:JSON.stringify({adminUser:"Admin"}), headers:{"Content-Type":"application/json"}}).then(r=>r.json()).then(d=>{if(d.success) {toast.success("Synced"); fetchCurrencies();} else toast.error("Sync failed"); setIsSyncingCurrencies(false);}) }}
                disabled={isSyncingCurrencies}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncingCurrencies ? 'animate-spin' : ''}`} />
                {isSyncingCurrencies ? "Syncing..." : "Sync from NOWPayments"}
              </button>
            </div>
            
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 uppercase text-[10px] text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Currency</th>
                    <th className="py-3 px-4">Network</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Min Deposit</th>
                    <th className="py-3 px-4">Max Deposit</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {currenciesLoading ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : currencies.length === 0 ? (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-500">No currencies synced. Click sync above.</td></tr>
                  ) : (
                    currencies.map((c, i) => (
                      <tr key={c?.id || i} className="hover:bg-slate-950/40">
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-black text-xs">
                            {(c?.token || c?.currency || "C").slice(0, 1)}
                          </span>
                          {c?.label || c?.name || c?.token || "Crypto"} ({String(c?.token || c?.currency || "CRYPTO").toUpperCase()})
                        </td>
                        <td className="py-3 px-4 text-slate-300 font-mono">{c?.network || "Mainnet"}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${c?.enabled !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {c?.enabled !== false ? "ENABLED" : "DISABLED"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-amber-400">{c?.minDepositUSD ? `$${c.minDepositUSD}` : '$20'}</td>
                        <td className="py-3 px-4 text-amber-400">{c?.maxDepositUSD ? `$${c.maxDepositUSD}` : 'Default'}</td>
                        <td className="py-3 px-4">
                          <button onClick={() => handleUpdateCurrency(c?.token || c?.currency, c?.network, { enabled: c?.enabled === false })} className="text-[10px] bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg text-white font-medium cursor-pointer transition">
                            Toggle Status
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: WEBHOOKS */}
      {activeSubTab === "webhooks" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-white">IPN / Webhook Management</h3>
                <p className="text-xs text-slate-400">Monitor incoming webhooks from NOWPayments.</p>
              </div>
              <button
                onClick={handleTestIpnWebhook}
                disabled={isTestingIpn}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2"
              >
                <Activity className={`w-4 h-4 ${isTestingIpn ? 'animate-pulse' : ''}`} />
                {isTestingIpn ? "Testing..." : "Test Webhook"}
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Status</div>
                <div className="text-lg font-black text-emerald-400">{settingsData?.webhookHealth?.configured ? "Healthy" : "Degraded"}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Last Received</div>
                <div className="text-sm font-bold text-white">{settingsData?.webhookHealth?.lastReceived ? new Date(settingsData.webhookHealth.lastReceived).toLocaleString() : "Never"}</div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Failed Count</div>
                <div className="text-lg font-black text-rose-400">{settingsData?.webhookHealth?.failedCount || 0}</div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 uppercase text-[10px] text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Event Type</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {webhooksLoading ? (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : webhookEvents.length === 0 ? (
                    <tr><td colSpan={4} className="py-8 text-center text-slate-500">No webhooks recorded.</td></tr>
                  ) : (
                    webhookEvents.map((w, i) => (
                      <tr key={i} className="hover:bg-slate-950/40">
                        <td className="py-3 px-4 text-slate-400">{new Date(w.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4 text-amber-400 font-bold">{w.eventType}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-bold ${w.eventType === 'invalid_signature' || w.eventType === 'webhook_failure' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                            {w.eventType === 'invalid_signature' || w.eventType === 'webhook_failure' ? "FAILED" : "VERIFIED"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300 break-all">{w.details || w.settingChanged}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: AUDIT LOGS */}
      {activeSubTab === "audit" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-white">Security & Audit Logs</h3>
              <p className="text-xs text-slate-400">Immutable security audit logs for settings modifications.</p>
            </div>
            <div className="overflow-x-auto border border-slate-800 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 uppercase text-[10px] text-slate-500">
                  <tr>
                    <th className="py-3 px-4">Admin</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {auditLogsLoading ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">Loading...</td></tr>
                  ) : auditLogs.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">No logs found.</td></tr>
                  ) : (
                    auditLogs.map((log: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-950/40">
                        <td className="py-3 px-4 text-amber-400 font-extrabold">{log.adminUser || "Admin"}</td>
                        <td className="py-3 px-4 text-white font-bold">{log.action}</td>
                        <td className="py-3 px-4 text-slate-300">{log.settingChanged || log.details}</td>
                        <td className="py-3 px-4 text-slate-500">{log.ip || "127.0.0.1"}</td>
                        <td className="py-3 px-4 text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 6: REPORTS & EXPORTS */}
      {activeSubTab === "reports" && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-white">Generate Executive Crypto Deposit Reports</h3>
              <p className="text-xs text-slate-400">Export transaction breakdowns, net credited balances, fees & status metrics</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <button
                onClick={handleExportCSV}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Download Full CSV Report</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT DETAIL DRAWER / MODAL */}
      <AnimatePresence>
        {selectedDepositId && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/80 backdrop-blur-sm p-4">
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl h-full overflow-y-auto p-6 shadow-2xl relative space-y-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <Bitcoin className="w-6 h-6 text-amber-400" />
                  <h3 className="text-base font-extrabold text-white">Deposit #{selectedDepositId}</h3>
                </div>
                <button
                  onClick={() => {
                    setSelectedDepositId(null);
                    setDepositDetail(null);
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white p-2 rounded-xl transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {depositDetailLoading ? (
                <div className="py-20 text-center text-slate-500 font-bold">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-amber-400" />
                  Loading deposit audit history...
                </div>
              ) : depositDetail?.deposit ? (
                <div className="space-y-6">
                  {/* Overview */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                    <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Payment Overview</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-500">User:</span> <strong className="text-white">{depositDetail.deposit.username}</strong></div>
                      <div><span className="text-slate-500">Email:</span> <strong className="text-slate-300">{depositDetail.deposit.userEmail}</strong></div>
                      <div><span className="text-slate-500">NOWPayments ID:</span> <strong className="text-amber-400 font-mono">{depositDetail.deposit.nowpaymentsPaymentId || "N/A"}</strong></div>
                      <div><span className="text-slate-500">Status:</span> {getStatusBadge(depositDetail.deposit.status)}</div>
                    </div>
                  </div>

                  {/* Payment Info */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2">
                    <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Payment Information</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-slate-500">Requested USD:</span> <strong className="text-emerald-400">${depositDetail.deposit.requestedAmountUSD} USD</strong></div>
                      <div><span className="text-slate-500">Credited PKR:</span> <strong className="text-emerald-400">Rs {depositDetail.deposit.requestedAmountPKR} PKR</strong></div>
                      <div><span className="text-slate-500">Asset & Network:</span> <strong className="text-white">{depositDetail.deposit.cryptoCurrency} ({depositDetail.deposit.network})</strong></div>
                      <div><span className="text-slate-500">Target Crypto Amount:</span> <strong className="text-amber-400 font-mono">{depositDetail.deposit.payAmount} {depositDetail.deposit.cryptoCurrency}</strong></div>
                      <div><span className="text-slate-500">Actual Crypto Paid:</span> <strong className="text-white font-mono">{depositDetail.deposit.actuallyPaid} {depositDetail.deposit.cryptoCurrency}</strong></div>
                      <div><span className="text-slate-500">Deposit Address:</span> <strong className="text-slate-300 font-mono text-[10px] break-all">{depositDetail.deposit.payAddress}</strong></div>
                    </div>
                  </div>

                  {/* Audit Timeline */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-3">
                    <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">Audit Log & Event Timeline</h4>
                    <div className="space-y-2">
                      {depositDetail.deposit.statusHistory && depositDetail.deposit.statusHistory.map((h: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 border-l-2 border-amber-500 pl-3 py-1">
                          <div>
                            <div className="text-xs font-extrabold text-white uppercase">{h.status}</div>
                            <div className="text-[11px] text-slate-400">{h.message}</div>
                            <div className="text-[9px] text-slate-600 mt-0.5">{new Date(h.timestamp).toLocaleString()}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
