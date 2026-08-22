import React from "react";
import { createPortal } from "react-dom";
import { InvoiceData, downloadInvoicePdf, openInvoicePrintWindow } from "../lib/invoiceGenerator";
import { Download, Printer, X, FileText, CheckCircle2, ShieldCheck, Sparkles, Building2, XCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "react-hot-toast";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData | null;
}

export default function InvoiceModal({ isOpen, onClose, data }: InvoiceModalProps) {
  const handleDownloadPdf = async () => {
    toast.loading("Generating Official PDF Invoice...", { id: "pdf-toast" });
    try {
      if (!data) return;
      await downloadInvoicePdf(data);
      toast.success("Invoice PDF downloaded successfully! 📄", { id: "pdf-toast" });
    } catch (e) {
      toast.error("Failed to generate PDF. Opening print preview...", { id: "pdf-toast" });
      if (data) openInvoicePrintWindow(data);
    }
  };

  const handlePrint = () => {
    if (data) openInvoicePrintWindow(data);
  };

  if (!data) return null;

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
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh]"
        >
          {/* Top Modal Control Header */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 sm:hidden p-1.5 text-slate-400 hover:text-white rounded-full transition cursor-pointer z-50"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-start gap-3 pr-8 sm:pr-0">
              <div className="p-2.5 bg-[#00AEEF]/20 text-[#00AEEF] rounded-2xl border border-[#00AEEF]/30 shrink-0 mt-0.5">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex flex-wrap items-center gap-2">
                  <span>Official Invoice & Tax Receipt</span>
                  <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase shrink-0">
                    Verified
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-none">Invoice #{data.invoiceNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={handlePrint}
                className="flex-1 sm:flex-none justify-center px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-slate-700/50"
                title="Print or Save as PDF"
              >
                <Printer className="w-4 h-4 text-slate-300" />
                <span className="inline">Print</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                className="flex-1 sm:flex-none justify-center px-4 py-2 rounded-xl bg-[#00AEEF] hover:bg-[#0096ce] text-white text-xs font-extrabold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-[#00AEEF]/20"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>

              <button
                onClick={onClose}
                className="hidden sm:block p-1.5 text-slate-400 hover:text-white rounded-full transition cursor-pointer ml-1 z-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Invoice Body Preview */}
          <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800">
            {/* Header / Brand */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-[#00AEEF] pb-5">
              <div className="w-full sm:w-auto">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">ZEROX NETWORK</h1>
                <p className="text-xs font-black uppercase text-[#00AEEF] tracking-wider mt-0.5">
                  Digital Services & API Platform
                </p>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium mt-1 pr-2 sm:pr-0 leading-tight">Official Accounting Ledger & Client Documentation</p>
              </div>
              
              <div className="sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t border-slate-100 sm:border-0">
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-black text-xs uppercase border ${
                  (data.status === 'COMPLETED' || data.status === 'APPROVED' || data.status === 'FINISHED') 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : (data.status === 'CANCELED' || data.status === 'CANCELLED' || data.status === 'BANNED' || data.status === 'REJECTED' || data.status === 'REFUNDED')
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  {(data.status === 'COMPLETED' || data.status === 'APPROVED' || data.status === 'FINISHED') ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (data.status === 'CANCELED' || data.status === 'CANCELLED' || data.status === 'BANNED' || data.status === 'REJECTED' || data.status === 'REFUNDED') ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  {data.status}
                </span>
                <p className="text-[11px] sm:text-xs font-mono font-black text-slate-900 mt-2">{data.invoiceNumber}</p>
                <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5">
                  {new Date(data.date).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Billed To (Client)</p>
                <p className="text-sm font-black text-slate-900">@{data.customerName}</p>
                {data.customerEmail && <p className="text-xs text-slate-600 font-medium">{data.customerEmail}</p>}
                {data.customerPhone && <p className="text-xs text-slate-600 font-medium">{data.customerPhone}</p>}
              </div>

              <div className="space-y-1 sm:text-right">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Transaction Details</p>
                <p className="text-xs font-mono font-bold text-slate-800">Order ID: #{data.orderId}</p>
                <p className="text-xs text-slate-600 font-medium">Payment Method: <strong className="text-slate-800">{data.paymentMethod || "Wallet Balance"}</strong></p>
                <p className="text-[11px] text-slate-500 font-medium">Issuer: Zerox Network Automated Gateway</p>
              </div>
            </div>

            {/* Items Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-white font-black uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Service Description</th>
                    <th className="py-3 px-4 text-center">Category</th>
                    <th className="py-3 px-4 text-center">Qty</th>
                    <th className="py-3 px-4 text-right">Unit Price</th>
                    <th className="py-3 px-4 text-right">Total (PKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {data.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 align-top">
                      <td className="py-3.5 px-4 font-bold text-slate-500">{idx + 1}</td>
                      <td className="py-3.5 px-4 min-w-[200px]">
                        <p className="font-extrabold text-slate-900 text-xs">{item.title}</p>
                        {item.details && <p className="text-[11px] text-slate-500 mt-1 whitespace-pre-wrap break-all">{item.details}</p>}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-black text-[10px] inline-block mt-1">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">{item.quantity}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">₨ {item.unitPricePkr.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">₨ {item.totalPkr.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Fees Summary */}
            <div className="flex flex-col md:flex-row items-stretch md:items-start justify-between gap-4 pt-2">
              {/* Left Side: Refund breakdown or Guarantee Info */}
              <div className="flex-1 space-y-3">
                {(()=>{
                  const isFailed = data.status === 'CANCELED' || data.status === 'CANCELLED' || data.status === 'BANNED' || data.status === 'REJECTED' || data.status === 'REFUNDED' || data.status === 'PARTIAL';
                  const cancelFee5Percent = data.fees?.cancellationFeePkr ?? (data.grandTotalPkr * 0.05);
                  const procFee2Percent = data.fees?.processingFeePkr ?? (data.grandTotalPkr * 0.02);
                  const refundAmount = data.refundDetails?.netRefundAmountPkr ?? Math.max(0, data.grandTotalPkr - cancelFee5Percent);
                  const refundReason = data.refundDetails?.refundReason || (data.status === 'BANNED' ? 'Virtual Number Blocked / Bad Quality' : data.status === 'CANCELED' || data.status === 'CANCELLED' ? 'SMS Timeout / Number Canceled' : 'System Auto-Refund');

                  if (isFailed) {
                    return (
                      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs space-y-2.5">
                        <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                          <span className="font-black text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="p-1 bg-rose-500 text-white rounded-md text-[9px]">REFUND</span>
                            <span>Official Refund Settlement</span>
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px]">
                            REFUND SETTLED
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">Original Paid:</span>
                            <span className="font-bold text-slate-800 font-mono">₨ {data.grandTotalPkr.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Processing Fee (2%):</span>
                            <span className="font-bold text-slate-700 font-mono">₨ {procFee2Percent.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Cancellation Fee (5%):</span>
                            <span className="font-bold text-rose-600 font-mono">- ₨ {cancelFee5Percent.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Reason:</span>
                            <span className="font-bold text-rose-700 truncate block">{refundReason}</span>
                          </div>
                        </div>
                        <div className="border-t border-rose-200 pt-2 flex items-center justify-between font-black text-xs text-rose-900">
                          <span>Net Refund Credited to Wallet:</span>
                          <span className="text-sm font-mono text-rose-600">+ ₨ {refundAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PKR</span>
                        </div>
                        <p className="text-[10px] text-rose-700 font-medium pt-0.5">
                          ✓ Destination: Digital Wallet Balance (Credited after 5% cancellation fee adjustment).
                        </p>
                      </div>
                    );
                  }

                  const isDeposit = data.items.some(i => i.category === 'Wallet Deposit');
                  const isCrypto = (data.paymentMethod || "").toLowerCase().includes("crypto") || (data.paymentMethod || "").toLowerCase().includes("usdt") || (data.paymentMethod || "").toLowerCase().includes("redotpay");
                  const depositFeePct = isCrypto ? 0.5 : 2.0;

                  if (isDeposit) {
                    return (
                      <div className="space-y-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Deposit Ledger: Verified & Recorded</span>
                        </div>
                        <p className="font-mono text-[10px]">Code: ZX-DEP-{data.orderId}-OFFICIAL</p>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 space-y-1">
                          <span className="font-bold text-slate-900 block">✓ Deposit Fee Policy:</span>
                          <p className="text-slate-600 leading-relaxed">
                            Funds processed with <strong>{depositFeePct}% {isCrypto ? 'Crypto Processing Fee' : 'Local Deposit Fee'}</strong>. Standard order cancellation fee is <strong>5%</strong> with automated protection.
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Ledger Status: Verified & Recorded</span>
                      </div>
                      <p className="font-mono text-[10px]">Code: ZX-LEDGER-{data.orderId}-OFFICIAL</p>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-700 space-y-1">
                        <span className="font-bold text-slate-900 block">✓ Fee Policy & Transparent Ledger:</span>
                        <p className="text-slate-600 leading-relaxed">
                          Transactions include a standard <strong>Processing Fee (2%)</strong>. Canceled or unreceived virtual numbers are refunded automatically after a <strong>Cancellation Fee (5%)</strong> deduction.
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Right Side: Detailed Fee Breakdown & Grand Total */}
              {(()=>{
                const isDeposit = data.items.some(i => i.category === 'Wallet Deposit');
                const isCrypto = (data.paymentMethod || "").toLowerCase().includes("crypto") || (data.paymentMethod || "").toLowerCase().includes("usdt") || (data.paymentMethod || "").toLowerCase().includes("redotpay");
                const depositFeePct = isCrypto ? 0.5 : 2.0;
                const depositFeeAmount = data.subtotalPkr * (depositFeePct / 100);
                const netDepositCredit = Math.max(0, data.subtotalPkr - depositFeeAmount);

                if (isDeposit) {
                  return (
                    <div className="w-full md:w-80 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>Gross Deposit:</span>
                        <span className="font-mono">₨ {data.subtotalPkr.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-amber-600 font-medium">
                        <span>Deposit Fee ({depositFeePct}%):</span>
                        <span className="font-bold font-mono">- ₨ {depositFeeAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-rose-600 font-medium">
                        <span>Cancellation Fee (5%):</span>
                        <span className="font-bold font-mono">5% (On order cancel)</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                        <span>Net Credited to Wallet:</span>
                        <span className="text-emerald-600 font-mono">₨ {netDepositCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} PKR</span>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="w-full md:w-80 bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Base Subtotal:</span>
                      <span className="font-mono">₨ {data.subtotalPkr.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Real-Time Carrier Routing:</span>
                      <span className="text-emerald-600 font-bold font-mono">₨ {(data.fees?.realtimeNetworkFeePkr || 0).toFixed(2)} (Included)</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Processing Fee (2%):</span>
                      <span className="text-slate-800 font-bold font-mono">₨ {(data.fees?.processingFeePkr ?? (data.subtotalPkr * 0.02)).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Cancellation Fee (5%):</span>
                      <span className="text-rose-600 font-bold font-mono">₨ {(data.fees?.cancellationFeePkr ?? (data.subtotalPkr * 0.05)).toFixed(2)}</span>
                    </div>
                    {data.discountPkr ? (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Discount Applied:</span>
                        <span className="font-mono">- ₨ {data.discountPkr.toLocaleString()}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-slate-600 font-medium">
                      <span>Tax (0% GST):</span>
                      <span className="text-emerald-600 font-bold font-mono">₨ 0.00</span>
                    </div>
                    <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-sm text-slate-900">
                      <span>Grand Total:</span>
                      <span className="text-[#00AEEF] font-mono">₨ {data.grandTotalPkr.toLocaleString()} PKR</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium text-center sm:text-left leading-tight">Official client receipt generated for accounting & audit proof.</span>
            <button
              onClick={handleDownloadPdf}
              className="w-full sm:w-auto justify-center px-5 py-2.5 sm:py-2 rounded-xl bg-[#00AEEF] hover:bg-[#0096ce] text-white font-black text-[11px] sm:text-xs flex items-center gap-2 shadow-md transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Invoice</span>
            </button>
          </div>
        </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
