import React from "react";
import { Wallet, Award, Activity, ShieldCheck, ShoppingCart, CheckCircle2, TrendingUp } from "lucide-react";
import CurrencyDisplay from "./CurrencyDisplay";

interface DashboardStatsProps {
  profile: any;
  activeCount: number;
  completedCount: number;
  onOpenSettings: () => void;
  formatPrice: (baseUnits: number) => string;
}

export default function DashboardStats({
  profile,
  activeCount,
  completedCount,
  onOpenSettings,
  formatPrice
}: DashboardStatsProps) {
  const userBalance = profile?.balance || 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Professional Dashboard Header */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <span className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </span>
            Account Insight
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium tracking-wide uppercase font-mono opacity-80">
            Real-time monitoring & secure gateway status
          </p>
        </div>
        
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[9px] font-black text-slate-300 font-mono tracking-widest uppercase">System Encrypted</span>
        </div>
      </div>

      {/* High-Fidelity Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Available Balance Card */}
        <div className="relative group overflow-hidden bg-zinc-950 border border-zinc-900 rounded-2xl p-6 transition-all duration-300 hover:border-blue-500/30 shadow-2xl">
          <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-12">
            <Wallet className="w-24 h-24 text-blue-500" />
          </div>
          
          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 font-mono">
                Available Liquidity
              </span>
            </div>
            
            <div className="space-y-1">
              <CurrencyDisplay 
                baseUnits={userBalance} 
                formatPrice={formatPrice} 
                amountClassName="text-3xl sm:text-4xl font-black text-white font-mono tracking-tighter"
                usdClassName="text-blue-400 font-black mt-2 text-sm sm:text-base opacity-90 block"
              />
            </div>
            
            <div className="pt-4 border-t border-zinc-900/50 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-600 font-mono uppercase tracking-widest">Valuation Index</span>
              <span className="text-[10px] font-black text-emerald-500 font-mono">PKR / USD</span>
            </div>
          </div>
        </div>

        {/* Order Performance Card */}
        <div className="relative group overflow-hidden bg-zinc-950 border border-zinc-900 rounded-2xl p-6 transition-all duration-300 hover:border-emerald-500/30 shadow-2xl">
          <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity -rotate-12">
            <ShoppingCart className="w-24 h-24 text-emerald-500" />
          </div>

          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 font-mono">
                Order Activity
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-tighter">Active</span>
                <div className="text-2xl font-black text-white font-mono">{activeCount}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-slate-500 uppercase font-mono tracking-tighter">Completed</span>
                <div className="text-2xl font-black text-emerald-500 font-mono">{completedCount}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span className="text-[9px] font-bold text-slate-600 uppercase font-mono">Success Rate</span>
              </div>
              <span className="text-[10px] font-black text-white font-mono">99.9%</span>
            </div>
          </div>
        </div>

        {/* Gateway Rating Card */}
        <div className="relative group overflow-hidden bg-zinc-950 border border-zinc-900 rounded-2xl p-6 transition-all duration-300 hover:border-amber-500/30 shadow-2xl">
          <div className="absolute -top-4 -right-4 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity rotate-[25deg]">
            <Award className="w-24 h-24 text-amber-500" />
          </div>

          <div className="relative z-10 space-y-5">
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b] animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 font-mono">
                Gateway Score
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <h3 className="text-4xl font-black font-mono text-white tracking-tighter">
                {profile?.rating !== undefined ? (Number.isFinite(Number(profile.rating)) ? Number(profile.rating).toFixed(2) : "5.00") : "5.00"}
              </h3>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>

            <p className="text-[10.5px] text-slate-400 font-medium leading-relaxed opacity-80">
              Your trust rating determines maximum daily purchase limits and priority delivery.
            </p>

            <div className="pt-4 border-t border-zinc-900/50 flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-600 font-mono uppercase tracking-widest">Tier Rank</span>
              <span className="text-[10px] font-black text-amber-500 font-mono uppercase">Platinum</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
