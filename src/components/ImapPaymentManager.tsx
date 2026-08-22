import React, { useState, useEffect } from "react";
import { 
  Mail, RefreshCw, CheckCircle2, AlertCircle, ShieldCheck, 
  Search, Eye, Clock, ArrowRight, Server, Key, Terminal,
  Check, X, FileText, Smartphone, DollarSign, Download, Filter, Code, Network, Activity, Settings2, Sparkles, Inbox, Image as ImageIcon
} from "lucide-react";
import CurrencyDisplay from "./CurrencyDisplay";
import { toast } from "react-hot-toast";

interface PaymentReceived {
  id?: string;
  transaction_id: string;
  amount: number;
  sender_info: string;
  status: "pending" | "claimed";
  created_at: string;
}

interface UserDeposit {
  id?: string;
  user_id: string;
  submitted_tid: string;
  submitted_amount: number;
  screenshot_path?: string;
  status: "auto-approved" | "manual-review" | "rejected";
  processed_at: string;
}

interface ImapPaymentManagerProps {
  formatPrice: (baseUnits: number) => string;
}

export default function ImapPaymentManager({ formatPrice }: ImapPaymentManagerProps) {
  // IMAP Configuration State
  const [host, setHost] = useState("imap.gmail.com");
  const [port, setPort] = useState("993");
  const [user, setUser] = useState("info.rynmirza@gmail.com");
  const [pass, setPass] = useState("zmxe jydl hqzg udfm");
  const [showPass, setShowPass] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  // Parsing Rules State
  const DEFAULT_SENDERS = "alerts@easypaisa.com.pk, no-reply@jazzcash.pk, alerts@sadapay.pk, service@nayapay.com, noreply@nayapay.com";
  const DEFAULT_TID_REGEX = "(?:Transaction ID|NayaPay ID|TID|Trx ID|Ref No)[:\\s]+([A-Za-z0-9\\s-]+)";

  const [allowedSenders, setAllowedSenders] = useState(DEFAULT_SENDERS);
  const [tidRegex, setTidRegex] = useState(DEFAULT_TID_REGEX);

  // Operation States
  const [isPolling, setIsPolling] = useState(false);
  const [isAutoSyncEnabled, setIsAutoSyncEnabled] = useState(false);
  const [syncInterval, setSyncInterval] = useState<number>(30000);
  const [lastPollTime, setLastPollTime] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"ONLINE" | "OFFLINE" | "ERROR" | "IDLE">("IDLE");
  const [pollLog, setPollLog] = useState<string[]>([]);
  
  // Data States
  const [paymentsReceived, setPaymentsReceived] = useState<PaymentReceived[]>([]);
  const [userDeposits, setUserDeposits] = useState<UserDeposit[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"dashboard" | "logs" | "deposits" | "settings">("dashboard");
  const [searchTerm, setSearchTerm] = useState("");

  // Screenshot Modal Preview
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);

  // Fetch initial logs from backend
  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/deposit/list");
      if (res.ok) {
        const data = await res.json();
        const rawPayments = data.paymentsReceived || [];
        const rawDeposits = data.userDeposits || [];
        
        // Safely normalize payments with robust fallbacks
        const normalizedPayments = rawPayments.map((p: any) => ({
          id: p.id || "",
          transaction_id: p.transaction_id || p.txId || p.trxId || "N/A",
          amount: Number(p.amount !== undefined ? p.amount : 0),
          sender_info: p.sender_info || p.senderName || p.userEmail || "Unknown",
          status: p.status || "pending",
          created_at: p.created_at || p.createdAt || new Date().toISOString()
        }));

        // Safely normalize deposits with robust fallbacks matching database structures
        const normalizedDeposits = rawDeposits.map((d: any) => {
          let mappedStatus = "manual-review";
          const s = String(d.status || "").toUpperCase();
          if (s === "APPROVED" || s === "AUTO-APPROVED" || s === "COMPLETED") {
            mappedStatus = "auto-approved";
          } else if (s === "PENDING" || s === "MANUAL_REVIEW") {
            mappedStatus = "manual-review";
          } else {
            mappedStatus = "rejected";
          }
          return {
            id: d.id || "",
            user_id: d.userId || d.user_id || "Unknown",
            submitted_tid: d.txId || d.submitted_tid || d.trxId || "N/A",
            submitted_amount: Number(d.amount !== undefined ? d.amount : (d.submitted_amount || 0)),
            screenshot_path: d.proofImageUrl || d.screenshot_path || "",
            status: mappedStatus as any,
            processed_at: d.createdAt || d.processed_at || new Date().toISOString()
          };
        });

        setPaymentsReceived(normalizedPayments);
        setUserDeposits(normalizedDeposits);
      }
    } catch (err) {
      console.error("Failed to fetch deposit logs:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Load saved IMAP settings from localStorage if available
    const savedImap = localStorage.getItem("zerox_imap_config");
    if (savedImap) {
      try {
        const parsed = JSON.parse(savedImap);
        setHost(parsed.host || "imap.gmail.com");
        setPort(parsed.port || "993");
        setUser(parsed.user || "info.rynmirza@gmail.com");
        const cleanSavedPass = (parsed.pass || "").replace(/\s+/g, "");
        if (!cleanSavedPass || cleanSavedPass === "swjcvfwucmcaqdr") {
          setPass("zmxe jydl hqzg udfm");
          localStorage.setItem("zerox_imap_config", JSON.stringify({
            ...parsed,
            user: parsed.user || "info.rynmirza@gmail.com",
            pass: "zmxe jydl hqzg udfm"
          }));
        } else {
          setPass(parsed.pass);
        }
        setAllowedSenders(parsed.allowedSenders || DEFAULT_SENDERS);
        setTidRegex(parsed.tidRegex || DEFAULT_TID_REGEX);
        if (parsed.syncInterval) setSyncInterval(parsed.syncInterval);
        if (parsed.isAutoSyncEnabled !== undefined) setIsAutoSyncEnabled(parsed.isAutoSyncEnabled);
        setIsSaved(true);
      } catch (e) {
        console.error(e);
      }
    } else {
      setUser("info.rynmirza@gmail.com");
      setPass("zmxe jydl hqzg udfm");
      setIsSaved(true);
    }
  }, []);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("zerox_imap_config", JSON.stringify({ host, port, user, pass, allowedSenders, tidRegex }));
    setIsSaved(true);
    toast.success("IMAP credentials & parsing rules saved locally!");
  };

  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoSyncEnabled && user && pass) {
      interval = setInterval(() => {
        handlePollInbox(true);
      }, syncInterval);
    }
    return () => clearInterval(interval);
  }, [isAutoSyncEnabled, user, pass, host, port, syncInterval]);

  const handlePollInbox = async (isSilent = false) => {
    if (!user || !pass) {
      if (!isSilent) toast.error("Please enter IMAP Username and App Password first.");
      setActiveSubTab("settings");
      return;
    }

    setIsPolling(true);
    const timeStr = new Date().toLocaleTimeString();
    setPollLog(prev => [`[${timeStr}] Initiating SSL connection to ${host}:${port}...`, ...prev]);

    try {
      const res = await fetch("/api/imap/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host,
          port: Number(port),
          user,
          pass,
          allowedSenders,
          tidRegex
        })
      });

      let data: any = {};
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await res.json().catch(() => ({}));
      } else {
        const text = await res.text().catch(() => "");
        data = { success: false, message: text || `HTTP ${res.status}: ${res.statusText}` };
      }

      if (res.ok && data.success) {
        setLastPollTime(timeStr);
        setConnectionStatus("ONLINE");
        if (!isSilent) toast.success(data.message || "IMAP Inbox polled successfully!");
        setPollLog(prev => [
          `[${timeStr}] SUCCESS: Parsed ${data.parsedCount || 0} valid banking emails.`,
          ...prev
        ]);
        fetchLogs();
      } else {
        const errMsg = data.error || data.message || `HTTP ${res.status} error`;
        setConnectionStatus("ERROR");
        if (!isSilent) toast.error(errMsg);
        setPollLog(prev => [
          `[${timeStr}] ERROR: ${errMsg}`,
          ...prev
        ]);
      }
    } catch (err: any) {
      setConnectionStatus("ERROR");
      if (!isSilent) toast.error("Network or server error during IMAP polling.");
      setPollLog(prev => [`[${timeStr}] EXCEPTION: ${err.message}`, ...prev]);
    } finally {
      setIsPolling(false);
    }
  };

  const filteredPayments = paymentsReceived.filter(p => {
    const tid = typeof p?.transaction_id === 'string' ? p.transaction_id : '';
    const sender = typeof p?.sender_info === 'string' ? p.sender_info : '';
    const term = typeof searchTerm === 'string' ? searchTerm.toLowerCase() : '';
    return tid.toLowerCase().includes(term) || sender.toLowerCase().includes(term);
  });

  const filteredDeposits = userDeposits.filter(d => {
    const tid = typeof d?.submitted_tid === 'string' ? d.submitted_tid : '';
    const uid = typeof d?.user_id === 'string' ? d.user_id : '';
    const term = typeof searchTerm === 'string' ? searchTerm.toLowerCase() : '';
    return tid.toLowerCase().includes(term) || uid.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Network className="h-32 w-32" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <span className="p-2.5 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-300 shadow-inner">
              <Mail className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-lg font-black tracking-wide uppercase flex items-center gap-2 text-white">
                IMAP Payment Engine v2.0
                <span className="bg-indigo-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">Pro</span>
              </h2>
              <p className="text-xs text-indigo-200/80 font-medium mt-0.5 max-w-xl">
                Automated email parsing, transaction ID matching, and instant auto-approval pipelines for bank and wallet deposits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">

          <div className="flex items-center gap-2">
            <select
              value={syncInterval}
              onChange={(e) => {
                setSyncInterval(Number(e.target.value));
                localStorage.setItem("zerox_imap_config", JSON.stringify({ host, port, user, pass, allowedSenders, tidRegex, syncInterval: Number(e.target.value), isAutoSyncEnabled }));
              }}
              disabled={isAutoSyncEnabled}
              className="bg-slate-800 border border-slate-700 text-white rounded-xl text-xs py-2.5 px-3 font-medium outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={30000}>30 Sec</option>
              <option value={60000}>60 Sec</option>
              <option value={300000}>5 Min</option>
            </select>
            <button
              onClick={() => {
                setIsAutoSyncEnabled(!isAutoSyncEnabled);
                localStorage.setItem("zerox_imap_config", JSON.stringify({ host, port, user, pass, allowedSenders, tidRegex, syncInterval, isAutoSyncEnabled: !isAutoSyncEnabled }));
              }}
              className={`font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg transition-all ${isAutoSyncEnabled ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50" : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"}`}
            >
              <Clock className={`h-4 w-4 ${isAutoSyncEnabled ? "animate-pulse text-white" : ""}`} />
              <span>{isAutoSyncEnabled ? "Auto-Sync: ON" : "Auto-Sync: OFF"}</span>
            </button>
          </div>

          <button
            onClick={() => handlePollInbox(false)}
            disabled={isPolling}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-900/50 transition-all disabled:opacity-70 disabled:cursor-wait"
          >
            <RefreshCw className={`h-4 w-4 ${isPolling ? "animate-spin text-white" : ""}`} />
            <span>{isPolling ? "Syncing Inbox..." : "Run Engine Sync"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          <button
            onClick={() => setActiveSubTab("dashboard")}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "dashboard"
                ? "bg-slate-800 text-white shadow-md shadow-slate-200"
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <Activity className="h-3.5 w-3.5" /> Dashboard
          </button>
          
          <button
            onClick={() => setActiveSubTab("logs")}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "logs"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-100"
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <Inbox className="h-3.5 w-3.5" /> Parsed Inbox ({paymentsReceived.length})
          </button>

          <button
            onClick={() => setActiveSubTab("deposits")}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "deposits"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-100"
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" /> User Claims ({userDeposits.length})
            {userDeposits.filter(d => d.status === "manual-review").length > 0 && (
              <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-black ${activeSubTab === 'deposits' ? 'bg-white text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {userDeposits.filter(d => d.status === "manual-review").length} PENDING
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSubTab("settings")}
            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === "settings"
                ? "bg-slate-800 text-white shadow-md shadow-slate-200"
                : "bg-white border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
            }`}
          >
            <Settings2 className="h-3.5 w-3.5" /> Configuration
          </button>
        </div>

        {activeSubTab !== "settings" && activeSubTab !== "dashboard" && (
          <div className="relative w-48 sm:w-64 shrink-0">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search TID, Email, User ID..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
            />
          </div>
        )}
      </div>

      {/* SUB-TAB 0: DASHBOARD */}
      {activeSubTab === "dashboard" && (
        <div className="space-y-6 animate-fade-in">
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 bg-indigo-50 h-16 w-16 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-100 text-indigo-600 mb-3 shadow-sm border border-indigo-200">
                  <Inbox className="h-5 w-5" />
                </span>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Parsed Emails</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{paymentsReceived.length}</h3>
                  <span className="text-[10px] font-bold text-emerald-500 flex items-center"><ArrowRight className="h-3 w-3 -rotate-45" /> Auto-synced</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 bg-emerald-50 h-16 w-16 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 mb-3 shadow-sm border border-emerald-200">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Auto-Matched</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{userDeposits.filter(d => d.status === "auto-approved").length}</h3>
                  <span className="text-[10px] font-bold text-emerald-500">Matches</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 bg-amber-50 h-16 w-16 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-amber-100 text-amber-600 mb-3 shadow-sm border border-amber-200">
                  <AlertCircle className="h-5 w-5" />
                </span>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Pending Review</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">{userDeposits.filter(d => d.status === "manual-review").length}</h3>
                  <span className="text-[10px] font-bold text-amber-500">Action Required</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 bg-slate-100 h-16 w-16 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative z-10">
                <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-slate-100 text-slate-600 mb-3 shadow-sm border border-slate-200">
                  <Activity className="h-5 w-5" />
                </span>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">System Status</p>
                <div className="flex flex-col gap-1 mt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600">IMAP Connection:</span>
                    {connectionStatus === "ONLINE" ? (
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">ONLINE</span>
                    ) : connectionStatus === "ERROR" ? (
                      <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">OFFLINE/ERROR</span>
                    ) : (
                      <span className="text-[9px] font-black text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">IDLE</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-600">Last Sync:</span>
                    <span className="text-[9px] font-bold text-slate-500">{lastPollTime || "Never"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Engine Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
             <div className="flex items-center justify-between text-slate-400 bg-slate-950 px-4 py-3 border-b border-slate-800 text-[10px] uppercase font-black tracking-wider">
              <span className="flex items-center gap-2 text-indigo-400">
                <Terminal className="h-4 w-4" /> IMAP Pipeline Terminal
              </span>
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isPolling ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`}></span>
                {isPolling ? 'EXECUTING' : 'IDLE'}
              </span>
            </div>
            <div className="p-4 h-48 overflow-y-auto space-y-1.5 custom-scrollbar font-mono text-xs">
              {pollLog.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-600">
                  <Terminal className="h-8 w-8 mb-2 opacity-20" />
                  <p>Terminal ready. Waiting for execution...</p>
                </div>
              ) : (
                pollLog.map((log, i) => (
                  <p key={i} className={`leading-relaxed ${log.includes('ERROR') || log.includes('EXCEPTION') ? 'text-red-400' : log.includes('SUCCESS') ? 'text-emerald-400' : 'text-indigo-200'}`}>
                    <span className="text-slate-600 select-none mr-2">›</span> {log}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 1: PARSED EMAIL PAYMENTS LOG */}
      {activeSubTab === "logs" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Inbox className="h-4 w-4 text-indigo-600" />
              Parsed Mailbox Feed
            </h3>
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Auto-Sync Active
            </span>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <Mail className="h-8 w-8 stroke-1 text-slate-300" />
              </div>
              <p className="text-sm font-black uppercase tracking-wider text-slate-600">No Parsed Emails</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                Sync the inbox to parse new transaction alerts from authorized senders.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 font-black">
                    <th className="py-3 px-4 rounded-tl-xl">Transaction ID</th>
                    <th className="py-3 px-4">Detected Amount</th>
                    <th className="py-3 px-4">Parsed Sender</th>
                    <th className="py-3 px-4">Matcher Status</th>
                    <th className="py-3 px-4 rounded-tr-xl text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{p.transaction_id}</td>
                      <td className="py-3 px-4 font-mono font-black text-emerald-600">
                        <CurrencyDisplay baseUnits={p.amount} formatPrice={formatPrice} inline={true} usdClassName="text-emerald-500" />
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium text-xs">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] border border-slate-200">
                           {p.sender_info}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase border flex items-center gap-1.5 w-max ${
                          p.status === "claimed"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}>
                          {p.status === "claimed" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[10px] text-slate-400 font-mono text-right font-medium">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: USER DEPOSITS SUBMISSION LOG */}
      {activeSubTab === "deposits" && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 animate-fade-in">
           <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              User Submission Claims
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> IMAP Auto-Verification
            </span>
          </div>

          {filteredDeposits.length === 0 ? (
             <div className="text-center py-16 text-slate-400">
              <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <DollarSign className="h-8 w-8 stroke-1 text-slate-300" />
              </div>
              <p className="text-sm font-black uppercase tracking-wider text-slate-600">No User Claims</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto font-medium">
                No deposit claims have been submitted by users yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] uppercase tracking-wider text-slate-500 font-black">
                    <th className="py-3 px-4 rounded-tl-xl">User ID</th>
                    <th className="py-3 px-4">Claimed TID</th>
                    <th className="py-3 px-4">Claimed Amount</th>
                    <th className="py-3 px-4">Proof (SS)</th>
                    <th className="py-3 px-4">Engine Decision</th>
                    <th className="py-3 px-4 rounded-tr-xl text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeposits.map((d, idx) => (
                    <tr key={d.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800 text-xs">{d.user_id}</td>
                      <td className="py-3 px-4 font-mono font-bold text-indigo-600 bg-indigo-50/30">{d.submitted_tid}</td>
                      <td className="py-3 px-4 font-mono font-black text-slate-800">
                        <CurrencyDisplay baseUnits={d.submitted_amount} formatPrice={formatPrice} inline={true} usdClassName="text-emerald-500" />
                      </td>
                      <td className="py-3 px-4">
                        {d.screenshot_path ? (
                          <button
                            onClick={() => setSelectedScreenshot(d.screenshot_path || null)}
                            className="text-[10px] font-black text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer bg-blue-50 px-2 py-1 rounded-md transition-colors"
                          >
                            <Eye className="h-3 w-3" /> View Image
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic px-2 py-1 bg-slate-50 rounded-md border border-slate-100">No Image</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                         <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase border flex items-center gap-1.5 w-max ${
                          d.status === "auto-approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : d.status === "manual-review"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-red-50 text-red-700 border-red-200"
                        }`}>
                          {d.status === "auto-approved" ? <CheckCircle2 className="h-3 w-3" /> : d.status === "manual-review" ? <AlertCircle className="h-3 w-3" /> : <X className="h-3 w-3" />}
                          {d.status.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-[10px] text-slate-400 font-mono text-right font-medium">
                        {new Date(d.processed_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 3: IMAP CREDENTIALS CONFIGURATION */}
      {activeSubTab === "settings" && (
        <form onSubmit={handleSaveSettings} className="space-y-6 animate-fade-in">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 relative overflow-hidden">
             {isSaved && (
                <div className="absolute top-0 right-0 m-4 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm animate-fade-in">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Saved
                </div>
              )}
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-600" />
                Connection Parameters
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1 max-w-2xl">
                Configure SSL IMAP access to the mailbox receiving banking alerts. Google App Passwords are required for Gmail.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">IMAP Server Host</label>
                <div className="relative">
                  <Server className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="imap.gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">IMAP Port (SSL)</label>
                 <div className="relative">
                  <Network className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="993"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Mailbox Username / Email</label>
                 <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="alerts@yourdomain.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-2 md:col-span-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                  App Password / Secret Token
                </label>
                <div className="relative">
                   <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={pass}
                    onChange={(e) => setPass(e.target.value)}
                    placeholder="16-character secure token"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer bg-white rounded-md p-1 border border-slate-200 shadow-sm"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </button>
                </div>
                 <p className="text-[9px] text-slate-400 font-medium mt-1.5 ml-1">Do not use your main account password. Generate a dedicated App Password.</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
             <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Code className="h-5 w-5 text-emerald-600" />
                Parsing Rules & Regex Patterns
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-1 max-w-2xl">
                Define the authorized sender domains and the Regular Expression used to extract Transaction IDs from email bodies.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-5">
               <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Authorized Senders (Comma separated)</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAllowedSenders(DEFAULT_SENDERS);
                      setTidRegex(DEFAULT_TID_REGEX);
                      toast.success("Loaded NayaPay, EasyPaisa, JazzCash & SadaPay rules!");
                    }}
                    className="text-[10px] font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
                  >
                    + Load NayaPay & Gateway Presets
                  </button>
                </div>
                <input
                  type="text"
                  value={allowedSenders}
                  onChange={(e) => setAllowedSenders(e.target.value)}
                  placeholder="service@nayapay.com, alerts@easypaisa.com.pk, no-reply@jazzcash.pk"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                 <p className="text-[9px] text-slate-400 font-medium mt-1.5 ml-1">Supports NayaPay (service@nayapay.com, noreply@nayapay.com), EasyPaisa, JazzCash, and Bank emails.</p>
              </div>

               <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Transaction ID Extraction Regex</label>
                <input
                  type="text"
                  value={tidRegex}
                  onChange={(e) => setTidRegex(e.target.value)}
                  placeholder="TID:?\s*([A-Z0-9]+)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                 <p className="text-[9px] text-slate-400 font-medium mt-1.5 ml-1">Capture group 1 extracts the Transaction ID (e.g. NayaPay 16-26 digit numbers, TRX numbers).</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              className="bg-slate-900 hover:bg-black text-white font-black uppercase tracking-wider py-3 px-6 rounded-xl text-[11px] cursor-pointer shadow-md transition-all flex items-center gap-2"
            >
              <Check className="h-4 w-4" /> Save Configuration
            </button>
          </div>
        </form>
      )}

      {/* Screenshot Preview Modal */}
      {selectedScreenshot && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-1 shadow-2xl relative">
            <div className="flex items-center justify-between p-3 border-b border-slate-100">
              <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-indigo-600" /> Verification Image
              </h4>
              <button
                onClick={() => setSelectedScreenshot(null)}
                className="text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg p-1.5 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="bg-slate-950 rounded-b-xl overflow-hidden flex items-center justify-center p-4 min-h-[300px]">
              <img
                src={selectedScreenshot}
                alt="Deposit Screenshot"
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-lg border border-slate-800"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://placehold.co/600x400/1e293b/ffffff?text=Image+Unavailable";
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
