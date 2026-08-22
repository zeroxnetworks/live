import React, { useState } from "react";
import { History, CheckCircle2, XCircle, Ban, Copy, Check, Search, Trash2, Download, RefreshCw, ChevronDown, FileText, ExternalLink } from "lucide-react";
import CurrencyDisplay from "./CurrencyDisplay";
import { ActivationOrder, UserAccount } from "../types";
import InvoiceModal from "./InvoiceModal";
import { InvoiceData } from "../lib/invoiceGenerator";
import { getServiceConfig } from "../utils/serviceIcons";

interface OrdersHistoryProps {
  cryptoRate?: number;
  onBuyAgain?: (country: string, product: string) => void;
  orders: ActivationOrder[];
  onClearHistory: () => void;
  formatPrice: (baseUnits: number) => string;
  currentUser?: UserAccount | null;
  onViewDetails?: (order: ActivationOrder) => void;
}

export default function OrdersHistory({
  cryptoRate, orders, onClearHistory, onBuyAgain, formatPrice, currentUser, onViewDetails }: OrdersHistoryProps) {
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [isMinimized, setIsMinimized] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceData | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const historyOrders = orders.filter(
    (o) => o.status === "FINISHED" || o.status === "CANCELED" || o.status === "BANNED"
  );

  const filteredHistory = historyOrders.filter(
    (o) =>
      o.phone.includes(search) ||
      o.product.toLowerCase().includes(search.toLowerCase()) ||
      o.country.toLowerCase().includes(search.toLowerCase())
  );

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportCSV = () => {
    if (historyOrders.length === 0) return;

    const headers = [
      "Order ID",
      "Service",
      "Country",
      "Phone Number",
      "Latest SMS Code",
      "SMS Message Text",
      "Price (Base)",
      "Price (PKR)",
      "Price (USD)",
      "Status",
      "Date Time"
    ];

    const rows = historyOrders.map((o) => {
      const lastSms = o.sms && o.sms.length > 0 ? o.sms[o.sms.length - 1] : null;
      const smsCode = lastSms?.code || "";
      const smsText = lastSms?.text || "";
      const priceUsd = o.price || 0;
      const pricePkr = (priceUsd * (cryptoRate || 278)).toFixed(2);
      const priceUsdStr = priceUsd.toFixed(2);
      const dateStr = o.created_at ? new Date(o.created_at).toLocaleString() : "";

      return [
        o.id,
        `"${(o.product || "").replace(/"/g, '""')}"`,
        `"${(o.country || "").replace(/"/g, '""')}"`,
        `"${(o.phone || "").replace(/"/g, '""')}"`,
        `"${smsCode.replace(/"/g, '""')}"`,
        `"${smsText.replace(/"/g, '""')}"`,
        priceUsd,
        pricePkr,
        priceUsdStr,
        `"${o.status}"`,
        `"${dateStr}"`
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `activation_orders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInvoice = (order: ActivationOrder) => {
    const priceUsd = order.price || 0;
    const pricePkr = Number((priceUsd * (cryptoRate || 278)).toFixed(2));
    
    const invoiceData: InvoiceData = {
      invoiceNumber: `INV-SMS-${order.id}`,
      orderId: order.id,
      date: order.created_at || new Date().toISOString(),
      customerName: currentUser?.username || "Client",
      customerEmail: currentUser?.email || "",
      customerPhone: currentUser?.phone || order.phone,
      paymentMethod: "Zerox Wallet Balance",
      status: order.status === "FINISHED" ? "COMPLETED" : order.status === "CANCELED" ? "CANCELED" : order.status === "BANNED" ? "BANNED" : String(order.status),
      items: [
        {
          id: order.id,
          title: `SMS Activation - ${order.product.toUpperCase()} (${order.country})`,
          category: "SMS Activation",
          details: `Phone: ${order.phone} | SMS Code: ${order.sms?.[0]?.code || "Received"}`,
          quantity: 1,
          unitPriceUsd: priceUsd,
          unitPricePkr: pricePkr,
          totalUsd: priceUsd,
          totalPkr: pricePkr
        }
      ],
      subtotalPkr: pricePkr,
      subtotalUsd: priceUsd,
      grandTotalPkr: pricePkr,
      grandTotalUsd: priceUsd
    };

    setSelectedInvoice(invoiceData);
    setIsInvoiceOpen(true);
  };

  return (
    <div id="orders-history-card" className="relative overflow-hidden bg-slate-950 border border-slate-900 rounded-2xl p-5 sm:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-slate-800 space-y-4">
      <InvoiceModal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} data={selectedInvoice} />
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-900 pb-3.5">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-blue-950/40 border border-blue-500/20 rounded-xl text-[#00AEEF]">
            <History className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-extrabold text-white uppercase tracking-wider font-sans">
            Activation History
          </h3>
          <span className="px-2 py-0.5 bg-slate-900 text-slate-400 border border-slate-800 rounded-md text-[9px] font-black font-mono">
            {historyOrders.length} ARCHIVED
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {historyOrders.length > 0 && (
            <>
              <button
                id="export-csv-btn"
                onClick={handleExportCSV}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[10px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider transition cursor-pointer"
                title="Export activation order history to CSV file"
              >
                <Download className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden xs:inline">Export CSV</span>
              </button>

              <button
                id="clear-logs-btn"
                onClick={onClearHistory}
                className="bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 hover:text-red-300 text-[10px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-black uppercase tracking-wider transition cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden xs:inline">Clear Logs</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-all text-xs font-semibold cursor-pointer"
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

      {historyOrders.length === 0 ? (
        <div id="history-empty-state" className="text-center py-12 border border-dashed border-slate-900 rounded-2xl bg-slate-900/10">
          <p className="text-[10px] text-slate-500 font-black font-mono uppercase tracking-widest">No historical activations found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-3.5 w-3.5 text-slate-500" />
            <input
              id="history-search-input"
              type="text"
              placeholder="Search by phone, country, or service..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-850/80 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500/80 transition shadow-inner font-sans font-medium"
            />
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table id="history-table" className="w-full text-left border-collapse text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 font-black text-[9px] uppercase tracking-wider font-mono">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">Service / Country</th>
                  <th className="py-3 px-2">Phone Number</th>
                  <th className="py-3 px-2">SMS Verification Code</th>
                  <th className="py-3 px-2">Line Cost</th>
                  <th className="py-3 px-2 text-right">Status / Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60 font-mono">
                {filteredHistory.map((order) => {
                  const smsCode = order.sms && order.sms.length > 0 ? order.sms[order.sms.length - 1].code : null;
                  const config = getServiceConfig(order.product);
                  const IconComp = config.icon;
                  return (
                    <tr key={order.id} className="hover:bg-slate-900/20 transition-colors border-b border-slate-900/40">
                      <td className="py-3.5 px-2 text-[10px] text-slate-600">#{order.id}</td>
                      <td className="py-3.5 px-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded border ${config.bgClass} ${config.borderClass}`}>
                            <IconComp className={`h-3.5 w-3.5 ${config.textClass}`} />
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 capitalize font-sans text-xs">
                              {config.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold capitalize font-sans">{order.country}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-2 text-slate-200 font-bold select-all tracking-wide">{order.phone}</td>
                      <td className="py-3.5 px-2">
                        {smsCode ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[#00e1ff] font-bold bg-slate-900 px-2.5 py-0.5 rounded-lg border border-[#00AEEF]/20 text-xs shadow-[0_0_10px_rgba(0,174,239,0.1)]">
                              {smsCode}
                            </span>
                            <button
                              onClick={() => handleCopy(order.id, smsCode)}
                              className="text-slate-500 hover:text-slate-300 transition cursor-pointer p-1"
                            >
                              {copiedId === order.id ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[10px] font-bold">--</span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-slate-300 text-xs font-black">
                        <CurrencyDisplay 
                          baseUnits={order.price} 
                          formatPrice={formatPrice} 
                          usdClassName="text-emerald-400 font-bold"
                        />
                      </td>
                      <td className="py-3.5 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {onViewDetails && (
                            <button
                              onClick={() => onViewDetails(order)}
                              className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                              title="View Order Details"
                            >
                              <ExternalLink className="h-3 w-3 text-cyan-400" />
                              <span className="hidden sm:inline">Details</span>
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenInvoice(order)}
                            className="p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition cursor-pointer"
                            title="Download PDF Invoice / Receipt"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          {onBuyAgain && (
                            <button 
                              onClick={() => onBuyAgain(order.country, order.product)}
                              className="bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition cursor-pointer"
                              title="Buy this service again"
                            >
                              Allocate Again
                            </button>
                          )}
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                              order.status === "FINISHED"
                                ? "bg-blue-950/30 text-[#00AEEF] border-[#00AEEF]/30"
                                : order.status === "CANCELED"
                                ? "bg-slate-900 text-slate-500 border-slate-800"
                                : "bg-red-950/30 text-red-400 border-red-900/30"
                            }`}
                          >
                            {order.status === "FINISHED" ? (
                              <CheckCircle2 className="h-2.5 w-2.5 text-[#00AEEF]" />
                            ) : order.status === "CANCELED" ? (
                              <XCircle className="h-2.5 w-2.5 text-slate-500" />
                            ) : (
                              <Ban className="h-2.5 w-2.5 text-red-400" />
                            )}
                            <span className="ml-0.5">{order.status}</span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-600 font-bold font-mono">
                      No matching records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </div>
      )}
    </div>
  );
}
