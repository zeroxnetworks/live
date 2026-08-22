import React, { useState, useEffect } from "react";
import { 
  Activity, Sparkles, DollarSign, Smartphone, TrendingUp, 
  CheckCircle2, Bell, RefreshCw, Pause, Play, ShieldAlert,
  ArrowUpRight, Clock, Tag, ExternalLink, ChevronDown
} from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface ActivityItem {
  id: string;
  type: "topup" | "service" | "activation" | "smm" | "system";
  title: string;
  description: string;
  timestamp: string;
  badgeText: string;
  amount?: string;
  iconType: "topup" | "service" | "activation" | "smm" | "system";
  timeAgoInSeconds: number;
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<"all" | "topup" | "service" | "activation" | "smm">("all");
  const [isLive, setIsLive] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("Just now");
  const [isMinimized, setIsMinimized] = useState<boolean>(true);

  // Real-time Firestore subscription to real orders, deposits, and SMM activities
  useEffect(() => {
    if (!isLive) return;

    const itemsMap: Map<string, ActivityItem> = new Map();

    // 1. Subscribe to SMS Orders
    const ordersQuery = query(collection(db, "orders"), limit(10));
    const unsubOrders = onSnapshot(ordersQuery, (snap) => {
      snap.forEach(d => {
        const data = d.data();
        const createdMs = data.created_at ? new Date(data.created_at).getTime() : Date.now();
        const diffSec = Math.max(0, Math.floor((Date.now() - createdMs) / 1000));
        
        itemsMap.set(`ord_${d.id}`, {
          id: `ord_${d.id}`,
          type: "activation",
          title: `SMS Verification ${data.status || 'Active'}`,
          description: `${data.country || 'Global'} ${data.product || 'Service'} number assigned`,
          timestamp: diffSec < 60 ? "Just now" : `${Math.floor(diffSec / 60)}m ago`,
          badgeText: data.status === "RECEIVED" ? "SMS Delivered" : "Line Active",
          amount: data.price ? `₨ ${data.price}` : undefined,
          iconType: "activation",
          timeAgoInSeconds: diffSec
        });
      });
      updateActivities();
    }, (err) => console.warn("ActivityFeed orders err:", err));

    // 2. Subscribe to SMM Orders
    const smmQuery = query(collection(db, "smm_orders"), limit(10));
    const unsubSmm = onSnapshot(smmQuery, (snap) => {
      snap.forEach(d => {
        const data = d.data();
        const createdMs = data.created_at ? new Date(data.created_at).getTime() : Date.now();
        const diffSec = Math.max(0, Math.floor((Date.now() - createdMs) / 1000));

        itemsMap.set(`smm_${d.id}`, {
          id: `smm_${d.id}`,
          type: "smm",
          title: `SMM Order: ${data.serviceName || 'Service Boost'}`,
          description: `Qty: ${data.quantity || 1000} • Status: ${data.status || 'Pending'}`,
          timestamp: diffSec < 60 ? "Just now" : `${Math.floor(diffSec / 60)}m ago`,
          badgeText: `SMM ${data.status || 'Processing'}`,
          amount: data.charge ? `₨ ${data.charge}` : undefined,
          iconType: "smm",
          timeAgoInSeconds: diffSec
        });
      });
      updateActivities();
    }, (err) => console.warn("ActivityFeed smm err:", err));

    // 3. Subscribe to Deposits / Payments
    const depositsQuery = query(collection(db, "payments_received"), limit(10));
    const unsubDeposits = onSnapshot(depositsQuery, (snap) => {
      snap.forEach(d => {
        const data = d.data();
        const createdMs = data.created_at ? new Date(data.created_at).getTime() : Date.now();
        const diffSec = Math.max(0, Math.floor((Date.now() - createdMs) / 1000));

        itemsMap.set(`dep_${d.id}`, {
          id: `dep_${d.id}`,
          type: "topup",
          title: `Wallet Deposit Verified`,
          description: `TID ${data.transaction_id || d.id} • ${data.sender_info || 'Bank Email'}`,
          timestamp: diffSec < 60 ? "Just now" : `${Math.floor(diffSec / 60)}m ago`,
          badgeText: data.status === "claimed" ? "Claimed & Credited" : "Top-Up Pending",
          amount: data.amount ? `₨ ${data.amount}` : undefined,
          iconType: "topup",
          timeAgoInSeconds: diffSec
        });
      });
      updateActivities();
    }, (err) => console.warn("ActivityFeed deposits err:", err));

    function updateActivities() {
      const sorted = Array.from(itemsMap.values()).sort((a, b) => a.timeAgoInSeconds - b.timeAgoInSeconds);
      setActivities(sorted.slice(0, 20));
      setLastRefreshed(new Date().toLocaleTimeString());
    }

    return () => {
      unsubOrders();
      unsubSmm();
      unsubDeposits();
    };
  }, [isLive]);

  // Timer to increment seconds and format relative time
  useEffect(() => {
    const interval = setInterval(() => {
      setActivities(prev => 
        prev.map(item => {
          const newSeconds = item.timeAgoInSeconds + 5;
          let timeLabel = "Just now";
          if (newSeconds >= 3600) {
            timeLabel = `${Math.floor(newSeconds / 3600)}h ago`;
          } else if (newSeconds >= 60) {
            timeLabel = `${Math.floor(newSeconds / 60)}m ago`;
          } else if (newSeconds > 15) {
            timeLabel = `${newSeconds}s ago`;
          }
          return {
            ...item,
            timeAgoInSeconds: newSeconds,
            timestamp: timeLabel
          };
        })
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  const filteredActivities = activities.filter(a => {
    if (filter === "all") return true;
    return a.type === filter;
  });

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case "topup":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "service":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "activation":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "smm":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case "topup":
        return <DollarSign className="h-4 w-4 text-emerald-600" />;
      case "service":
        return <Sparkles className="h-4 w-4 text-indigo-600" />;
      case "activation":
        return <Smartphone className="h-4 w-4 text-blue-600" />;
      case "smm":
        return <TrendingUp className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div id="activity-feed-card" className="relative overflow-hidden bg-slate-950 border border-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-indigo-500/10 space-y-3 sm:space-y-4">
      {/* Feed Header */}
      <div className="flex flex-row items-center justify-between gap-2 border-b border-slate-900/80 pb-2.5 sm:pb-3.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span className="p-1 sm:p-1.5 bg-indigo-950/40 border border-indigo-500/20 rounded-lg sm:rounded-xl text-indigo-400 shrink-0">
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </span>
            <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider font-sans truncate">
              System Activity Feed
            </h3>
            {isLive ? (
              <span className="bg-emerald-950/60 text-emerald-400 text-[8px] sm:text-[9px] font-black tracking-widest uppercase border border-emerald-500/20 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full flex items-center gap-1 shrink-0 animate-pulse">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" /> LIVE
              </span>
            ) : (
              <span className="bg-slate-900 text-slate-400 text-[8px] sm:text-[9px] font-black tracking-widest uppercase border border-slate-800 px-2 py-0.5 sm:px-2.5 sm:py-0.5 rounded-full shrink-0">
                PAUSED
              </span>
            )}
          </div>
          <p className="hidden sm:block text-[11px] text-slate-400 mt-1 font-medium leading-normal">
            Real-time updates on completed top-ups, new virtual number services, and system events
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1 sm:gap-1.5 cursor-pointer border ${
              isLive 
                ? "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800" 
                : "bg-emerald-600 text-white shadow-xs border-emerald-500 hover:bg-emerald-700"
            }`}
            title={isLive ? "Pause live event stream" : "Resume live event stream"}
          >
            {isLive ? <Pause className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> : <Play className="h-3 w-3 sm:h-3.5 sm:w-3.5" />}
            <span className="hidden xs:inline sm:inline">{isLive ? "Pause" : "Resume"}</span>
          </button>

          <button
            onClick={handleManualRefresh}
            className="p-1.5 sm:p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-lg sm:rounded-xl transition cursor-pointer"
            title="Refresh feed"
          >
            <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
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
        <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-200">
          {/* Filter Category Tabs */}
      <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        <button
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer border ${
            filter === "all"
              ? "bg-slate-100 text-slate-950 border-white"
              : "bg-slate-900 text-slate-400 border-slate-800/80 hover:text-white"
          }`}
        >
          All ({activities.length})
        </button>

        <button
          onClick={() => setFilter("topup")}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer flex items-center gap-1 sm:gap-1.5 border ${
            filter === "topup"
              ? "bg-emerald-950 text-emerald-400 border-emerald-500/30"
              : "bg-slate-900 text-slate-400 border-slate-800/80 hover:text-white"
          }`}
        >
          <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-emerald-400" />
          <span>Top-Ups</span>
        </button>

        <button
          onClick={() => setFilter("service")}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer flex items-center gap-1 sm:gap-1.5 border ${
            filter === "service"
              ? "bg-indigo-950 text-indigo-400 border-indigo-500/30"
              : "bg-slate-900 text-slate-400 border-slate-800/80 hover:text-white"
          }`}
        >
          <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-indigo-400" />
          <span>Services</span>
        </button>

        <button
          onClick={() => setFilter("activation")}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer flex items-center gap-1 sm:gap-1.5 border ${
            filter === "activation"
              ? "bg-[#00AEEF]/20 text-[#00AEEF] border-[#00AEEF]/30"
              : "bg-slate-900 text-slate-400 border-slate-800/80 hover:text-white"
          }`}
        >
          <Smartphone className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-[#00AEEF]" />
          <span>SMS</span>
        </button>

        <button
          onClick={() => setFilter("smm")}
          className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition whitespace-nowrap cursor-pointer flex items-center gap-1 sm:gap-1.5 border ${
            filter === "smm"
              ? "bg-purple-950 text-purple-400 border-purple-500/30"
              : "bg-slate-900 text-slate-400 border-slate-800/80 hover:text-white"
          }`}
        >
          <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-purple-400" />
          <span>SMM</span>
        </button>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-1.5 sm:space-y-2.5 max-h-[320px] sm:max-h-[380px] overflow-y-auto pr-0.5 sm:pr-1 custom-scrollbar">
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8 sm:py-12 text-slate-500">
            <Activity className="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-slate-700 mb-2 sm:mb-3 stroke-1" />
            <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest font-mono">No updates found</p>
          </div>
        ) : (
          filteredActivities.map((act) => (
            <div
              key={act.id}
              className="group p-2.5 sm:p-4 bg-slate-900/30 hover:bg-slate-900/60 border border-slate-900/80 hover:border-slate-800/80 rounded-xl sm:rounded-2xl transition duration-300 flex items-start justify-between gap-2 sm:gap-3"
            >
              <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0">
                <span className="p-1.5 sm:p-2.5 bg-slate-950 rounded-lg sm:rounded-xl border border-slate-800 shrink-0 mt-0.5 group-hover:scale-105 transition duration-300">
                  {getIcon(act.iconType)}
                </span>

                <div className="space-y-0.5 sm:space-y-1 min-w-0">
                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <h4 className="text-[11px] sm:text-xs font-bold text-slate-100 group-hover:text-indigo-400 transition duration-200 truncate">
                      {act.title}
                    </h4>
                    <span className="px-1.5 py-0.2 sm:px-2 sm:py-0.5 bg-slate-950 text-slate-400 border border-slate-800/80 rounded-md text-[7.5px] sm:text-[8px] font-black font-mono tracking-wider uppercase shrink-0">
                      {act.badgeText}
                    </span>
                  </div>

                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium leading-snug sm:leading-relaxed line-clamp-2 sm:line-clamp-none">
                    {act.description}
                  </p>

                  <div className="flex items-center gap-2 sm:gap-3 text-[8.5px] sm:text-[9px] text-slate-500 font-mono pt-0.5">
                    <span className="flex items-center gap-1 font-bold text-slate-400">
                      <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                      {act.timestamp}
                    </span>
                    <span className="hidden sm:inline">• GATEWAY TELEMETRY</span>
                  </div>
                </div>
              </div>

              {act.amount && (
                <div className="text-right shrink-0">
                  <span className="text-[10px] sm:text-[11px] font-black font-mono text-emerald-400 bg-emerald-950/20 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border border-emerald-500/10 inline-block">
                    {act.amount}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
        </div>
      )}
    </div>
  );
}
