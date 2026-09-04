import React, { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "react-hot-toast";
import { 
  RefreshCw, CheckCircle2, Clock, AlertTriangle, XCircle, Search, 
  ExternalLink, Zap, ShieldCheck, Activity, ChevronRight, ChevronDown, Sparkles, Filter, CheckSquare
} from "lucide-react";
import { SmmOrder, SmmProvider, UserAccount, ActivationOrder } from "../types";
import { db } from "../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { sanitizeUrl } from "../lib/security";

interface OrderTrackingSyncProps {
  currentUser: UserAccount | null;
  smmOrders: SmmOrder[];
  setSmmOrders: React.Dispatch<React.SetStateAction<SmmOrder[]>>;
  smmProviders: SmmProvider[];
  activationOrders?: ActivationOrder[];
}

export default function OrderTrackingSync({
  currentUser,
  smmOrders,
  setSmmOrders,
  smmProviders,
  activationOrders = []
}: OrderTrackingSyncProps) {
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [syncIntervalSeconds, setSyncIntervalSeconds] = useState<number>(30);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [syncedCount, setSyncedCount] = useState<number>(0);
  const [hideDemoOrders, setHideDemoOrders] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(true);

  // Strict validator function: Returns true ONLY if order is a genuine, real order
  const isRealOrder = useCallback((o: SmmOrder): boolean => {
    if (!o) return false;

    // 1. Explicit demo/fake/test flags
    if ((o as any).isDemo || (o as any).isFake || (o as any).isTest || (o as any).isSample || (o as any).isMock) {
      return false;
    }

    // 2. Provider Order ID inspection
    const pRef = (o.providerOrderId || "").toString().trim().toUpperCase();
    if (!pRef || pRef === "0" || pRef === "N/A" || pRef === "NULL" || pRef === "UNDEFINED" || pRef === "NONE" || pRef === "DUMMY") {
      return false;
    }

    if (
      pRef.includes("DEMO") || 
      pRef.includes("TEST") || 
      pRef.includes("FAKE") || 
      pRef.includes("MOCK") || 
      pRef.includes("SAMPLE") || 
      pRef.includes("DUMMY") ||
      pRef.includes("TEMP") ||
      pRef === "12345" ||
      pRef === "123"
    ) {
      return false;
    }

    // 3. String content checks on service name, category name, link, and username
    const sName = (o.serviceName || "").toLowerCase();
    const catName = (o.categoryName || "").toLowerCase();
    const link = (o.link || "").toLowerCase();
    const username = (o.username || "").toLowerCase();

    if (
      sName.includes("demo") || sName.includes("fake order") || sName.includes("test order") || sName.includes("sample order") || sName.includes("dummy") ||
      catName.includes("demo") || catName.includes("fake") || catName.includes("test category") ||
      link.includes("example.com") || link.includes("demo.com") || link.includes("test.com") || link.includes("fake") || link.includes("dummy") ||
      username.includes("demo_user") || username.includes("test_user") || username.includes("fake_user")
    ) {
      return false;
    }

    return true;
  }, []);

  // Filter orders relevant to current user (or all if admin) and exclude demo/fake orders
  const mySmmOrders = React.useMemo(() => {
    let list = smmOrders;
    if (currentUser) {
      list = smmOrders.filter(o => o.userId === currentUser.id || o.username === currentUser.username);
    }

    if (hideDemoOrders) {
      list = list.filter(isRealOrder);
    }

    return list;
  }, [smmOrders, currentUser, hideDemoOrders, isRealOrder]);

  // Sync order statuses directly from providers API
  const handleSyncOrdersNow = useCallback(async (isSilent = false) => {
    if (isSyncing) return;

    // Active/all orders check
    const ordersToSync = mySmmOrders.length > 0 ? mySmmOrders : [];

    if (ordersToSync.length === 0) {
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      if (!isSilent) {
        toast.success("No orders found to sync.", { id: "sync-toast" });
      }
      return;
    }

    setIsSyncing(true);
    if (!isSilent) {
      toast.loading(`Syncing real-time status for ${ordersToSync.length} order(s)...`, { id: "sync-toast" });
    }

    let updatedCount = 0;
    const nowIso = new Date().toISOString();

    try {
      // First try server sync route
      const syncRes = await fetch("/api/smm/sync-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser?.id,
          orderIds: ordersToSync.map(p => p.id)
        })
      });

      if (syncRes.ok) {
        const syncData = await syncRes.json();
        if (syncData.updatedOrders && Array.isArray(syncData.updatedOrders) && syncData.updatedOrders.length > 0) {
          updatedCount = syncData.updatedCount || syncData.updatedOrders.length;
          setSmmOrders(prev => {
            const map = new Map<string, SmmOrder>(syncData.updatedOrders.map((u: SmmOrder) => [u.id, u]));
            return prev.map(o => map.has(o.id) ? { ...o, ...map.get(o.id) } : o);
          });
        }
      }

      // Fallback client-side check if server sync returned 0
      if (updatedCount === 0) {
        for (const order of ordersToSync) {
          const provider = smmProviders.find(p => p.id === order.providerId) || smmProviders[0];
          if (!provider || !provider.apiUrl || !provider.apiKey || !order.providerOrderId) continue;

          try {
            const res = await fetch("/api/smm/proxy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                apiUrl: provider.apiUrl,
                apiKey: provider.apiKey,
                action: "status",
                order: order.providerOrderId
              })
            });

            if (!res.ok) continue;
            const data = await res.json();

            if (data && !data.error) {
              const rawStatus = (data.status || "").toString().toLowerCase().trim();
              let nextStatus = order.status;

              if (rawStatus.includes("completed") || rawStatus.includes("finish") || rawStatus.includes("done")) {
                nextStatus = "Completed";
              } else if (rawStatus.includes("progress")) {
                nextStatus = "In Progress";
              } else if (rawStatus.includes("processing")) {
                nextStatus = "Processing";
              } else if (rawStatus.includes("partial")) {
                nextStatus = "Partial";
              } else if (rawStatus.includes("cancel") || rawStatus.includes("refund")) {
                nextStatus = "Canceled";
              }

              const startCount = data.start_count !== undefined ? Number(data.start_count) : order.startCount;
              const remains = data.remains !== undefined ? Number(data.remains) : order.remains;

              if (nextStatus !== order.status || remains !== order.remains || startCount !== order.startCount) {
                updatedCount++;
                setSmmOrders(prev => prev.map(o => o.id === order.id ? {
                  ...o,
                  status: nextStatus,
                  remains,
                  startCount,
                  updatedAt: nowIso
                } : o));

                try {
                  await updateDoc(doc(db, "smm_orders", order.id), {
                    status: nextStatus,
                    remains,
                    startCount,
                    updatedAt: nowIso
                  });
                } catch (e) {
                  console.error("Firestore sync error:", e);
                }
              }
            }
          } catch (err) {
            console.error(`Failed to sync provider order ${order.providerOrderId}:`, err);
          }
        }
      }

      setSyncedCount(prev => prev + updatedCount);
      setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      if (!isSilent) {
        if (updatedCount > 0) {
          toast.success(`Updated ${updatedCount} order status(es)!`, { id: "sync-toast" });
        } else {
          toast.success("Order statuses verified.", { id: "sync-toast" });
        }
      }
    } catch (err) {
      console.error("Auto Sync Error:", err);
      if (!isSilent) toast.error("Order status refresh encountered an error.", { id: "sync-toast" });
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, mySmmOrders, smmProviders, setSmmOrders]);

  // Automatic Background Interval Polling
  useEffect(() => {
    if (!autoSync) return;

    const timer = setInterval(() => {
      handleSyncOrdersNow(true);
    }, syncIntervalSeconds * 1000);

    return () => clearInterval(timer);
  }, [autoSync, syncIntervalSeconds, handleSyncOrdersNow]);

  // Filtered orders list for display
  const filteredOrders = mySmmOrders.filter(o => {
    const matchesFilter = filterStatus === "ALL" || o.status === filterStatus;
    const matchesSearch = 
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.link.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.providerOrderId && o.providerOrderId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Calculate status summary metrics
  const activeCount = mySmmOrders.filter(o => o.status === "PENDING" || o.status === "PROCESSING" || o.status === "IN_PROGRESS" || o.status === "PARTIAL").length;
  const completedCount = mySmmOrders.filter(o => o.status === "COMPLETED").length;
  const canceledCount = mySmmOrders.filter(o => o.status === "CANCELED" || o.status === "REJECTED").length;

  return (
    <div id="order-tracking-sync-card" className="relative overflow-hidden bg-slate-950 border border-slate-900 rounded-xl sm:rounded-2xl p-3.5 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-[#00AEEF]/10 space-y-3.5 sm:space-y-5">
      {/* Header & Controls Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-900/80 pb-3 sm:pb-4">
        <div>
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="p-1 sm:p-1.5 bg-[#00AEEF]/10 border border-[#00AEEF]/20 rounded-lg sm:rounded-xl text-[#00AEEF] shrink-0">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-pulse" />
            </span>
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider font-sans truncate">
              Live Order Tracking Engine
            </h3>
            <span className="bg-emerald-950/60 text-emerald-400 text-[8px] sm:text-[9px] font-black tracking-widest uppercase border border-emerald-500/20 px-2 sm:px-2.5 py-0.5 rounded-full shrink-0">
              Real-time Sync
            </span>
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 font-medium mt-1">
            Automatic live status updates and progress tracking for SMM campaigns and virtual numbers.
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
          {/* Real Orders Only Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !hideDemoOrders;
              setHideDemoOrders(next);
              if (next) {
                toast.success("Filtering active: Only Real Orders displayed (excluding demo/fake data).", { id: "real-orders-toast" });
              } else {
                toast("Showing all orders including demo & test data.", { id: "real-orders-toast" });
              }
            }}
            className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 sm:gap-1.5 cursor-pointer border ${
              hideDemoOrders 
                ? "bg-emerald-950/80 text-emerald-400 border-emerald-500/30 hover:bg-emerald-900 shadow-xs" 
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
            title={hideDemoOrders ? "Currently showing REAL orders only. Click to toggle." : "Click to hide fake & demo orders"}
          >
            <ShieldCheck className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${hideDemoOrders ? "text-emerald-400" : "text-slate-500"}`} />
            <span>{hideDemoOrders ? "Real Orders Only" : "All Orders"}</span>
          </button>

          {/* Auto-Sync Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-900 border border-slate-800 rounded-lg sm:rounded-xl px-2.5 sm:px-3 py-1 sm:py-1.5">
            <span className="text-[8.5px] sm:text-[9px] font-black font-mono text-slate-400 uppercase tracking-widest">Auto-Sync</span>
            <button
              type="button"
              onClick={() => setAutoSync(!autoSync)}
              className={`relative inline-flex h-4 sm:h-5 w-8 sm:w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                autoSync ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-3 sm:h-4 w-3 sm:w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  autoSync ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
            {autoSync && (
              <span className="flex h-1.5 sm:h-2 w-1.5 sm:w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 sm:h-2 w-1.5 sm:w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>

          {/* Sync Interval Selector */}
          {autoSync && (
            <select
              value={syncIntervalSeconds}
              onChange={(e) => setSyncIntervalSeconds(Number(e.target.value))}
              className="bg-slate-900 border border-slate-850 text-slate-300 font-mono font-bold text-[10px] sm:text-xs rounded-lg sm:rounded-xl px-2 sm:px-2.5 py-1 sm:py-1.5 outline-none cursor-pointer hover:bg-slate-800"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          )}

          {/* Manual Sync Now Button */}
          <button
            type="button"
            disabled={isSyncing}
            onClick={() => handleSyncOrdersNow(false)}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-lg sm:rounded-xl shadow-xs transition flex items-center gap-1 sm:gap-1.5 active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg sm:rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all text-xs font-semibold cursor-pointer"
            title={isMinimized ? "Expand section" : "Minimize section"}
          >
            <span className="hidden sm:inline text-[11px] text-slate-400">
              {isMinimized ? "Expand" : "Minimize"}
            </span>
            <ChevronDown className={`w-4 h-4 text-[#00AEEF] neon-arrow-bounce transition-transform duration-300 ${isMinimized ? "" : "rotate-180"}`} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-slate-900/30 border border-slate-900 rounded-lg sm:rounded-xl p-2.5 sm:p-3.5">
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-0.5 sm:mb-1">Active Orders</span>
          <span className="text-base sm:text-lg font-black text-amber-500 font-mono">{activeCount}</span>
        </div>
        <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-2.5 sm:p-3.5">
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-0.5 sm:mb-1">Completed</span>
          <span className="text-base sm:text-lg font-black text-emerald-400 font-mono">{completedCount}</span>
        </div>
        <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-2.5 sm:p-3.5">
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-0.5 sm:mb-1">Canceled</span>
          <span className="text-base sm:text-lg font-black text-rose-500 font-mono">{canceledCount}</span>
        </div>
        <div className="bg-slate-900/30 border border-slate-900 rounded-xl p-2.5 sm:p-3.5">
          <span className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-0.5 sm:mb-1">Last Synced</span>
          <span className="text-[10px] sm:text-xs font-black text-slate-300 font-mono truncate block mt-0.5">
            {lastSyncedTime || "Just now"}
          </span>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 pt-1 sm:pt-2">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 custom-scrollbar">
          {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "CANCELED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg sm:rounded-xl text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer border ${
                filterStatus === status
                  ? "bg-slate-100 text-slate-950 border-white"
                  : "bg-slate-900 text-slate-400 border-slate-800/60 hover:text-white"
              }`}
            >
              {status === "ALL" ? "All Orders" : status === "IN_PROGRESS" ? "Processing" : status.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order ID or link..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500 font-mono"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto custom-scrollbar">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-900 rounded-2xl bg-slate-900/10">
            <CheckSquare className="h-6 w-6 text-slate-700 mx-auto mb-2" />
            <p className="text-[10px] text-slate-500 font-black font-mono uppercase tracking-widest">No matching orders found.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs min-w-[750px]">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 font-black text-[9px] uppercase tracking-wider font-mono">
                <th className="py-3 px-3">Order ID</th>
                <th className="py-3 px-3">Service Package</th>
                <th className="py-3 px-3">Target Link</th>
                <th className="py-3 px-3 text-right">Quantity</th>
                <th className="py-3 px-3 text-center">Progress</th>
                <th className="py-3 px-3 text-right">Charge</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {filteredOrders.map((ord) => {
                const remains = ord.remains ?? 0;
                const completed = ord.quantity - remains;
                const progressPct = ord.quantity > 0 ? Math.min(100, Math.max(0, Math.round((completed / ord.quantity) * 100))) : 0;

                return (
                  <tr key={ord.id} className="hover:bg-slate-900/20 transition-colors border-b border-slate-900/40">
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-400 text-[10px]">
                      <div>#{ord.id.toString().slice(-8)}</div>
                      {ord.providerOrderId && (
                        <div className="text-[8.5px] text-slate-600 font-normal">Network Ref: #{ord.providerOrderId}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-slate-200 line-clamp-1 max-w-[200px] text-xs" title={ord.serviceName}>
                        {ord.serviceName}
                      </div>
                      <div className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{ord.categoryName}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <a
                        href={sanitizeUrl(ord.link)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#00e1ff] hover:underline font-mono text-[10.5px] font-bold flex items-center gap-1 max-w-[140px] truncate"
                        title={ord.link}
                      >
                        <span className="truncate">{ord.link}</span>
                        <ExternalLink className="h-3 w-3 shrink-0 text-[#00AEEF]" />
                      </a>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-black text-slate-300">
                      {ord.quantity.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="w-24 mx-auto space-y-1">
                        <div className="flex justify-between text-[8.5px] font-mono font-bold text-slate-500">
                          <span>{completed}</span>
                          <span>{ord.quantity}</span>
                        </div>
                        <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              ord.status === "COMPLETED" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                              ord.status === "IN_PROGRESS" || ord.status === "PROCESSING" ? "bg-blue-500" :
                              "bg-amber-500"
                            }`}
                            style={{ width: `${ord.status === "COMPLETED" ? 100 : progressPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-black text-slate-200">
                      ₨ {ord.charge.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                        ord.status === "COMPLETED" ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/20" :
                        ord.status === "IN_PROGRESS" || ord.status === "PROCESSING" ? "bg-blue-950/30 text-[#00AEEF] border-[#00AEEF]/20 animate-pulse" :
                        ord.status === "PENDING" ? "bg-amber-950/20 text-amber-500 border-amber-500/20" :
                        "bg-rose-950/20 text-rose-400 border-rose-500/20"
                      }`}>
                        {ord.status === "COMPLETED" ? <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> :
                         ord.status === "IN_PROGRESS" || ord.status === "PROCESSING" ? <Clock className="h-2.5 w-2.5 text-[#00AEEF]" /> :
                         <AlertTriangle className="h-2.5 w-2.5" />}
                        <span className="ml-0.5">{ord.status}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
        </div>
      )}
    </div>
  );
}
