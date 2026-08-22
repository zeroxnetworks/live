import React, { useState, useEffect } from "react";
import { ShieldCheck, Smartphone, AlertTriangle, KeyRound, CheckCircle2, XCircle, RefreshCw, Send, Layers, Lock, Cpu, Globe, Activity, Eye, History } from "lucide-react";
import { toast } from "react-hot-toast";

interface SecurityAuditLog {
  id: string;
  brandId: string;
  appId: string;
  eventType: string;
  identifier: string;
  recipientPhone?: string;
  status: "SUCCESS" | "FAILED" | "BLOCKED" | "PENDING";
  ip?: string;
  device?: string;
  browser?: string;
  os?: string;
  location?: string;
  details?: string;
  timestamp: string;
}

interface SecurityStats {
  activeOtpCount: number;
  totalVerifications: number;
  failedAttempts: number;
  blockedRequests: number;
  admin2faEnabled: boolean;
  logs: SecurityAuditLog[];
}

export function WhatsAppSecurityTab() {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<SecurityStats>({
    activeOtpCount: 0,
    totalVerifications: 0,
    failedAttempts: 0,
    blockedRequests: 0,
    admin2faEnabled: true,
    logs: []
  });

  const [testPhone, setTestPhone] = useState("+447868713315");
  const [testType, setTestType] = useState<"REGISTRATION" | "RECOVERY" | "ADMIN_2FA">("REGISTRATION");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchSecurityStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp-auth/security-stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load security stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityStats();
    const interval = setInterval(fetchSecurityStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSendTestOtp = async () => {
    if (!testPhone.trim()) {
      toast.error("Please enter a valid phone number");
      return;
    }
    setIsSendingTest(true);
    try {
      const res = await fetch("/api/whatsapp-auth/send-test-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone.trim(), otpType: testType })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`WhatsApp ${testType} OTP test dispatched to ${testPhone}!`);
        fetchSecurityStats();
      } else {
        toast.error(data.message || "Failed to dispatch test OTP");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send test OTP");
    } finally {
      setIsSendingTest(false);
    }
  };

  const filteredLogs = stats.logs.filter(log => {
    const matchesSearch =
      log.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.recipientPhone && log.recipientPhone.includes(searchTerm)) ||
      log.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ip && log.ip.includes(searchTerm));

    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-widest mb-1">
              <ShieldCheck className="w-4 h-4" /> Centralized Security Layer • Injazify Multi-Brand Ready
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              WhatsApp OTP Security & 2FA Engine
            </h2>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Protects customer registrations, WhatsApp password recovery, and admin portal 2FA authentication with cryptographically hashed 6-digit OTPs and real-time security alerts.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchSecurityStats}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              Refresh Security Logs
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active OTP Sessions</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{stats.activeOtpCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Pending 5-minute verification windows</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Successful Verifications</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{stats.totalVerifications}</div>
          <p className="text-[11px] text-emerald-700/80 mt-1 font-medium">100% verified via WhatsApp OTP</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Failed Attempts</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600">{stats.failedAttempts}</div>
          <p className="text-[11px] text-slate-500 mt-1">Invalid OTP entries recorded</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Blocked Rate Limits</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600">{stats.blockedRequests}</div>
          <p className="text-[11px] text-slate-500 mt-1">Brute-force / Cooldown enforcement</p>
        </div>
      </div>

      {/* Brand Architecture & Live Test Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Test Panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Live WhatsApp OTP Dispatch Test</h3>
          </div>

          <p className="text-xs text-slate-600">
            Send an instant test 6-digit WhatsApp OTP to any phone number to verify live delivery via the connected WhatsApp gateway.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Target WhatsApp Phone Number</label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. +447868713315"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">OTP Template Type</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-emerald-500 focus:outline-none"
              >
                <option value="REGISTRATION">New User Registration</option>
                <option value="RECOVERY">Account Recovery</option>
                <option value="ADMIN_2FA">Admin Portal 2FA</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSendTestOtp}
              disabled={isSendingTest}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-all"
            >
              {isSendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {isSendingTest ? "Dispatching WhatsApp Code..." : "Dispatch Test WhatsApp OTP"}
            </button>
          </div>
        </div>

        {/* Multi-Brand Architecture Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-widest flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Injazify Ecosystem
              </span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-[10px] font-bold">
                Active
              </span>
            </div>

            <h4 className="text-lg font-bold text-white mb-2">Multi-Brand Architecture</h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Unified authentication layer designed for Zerox Network with built-in multi-brand configuration (<code className="text-emerald-300 font-mono">brandId: zerox_network</code>). Ready for expansion across Injazify products.
            </p>

            <div className="space-y-2 text-xs border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Customer Brand:</span>
                <span className="font-semibold text-white">Zerox Network</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Parent Company:</span>
                <span className="font-semibold text-emerald-400">Injazify</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">OTP Algorithm:</span>
                <span className="font-mono text-slate-300">HMAC-SHA256 Hashed</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span className="text-slate-500">Admin 2FA Status:</span>
                <span className="font-bold text-emerald-400">Enforced via WhatsApp</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log & Security Events Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-blue-600" /> Real-time Security Audit Logs & OTP Requests
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Tracks all registration verifications, password recovery attempts, admin 2FA logins, and rate-limit security events.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search phone, email, IP..."
              className="px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-200/60">
              <tr>
                <th className="px-4 py-3">Timestamp & Brand</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">User / Identifier</th>
                <th className="px-4 py-3">WhatsApp Number</th>
                <th className="px-4 py-3">Device & IP</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    No security audit logs match your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono whitespace-nowrap">
                      <div className="text-slate-800 font-semibold">{new Date(log.timestamp).toLocaleTimeString()}</div>
                      <div className="text-[10px] text-slate-400">{log.brandId || "zerox_network"}</div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-mono font-semibold text-slate-700">{log.eventType}</span>
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-800 whitespace-nowrap">
                      {log.identifier}
                    </td>

                    <td className="px-4 py-3 font-mono text-emerald-700 font-semibold whitespace-nowrap">
                      {log.recipientPhone || "N/A"}
                    </td>

                    <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      <div>{log.ip || "127.0.0.1"}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[120px]">{log.device || "Browser"}</div>
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.status === "SUCCESS" && (
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-md font-bold text-[10px]">
                          SUCCESS
                        </span>
                      )}
                      {log.status === "FAILED" && (
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200/60 rounded-md font-bold text-[10px]">
                          FAILED
                        </span>
                      )}
                      {log.status === "BLOCKED" && (
                        <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/60 rounded-md font-bold text-[10px]">
                          BLOCKED
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                      {log.details || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
