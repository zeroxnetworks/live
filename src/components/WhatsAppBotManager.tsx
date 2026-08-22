import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  QrCode, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Send, 
  Smartphone, 
  Zap, 
  ShieldCheck, 
  AlertTriangle,
  Power,
  Clock,
  List,
  Copy,
  KeyRound,
  PhoneCall,
  ShieldAlert,
  AlertCircle,
  Info
} from "lucide-react";
import toast from "react-hot-toast";

interface WhatsAppStatus {
  connected: boolean;
  qrCodeDataUrl: string | null;
  userPhone: string | null;
  statusText: string;
  error: string | null;
  lastConnectedAt: string | null;
  pairingCode?: string | null;
}

interface WhatsAppLog {
  id: string;
  timestamp: string;
  recipient: string;
  message: string;
  status: "SENT" | "FAILED" | "PENDING";
  error?: string;
}

export default function WhatsAppBotManager() {
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);

  // Test Message State
  const [testPhone, setTestPhone] = useState("+923171605076");
  const [testMessage, setTestMessage] = useState("Hello! This is a test notification from ZeroX Network WhatsApp Engine.");
  const [sendingTest, setSendingTest] = useState(false);

  // Pairing Code State
  const [pairingPhone, setPairingPhone] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [requestingPairing, setRequestingPairing] = useState(false);
  const [authMethod, setAuthMethod] = useState<"pairing" | "qr">("pairing");

  // Analytics State
  const [analytics, setAnalytics] = useState<any>(null);

  // Fetch Status
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      setStatus(data);
      if (!data.pairingCode) {
        setPairingCode(null);
      }
    } catch (e) {
      console.error("Failed to fetch WhatsApp status:", e);
    }
  };

  // Fetch Analytics
  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/whatsapp/analytics");
      const data = await res.json();
      setAnalytics(data);
    } catch (e) {
      console.error("Failed to fetch WhatsApp analytics:", e);
    }
  };

  // Fetch Logs
  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/whatsapp/logs");
      const data = await res.json();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch WhatsApp logs:", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    fetchLogs();
    fetchAnalytics();

    const interval = setInterval(() => {
      fetchStatus();
      fetchLogs();
      fetchAnalytics();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setReconnecting(true);
    try {
      const res = await fetch("/api/whatsapp/connect", { method: "POST" });
      const data = await res.json();
      setStatus(data);
      toast.success("WhatsApp Engine Initialized! Scan QR Code if presented.");
    } catch (e: any) {
      toast.error("Failed to connect WhatsApp Engine: " + e.message);
    } finally {
      setReconnecting(false);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp Web?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/logout", { method: "POST" });
      const data = await res.json();
      setStatus(data);
      setPairingCode(null);
      toast.success("Disconnected from WhatsApp Web.");
    } catch (e: any) {
      toast.error("Logout error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = async () => {
    if (!confirm("Reset WhatsApp session and clear all auth keys? Use this if pairing or QR code gets stuck.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/reset", { method: "POST" });
      const data = await res.json();
      setStatus(data);
      setPairingCode(null);
      toast.success("WhatsApp session reset cleanly! Ready to link a phone number.");
    } catch (e: any) {
      toast.error("Reset error: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGetPairingCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairingPhone.trim()) {
      return toast.error("Please enter a WhatsApp phone number!");
    }
    setRequestingPairing(true);
    setPairingCode(null);
    try {
      const res = await fetch("/api/whatsapp/pairing-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: pairingPhone })
      });
      const data = await res.json();
      if (data.success && data.code) {
        setPairingCode(data.code);
        toast.success(`Pairing Code Generated: ${data.code}`);
      } else {
        toast.error(data.error || "Failed to generate pairing code.");
      }
    } catch (err: any) {
      toast.error("Error: " + err.message);
    } finally {
      setRequestingPairing(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim() || !testMessage.trim()) {
      return toast.error("Please enter both phone number and message.");
    }

    setSendingTest(true);
    try {
      const res = await fetch("/api/whatsapp/send-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientPhone: testPhone, message: testMessage })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("WhatsApp Message Sent Successfully!");
        fetchLogs();
      } else {
        toast.error("Failed: " + data.message);
      }
    } catch (e: any) {
      toast.error("Error sending test message: " + e.message);
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 p-6 rounded-2xl border border-emerald-500/20 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
              <MessageSquare className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-tight">WhatsApp Web Auto-Message Engine</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  FREE BAILEYS ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                Automatically dispatches real WhatsApp notifications to users & admin for instant deposits, registration alerts, and order confirmations without API fees.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchStatus}
              className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <button
              onClick={handleResetSession}
              disabled={loading}
              className="px-3 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Wipe auth files & restart engine clean"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Session
            </button>

            {status?.connected ? (
              <button
                onClick={handleLogout}
                className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <Power className="w-4 h-4" />
                Disconnect WhatsApp
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={reconnecting}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <QrCode className="w-4 h-4" />
                {reconnecting ? "Initializing..." : "Start / Connect WhatsApp"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: QR & Status + Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Connection Status & QR Code Panel */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Device Connection Status</h3>
            </div>
            {status?.connected ? (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                CONNECTED
              </span>
            ) : status?.qrCodeDataUrl ? (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                SCAN QR CODE
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                DISCONNECTED
              </span>
            )}
          </div>

          {/* Authentication Mode Selector when Disconnected */}
          {!status?.connected && (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setAuthMethod("pairing")}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethod === "pairing" 
                    ? "bg-white text-emerald-700 shadow-sm font-extrabold border border-slate-200" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Phone Number Pairing (No QR)
              </button>
              <button
                onClick={() => setAuthMethod("qr")}
                className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMethod === "qr" 
                    ? "bg-white text-emerald-700 shadow-sm font-extrabold border border-slate-200" 
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                Scan QR Code
              </button>
            </div>
          )}

          {/* Connected View */}
          {status?.connected && (
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-5 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-500 text-white rounded-full mx-auto flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-base font-extrabold text-emerald-950">WhatsApp Linked & Active</h4>
              <p className="text-xs text-emerald-800 font-medium">
                Active Phone Number: <span className="font-mono font-bold text-emerald-950">+{status.userPhone || "Linked WhatsApp"}</span>
              </p>
              <div className="text-[10px] text-emerald-700 font-bold bg-white/80 rounded-lg p-2 border border-emerald-200/60 inline-block">
                Last Connected: {status.lastConnectedAt || "Just now"}
              </div>
            </div>
          )}

          {/* Direct Phone Number Pairing Code View */}
          {!status?.connected && authMethod === "pairing" && (
            <div className="space-y-4 bg-slate-50 border border-slate-200 rounded-xl p-5">
              <form onSubmit={handleGetPairingCode} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    WhatsApp Phone Number
                  </label>
                  <div className="relative">
                    <PhoneCall className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={pairingPhone}
                      onChange={(e) => setPairingPhone(e.target.value)}
                      placeholder="e.g. +44 7868 713315 or 447868713315"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={requestingPairing}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  {requestingPairing ? "Generating Code..." : "Get 8-Digit Pairing Code"}
                </button>
              </form>

              {(pairingCode || status?.pairingCode) && (
                <div className="bg-emerald-950 text-emerald-100 p-5 rounded-xl border-2 border-emerald-500/50 text-center space-y-4 shadow-xl">
                  <span className="text-[10px] font-black text-emerald-300 uppercase tracking-widest block">
                    Your 8-Digit WhatsApp Pairing Code
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-2xl md:text-3xl font-black font-mono tracking-widest text-emerald-300 bg-slate-900 px-5 py-3 rounded-xl border border-emerald-500/40 shadow-inner">
                      {(pairingCode || status?.pairingCode || "").replace("-", " - ")}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const raw = (pairingCode || status?.pairingCode || "").replace(/[^A-Z0-9]/gi, "");
                        navigator.clipboard.writeText(raw);
                        toast.success(`Copied pairing code (${raw}) to clipboard!`);
                      }}
                      className="p-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition-all cursor-pointer shadow-md flex items-center justify-center"
                      title="Copy Code without hyphens"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-[11px] text-emerald-200 text-left bg-slate-900/80 p-3.5 rounded-xl space-y-1.5 font-medium border border-emerald-500/20">
                    <p className="font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-400" /> How to link on your phone:
                    </p>
                    <ol className="list-decimal pl-4 space-y-1 text-[11px]">
                      <li>Open WhatsApp on <strong>{pairingPhone || status?.userPhone || "your phone"}</strong>.</li>
                      <li>Go to <strong>Settings / Menu (⋮)</strong> &gt; <strong>Linked Devices</strong>.</li>
                      <li>Tap <strong>Link a Device</strong> &gt; <strong>Link with phone number instead</strong>.</li>
                      <li>Enter the code: <strong className="text-amber-300 font-mono text-xs">{pairingCode || status?.pairingCode}</strong></li>
                    </ol>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* QR Code Scan View */}
          {!status?.connected && authMethod === "qr" && (
            <div className="space-y-4 text-center bg-slate-50 border border-slate-200 rounded-xl p-5">
              {status?.qrCodeDataUrl ? (
                <>
                  <div className="inline-block p-3 bg-white border-2 border-emerald-500/30 rounded-2xl shadow-md">
                    <img 
                      src={status.qrCodeDataUrl} 
                      alt="WhatsApp Web QR Code" 
                      className="w-64 h-64 mx-auto object-contain rounded-lg"
                    />
                  </div>
                  <div className="space-y-1.5 text-left bg-white p-4 rounded-xl border border-slate-200">
                    <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" /> Instructions to Link:
                    </p>
                    <ol className="text-[11px] text-slate-600 space-y-1 font-medium pl-4 list-decimal">
                      <li>Open <strong>WhatsApp</strong> on your mobile device.</li>
                      <li>Tap <strong>Settings / Menu (⋮)</strong> &gt; <strong>Linked Devices</strong>.</li>
                      <li>Tap <strong>Link a Device</strong> and point camera at the QR code above.</li>
                      <li>The session will pair automatically within 3 seconds!</li>
                    </ol>
                  </div>
                </>
              ) : (
                <div className="py-6 space-y-3">
                  <QrCode className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500">QR Engine is idle. Click below to start QR scanner stream.</p>
                  <button
                    onClick={handleConnect}
                    disabled={reconnecting}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                  >
                    {reconnecting ? "Initializing..." : "Generate QR Code"}
                  </button>
                </div>
              )}
            </div>
          )}

          {status?.error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{status.error}</span>
            </div>
          )}
        </div>

        {/* Test Sender & Features Overview */}
        <div className="lg:col-span-7 space-y-6">

          {/* Enterprise Analytics Dashboard */}
          {analytics && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Enterprise Bot Analytics</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <div className="text-2xl font-black text-slate-800">{analytics.activeSessions}</div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mt-1">Active Sessions</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center">
                  <div className="text-2xl font-black text-indigo-700">{analytics.aiRequests}</div>
                  <div className="text-[10px] uppercase font-bold text-indigo-600 mt-1">AI Replies</div>
                </div>
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-center">
                  <div className="text-2xl font-black text-emerald-700">{analytics.duplicateRepliesPrevented}</div>
                  <div className="text-[10px] uppercase font-bold text-emerald-600 mt-1">Duplicates Blocked</div>
                </div>
                <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 text-center">
                  <div className="text-2xl font-black text-rose-700">{analytics.spamAttemptsBlocked}</div>
                  <div className="text-[10px] uppercase font-bold text-rose-600 mt-1">Spam Blocked</div>
                </div>
              </div>

              {analytics.recentAlerts && analytics.recentAlerts.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    <h4 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Recent System Alerts</h4>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {analytics.recentAlerts.map((alert: any) => (
                      <div key={alert.id} className={`p-3 rounded-xl border text-sm flex items-start gap-3 ${
                        alert.severity === 'critical' ? 'bg-rose-50 border-rose-200 text-rose-900' :
                        alert.severity === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-900' :
                        'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <div className="mt-0.5">
                           {alert.severity === 'critical' ? <ShieldAlert className="w-4 h-4 text-rose-600" /> :
                            alert.severity === 'warning' ? <AlertCircle className="w-4 h-4 text-amber-600" /> :
                            <Info className="w-4 h-4 text-slate-500" />}
                        </div>
                        <div className="flex-1">
                          <div className="font-bold flex items-center justify-between">
                            <span>{alert.type}</span>
                            <span className="text-[10px] opacity-70 font-medium">{new Date(alert.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <div className="text-[13px] opacity-90 mt-0.5">{alert.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Test Message Tool */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
              <Send className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Test WhatsApp Notification</h3>
            </div>

            <form onSubmit={handleSendTestMessage} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    Recipient WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="+44 7868 713315 or 447868713315"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Accepts local (03xx) or international (+92xx) numbers.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                    System Target Admin
                  </label>
                  <input
                    type="text"
                    readOnly
                    value="+923171605076 (Admin WhatsApp)"
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[9px] text-emerald-600 font-bold mt-1">Receives instant admin alerts on new deposits & orders.</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">
                  Test Message Content
                </label>
                <textarea
                  rows={2}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Type a test message..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={sendingTest || !status?.connected}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                  status?.connected 
                    ? "bg-slate-900 hover:bg-slate-800 text-white shadow-md cursor-pointer" 
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                <Send className="w-4 h-4" />
                {sendingTest ? "Sending WhatsApp Message..." : status?.connected ? "Send Test WhatsApp Message Now" : "Connect WhatsApp Web to Send Test"}
              </button>
            </form>
          </div>

          {/* Active Automations Summary */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl p-6 text-white space-y-3 shadow-md border border-slate-800">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Active WhatsApp Automated Triggers:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-emerald-300">1. Deposit Verification</p>
                <p className="text-[11px] text-slate-400 mt-1">Dispatches receipt to user & alert to admin on instant NayaPay / Bank email match.</p>
              </div>
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <p className="font-bold text-emerald-300">2. New User Registration</p>
                <p className="text-[11px] text-slate-400 mt-1">Notifies admin on WhatsApp when a new customer creates an account.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WhatsApp Dispatch Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <List className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Recent WhatsApp Dispatch Logs</h3>
          </div>
          <button
            onClick={fetchLogs}
            className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-400 text-xs font-medium">
            No WhatsApp notification logs recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-black border-b border-slate-200">
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Recipient</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Message Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 font-bold">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {log.timestamp}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {log.recipient}
                    </td>
                    <td className="py-2.5 px-3">
                      {log.status === "SENT" ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          SENT ✅
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300" title={log.error}>
                          FAILED ❌
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs font-mono text-[11px]">
                      {log.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
