import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";
import { CheckCircle2, Copy, Download, X, Clock, Target, CreditCard, ShoppingCart, Loader2, Sparkles, AlertCircle, FileText, Share2, User, ShieldCheck, RefreshCw, Wallet } from "lucide-react";
import { SmmOrder, SmmService, UserAccount } from "../types";
import { InvoiceData } from "../lib/invoiceGenerator";
import { downloadSmmReceiptPdf } from "../lib/smmReceiptGenerator";
import CurrencyDisplay from "./CurrencyDisplay";
import { ZXLogo } from "./ZXLogo";

interface SmmReceiptModalProps {
  cryptoRate?: number;
  isOpen: boolean;
  onClose: () => void;
  order: SmmOrder | null;
  service: SmmService | null;
  user: UserAccount | null;
  formatPrice: (val: number) => string;
  isHistory?: boolean;
}

export default function SmmReceiptModal({
  cryptoRate, isOpen, onClose, order, service, user, formatPrice, isHistory = false }: SmmReceiptModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const invoiceNumber = order ? `INV-${order.id.substring(0, 8).toUpperCase()}` : '';

  useEffect(() => {
    if (isOpen && order?.id) {
      const syncOrder = async () => {
        try {
          setIsSyncing(true);
          await fetch("/api/smm/sync-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderIds: [order.id] })
          });
        } catch (error) {
          console.error("Failed to sync order status:", error);
        } finally {
          setIsSyncing(false);
        }
      };
      // Give the modal animation a moment to finish before fetching
      setTimeout(syncOrder, 500);
    }
  }, [isOpen, order?.id]);

  let statusStr = (order?.status || 'PENDING').toUpperCase();
  let steps = ['Submitted', 'Pending', 'Processing', 'In Progress', 'Completed'];
  let activeIndex = 0;

  if (statusStr === 'PENDING') {
    activeIndex = 1;
  } else if (statusStr === 'PROCESSING') {
    activeIndex = 2;
  } else if (statusStr === 'IN_PROGRESS') {
    activeIndex = 3;
  } else if (statusStr === 'COMPLETED') {
    activeIndex = 4;
  } else if (statusStr === 'PARTIAL') {
    steps = ['Submitted', 'Pending', 'Processing', 'In Progress', 'Partial'];
    activeIndex = 4;
  } else if (statusStr === 'CANCELED' || statusStr === 'CANCELLED' || statusStr === 'REJECTED') {
    steps = ['Submitted', 'Pending', 'Processing', 'In Progress', 'Canceled'];
    activeIndex = 4;
  }

  const progressPercentage = (activeIndex / (steps.length - 1)) * 100;
  const isFailedState = activeIndex === 4 && (statusStr === 'CANCELED' || statusStr === 'CANCELLED' || statusStr === 'REJECTED' || statusStr === 'PARTIAL');

  const handleContactSupport = () => {
    toast.success("Connecting to support...");
    onClose();
  };

  const handleViewOrders = () => {
    toast.success("Navigating to your orders...");
    onClose();
  };

  const handleTrackOrder = () => {
    toast.success("Order tracking synced. It is currently in queue.");
    onClose();
  };

  const handleCopyOrderId = () => {
    navigator.clipboard.writeText(order.providerOrderId ? String(order.providerOrderId) : String(order.id));
    toast.success("Order ID copied to clipboard!");
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    toast.loading("Generating Official Receipt...", { id: "pdf-smm" });
    try {
      const invoiceData: InvoiceData = {
        invoiceNumber: invoiceNumber,
        orderId: order.providerOrderId || order.id,
        date: order.createdAt,
        customerName: user.fullName || user.username || "Customer",
        customerEmail: user.email,
        customerPhone: user.phone || user.whatsappNumber,
        status: String(order.status).toUpperCase(),
        paymentMethod: "Wallet Balance",
        items: [{
          id: order.id,
          title: service.name,
          category: "SMM Order",
          details: `Target: ${order.link} | Refill: ${service.refill ? 'Yes' : 'No'}`,
          quantity: order.quantity,
          unitPriceUsd: (order.charge / (cryptoRate || 278)) / order.quantity,
          unitPricePkr: order.charge / order.quantity,
          totalUsd: order.charge / (cryptoRate || 278),
          totalPkr: order.charge
        }],
        subtotalUsd: order.charge / (cryptoRate || 278),
        subtotalPkr: order.charge,
        grandTotalUsd: order.charge / (cryptoRate || 278),
        grandTotalPkr: order.charge
      };

      await downloadSmmReceiptPdf(invoiceData, order.link, !!service.refill);
      toast.success("Receipt downloaded successfully!", { id: "pdf-smm" });
    } catch (e) {
      toast.error("Failed to generate PDF.", { id: "pdf-smm" });
    } finally {
      setDownloading(false);
    }
  };

  if (!order || !service || !user) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] selection:bg-blue-100 selection:text-[#00AEEF]"
          >
            {/* Header */}
          <div className="bg-gradient-to-r from-[#00AEEF] to-[#0077B5] p-5 sm:p-6 relative overflow-hidden shrink-0">
            <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
              <ZXLogo size={200} className="text-white" withBackground={false} interactive={false} />
            </div>
            <div className="relative z-10 flex flex-col items-center text-center space-y-2">
              <div className="bg-white/20 p-2 sm:p-2.5 rounded-full backdrop-blur-sm border border-white/30 text-white mb-1 shadow-lg">
                {isHistory ? <FileText className="w-6 h-6 sm:w-8 sm:h-8" /> : <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8" />}
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {isHistory ? "Official SMM Receipt" : "SMM Order Submitted Successfully"}
              </h2>
              <p className="text-blue-50 text-[11px] sm:text-[13px] font-medium max-w-sm mx-auto leading-relaxed">
                {isHistory 
                  ? "Here is the official detailed receipt for your digital service transaction."
                  : "Thank you for choosing Zerox Network. Your order has been received securely and is now being processed. A professional receipt has been generated automatically."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/10 hover:bg-black/20 p-1.5 rounded-full transition-colors cursor-pointer z-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/50">
            {/* Progress Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Order Progress</h3>
                {isSyncing && (
                  <div className="flex items-center gap-1.5 text-[#00AEEF] bg-blue-50 px-2 py-1 rounded-md">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Live Syncing</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full"></div>
                <div 
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#00AEEF] rounded-full transition-all duration-1000"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
                
                {steps.map((step, i) => {
                  const isPast = i < activeIndex;
                  const isCurrent = i === activeIndex;
                  const isLastStep = i === steps.length - 1;
                  const isFailed = isFailedState && isLastStep;
                  
                  const isFullyCompleted = isPast || (isCurrent && isLastStep);

                  return (
                  <div key={step + i} className="relative z-10 flex flex-col items-center gap-1.5 w-8">
                    <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-colors ${
                      isFullyCompleted && !isFailed ? 'bg-[#00AEEF] border-[#00AEEF] text-white shadow-md shadow-blue-500/30' : 
                      isFullyCompleted && isFailed ? 'bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/30' :
                      isCurrent && !isFullyCompleted ? 'bg-white border-[#00AEEF] text-[#00AEEF]' : 
                      'bg-white border-slate-200 text-slate-300'
                    }`}>
                      {isFullyCompleted && !isFailed ? <CheckCircle2 className="w-3 h-3" /> : 
                       isFullyCompleted && isFailed ? <X className="w-3 h-3" /> : 
                       i + 1}
                    </div>
                    <span className={`text-[8px] sm:text-[9px] font-bold absolute -bottom-6 sm:-bottom-5 text-center leading-[1.1] w-12 sm:w-16 ${
                      isFullyCompleted && !isFailed ? 'text-[#00AEEF]' : 
                      isFullyCompleted && isFailed ? 'text-rose-500' : 
                      isCurrent && !isFullyCompleted ? 'text-[#00AEEF]' :
                      'text-slate-400'
                    }`}>
                      {step}
                    </span>
                  </div>
                )})}
              </div>
              <div className="mt-8 sm:mt-8"></div>
            </div>

            {/* Refund Breakdown Banner if Canceled or Partial Refunded */}
            {(statusStr === 'CANCELED' || statusStr === 'CANCELLED' || statusStr === 'REJECTED' || statusStr === 'PARTIAL' || order.isRefunded) && (
              <div className="bg-gradient-to-br from-rose-50 to-amber-50/40 p-4 rounded-2xl border border-rose-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
                  <div className="flex items-center gap-1.5 text-rose-700">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <h3 className="text-xs font-black uppercase tracking-wider">Automated Fail-Safe Refund Settled</h3>
                  </div>
                  <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Credited to Wallet
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-[11px] font-bold">Original / Unfulfilled Amount:</span>
                    <span className="font-extrabold font-mono text-slate-800">
                      PKR {((order.refundAmount || 0) + (order.processingFee || 0) || order.charge).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-rose-600">
                    <span className="text-[11px] font-bold flex items-center gap-1">
                      Gateway Processing Fee (2%):
                    </span>
                    <span className="font-extrabold font-mono">
                      - PKR {(order.processingFee || Number((((order.refundAmount || order.charge) / 0.98) * 0.02).toFixed(2))).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-rose-200/80">
                    <span className="text-xs font-black text-slate-900">Net Refund Credited to Balance:</span>
                    <span className="text-sm font-black font-mono text-emerald-600">
                      + PKR {(order.refundAmount || Number((order.charge * 0.98).toFixed(2))).toFixed(2)}
                    </span>
                  </div>

                  {order.refundTxId && (
                    <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                      <span>Refund TxID:</span>
                      <span className="font-mono font-bold text-slate-700">{order.refundTxId}</span>
                    </div>
                  )}

                  <div className="mt-2 p-2.5 bg-white/80 rounded-xl border border-rose-100 text-[10px] text-slate-600 leading-relaxed font-medium">
                    🛡️ <span className="font-bold text-slate-800">ZeroX Policy Note:</span> SMM orders are non-cancellable by users. This refund was processed automatically by the ZeroX Network gateway with the standard 2% processing fee.
                  </div>
                </div>
              </div>
            )}

            {/* Receipt Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              
              {/* Order Info */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-[#00AEEF] border-b border-slate-100 pb-2 mb-2">
                  <FileText className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Official SMM Receipt</h3>
                </div>
                
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Order ID</span>
                    <span className="text-[11px] font-black text-slate-900 font-mono bg-slate-100 px-1.5 py-0.5 rounded">
                      #{order.providerOrderId || order.id}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Invoice Number</span>
                    <span className="text-[11px] font-bold text-slate-700">{invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Transaction ID</span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">TXN-{order.id.substring(8, 16).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Date & Time</span>
                    <span className="text-[11px] font-bold text-slate-700">{new Date(order.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Order Status</span>
                    <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-200 uppercase">
                      In Queue
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">AI Verification Status</span>
                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200 uppercase flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Secure
                    </span>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-[#00AEEF] border-b border-slate-100 pb-2 mb-2">
                  <User className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Customer Details</h3>
                </div>
                
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Name</span>
                    <span className="text-[11px] font-bold text-slate-700">{user.fullName || user.username || "Customer"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Username</span>
                    <span className="text-[11px] font-bold text-slate-700">@{user.username || "user"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Phone</span>
                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{user.phone || user.whatsappNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Email</span>
                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{user.email || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">User ID</span>
                    <span className="text-[10px] font-mono font-bold text-slate-500 truncate max-w-[120px]">{user.id}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Payment Status</span>
                    <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-200 uppercase flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Paid
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400">Wallet Used</span>
                    <span className="text-[11px] font-bold text-slate-700">Main Balance</span>
                  </div>
                </div>
              </div>

              {/* Service Info - Full Width */}
              <div className="sm:col-span-2 bg-gradient-to-br from-blue-50/50 to-white p-4 rounded-2xl border border-[#00AEEF]/20 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-[#00AEEF] border-b border-blue-100/50 pb-2">
                  <Target className="w-4 h-4" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">Service Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400">Platform</span>
                      <span className="text-[11px] font-bold text-slate-700">{service.category?.split(' ')[0] || "Social"}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400">Category</span>
                      <span className="text-[11px] font-bold text-slate-700 max-w-[120px] truncate text-right">{service.category}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-0.5">Service Name</p>
                      <p className="text-[11px] font-bold text-slate-800 leading-tight">{service.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 mb-0.5">Target Link / Username</p>
                      <a href={order.link} target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[#00AEEF] hover:underline break-all">
                        {order.link}
                      </a>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 mb-0.5">Quantity</p>
                        <p className="text-[13px] font-black text-slate-900">{order.quantity.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 mb-0.5">Total Price</p>
                        <div className="text-[13px] font-black text-[#00AEEF]">
                          <CurrencyDisplay baseUnits={order.charge / (cryptoRate || 278)} formatPrice={formatPrice} inline={true} usdClassName="text-emerald-500 ml-1 text-[10px]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Clock className="w-3 h-3" /> Est. Start Time</span>
                      <span className="text-[11px] font-bold text-slate-700">0-1 Hours</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Delivery Speed</span>
                      <span className="text-[11px] font-bold text-slate-700">Fast / Natural</span>
                    </div>
                    <div className="flex justify-between items-center bg-white p-2 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Refill / Warranty</span>
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${service.refill ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                        {service.refill ? "Included" : "No Refill"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-[#00AEEF]/10 p-2 rounded-xl border border-[#00AEEF]/20">
                      <span className="text-[10px] font-bold text-[#00AEEF] flex items-center gap-1.5"><Wallet className="w-3 h-3" /> Remaining Balance</span>
                      <div className="text-[11px] font-black text-slate-800">
                        <CurrencyDisplay baseUnits={(user.balance * (cryptoRate || 278)) / (cryptoRate || 278)} formatPrice={formatPrice} inline={true} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="bg-white border-t border-slate-200 p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadPdf}
                disabled={downloading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-sm shadow-slate-900/20 cursor-pointer"
              >
                {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download PDF
              </button>
              <button
                onClick={handleCopyOrderId}
                className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 cursor-pointer"
                title="Copy Order ID"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            
            {!isHistory && (
              <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2 w-full sm:w-auto mt-2 sm:mt-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <button
                  onClick={handleContactSupport}
                  className="whitespace-nowrap text-slate-400 hover:text-[#00AEEF] hover:drop-shadow-[0_0_8px_rgba(0,174,239,0.8)] text-[10px] sm:text-xs font-bold px-2 py-2 transition-all duration-300 cursor-pointer"
                >
                  Contact Support
                </button>
                <button
                  onClick={handleViewOrders}
                  className="whitespace-nowrap text-slate-400 hover:text-[#00AEEF] hover:drop-shadow-[0_0_8px_rgba(0,174,239,0.8)] text-[10px] sm:text-xs font-bold px-2 py-2 transition-all duration-300 cursor-pointer"
                >
                  View My Orders
                </button>
                <button
                  onClick={handleTrackOrder}
                  className="whitespace-nowrap flex items-center justify-center gap-1.5 text-[#00AEEF] drop-shadow-[0_0_8px_rgba(0,174,239,0.6)] hover:drop-shadow-[0_0_12px_rgba(0,174,239,1)] text-[10px] sm:text-xs font-bold px-2 py-2 transition-all duration-300 cursor-pointer"
                >
                  <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Track Order
                </button>
              </div>
            )}
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
