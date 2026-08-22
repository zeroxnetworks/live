import React, { useState, useEffect } from "react";
import { AlertTriangle, Wallet, ArrowRight, X, Settings2, Sparkles, Zap, ShieldAlert } from "lucide-react";
import { UserAccount } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface LowBalanceBannerProps {
  cryptoRate?: number;
  currentUser: UserAccount | null;
  onTopUp: () => void;
  formatPrice: (units: number) => string;
}

export default function LowBalanceBanner({
  cryptoRate, currentUser, onTopUp, formatPrice }: LowBalanceBannerProps) {
  const [threshold, setThreshold] = useState<number>(() => {
    const saved = localStorage.getItem("zerox_low_balance_threshold");
    return saved ? Number(saved) : 50; // Default 50 units (~157.5 PKR)
  });

  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("zerox_low_balance_threshold", String(threshold));
  }, [threshold]);

  if (!currentUser || isDismissed) return null;

  const userBalance = currentUser.balance || 0;
  const isLow = userBalance < threshold;

  if (!isLow) return null;

  const userBalancePkr = (userBalance * (cryptoRate || 278)).toFixed(1);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.99 }}
        className="relative z-30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 shadow-sm backdrop-blur-sm overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Left: Icon & Warning Info */}
          <div className="flex items-start sm:items-center gap-3">
            <div className="relative p-2.5 bg-amber-500/20 text-amber-600 rounded-xl border border-amber-500/30 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-extrabold text-amber-950 flex items-center gap-1.5">
                  Low Balance Alert: {formatPrice(userBalance)} remaining
                  <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                    ₨ {userBalancePkr} PKR
                  </span>
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-amber-800 font-medium mt-0.5">
                Your wallet is below {threshold} units limit. Renting virtual numbers or ordering services may pause soon.
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-500/20 rounded-xl transition cursor-pointer text-xs flex items-center gap-1 font-bold"
              title="Customize Low Balance Alert Threshold"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Limit: {threshold}</span>
            </button>

            <button
              onClick={onTopUp}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer shrink-0 hover:scale-[1.02] active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 fill-white" />
              <span>Instant Top Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-amber-700 hover:text-amber-950 hover:bg-amber-500/20 rounded-xl transition cursor-pointer ml-1"
              title="Dismiss for session"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Customizable threshold dropdown panel */}
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t border-amber-500/20 flex flex-wrap items-center gap-2 text-xs font-bold text-amber-900"
          >
            <span>Notify me when balance is under:</span>
            {[20, 50, 100, 200, 500].map((val) => (
              <button
                key={val}
                onClick={() => {
                  setThreshold(val);
                  setShowSettings(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                  threshold === val
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300"
                }`}
              >
                {val} units (₨ {(val * (cryptoRate || 278)).toFixed(0)})
              </button>
            ))}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
