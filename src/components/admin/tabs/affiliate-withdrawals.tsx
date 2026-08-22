import React, { useState, useEffect, useMemo } from 'react';
import { useAdminContext } from '../AdminContext';
import { db } from '../../../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { AffiliateWithdrawalRequest } from '../../../types';
import { 
  Banknote, CheckCircle, Clock, XCircle, Search, 
  Download, RefreshCw, Check, X, AlertCircle, 
  Smartphone, Landmark, CreditCard, Globe, 
  FileText, ShieldCheck, Percent
} from "lucide-react";
import { format } from "date-fns";
import toast from 'react-hot-toast';
import InvoiceModal from '../../InvoiceModal';
import { InvoiceData } from '../../../lib/invoiceGenerator';

export default function AffiliateWithdrawalsTab() {
  const ctx = useAdminContext();
  const { cryptoRate = 300, logAdminAction } = ctx;

  const [withdrawals, setWithdrawals] = useState<AffiliateWithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');

  // Selected item for action modals
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<AffiliateWithdrawalRequest | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'PAY' | 'REJECT' | null>(null);
  const [payoutReference, setPayoutReference] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Invoice Modal State
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  // Helper getters for robust field access
  const getMethod = (w: AffiliateWithdrawalRequest) => w.payoutMethod || (w as any).method || 'bank';
  const getFeePkr = (w: AffiliateWithdrawalRequest) => w.feeAmountPkr ?? (w as any).feePkr ?? (w.amountPkr * 0.02);
  const getNetPkr = (w: AffiliateWithdrawalRequest) => w.netPayoutPkr ?? (w as any).netAmountPkr ?? (w.amountPkr - getFeePkr(w));
  const getTxRef = (w: AffiliateWithdrawalRequest) => w.transactionRef || (w as any).payoutReference || '';

  // Real-time Firestore Listener
  useEffect(() => {
    const q = query(collection(db, "affiliate_withdrawals"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: AffiliateWithdrawalRequest[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as AffiliateWithdrawalRequest);
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setWithdrawals(items);
      setLoading(false);
    }, (err) => {
      console.warn("Affiliate withdrawals snapshot error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filtered list
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(w => {
      if (statusFilter !== 'ALL' && w.status !== statusFilter) return false;
      const method = getMethod(w);
      if (methodFilter !== 'ALL' && method.toLowerCase() !== methodFilter.toLowerCase()) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesUser = (w.username || '').toLowerCase().includes(q) || (w.userEmail || '').toLowerCase().includes(q);
        const matchesAccount = (w.accountTitle || '').toLowerCase().includes(q) || (w.accountNumber || '').toLowerCase().includes(q);
        const matchesId = (w.id || '').toLowerCase().includes(q) || getTxRef(w).toLowerCase().includes(q);
        return matchesUser || matchesAccount || matchesId;
      }
      return true;
    });
  }, [withdrawals, statusFilter, methodFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    let pendingCount = 0;
    let pendingPkr = 0;
    let paidCount = 0;
    let paidPkr = 0;
    let totalFeePkr = 0;

    withdrawals.forEach(w => {
      const feePkr = getFeePkr(w);
      const netPkr = getNetPkr(w);
      if (w.status === 'PENDING') {
        pendingCount++;
        pendingPkr += w.amountPkr;
      } else if (w.status === 'PAID') {
        paidCount++;
        paidPkr += netPkr;
        totalFeePkr += feePkr;
      }
    });

    return { pendingCount, pendingPkr, paidCount, paidPkr, totalFeePkr, totalCount: withdrawals.length };
  }, [withdrawals]);

  // Action Handlers
  const handleApprove = async (withdrawal: AffiliateWithdrawalRequest) => {
    setIsProcessing(true);
    try {
      const docRef = doc(db, "affiliate_withdrawals", withdrawal.id);
      await updateDoc(docRef, {
        status: "APPROVED",
        processedAt: new Date().toISOString(),
        verifiedAt: new Date().toISOString(),
        adminNotes: adminNote || "Verified and queued for disbursement"
      });

      if (logAdminAction) {
        await logAdminAction(
          "Finance",
          `Approved Affiliate Withdrawal: ${withdrawal.id}`,
          `Approved ₨ ${withdrawal.amountPkr} PKR for @${withdrawal.username} (${withdrawal.accountTitle} - ${getMethod(withdrawal).toUpperCase()}).`,
          withdrawal.userEmail,
          "SUCCESS"
        ).catch(() => {});
      }

      toast.success(`Request ${withdrawal.id} marked as APPROVED!`);
      setActionType(null);
      setSelectedWithdrawal(null);
      setAdminNote('');
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to approve withdrawal: " + (err.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMarkPaid = async (withdrawal: AffiliateWithdrawalRequest) => {
    if (!payoutReference.trim()) {
      toast.error("Please enter a payout transaction reference / TID.");
      return;
    }
    setIsProcessing(true);
    try {
      const docRef = doc(db, "affiliate_withdrawals", withdrawal.id);
      await updateDoc(docRef, {
        status: "PAID",
        processedAt: new Date().toISOString(),
        paidAt: new Date().toISOString(),
        transactionRef: payoutReference.trim(),
        payoutReference: payoutReference.trim(),
        adminNotes: adminNote || "Disbursed to user account successfully"
      });

      if (logAdminAction) {
        await logAdminAction(
          "Finance",
          `Completed Affiliate Payout: ${withdrawal.id}`,
          `Disbursed ₨ ${getNetPkr(withdrawal)} PKR (Fee: ₨ ${getFeePkr(withdrawal).toFixed(2)}) via ${getMethod(withdrawal).toUpperCase()} [Ref: ${payoutReference.trim()}].`,
          withdrawal.userEmail,
          "SUCCESS"
        ).catch(() => {});
      }

      toast.success(`Payout successfully marked as PAID!`);
      setActionType(null);
      setSelectedWithdrawal(null);
      setPayoutReference('');
      setAdminNote('');
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to complete payout: " + (err.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (withdrawal: AffiliateWithdrawalRequest) => {
    setIsProcessing(true);
    try {
      // 1. Update withdrawal doc
      const docRef = doc(db, "affiliate_withdrawals", withdrawal.id);
      await updateDoc(docRef, {
        status: "REJECTED",
        processedAt: new Date().toISOString(),
        rejectedAt: new Date().toISOString(),
        adminNotes: adminNote || "Request rejected by admin and balance refunded"
      });

      // 2. Refund balance back to user
      const refundUsd = withdrawal.amountUsd || (withdrawal.amountPkr / (cryptoRate || 300));
      const userRef = doc(db, "users", withdrawal.userId);
      await updateDoc(userRef, {
        balance: increment(refundUsd)
      });

      if (logAdminAction) {
        await logAdminAction(
          "Finance",
          `Rejected Affiliate Withdrawal: ${withdrawal.id}`,
          `Rejected ₨ ${withdrawal.amountPkr} ($${refundUsd.toFixed(2)}) for @${withdrawal.username} & refunded wallet. Reason: ${adminNote || "Unspecified"}`,
          withdrawal.userEmail,
          "SUCCESS"
        ).catch(() => {});
      }

      toast.success(`Request rejected and $${refundUsd.toFixed(2)} (₨ ${withdrawal.amountPkr}) refunded to user.`);
      setActionType(null);
      setSelectedWithdrawal(null);
      setAdminNote('');
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to reject withdrawal: " + (err.message || "Unknown error"));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenInvoice = (w: AffiliateWithdrawalRequest) => {
    const feePkr = getFeePkr(w);
    const netPkr = getNetPkr(w);
    const feeUsd = w.feeAmountUsd ?? (w.amountUsd * 0.02);
    const netUsd = w.netPayoutUsd ?? (w.amountUsd - feeUsd);
    const method = getMethod(w);
    const txRef = getTxRef(w);

    const data: InvoiceData = {
      invoiceNumber: w.invoiceNumber || `INV-AFF-${w.id.toUpperCase()}`,
      orderId: w.id,
      date: w.createdAt || new Date().toISOString(),
      customerName: w.accountTitle || w.username || 'Zerox Affiliate Partner',
      customerEmail: w.userEmail || 'affiliate@zerox.network',
      customerPhone: w.accountNumber || '',
      paymentMethod: `${method.toUpperCase()} (${w.accountTitle || 'Account'})`,
      status: w.status === 'PAID' || w.status === 'APPROVED' ? 'COMPLETED' : w.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
      items: [
        {
          id: w.id,
          title: `Affiliate Commission Payout — ${method.toUpperCase()}`,
          category: 'Affiliate Withdrawal',
          details: `Payout Account: ${w.accountTitle}\nAccount / IBAN / Wallet: ${w.accountNumber}${w.bankName ? `\nBank: ${w.bankName}` : ''}${txRef ? `\nTransaction Reference: ${txRef}` : ''}${w.adminNotes ? `\nAdmin Notes: ${w.adminNotes}` : ''}`,
          quantity: 1,
          unitPriceUsd: w.amountUsd || (w.amountPkr / cryptoRate),
          unitPricePkr: w.amountPkr,
          totalUsd: w.amountUsd || (w.amountPkr / cryptoRate),
          totalPkr: w.amountPkr
        }
      ],
      subtotalPkr: w.amountPkr,
      subtotalUsd: w.amountUsd || (w.amountPkr / cryptoRate),
      grandTotalPkr: netPkr,
      grandTotalUsd: netUsd,
      fees: {
        processingFeePkr: feePkr,
        processingFeeUsd: feeUsd
      }
    };

    setInvoiceData(data);
    setIsInvoiceOpen(true);
  };

  const handleExportCsv = () => {
    if (filteredWithdrawals.length === 0) {
      toast.error("No withdrawal records to export.");
      return;
    }

    const headers = [
      "Request ID", "Date", "Username", "User Email", "Method", 
      "Account Title", "Account Number / IBAN", "Bank Name", 
      "Gross (PKR)", "Fee 2% (PKR)", "Net Payout (PKR)", "Amount (USD)", 
      "Status", "Payout Ref", "Admin Notes"
    ];

    const rows = filteredWithdrawals.map(w => [
      w.id,
      new Date(w.createdAt).toISOString(),
      w.username,
      w.userEmail || '',
      getMethod(w).toUpperCase(),
      `"${(w.accountTitle || '').replace(/"/g, '""')}"`,
      `"${(w.accountNumber || '').replace(/"/g, '""')}"`,
      `"${(w.bankName || '').replace(/"/g, '""')}"`,
      w.amountPkr,
      getFeePkr(w).toFixed(2),
      getNetPkr(w).toFixed(2),
      w.amountUsd?.toFixed(2) || (w.amountPkr / cryptoRate).toFixed(2),
      w.status,
      `"${getTxRef(w).replace(/"/g, '""')}"`,
      `"${(w.adminNotes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `affiliate_withdrawals_statement_${format(new Date(), "yyyyMMdd_HHmm")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Affiliate withdrawal records exported to CSV!");
  };

  const getMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'easypaisa':
      case 'jazzcash':
      case 'nayapay':
      case 'sadapay':
        return <Smartphone className="w-3.5 h-3.5" />;
      case 'bank':
        return <Landmark className="w-3.5 h-3.5" />;
      case 'crypto':
        return <Globe className="w-3.5 h-3.5" />;
      default:
        return <CreditCard className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in flex flex-col h-auto md:h-[540px] md:min-h-[400px] pr-1 overflow-y-auto">
      {/* Top Header & Export */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
            <Banknote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              Affiliate &amp; Partner Withdrawal Verification
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200">
                2.0% Fee Settlement
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Verify incoming affiliate payout requests, dispatch funds, and generate tax compliant statements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportCsv}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 border border-slate-200"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-amber-200/80 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Verification</span>
            <span className="p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-black text-amber-600 font-mono mt-1">
            ₨ {stats.pendingPkr.toLocaleString()} PKR
          </p>
          <p className="text-[11px] text-slate-500 font-medium">{stats.pendingCount} requests waiting</p>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Disbursed Payouts</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
              <CheckCircle className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-black text-emerald-600 font-mono mt-1">
            ₨ {stats.paidPkr.toLocaleString(undefined, { maximumFractionDigits: 0 })} PKR
          </p>
          <p className="text-[11px] text-slate-500 font-medium">{stats.paidCount} successfully paid</p>
        </div>

        <div className="bg-white border border-indigo-200/80 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">2% Platform Fee Yield</span>
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Percent className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-black text-indigo-600 font-mono mt-1">
            ₨ {stats.totalFeePkr.toFixed(2)} PKR
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Automatic system revenue</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Inflow Records</span>
            <span className="p-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
              <FileText className="w-3.5 h-3.5" />
            </span>
          </div>
          <p className="text-lg font-black text-slate-900 font-mono mt-1">
            {stats.totalCount} Total
          </p>
          <p className="text-[11px] text-slate-500 font-medium">Lifetime payout requests</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user, email, account, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Withdrawals */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex-1 min-h-[260px] flex flex-col">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2 my-auto">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs font-semibold">Loading affiliate withdrawal logs...</span>
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2 my-auto">
            <Banknote className="w-8 h-8 text-slate-300 stroke-1" />
            <span className="text-xs font-semibold">No affiliate withdrawal requests match the selected filters.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Request &amp; User</th>
                  <th className="py-3 px-4">Method &amp; Account</th>
                  <th className="py-3 px-4">Gross &amp; Net (2% Fee)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredWithdrawals.map((w) => {
                  const method = getMethod(w);
                  const feePkr = getFeePkr(w);
                  const netPkr = getNetPkr(w);
                  const txRef = getTxRef(w);

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-slate-900 text-xs">#{w.id}</div>
                        <div className="text-[11px] font-bold text-emerald-700">@{w.username || 'user'}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]">{w.userEmail}</div>
                        <div className="text-[10px] text-slate-400">{format(new Date(w.createdAt), "dd MMM yyyy, hh:mm a")}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 rounded-md bg-slate-100 text-slate-700">
                            {getMethodIcon(method)}
                          </span>
                          <span className="font-extrabold text-slate-800 uppercase">{method}</span>
                        </div>
                        <div className="font-bold text-slate-900 text-xs mt-0.5">{w.accountTitle}</div>
                        <div className="font-mono text-[11px] text-slate-600 select-all">{w.accountNumber}</div>
                        {w.bankName && (
                          <div className="text-[10px] text-slate-500 font-semibold">{w.bankName}</div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900 font-mono text-xs">
                          ₨ {w.amountPkr.toLocaleString()} PKR
                        </div>
                        <div className="text-[10px] text-amber-600 font-semibold">
                          - ₨ {feePkr.toFixed(2)} Fee (2%)
                        </div>
                        <div className="text-[11px] font-black text-emerald-600 font-mono">
                          Net: ₨ {netPkr.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                          w.status === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : w.status === "APPROVED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : w.status === "REJECTED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                        }`}>
                          {w.status === "PAID" ? <CheckCircle className="w-3 h-3" /> :
                           w.status === "APPROVED" ? <ShieldCheck className="w-3 h-3" /> :
                           w.status === "REJECTED" ? <XCircle className="w-3 h-3" /> :
                           <Clock className="w-3 h-3" />}
                          <span>{w.status}</span>
                        </span>
                        {txRef && (
                          <div className="text-[10px] text-slate-500 font-mono mt-1 truncate max-w-[140px]" title={txRef}>
                            Ref: {txRef}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Invoice */}
                          <button
                            onClick={() => handleOpenInvoice(w)}
                            title="Generate Tax Invoice & Statement"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer border border-slate-200"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Approve Button (if pending) */}
                          {w.status === "PENDING" && (
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setActionType("APPROVE");
                                setAdminNote('');
                              }}
                              title="Verify & Approve"
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition cursor-pointer border border-blue-200 flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verify</span>
                            </button>
                          )}

                          {/* Mark Paid Button (if approved or pending) */}
                          {(w.status === "APPROVED" || w.status === "PENDING") && (
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setActionType("PAY");
                                setPayoutReference('');
                                setAdminNote('');
                              }}
                              title="Mark as Paid / Disbursed"
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer shadow-xs flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Disburse</span>
                            </button>
                          )}

                          {/* Reject Button (if not already paid or rejected) */}
                          {w.status !== "PAID" && w.status !== "REJECTED" && (
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(w);
                                setActionType("REJECT");
                                setAdminNote('');
                              }}
                              title="Reject & Refund User Balance"
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer border border-rose-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ACTION MODAL (APPROVE / PAY / REJECT) */}
      {actionType && selectedWithdrawal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs" onClick={() => !isProcessing && setActionType(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10">
            {/* Modal Header */}
            <div className={`p-5 text-white flex items-center justify-between ${
              actionType === "APPROVE" ? "bg-blue-600" :
              actionType === "PAY" ? "bg-emerald-600" : "bg-rose-600"
            }`}>
              <div className="flex items-center gap-2">
                {actionType === "APPROVE" ? <ShieldCheck className="w-5 h-5" /> :
                 actionType === "PAY" ? <CheckCircle className="w-5 h-5" /> :
                 <XCircle className="w-5 h-5" />}
                <h3 className="text-sm font-black tracking-tight">
                  {actionType === "APPROVE" ? "Verify & Approve Payout" :
                   actionType === "PAY" ? "Complete & Mark as Disbursed" :
                   "Reject & Refund Wallet"}
                </h3>
              </div>
              <button 
                onClick={() => !isProcessing && setActionType(null)} 
                className="p-1 text-white/80 hover:text-white rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Summary of withdrawal */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">User:</span>
                  <span className="font-bold text-slate-900">@{selectedWithdrawal.username} ({selectedWithdrawal.userEmail})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Account:</span>
                  <span className="font-bold text-slate-900">{selectedWithdrawal.accountTitle} ({getMethod(selectedWithdrawal).toUpperCase()})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Number / IBAN:</span>
                  <span className="font-mono font-bold text-slate-900 select-all">{selectedWithdrawal.accountNumber}</span>
                </div>
                {selectedWithdrawal.bankName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-semibold">Bank:</span>
                    <span className="font-bold text-slate-900">{selectedWithdrawal.bankName}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-1.5 flex justify-between">
                  <span className="font-black text-slate-700">Net to Disburse:</span>
                  <span className="font-black text-emerald-600 font-mono text-sm">
                    ₨ {getNetPkr(selectedWithdrawal).toLocaleString()} PKR
                  </span>
                </div>
              </div>

              {actionType === "PAY" && (
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">
                    Transaction ID / Reference / Proof <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 0918237465, JazzCash TID, Bank UTR, USDT Hash"
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-800 block">
                  {actionType === "REJECT" ? "Rejection Reason (Sent to User)" : "Admin Internal Note / Memo (Optional)"}
                </label>
                <input
                  type="text"
                  placeholder={actionType === "REJECT" ? "e.g. Invalid account title / duplicate request" : "e.g. Dispatched via online banking"}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500"
                />
              </div>

              {actionType === "REJECT" && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 leading-relaxed flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    Rejecting this request will automatically refund <strong>${(selectedWithdrawal.amountUsd || (selectedWithdrawal.amountPkr / cryptoRate)).toFixed(2)} USD (₨ {selectedWithdrawal.amountPkr} PKR)</strong> directly back to the user's active wallet balance.
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => setActionType(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                >
                  Cancel
                </button>

                {actionType === "APPROVE" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleApprove(selectedWithdrawal)}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>Confirm Approval</span>
                  </button>
                )}

                {actionType === "PAY" && (
                  <button
                    type="button"
                    disabled={isProcessing || !payoutReference.trim()}
                    onClick={() => handleMarkPaid(selectedWithdrawal)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Complete Payout</span>
                  </button>
                )}

                {actionType === "REJECT" && (
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={() => handleReject(selectedWithdrawal)}
                    className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition cursor-pointer flex items-center gap-1.5"
                  >
                    {isProcessing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    <span>Reject &amp; Refund</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL INVOICE MODAL */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        data={invoiceData}
      />
    </div>
  );
}
