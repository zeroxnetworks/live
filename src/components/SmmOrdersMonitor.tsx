import React, { useState } from "react";
import { SmmOrder, SmmService, UserAccount } from "../types";
import { Search, RefreshCw, Mail, Download, CheckCircle2, Clock, CheckSquare } from "lucide-react";
import { toast } from "react-hot-toast";
import { InvoiceData } from "../lib/invoiceGenerator";
import { downloadSmmReceiptPdf } from "../lib/smmReceiptGenerator";

interface SmmOrdersMonitorProps {
  cryptoRate?: number;
  orders: SmmOrder[];
  users: UserAccount[];
  services: SmmService[];
  onRefresh: () => void;
}

export default function SmmOrdersMonitor({
  cryptoRate, orders, users, services, onRefresh }: SmmOrdersMonitorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncAll = async () => {
    setIsSyncing(true);
    toast.loading("Syncing all active SMM orders with Zerox Network...", { id: "sync" });
    try {
      const res = await fetch("/api/smm/sync-status", { method: "POST" });
      if (res.ok) {
        toast.success("Order statuses synced successfully!", { id: "sync" });
        onRefresh();
      } else {
        toast.error("Failed to sync orders from Zerox Network.", { id: "sync" });
      }
    } catch (e) {
      toast.error("Network error during sync.", { id: "sync" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGenerateInvoice = async (order: SmmOrder) => {
    const user = users.find(u => u.id === order.userId);
    const service = services.find(s => s.id === order.serviceId || s.providerServiceId === order.serviceId);
    
    if (!user || !service) {
      toast.error("User or Service data missing for this order.");
      return;
    }

    const invoiceData: InvoiceData = {
      invoiceNumber: `INV-${order.id.substring(0, 8).toUpperCase()}`,
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

    toast.loading("Generating Official PDF Receipt...", { id: "admin-pdf" });
    try {
      await downloadSmmReceiptPdf(invoiceData, order.link, !!service.refill);
      toast.success("PDF Generated Successfully", { id: "admin-pdf" });
    } catch (e) {
      toast.error("Failed to generate PDF.", { id: "admin-pdf" });
    }
  };

  const handleSendEmail = (order: SmmOrder) => {
    const user = users.find(u => u.id === order.userId);
    if (!user?.email) {
      toast.error("User email not found");
      return;
    }

    const subject = encodeURIComponent(`Order Completed - Zerox Network (#${order.id})`);
    const body = encodeURIComponent(`Hi ${user.fullName || user.username},

Great news! Your order #${order.id} for "${order.serviceName}" has been successfully completed.

We strive to provide the best services. If you are satisfied with your experience, we would highly appreciate it if you could leave us a 5-star review!

Should you need any further assistance, feel free to reach out to us at:
WhatsApp Support: +44 7868 713315
Email: zeroxnetworks@gmail.com

Thank you for choosing Zerox Network!

Best regards,
The Zerox Network Team`);
    
    window.location.href = `mailto:${user.email}?subject=${subject}&body=${body}`;
    toast.success("Opened email client to send review request!");
  };

  const filteredOrders = orders
    .filter(o => filterStatus === "ALL" || (o.status || "PENDING").toUpperCase() === filterStatus)
    .filter(o => 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.providerOrderId && o.providerOrderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      o.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.serviceName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-[#00AEEF] rounded-lg">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Global Order Monitor</h3>
              <p className="text-xs text-slate-500 font-medium">Track all user SMM orders with realtime status sync</p>
            </div>
          </div>
          <button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin text-blue-400" : "text-slate-300"}`} />
            Sync All Statuses
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order ID, Username, or Service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF] transition-all bg-slate-50"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none focus:border-[#00AEEF]"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending / Processing</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="PARTIAL">Partial</option>
            <option value="CANCELED">Canceled</option>
          </select>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="p-3 font-bold uppercase tracking-wider w-24">Order ID</th>
                <th className="p-3 font-bold uppercase tracking-wider">User</th>
                <th className="p-3 font-bold uppercase tracking-wider">Service</th>
                <th className="p-3 font-bold uppercase tracking-wider text-center">Qty / Cost</th>
                <th className="p-3 font-bold uppercase tracking-wider text-center">Status</th>
                <th className="p-3 font-bold uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No orders found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const status = (order.status || "PENDING").toUpperCase();
                  const isCompleted = status === "COMPLETED";
                  
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-mono font-extrabold text-slate-700">
                        {order.providerOrderId ? `#${order.providerOrderId}` : `#${order.id.substring(0, 8)}`}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{order.username}</div>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[100px]">{order.userId}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-[#00AEEF] truncate max-w-[200px]">{order.serviceName}</div>
                        <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{order.link}</div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="font-black text-slate-800">{order.quantity.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-600 font-bold">{order.charge.toFixed(2)} PKR</div>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-md text-[9px] font-extrabold uppercase ${
                          isCompleted ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
                          status === 'CANCELED' ? 'bg-red-50 text-red-600 border border-red-200' :
                          status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                          'bg-amber-50 text-amber-600 border border-amber-200'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleGenerateInvoice(order)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
                            title="Generate Official PDF Invoice"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {isCompleted && (
                            <button
                              onClick={() => handleSendEmail(order)}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg transition-colors border border-indigo-200 flex items-center gap-1 px-2"
                              title="Send 5-Star Review Request Email"
                            >
                              <Mail className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-bold uppercase tracking-wider">Request Review</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
