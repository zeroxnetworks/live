import React, { useState, useEffect } from "react";
import { safeFixed } from "../../../lib/safeNumeric";
import { 
  Mic, PhoneCall, PhoneOff, Clock, DollarSign, RefreshCw, 
  TrendingUp, Users, AlertTriangle, ShieldCheck, CheckCircle2,
  Calendar, FileText, Zap, Sparkles
} from "lucide-react";

interface VoiceAnalyticsData {
  totalCalls: number;
  connectedCalls: number;
  totalSeconds: number;
  totalMinutes: number;
  totalRevenuePkr: number;
  avgDurationSecs: number;
  avgRevenuePkr: number;
  maxDurationCalls: number;
  lowBalanceTerminations: number;
}

export const VoiceAnalyticsTab: React.FC = () => {
  const [analytics, setAnalytics] = useState<VoiceAnalyticsData | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "TODAY" | "MAX_LIMIT">("ALL");

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/ai-voice/analytics");
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
        if (data.recentSessions) {
          setSessions(data.recentSessions);
        }
      }
    } catch (err) {
      console.error("Failed to load voice analytics", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(fetchData, 15000);
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="space-y-6 text-white font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950/40 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Mic className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide">
                  AI Voice Call Intelligence Center
                </h2>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                  Live Billing Active
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Realtime analytics, connected call time, revenue, and server-enforced session monitoring (Rs 10/min, 2-min limit).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                autoRefresh 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-ping" : "bg-zinc-500"}`}></span>
              Auto-Refresh (15s)
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Analytics KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Calls */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Total Voice Calls</span>
            <PhoneCall className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {analytics?.totalCalls ?? 0}
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">
            {analytics?.connectedCalls ?? 0} connected & billed
          </p>
        </div>

        {/* Connected Minutes */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Connected Time</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {analytics?.totalMinutes ?? 0} <span className="text-xs text-zinc-400 font-normal">mins</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">
            Avg call: {analytics?.avgDurationSecs ?? 0}s
          </p>
        </div>

        {/* Total Revenue */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Voice Revenue</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            ₨ {safeFixed(analytics?.totalRevenuePkr, 2)}
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">
            Avg revenue/call: ₨ {safeFixed(analytics?.avgRevenuePkr, 2)} PKR
          </p>
        </div>

        {/* Max Limit Terminated */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">2-Min Limit Reached</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {analytics?.maxDurationCalls ?? 0}
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">
            Strict 120s server limit enforced
          </p>
        </div>
      </div>

      {/* Rules & Billing Compliance Box */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 font-bold font-mono uppercase tracking-wider">
          <Zap className="w-4 h-4" />
          <span>Server-Enforced Voice Call Billing Rules</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-zinc-300 font-medium">
          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
            <span className="text-emerald-400 font-bold block mb-0.5">💰 Pricing Engine</span>
            <span>Rs 10 per minute (Rs 0.1667/sec). Charged strictly for actual connected call duration. Unconnected calls = Rs 0.00.</span>
          </div>
          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
            <span className="text-blue-400 font-bold block mb-0.5">⏱️ Absolute 120s Limit</span>
            <span>Server automatically terminates call at exactly 120 seconds. Maximum possible charge per call = Rs 20 PKR.</span>
          </div>
          <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60">
            <span className="text-amber-400 font-bold block mb-0.5">🔒 Financial Idempotency</span>
            <span>Server uses financial locks to ensure one <code>voiceSessionId</code> results in exactly one single wallet deduction.</span>
          </div>
        </div>
      </div>
      {/* Recent Voice Sessions Table */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Recent Voice Call Logs</h3>
          </div>
          <span className="text-[10px] text-zinc-400 font-mono">Showing last {sessions.length} sessions</span>
        </div>

        {sessions.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center font-mono">No voice call records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 text-[10px] uppercase">
                  <th className="py-2 px-3">Session ID / User</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Duration</th>
                  <th className="py-2 px-3">Rate</th>
                  <th className="py-2 px-3">Total Charged</th>
                  <th className="py-2 px-3">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {sessions.map((s) => {
                  const statusUpper = String(s.status || "").toUpperCase();
                  const endReasonUpper = String(s.endReason || "").toUpperCase();
                  const isSuccess = statusUpper === "COMPLETED" && Number(s.totalCharge || 0) > 0;
                  const isPermDenied = statusUpper === "PERMISSION_DENIED" || endReasonUpper === "PERMISSION_DENIED" || endReasonUpper === "MIC_ERROR";
                  const isConnFailed = statusUpper === "CONNECTION_FAILED" || endReasonUpper === "CONNECTION_FAILED";

                  return (
                    <tr key={s.id || s.sessionId} className="hover:bg-zinc-800/30 transition-colors">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white">{s.username || "User"}</div>
                        <div className="text-[10px] text-zinc-500">{s.sessionId}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        {isSuccess && (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            COMPLETED
                          </span>
                        )}
                        {isPermDenied && (
                          <span className="bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            PERMISSION_DENIED (Rs 0)
                          </span>
                        )}
                        {isConnFailed && (
                          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            CONN_FAILED (Rs 0)
                          </span>
                        )}
                        {!isSuccess && !isPermDenied && !isConnFailed && (
                          <span className="bg-zinc-800 text-zinc-400 border border-zinc-700 text-[9px] font-bold px-2 py-0.5 rounded-full">
                            {s.status || "ENDED"} (Rs 0)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        {s.billableSeconds ? `${Math.floor(s.billableSeconds / 60)}m ${s.billableSeconds % 60}s` : "0s"}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        Rs {s.ratePerMinute || 10}/min
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        <span className={(s.totalCharge || 0) > 0 ? "text-amber-400" : "text-zinc-500"}>
                          Rs {safeFixed(s.totalCharge, 2)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-zinc-400">
                        {s.startedAt ? new Date(s.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "N/A"}
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
};

export default VoiceAnalyticsTab;
