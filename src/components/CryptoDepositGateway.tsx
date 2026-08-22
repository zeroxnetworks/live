import React, { useState, useEffect } from "react";
import {
  Sparkles, Copy, Check, QrCode, RefreshCw, CheckCircle2,
  XCircle, AlertCircle, ArrowLeft, Zap, AlertTriangle
} from "lucide-react";
import { toast } from "react-hot-toast";
import { UserAccount } from "../types";

export interface ActiveCryptoDeposit {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  nowpaymentsPaymentId?: string;
  requestedAmountUSD: number;
  requestedAmountPKR: number;
  cryptoCurrency: string;
  network: string;
  payCurrency: string;
  payAmount: number;
  payAddress: string;
  expirationTime: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  status: "waiting" | "confirming" | "confirmed" | "sending" | "finished" | "partially_paid" | "failed" | "expired" | "refunded" | "requires_review";
  actuallyPaid: number;
  txHash?: string;
  isCredited: boolean;
}

export interface PopularCryptoItem {
  id: string;
  token: string;
  label: string;
  network: string;
  payCurrency: string;
  minDepositUSD: number;
  minDepositCoin?: number;
  minDepositDisplay?: string;
  minDepositUsdDisplay?: string;
  icon: string;
  popular?: boolean;
  explorerUrl?: string;
}

// Fallback curated popular list
const FALLBACK_POPULAR_CURRENCIES: PopularCryptoItem[] = [
  { id: "btc", token: "BTC", label: "Bitcoin", network: "BTC Mainnet", payCurrency: "btc", minDepositUSD: 19.05, minDepositDisplay: "Min: 0.0003 BTC", minDepositUsdDisplay: "0.0003 BTC ≈ $19.05 USD", icon: "₿" },
  { id: "eth", token: "ETH", label: "Ethereum", network: "ETH Mainnet", payCurrency: "eth", minDepositUSD: 19.05, minDepositDisplay: "Min: 0.010 ETH", minDepositUsdDisplay: "0.010 ETH ≈ $19.05 USD", icon: "Ξ" },
  { id: "usdt_trc20", token: "USDT", label: "Tether", network: "TRC20", payCurrency: "usdttrc20", minDepositUSD: 11.45, minDepositDisplay: "Min: 11.45 USDT", minDepositUsdDisplay: "11.45 USDT ≈ $11.45 USD", icon: "₮" },
  { id: "usdt_erc20", token: "USDT", label: "Tether", network: "ERC20", payCurrency: "usdt", minDepositUSD: 19.05, minDepositDisplay: "Min: 19.05 USDT", minDepositUsdDisplay: "19.05 USDT ≈ $19.05 USD", icon: "₮" },
  { id: "usdt_bsc", token: "USDT", label: "Tether", network: "BEP20 (BSC)", payCurrency: "usdtbsc", minDepositUSD: 12.08, minDepositDisplay: "Min: 12.08 USDT", minDepositUsdDisplay: "12.08 USDT ≈ $12.08 USD", icon: "₮" },
  { id: "usdc_erc20", token: "USDC", label: "USD Coin", network: "ERC20", payCurrency: "usdc", minDepositUSD: 12.85, minDepositDisplay: "Min: 12.85 USDC", minDepositUsdDisplay: "12.85 USDC ≈ $12.85 USD", icon: "💲" },
  { id: "usdc_sol", token: "USDC", label: "USD Coin", network: "Solana", payCurrency: "usdcsol", minDepositUSD: 12.58, minDepositDisplay: "Min: 12.58 USDC", minDepositUsdDisplay: "12.58 USDC ≈ $12.58 USD", icon: "💲" },
  { id: "bnb", token: "BNB", label: "BNB", network: "BEP20 (BSC)", payCurrency: "bnbbsc", minDepositUSD: 12.08, minDepositDisplay: "Min: 0.020 BNB", minDepositUsdDisplay: "0.020 BNB ≈ $12.08 USD", icon: "🟡" },
  { id: "sol", token: "SOL", label: "Solana", network: "SOL Mainnet", payCurrency: "sol", minDepositUSD: 19.05, minDepositDisplay: "Min: 0.250 SOL", minDepositUsdDisplay: "0.250 SOL ≈ $19.05 USD", icon: "🟣" },
  { id: "ltc", token: "LTC", label: "Litecoin", network: "LTC Mainnet", payCurrency: "ltc", minDepositUSD: 19.05, minDepositDisplay: "Min: 0.420 LTC", minDepositUsdDisplay: "0.420 LTC ≈ $19.05 USD", icon: "Ł" },
  { id: "doge", token: "DOGE", label: "Dogecoin", network: "DOGE Mainnet", payCurrency: "doge", minDepositUSD: 19.05, minDepositDisplay: "Min: 265.4 DOGE", minDepositUsdDisplay: "265.4 DOGE ≈ $19.05 USD", icon: "Ð" },
  { id: "xrp", token: "XRP", label: "XRP", network: "XRP Mainnet", payCurrency: "xrp", minDepositUSD: 11.80, minDepositDisplay: "Min: 18.68 XRP", minDepositUsdDisplay: "18.68 XRP ≈ $11.80 USD", icon: "✕" },
  { id: "trx", token: "TRX", label: "TRON", network: "TRX Mainnet", payCurrency: "trx", minDepositUSD: 11.80, minDepositDisplay: "Min: 56.50 TRX", minDepositUsdDisplay: "56.50 TRX ≈ $11.80 USD", icon: "▲" }
];

interface CryptoDepositGatewayProps {
  currentUser: UserAccount | null;
  cryptoRate?: number;
  cryptoMinDeposit?: number;
  formatPrice: (baseUnits: number) => string;
  onDepositCompleted?: () => void;
  depositHistory?: any[];
}

export default function CryptoDepositGateway({
  currentUser,
  cryptoRate = 278,
  cryptoMinDeposit = 20,
  formatPrice,
  onDepositCompleted,
  depositHistory = []
}: CryptoDepositGatewayProps) {
  const [currencies, setCurrencies] = useState<PopularCryptoItem[]>(FALLBACK_POPULAR_CURRENCIES);
  const [selectedCurrencyId, setSelectedCurrencyId] = useState<string>("usdt_trc20");
  const [amountUSD, setAmountUSD] = useState<string>("20");
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [activeDeposit, setActiveDeposit] = useState<ActiveCryptoDeposit | null>(null);
  const [hasInitializedFromHistory, setHasInitializedFromHistory] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(1800);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [gatewayStatusInfo, setGatewayStatusInfo] = useState({
    gatewayStatus: "enabled",
    apiConnectionStatus: "Connected",
    loading: true,
  });

  // Safe depositHistory check
  const safeHistory = Array.isArray(depositHistory) ? depositHistory : [];

  useEffect(() => {
    if (!hasInitializedFromHistory && safeHistory.length > 0) {
      const active = safeHistory.find(d => 
        d && 
        d.userId === currentUser?.id && 
        d.method === "crypto" && 
        ["waiting", "confirming", "confirmed", "sending"].includes(d.status)
      ) as ActiveCryptoDeposit | undefined;

      if (active) {
        setActiveDeposit(active);
      }
      setHasInitializedFromHistory(true);
    }
  }, [safeHistory, hasInitializedFromHistory, currentUser?.id]);

  useEffect(() => {
    let isMounted = true;
    async function loadStatusAndCurrencies() {
      try {
        const [statusRes, currenciesRes] = await Promise.all([
          fetch("/api/crypto/status").catch(() => null),
          fetch("/api/crypto/currencies").catch(() => null),
        ]);

        if (isMounted && statusRes && statusRes.ok) {
          const statusData = await statusRes.json().catch(() => null);
          if (statusData?.success) {
            setGatewayStatusInfo({
              gatewayStatus: statusData.gatewayStatus ?? "enabled",
              apiConnectionStatus: statusData.apiConnectionStatus ?? "Connected",
              loading: false,
            });
          } else {
            setGatewayStatusInfo(prev => ({ ...prev, loading: false }));
          }
        } else if (isMounted) {
          setGatewayStatusInfo(prev => ({ ...prev, loading: false }));
        }

        if (isMounted && currenciesRes && currenciesRes.ok) {
          const currenciesData = await currenciesRes.json().catch(() => null);
          if (currenciesData?.success && Array.isArray(currenciesData.currencies) && currenciesData.currencies.length > 0) {
            const safeList: PopularCryptoItem[] = currenciesData.currencies
              .filter((c: any) => c && (c.payCurrency || c.id))
              .map((c: any) => ({
                id: String(c.id || c.payCurrency || "btc").toLowerCase(),
                token: String(c.token || c.code || "CRYPTO").toUpperCase(),
                label: String(c.label || c.name || c.token || "Crypto"),
                network: String(c.network || "Mainnet"),
                payCurrency: String(c.payCurrency || c.id || "btc").toLowerCase(),
                minDepositUSD: Number(c.minDepositUSD) || 19.05,
                minDepositCoin: Number(c.minDepositCoin) || 0,
                minDepositDisplay: c.minDepositDisplay ? String(c.minDepositDisplay) : undefined,
                minDepositUsdDisplay: c.minDepositUsdDisplay ? String(c.minDepositUsdDisplay) : undefined,
                icon: String(c.icon || "🪙"),
                explorerUrl: c.explorerUrl ? String(c.explorerUrl) : undefined
              }));

            if (safeList.length > 0) {
              setCurrencies(safeList);
              if (!safeList.some(item => item.id === selectedCurrencyId)) {
                setSelectedCurrencyId(safeList[0].id);
              }
            }
          }
        }
      } catch (err) {
        console.warn("Failed to load crypto gateway info safely:", err);
        if (isMounted) setGatewayStatusInfo((prev) => ({ ...prev, loading: false }));
      }
    }
    loadStatusAndCurrencies();
    return () => { isMounted = false; };
  }, []);

  const selectedCurrency = currencies.find(c => c.id === selectedCurrencyId) || currencies[0] || FALLBACK_POPULAR_CURRENCIES[0];

  const amountUSDNum = Number(amountUSD) || 0;
  const amountPKR = Math.round(amountUSDNum * cryptoRate);

  // Status polling for active deposit
  useEffect(() => {
    if (!activeDeposit?.id || activeDeposit.status === "finished" || activeDeposit.status === "expired" || activeDeposit.status === "failed") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/crypto/payment-status/${activeDeposit.id}`).catch(() => null);
        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.success && data.deposit) {
            const updated = data.deposit as ActiveCryptoDeposit;
            if (activeDeposit.status !== "finished" && updated.status === "finished") {
              toast.success("🎉 Crypto Deposit Confirmed & Credited!");
              if (onDepositCompleted) onDepositCompleted();
            }
            setActiveDeposit(updated);
          }
        }
      } catch (err) {
        console.warn("Error polling deposit status safely:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [activeDeposit?.id, activeDeposit?.status, onDepositCompleted]);

  // Countdown timer
  useEffect(() => {
    if (!activeDeposit?.expirationTime) return;
    const calculateTimeLeft = () => {
      try {
        const now = new Date().getTime();
        const exp = new Date(activeDeposit.expirationTime).getTime();
        if (isNaN(exp)) return;
        const diff = Math.max(0, Math.floor((exp - now) / 1000));
        setTimeRemainingSeconds(diff);
        if (diff === 0 && activeDeposit.status === "waiting") {
          setActiveDeposit(prev => prev ? { ...prev, status: "expired" } : null);
        }
      } catch {
        // ignore date error
      }
    };
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [activeDeposit?.expirationTime, activeDeposit?.status]);

  const handleCopy = (text: string, fieldKey: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!currentUser) {
      return setErrorMsg("Please log in to generate a crypto deposit payment address.");
    }

    if (!selectedCurrency) {
      return setErrorMsg("Please select a supported cryptocurrency.");
    }

    const minRequiredUSD = selectedCurrency.minDepositUSD || cryptoMinDeposit || 20;

    if (amountUSDNum < minRequiredUSD) {
      return setErrorMsg(`Minimum deposit amount for ${selectedCurrency.token} (${selectedCurrency.network}) is $${minRequiredUSD}.00 USD.`);
    }

    setIsCreating(true);

    try {
      const res = await fetch("/api/crypto/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          username: currentUser.username || currentUser.fullName || "User",
          userEmail: currentUser.email || "",
          cryptoCurrency: selectedCurrency.token,
          network: selectedCurrency.network,
          amountUSD: amountUSDNum,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const errText = data?.error || "Failed to initialize crypto deposit.";
        setErrorMsg(errText);
        toast.error(errText);
      } else if (data.deposit) {
        setActiveDeposit(data.deposit);
        toast.success("Crypto payment created successfully!");
      } else {
        setErrorMsg("Gateway returned an incomplete payment response. Please try again.");
      }
    } catch (err: any) {
      setErrorMsg("Crypto payment service is temporarily unavailable. Please try again later.");
    } finally {
      setIsCreating(false);
    }
  };

  const formatCountdown = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const safeFormatDate = (dateVal: any) => {
    if (!dateVal) return "N/A";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString();
    } catch {
      return "N/A";
    }
  };

  const safeFormatNumber = (numVal: any) => {
    const n = Number(numVal);
    if (isNaN(n)) return "0";
    return n.toLocaleString();
  };

  // Standard high contrast black-on-white QR Code encoding the real payment address
  const qrCodeUrl = activeDeposit?.payAddress
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(activeDeposit.payAddress)}&bgcolor=ffffff&color=000000&qzone=1&format=png`
    : "";

  // Payment History filtered defensively
  const myCryptoHistory = safeHistory
    .filter((d) => d && d.userId === currentUser?.id && d.method === "crypto" && d.status !== "PENDING")
    .sort((a, b) => {
      const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
    });

  if (gatewayStatusInfo.loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-slate-900/90 rounded-3xl border border-slate-800">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-400">Loading Crypto Gateway...</p>
      </div>
    );
  }

  if (gatewayStatusInfo.gatewayStatus !== "enabled" || gatewayStatusInfo.apiConnectionStatus !== "Connected") {
    return (
      <div className="flex flex-col items-center justify-center py-10 bg-slate-950 rounded-3xl border border-slate-800 p-6 text-center shadow-xl">
        <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
        <h3 className="text-sm font-black text-white mb-1">Crypto deposits are currently undergoing maintenance</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">Please try again later or choose an alternative deposit method.</p>
      </div>
    );
  }

  const getStatusDisplay = (status?: string) => {
    switch (status) {
      case "waiting": return { label: "Waiting for Payment", color: "text-amber-400" };
      case "confirming": return { label: "Payment Detected", color: "text-sky-400" };
      case "sending":
      case "confirmed": return { label: "Confirming Transaction", color: "text-indigo-400" };
      case "finished": return { label: "Deposit Completed", color: "text-emerald-400" };
      case "partially_paid": return { label: "Partial Payment", color: "text-orange-400" };
      case "expired": return { label: "Payment Expired", color: "text-slate-500" };
      case "failed": return { label: "Payment Failed", color: "text-rose-400" };
      case "refunded": return { label: "Payment Refunded", color: "text-purple-400" };
      case "requires_review": return { label: "Requires Review", color: "text-rose-400" };
      default: return { label: (status || "PENDING").toUpperCase(), color: "text-slate-400" };
    }
  };

  const getCurrencySymbolIcon = (tokenName: string) => {
    switch (tokenName?.toUpperCase()) {
      case "BTC": return "₿";
      case "ETH": return "Ξ";
      case "USDT": return "₮";
      case "USDC": return "💲";
      case "BNB": return "🟡";
      case "SOL": return "🟣";
      case "LTC": return "Ł";
      case "DOGE": return "Ð";
      case "XRP": return "✕";
      case "TRX": return "▲";
      default: return "🪙";
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 border border-slate-800/90 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center shadow-lg">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide uppercase">
                Secure Crypto Payment
              </h3>
              <p className="text-xs text-slate-400 font-medium">Fast, automated crypto deposits with instant wallet crediting</p>
            </div>
          </div>
          {activeDeposit && (
            <button
              type="button"
              onClick={() => setActiveDeposit(null)}
              className="text-xs font-bold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-1.5 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> New Deposit
            </button>
          )}
        </div>

        {!activeDeposit ? (
          <form onSubmit={handleCreatePayment} className="space-y-6">
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs font-medium flex items-start gap-2.5 shadow-md">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Popular Currencies Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  1. Select Cryptocurrency
                </label>
                <span className="text-[10px] text-amber-400/90 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  Curated Popular Currencies
                </span>
              </div>

              {currencies.length === 0 ? (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
                  No popular cryptocurrencies are currently available.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {currencies.map(curr => {
                    const isSelected = selectedCurrencyId === curr.id;
                    const minText = curr.minDepositDisplay || `Min: ${curr.minDepositUSD || 19.04}`;
                    return (
                      <button
                        key={curr.id}
                        type="button"
                        onClick={() => setSelectedCurrencyId(curr.id)}
                        className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden flex items-center gap-3 cursor-pointer ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500/80 text-white shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/50"
                            : "bg-slate-900/90 border-slate-800/80 text-slate-300 hover:border-amber-500/40 hover:bg-slate-900"
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                          isSelected ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-slate-800/80 border-slate-700/60 text-amber-400"
                        }`}>
                          {getCurrencySymbolIcon(curr.token)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-sm text-white tracking-wide truncate">
                              {curr.label || curr.token}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700/50 uppercase shrink-0">
                              {curr.token}
                            </span>
                          </div>
                          <div className="text-[11px] font-semibold text-amber-400/90 mt-0.5 flex items-center justify-between gap-1 truncate">
                            <span>{curr.network}</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-400 mt-1 flex items-center justify-between">
                            <span className="text-amber-400/90 font-mono">{minText}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Deposit Amount Input */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>2. Deposit Amount (USD)</span>
                <span className="text-[10px] font-normal text-slate-400">Net credited to your wallet</span>
              </label>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-300 flex items-center justify-between">
                <span className="text-slate-300">Minimum Deposit:</span>
                <strong className="font-mono text-white">
                  {selectedCurrency?.minDepositUsdDisplay || selectedCurrency?.minDepositDisplay || `$${selectedCurrency?.minDepositUSD || 19.05} USD`}
                </strong>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-amber-400 font-bold">$</span>
                </div>
                <input
                  type="number"
                  min={selectedCurrency?.minDepositUSD || 19.05}
                  step="any"
                  required
                  value={amountUSD}
                  onChange={(e) => setAmountUSD(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white text-lg font-black rounded-2xl pl-10 pr-4 py-4 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                  placeholder="20.00"
                />
              </div>

              {/* Dynamic Fee Breakdown Panel */}
              {amountUSDNum > 0 && (() => {
                const processingFeeUSD = Math.max(0.05, Math.round(amountUSDNum * 0.005 * 100) / 100);
                const netLower = (selectedCurrency?.network || "").toLowerCase();
                const payLower = (selectedCurrency?.payCurrency || "").toLowerCase();
                let networkFeeUSD = 0.25;

                if (netLower.includes("btc") || payLower === "btc") {
                  networkFeeUSD = 1.50;
                } else if (netLower.includes("eth") || netLower.includes("erc20") || payLower === "eth" || payLower === "usdt" || payLower === "usdc") {
                  networkFeeUSD = 2.50;
                } else if (netLower.includes("trc20") || netLower.includes("tron") || payLower === "usdttrc20" || payLower === "trx") {
                  networkFeeUSD = 0.80;
                } else if (netLower.includes("bep20") || netLower.includes("bsc") || payLower === "usdtbsc" || payLower === "bnbbsc") {
                  networkFeeUSD = 0.25;
                } else if (netLower.includes("sol") || payLower === "sol" || payLower === "usdcsol") {
                  networkFeeUSD = 0.10;
                } else if (netLower.includes("ltc") || payLower === "ltc") {
                  networkFeeUSD = 0.05;
                } else if (netLower.includes("doge") || payLower === "doge") {
                  networkFeeUSD = 0.15;
                } else if (netLower.includes("xrp") || payLower === "xrp") {
                  networkFeeUSD = 0.05;
                }

                const totalPaymentUSD = Math.round((amountUSDNum + processingFeeUSD + networkFeeUSD) * 100) / 100;

                return (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-2.5">
                    <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1 flex items-center justify-between">
                      <span>Payment & Fee Summary</span>
                      <span className="text-[10px] text-amber-400/90 font-mono">ZeroX Auto-Gateway</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-slate-300">
                      <span className="text-slate-400">Deposit Amount:</span>
                      <span className="font-mono font-bold text-white">${amountUSDNum.toFixed(2)} USD</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-slate-300">
                      <span className="text-slate-400">Processing Fee (0.5%):</span>
                      <span className="font-mono text-amber-400/90">${processingFeeUSD.toFixed(2)} USD</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-slate-300">
                      <span className="text-slate-400">Network Fee ({selectedCurrency?.network}):</span>
                      <span className="font-mono text-amber-400/90">${networkFeeUSD.toFixed(2)} USD</span>
                    </div>

                    <div className="border-t border-slate-800 pt-2.5 mt-2 flex justify-between items-center text-xs sm:text-sm font-bold">
                      <span className="text-white">Total Payment:</span>
                      <div className="text-right">
                        <div className="font-mono text-amber-400 text-sm sm:text-base font-black">
                          ${totalPaymentUSD.toFixed(2)} USD
                        </div>
                        <div className="text-[10px] text-emerald-400 font-medium">
                          ≈ Rs {Math.round(totalPaymentUSD * cryptoRate).toLocaleString()} PKR
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Create Payment Button */}
            <button
              type="submit"
              disabled={isCreating || !selectedCurrency || amountUSDNum < (selectedCurrency?.minDepositUSD || 19.05)}
              className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl transition cursor-pointer flex justify-center items-center gap-2 shadow-lg shadow-amber-500/10"
            >
              {isCreating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {isCreating ? "Generating Payment Address..." : `Create ${selectedCurrency?.token || "Crypto"} Deposit`}
            </button>
          </form>
        ) : (
          /* Active Deposit Screen */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl border bg-slate-900/80 border-slate-800">
              <div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Deposit Status</div>
                <div className={`font-black text-base sm:text-lg ${getStatusDisplay(activeDeposit.status).color}`}>
                  {getStatusDisplay(activeDeposit.status).label}
                </div>
              </div>
              {activeDeposit.status === "waiting" && (
                <div className="text-center sm:text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">Expires In</div>
                  <div className="font-mono font-black text-base sm:text-lg text-white">
                    {formatCountdown(timeRemainingSeconds)}
                  </div>
                </div>
              )}
            </div>

            {activeDeposit.status === "finished" ? (
              <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-4">
                <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                <h4 className="text-xl font-black text-white">Deposit Completed & Credited!</h4>
                <p className="text-slate-300 text-sm max-w-md mx-auto">
                  Your crypto deposit of <strong>{activeDeposit.payAmount} {activeDeposit.cryptoCurrency}</strong> has been successfully verified and credited.
                </p>
                <div className="pt-2 flex justify-center">
                  <button onClick={() => window.location.reload()} className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-black rounded-xl transition cursor-pointer">
                    View Wallet Balance
                  </button>
                </div>
              </div>
            ) : activeDeposit.status === "expired" ? (
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
                <XCircle className="w-16 h-16 text-slate-400 mx-auto" />
                <h4 className="text-xl font-black text-white">Payment Expired</h4>
                <p className="text-slate-400 text-sm max-w-md mx-auto">This payment window expired before a payment was detected on-chain.</p>
                <div className="pt-2 flex justify-center">
                  <button onClick={() => setActiveDeposit(null)} className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl transition cursor-pointer">
                    Create New Deposit
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-medium text-center leading-relaxed">
                  Send exactly <strong className="text-amber-400">{activeDeposit.payAmount} {activeDeposit.cryptoCurrency}</strong> on the <strong className="text-amber-400">{activeDeposit.network}</strong> network to the address below.
                </div>

                {/* QR Code and Address Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  {/* High Contrast Black-on-White QR Code */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center gap-2">
                    {qrCodeUrl && activeDeposit.payAddress ? (
                      <div className="bg-white p-3 rounded-2xl border-2 border-slate-200 shadow-xl inline-block">
                        <img
                          src={qrCodeUrl}
                          alt="Payment QR Code"
                          className="w-40 h-40 object-contain block mx-auto"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-44 h-44 bg-slate-900 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-500 text-xs font-bold">
                        QR Code Unavailable
                      </div>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Scan to Pay
                    </span>
                  </div>

                  {/* Payment Details */}
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                        Amount to Pay
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xl sm:text-2xl text-white">
                          {activeDeposit.payAmount}
                        </span>
                        <span className="font-bold text-amber-400 text-base">
                          {activeDeposit.cryptoCurrency}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(String(activeDeposit.payAmount), "amount")}
                          className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer ml-auto"
                        >
                          {copiedField === "amount" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                        Deposit Payment Address ({activeDeposit.network})
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-xs sm:text-sm text-amber-300 break-all select-all">
                          {activeDeposit.payAddress || "Address not available"}
                        </div>
                        {activeDeposit.payAddress && (
                          <button
                            type="button"
                            onClick={() => handleCopy(activeDeposit.payAddress, "address")}
                            className="p-3 bg-amber-500 hover:bg-amber-400 text-amber-950 font-black rounded-xl transition cursor-pointer flex shrink-0"
                          >
                            {copiedField === "address" ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Identifiers */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Order ID</span>
                    <span className="text-white truncate block">{activeDeposit.id || "N/A"}</span>
                  </div>
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">Gateway Payment ID</span>
                    <span className="text-white truncate block">{activeDeposit.nowpaymentsPaymentId || "Pending"}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Payment History List */}
      {myCryptoHistory.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
          <h3 className="text-base font-black text-white uppercase tracking-wider">Recent Crypto Deposits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myCryptoHistory.slice(0, 10).map((h) => (
              <div key={h?.id || Math.random()} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono text-slate-400 truncate">ID: {h?.id || "N/A"}</span>
                  <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-bold shrink-0">
                    {safeFormatDate(h?.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5 truncate">
                    <span>{h?.cryptoCurrency || "Crypto"}</span>
                    <span className="text-[10px] text-slate-400">({h?.network || "Network"})</span>
                  </div>
                  <div className="font-mono font-black text-emerald-400 text-xs sm:text-sm shrink-0">
                    Rs {safeFormatNumber(h?.amount)} PKR
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    h?.status === "finished" || h?.status === "APPROVED"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : h?.status === "failed" || h?.status === "expired"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                  }`}>
                    {h?.status === "finished" ? "Completed" : (h?.status || "PENDING").toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
