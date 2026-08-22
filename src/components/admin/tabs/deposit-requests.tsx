import React, { useState, useRef, useEffect } from 'react';
import { useAdminContext } from '../AdminContext';
import { 
  CreditCard, CheckCircle2, XCircle, Trash2, Search, Filter, 
  Copy, Check, Plus, RefreshCw, Zap, ShieldCheck, Eye, 
  ExternalLink, User, ArrowUpRight, Coins, Landmark, DollarSign,
  AlertCircle, Sparkles, Building2, Wallet, X, ChevronDown, CheckCheck
} from "lucide-react";
import { format } from "date-fns";
import toast from 'react-hot-toast';
import { sanitizeUrl } from '../../../lib/security';

const GATEWAY_OPTIONS = [
  { id: 'easypaisa', label: 'Easypaisa', color: 'emerald', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'jazzcash', label: 'JazzCash', color: 'red', bg: 'bg-red-50 text-red-700 border-red-200' },
  { id: 'nayapay', label: 'NayaPay', color: 'orange', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  { id: 'bank', label: 'Bank Transfer', color: 'blue', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'crypto', label: 'Crypto (USDT)', color: 'amber', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'redotpay', label: 'RedotPay', color: 'purple', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'manual_bonus', label: 'Admin Bonus', color: 'indigo', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
];

export default function DepositRequestsTab() {
  const ctx = useAdminContext();
  const { 
    depositRequests = [], 
    onApproveDeposit, 
    onRejectDeposit, 
    onDeleteDeposit,
    onAddManualDeposit,
    registeredUsers = [], 
    autoApproveDeposits, 
    onToggleAutoApprove, 
    autoApproveCrypto, 
    onToggleAutoApproveCrypto, 
    cryptoRate = 300,
    adminNotesText = {}, 
    setAdminNotesText = () => {}, 
    requestSearch = "", 
    setRequestSearch = () => {} 
  } = ctx;

  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [isMethodFilterOpen, setIsMethodFilterOpen] = useState(false);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Direct Credit Modal State
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditUsername, setCreditUsername] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditMethod, setCreditMethod] = useState('easypaisa');
  const [creditTxId, setCreditTxId] = useState('');
  const [creditSenderName, setCreditSenderName] = useState('Admin Direct Deposit');
  const [creditSenderPhone, setCreditSenderPhone] = useState('');
  const [creditNotes, setCreditNotes] = useState('Manually credited by Administrator');
  const [creditAutoApprove, setCreditAutoApprove] = useState(true);

  // User picker popover state
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [userPickerSearch, setUserPickerSearch] = useState('');

  const methodDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (methodDropdownRef.current && !methodDropdownRef.current.contains(event.target as Node)) {
        setIsMethodFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Copy helper
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTxId(text);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  // Submit manual credit
  const handleManualCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditUsername.trim()) {
      toast.error('Please select or enter a target user account.');
      return;
    }
    const numAmount = parseFloat(creditAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid deposit amount in PKR.');
      return;
    }

    if (onAddManualDeposit) {
      onAddManualDeposit({
        username: creditUsername.trim(),
        method: creditMethod,
        amount: numAmount,
        txId: creditTxId.trim() || ('TX_' + Date.now().toString(36).toUpperCase()),
        senderName: creditSenderName.trim(),
        senderPhone: creditSenderPhone.trim(),
        adminNotes: creditNotes.trim(),
        autoCredit: creditAutoApprove
      });
      setIsCreditModalOpen(false);
      setCreditUsername('');
      setCreditAmount('');
      setCreditTxId('');
    } else {
      toast.error('Direct deposit handler unavailable.');
    }
  };

  // Calculations
  const pendingCount = depositRequests.filter(r => (r.status || '').toUpperCase() === 'PENDING').length;
  const approvedCount = depositRequests.filter(r => (r.status || '').toUpperCase() === 'APPROVED').length;
  const rejectedCount = depositRequests.filter(r => (r.status || '').toUpperCase() === 'REJECTED').length;

  const totalApprovedPkr = depositRequests
    .filter(r => (r.status || '').toUpperCase() === 'APPROVED')
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  // Filtered requests
  const filteredRequests = depositRequests.filter(req => {
    const reqStatus = (req.status || 'PENDING').toUpperCase();
    if (statusFilter !== 'ALL' && reqStatus !== statusFilter) return false;

    if (methodFilter !== 'ALL' && req.method?.toLowerCase() !== methodFilter.toLowerCase()) return false;

    if (requestSearch.trim()) {
      const q = requestSearch.toLowerCase();
      const matchTx = (req.txId || '').toLowerCase().includes(q);
      const matchUser = (req.username || '').toLowerCase().includes(q);
      const matchSender = (req.senderName || '').toLowerCase().includes(q);
      const matchPhone = (req.senderPhone || '').toLowerCase().includes(q);
      const matchMethod = (req.method || '').toLowerCase().includes(q);
      if (!matchTx && !matchUser && !matchSender && !matchPhone && !matchMethod) return false;
    }

    return true;
  });

  const getMethodBadgeColor = (method: string) => {
    const m = (method || '').toLowerCase();
    if (m.includes('easypaisa')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (m.includes('jazzcash')) return 'bg-red-50 text-red-700 border-red-200';
    if (m.includes('nayapay')) return 'bg-orange-50 text-orange-700 border-orange-200';
    if (m.includes('bank')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (m.includes('crypto')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (m.includes('redotpay')) return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  // Filter users for target account picker
  const filteredUsers = registeredUsers.filter(u => {
    if (!userPickerSearch.trim()) return true;
    const q = userPickerSearch.toLowerCase();
    return (
      (u.username || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.fullName || '').toLowerCase().includes(q)
    );
  });

  const selectedUserObj = registeredUsers.find(u => u.username?.toLowerCase() === creditUsername.toLowerCase());

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      
      {/* 1. TOP ANALYTICS & AUTO-APPROVE CONTROLS BAR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xl border border-slate-700/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                Cash Deposit Approvals Log
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Real-time Sync
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review user payment transactions, verify TxIDs, and issue instant wallet credits
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={() => setIsCreditModalOpen(true)}
            className="self-start lg:self-auto bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span>Issue Direct Credit</span>
          </button>
        </div>

        {/* Stats & Gateway Auto-Approve Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Review</span>
              <span className="text-lg font-black text-amber-400 font-mono">{pendingCount} Requests</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <RefreshCw className={`h-4 w-4 ${pendingCount > 0 ? 'animate-spin' : ''}`} />
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Credited</span>
              <span className="text-lg font-black text-emerald-400 font-mono">₨ {totalApprovedPkr.toLocaleString()}</span>
            </div>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          {/* Local Auto Approve Toggle */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1">
                Local Gateways
              </span>
              <span className="text-xs font-bold text-slate-400">Easypaisa / JazzCash</span>
            </div>
            <button
              onClick={onToggleAutoApprove}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer border ${
                autoApproveDeposits 
                  ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50 hover:bg-emerald-600/40' 
                  : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
              }`}
            >
              <Zap className={`h-3.5 w-3.5 ${autoApproveDeposits ? 'text-emerald-400 fill-emerald-400' : 'text-slate-400'}`} />
              <span>{autoApproveDeposits ? 'AUTO ON' : 'MANUAL'}</span>
            </button>
          </div>

          {/* Crypto / RedotPay Auto Approve Toggle */}
          <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700/50 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1">
                Crypto / RedotPay
              </span>
              <span className="text-xs font-bold text-slate-400">Global & Web3</span>
            </div>
            <button
              onClick={onToggleAutoApproveCrypto}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer border ${
                autoApproveCrypto 
                  ? 'bg-amber-600/30 text-amber-300 border-amber-500/50 hover:bg-amber-600/40' 
                  : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
              }`}
            >
              <Zap className={`h-3.5 w-3.5 ${autoApproveCrypto ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
              <span>{autoApproveCrypto ? 'AUTO ON' : 'MANUAL'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN LOG CARD & FILTERS */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 space-y-4">
        
        {/* Filter Navigation Tabs & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
            {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => {
              const count = tab === 'ALL' ? depositRequests.length 
                : tab === 'PENDING' ? pendingCount 
                : tab === 'APPROVED' ? approvedCount 
                : rejectedCount;

              const active = statusFilter === tab;

              return (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-2 cursor-pointer shrink-0 ${
                    active 
                      ? 'bg-slate-900 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{tab}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    active 
                      ? 'bg-white/20 text-white' 
                      : tab === 'PENDING' && count > 0 
                        ? 'bg-amber-500 text-white font-bold'
                        : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Custom Gateway Filter Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-56">
              <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search TxID, User, Phone..."
                value={requestSearch}
                onChange={(e) => setRequestSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
              {requestSearch && (
                <button 
                  onClick={() => setRequestSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* CUSTOM MOBILE-FRIENDLY GATEWAY DROPDOWN */}
            <div className="relative" ref={methodDropdownRef}>
              <button
                type="button"
                onClick={() => setIsMethodFilterOpen(!isMethodFilterOpen)}
                className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 flex items-center gap-2 transition cursor-pointer"
              >
                <Filter className="h-3.5 w-3.5 text-slate-500" />
                <span>
                  {methodFilter === 'ALL' 
                    ? 'All Gateways' 
                    : GATEWAY_OPTIONS.find(g => g.id === methodFilter)?.label || methodFilter}
                </span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${isMethodFilterOpen ? 'rotate-180' : ''}`} />
              </button>

              {isMethodFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-40 animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      setMethodFilter('ALL');
                      setIsMethodFilterOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                      methodFilter === 'ALL' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>All Gateways</span>
                    {methodFilter === 'ALL' && <Check className="h-3.5 w-3.5 text-blue-600" />}
                  </button>
                  <div className="my-1 border-t border-slate-100" />
                  {GATEWAY_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setMethodFilter(opt.id);
                        setIsMethodFilterOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                        methodFilter === opt.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${opt.bg}`} />
                        {opt.label}
                      </span>
                      {methodFilter === opt.id && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. REQUEST LIST ITEMS */}
        <div className="space-y-3 min-h-[250px]">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-16 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <CreditCard className="h-10 w-10 mx-auto text-slate-300 mb-2 stroke-1" />
              <p className="text-sm font-bold text-slate-600">No Deposit Records Found</p>
              <p className="text-xs text-slate-400 mt-1">
                {requestSearch || methodFilter !== 'ALL' || statusFilter !== 'ALL'
                  ? 'Try clearing search terms or changing tab filters.'
                  : 'New deposit requests submitted by users will appear here automatically.'}
              </p>
            </div>
          ) : (
            filteredRequests.map((req) => {
              const reqStatus = (req.status || 'PENDING').toUpperCase();
              const isAuto = req.adminNotes?.toLowerCase().includes('auto');

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    reqStatus === 'PENDING'
                      ? 'bg-amber-50/30 border-amber-200/80 shadow-sm'
                      : reqStatus === 'APPROVED'
                        ? 'bg-emerald-50/20 border-emerald-200/60'
                        : 'bg-red-50/20 border-red-200/60'
                  }`}
                >
                  {/* Left Column: Data Details */}
                  <div className="space-y-2 flex-1">
                    
                    {/* Header line: Method, Status, Auto Tag */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border font-mono ${getMethodBadgeColor(req.method)}`}>
                        {req.method}
                      </span>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg flex items-center gap-1 ${
                        reqStatus === 'PENDING' 
                          ? 'bg-amber-100 text-amber-800 border border-amber-300/50' 
                          : reqStatus === 'APPROVED' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300/50' 
                            : 'bg-red-100 text-red-800 border border-red-300/50'
                      }`}>
                        {reqStatus === 'PENDING' && <RefreshCw className="h-2.5 w-2.5 animate-spin" />}
                        {reqStatus === 'APPROVED' && <CheckCircle2 className="h-2.5 w-2.5" />}
                        {reqStatus === 'REJECTED' && <XCircle className="h-2.5 w-2.5" />}
                        <span>{reqStatus}</span>
                      </span>

                      {isAuto && (
                        <span className="text-[9px] font-black bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200 flex items-center gap-1">
                          <Zap className="h-2.5 w-2.5 fill-purple-600" />
                          <span>AUTO APPROVED</span>
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-slate-400 ml-auto sm:ml-0">
                        {format(new Date(req.createdAt || Date.now()), "MMM dd, yyyy • hh:mm a")}
                      </span>
                    </div>

                    {/* Data Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/80 p-3 rounded-xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Account User</span>
                        <span className="font-bold text-slate-900 flex items-center gap-1">
                          <User className="h-3 w-3 text-slate-400" />
                          @{req.username || 'unknown'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Transaction ID (TxID)</span>
                        <div className="flex items-center gap-1">
                          <span className="font-bold font-mono text-slate-900 truncate max-w-[120px] sm:max-w-[150px]">
                            {req.txId || 'N/A'}
                          </span>
                          {req.txId && (
                            <button
                              onClick={() => handleCopy(req.txId)}
                              title="Copy TxID"
                              className="text-slate-400 hover:text-blue-600 transition cursor-pointer p-0.5"
                            >
                              {copiedTxId === req.txId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                            </button>
                          )}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Deposit Amount</span>
                        <div className="font-extrabold text-blue-600 flex items-baseline gap-1">
                          <span>₨ {(req.amount || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-emerald-600 font-bold">
                            ($ {((req.amount || 0) / cryptoRate).toFixed(2)})
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Sender Info</span>
                        <span className="font-semibold text-slate-800 text-[11px] block truncate">
                          {req.senderName || 'N/A'} {req.senderPhone ? `(${req.senderPhone})` : ''}
                        </span>
                      </div>
                    </div>

                    {/* Proof Screenshot Thumbnail & Admin Remarks */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      {req.proofImageUrl && (
                        <button
                          onClick={() => setPreviewImageUrl(req.proofImageUrl || null)}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50/80 border border-blue-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span>View Payment Proof</span>
                        </button>
                      )}

                      {req.adminNotes && (
                        <p className="text-[11px] text-slate-600 bg-slate-100/80 px-2.5 py-1 rounded-lg border border-slate-200 flex-1 truncate">
                          <span className="font-bold text-slate-500">Note: </span>
                          <span>{req.adminNotes}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Verification Action Panel */}
                  <div className="shrink-0 w-full lg:w-64 bg-white p-3 rounded-xl border border-slate-200 space-y-2">
                    {reqStatus === 'PENDING' ? (
                      <>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Verification Action
                        </span>
                        <input
                          type="text"
                          placeholder="Note / Reason (optional)"
                          value={adminNotesText[req.id] || ''}
                          onChange={(e) => setAdminNotesText((prev: any) => ({ ...prev, [req.id]: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            onClick={() => onApproveDeposit(req.id, adminNotesText[req.id])}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm transition"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => onRejectDeposit(req.id, adminNotesText[req.id])}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-2 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm transition"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[11px] font-bold flex items-center gap-1 ${
                          reqStatus === 'APPROVED' ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {reqStatus === 'APPROVED' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          <span>{reqStatus === 'APPROVED' ? 'Approved & Credited' : 'Rejected'}</span>
                        </span>

                        <div className="flex items-center gap-1">
                          {reqStatus === 'REJECTED' && (
                            <button
                              onClick={() => onApproveDeposit(req.id, 'Re-approved by administrator')}
                              title="Re-approve and Credit User Wallet"
                              className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition cursor-pointer border border-emerald-200"
                            >
                              Approve
                            </button>
                          )}
                          {onDeleteDeposit && (
                            <button
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this deposit record?')) {
                                  onDeleteDeposit(req.id);
                                }
                              }}
                              title="Delete Record"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      {/* DIRECT CREDIT MODAL */}
      {isCreditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar">
            
            <button
              onClick={() => setIsCreditModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-5 pr-8">
              <div className="w-11 h-11 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shrink-0">
                <Plus className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Issue Direct Credit</h3>
                <p className="text-xs text-slate-500">Add deposit record & credit user wallet</p>
              </div>
            </div>

            <form onSubmit={handleManualCreditSubmit} className="space-y-4">
              
              {/* CUSTOM SEARCHABLE USER PICKER */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Target User Account
                </label>
                
                {registeredUsers.length > 0 ? (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsUserPickerOpen(!isUserPickerOpen)}
                      className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl p-3 text-left flex items-center justify-between transition cursor-pointer"
                    >
                      {creditUsername ? (
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center uppercase shrink-0 shadow-sm">
                            {creditUsername.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span className="font-extrabold text-xs text-slate-900 block truncate">
                              @{creditUsername}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium block truncate">
                              {selectedUserObj?.fullName || selectedUserObj?.email || 'Registered User'} • Balance: ₨ {((selectedUserObj?.balance || 0) * (cryptoRate || 278)).toFixed(1)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Tap to select target user account...</span>
                        </span>
                      )}
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform shrink-0 ${isUserPickerOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* USER PICKER POPUP SHEET */}
                    {isUserPickerOpen && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2">
                        <div className="relative">
                          <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Type to search user or email..."
                            value={userPickerSearch}
                            onChange={(e) => setUserPickerSearch(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            autoFocus
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-1">
                          {filteredUsers.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-4">No matching users found.</p>
                          ) : (
                            filteredUsers.map((u) => {
                              const isSelected = creditUsername.toLowerCase() === (u.username || '').toLowerCase();
                              return (
                                <button
                                  key={u.id}
                                  type="button"
                                  onClick={() => {
                                    setCreditUsername(u.username || '');
                                    setIsUserPickerOpen(false);
                                  }}
                                  className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                                    isSelected 
                                      ? 'bg-blue-50 text-blue-900 border border-blue-200' 
                                      : 'hover:bg-slate-50 text-slate-800'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <div className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center uppercase shrink-0 ${
                                      isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                                    }`}>
                                      {(u.username || 'U').charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                      <span className="font-bold text-xs block truncate">@{u.username}</span>
                                      <span className="text-[10px] text-slate-500 block truncate">
                                        {u.fullName || u.email || 'User'}
                                      </span>
                                    </div>
                                  </div>

                                  <span className="text-[10px] font-mono font-extrabold text-emerald-600 shrink-0 ml-2">
                                    ₨ {((u.balance || 0) * (cryptoRate || 278)).toFixed(1)}
                                  </span>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="Enter Username (e.g. zain_khan)"
                    value={creditUsername}
                    onChange={(e) => setCreditUsername(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                )}
              </div>

              {/* PKR AMOUNT FIELD */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Deposit Amount (PKR)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-xs">₨</span>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-8 pr-3.5 py-2.5 text-sm font-mono font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    required
                  />
                </div>
              </div>

              {/* CUSTOM VISUAL GATEWAY SELECTOR TILES */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Gateway Method
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {GATEWAY_OPTIONS.map((g) => {
                    const isSelected = creditMethod === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setCreditMethod(g.id)}
                        className={`p-2.5 rounded-2xl border text-left transition flex items-center justify-between cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-blue-500/30'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <span className="text-xs font-bold truncate">{g.label}</span>
                        {isSelected && <CheckCheck className="h-4 w-4 text-emerald-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* OPTIONAL TXID */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Transaction ID (TxID)
                </label>
                <input
                  type="text"
                  placeholder="Optional (Auto-generated if empty)"
                  value={creditTxId}
                  onChange={(e) => setCreditTxId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* ADMIN REASON / NOTES */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Admin Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Manually verified direct transfer"
                  value={creditNotes}
                  onChange={(e) => setCreditNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* IMMEDIATE AUTO CREDIT CHECKBOX */}
              <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-2xl flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="autoCreditCheck"
                  checked={creditAutoApprove}
                  onChange={(e) => setCreditAutoApprove(e.target.checked)}
                  className="rounded-lg border-emerald-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4 cursor-pointer"
                />
                <label htmlFor="autoCreditCheck" className="text-xs font-bold text-emerald-900 cursor-pointer select-none">
                  Approve & Credit User Wallet Immediately
                </label>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreditModalOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-2xl text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-2xl text-xs transition cursor-pointer shadow-lg shadow-blue-600/25 active:scale-95"
                >
                  Confirm Credit
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* PROOF IMAGE PREVIEW MODAL */}
      {previewImageUrl && (
        <div 
          onClick={() => setPreviewImageUrl(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full p-5 relative shadow-2xl space-y-3 cursor-default animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                Payment Proof Screenshot
              </h4>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                Close ✕
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-2xl border border-slate-200 flex justify-center bg-slate-900/5 p-2">
              <img 
                src={previewImageUrl} 
                alt="Payment Proof" 
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow"
              />
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <a 
                href={sanitizeUrl(previewImageUrl)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-bold flex items-center gap-1"
              >
                <span>Open in Full Screen Tab</span>
                <ExternalLink className="h-3 w-3" />
              </a>

              <button
                onClick={() => setPreviewImageUrl(null)}
                className="bg-slate-900 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
