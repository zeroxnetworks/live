import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, User, Tag, Clock, CheckCircle, Search, Filter, 
  ChevronRight, Reply, X, Paperclip, MoreVertical, AlertTriangle, ShieldCheck, 
  Send, ShoppingBag, RotateCcw, XCircle, CheckCircle2
} from 'lucide-react';
import { SupportTicket } from '../../../types';

export default function SupportTicketsTab() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED">("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    // Mock data for tickets
    setTickets([
      {
        id: "TICK-1029",
        userId: "u1",
        username: "AlexH",
        userEmail: "alex@example.com",
        subject: "Failed SMS Number (VKontakte)",
        status: "OPEN",
        priority: "HIGH",
        category: "SMS_ISSUE",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
        relatedOrderId: "ORD-9921",
        messages: [
          {
            id: "m1",
            senderId: "u1",
            senderName: "AlexH",
            senderRole: "USER",
            content: "I bought a VK number but didn't receive the SMS code after 15 minutes. Please refund my balance.",
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          }
        ]
      },
      {
        id: "TICK-1028",
        userId: "u2",
        username: "SarahJ",
        userEmail: "sarahj@example.com",
        subject: "Deposit via Binance not approved",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
        category: "DEPOSIT_ISSUE",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 1000000).toISOString(),
        messages: [
          {
            id: "m1",
            senderId: "u2",
            senderName: "SarahJ",
            senderRole: "USER",
            content: "I sent 50 USDT yesterday but it's still pending in my dashboard.",
            timestamp: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: "m2",
            senderId: "admin1",
            senderName: "Admin Support",
            senderRole: "ADMIN",
            content: "Hi Sarah, can you please provide the TXID for this transaction so I can check with our gateway?",
            timestamp: new Date(Date.now() - 40000000).toISOString(),
          },
          {
            id: "m3",
            senderId: "u2",
            senderName: "SarahJ",
            senderRole: "USER",
            content: "Sure, it's 0x39f28a9b2...",
            timestamp: new Date(Date.now() - 1000000).toISOString(),
          }
        ]
      }
    ]);
  }, []);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = 
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filterStatus !== "ALL" && t.status !== filterStatus) return false;
    if (filterCategory !== "ALL" && t.category !== filterCategory) return false;
    
    return true;
  });

  const handleReply = () => {
    if (!replyContent.trim() || !selectedTicketId) return;

    setTickets(prev => prev.map(t => {
      if (t.id === selectedTicketId) {
        return {
          ...t,
          status: t.status === "OPEN" ? "IN_PROGRESS" : t.status,
          updatedAt: new Date().toISOString(),
          messages: [
            ...t.messages,
            {
              id: `m${Date.now()}`,
              senderId: "admin",
              senderName: "Admin",
              senderRole: "ADMIN",
              content: replyContent,
              timestamp: new Date().toISOString()
            }
          ]
        };
      }
      return t;
    }));
    
    // Trigger Ticket Reply Email
    fetch("/api/email/ticket-reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        toEmail: selectedTicket.userEmail,
        username: selectedTicket.username,
        ticketId: selectedTicket.id,
        subject: selectedTicket.subject,
        reply: replyContent
      })
    }).catch(err => console.error("Ticket email failed", err));

    setReplyContent("");
  };
  
  const handleStatusChange = (newStatus: SupportTicket["status"]) => {
    if (!selectedTicketId || !selectedTicket) return;
    setTickets(prev => prev.map(t => 
      t.id === selectedTicketId ? { ...t, status: newStatus, updatedAt: new Date().toISOString() } : t
    ));

    // If status is changed to CLOSED, trigger feedback request email
    if (newStatus === "CLOSED") {
      fetch("/api/email/feedback-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: selectedTicket.userEmail,
          username: selectedTicket.username,
          ticketId: selectedTicket.id,
          subject: selectedTicket.subject
        })
      }).catch(err => console.error("Feedback request email failed", err));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OPEN": return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Open</span>;
      case "IN_PROGRESS": return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">In Progress</span>;
      case "RESOLVED": return <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Resolved</span>;
      case "CLOSED": return <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black uppercase">Closed</span>;
      default: return null;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "HIGH": 
      case "URGENT": return <span className="text-red-600 flex items-center gap-1 text-[10px] font-bold"><AlertTriangle className="h-3 w-3" /> {priority}</span>;
      case "MEDIUM": return <span className="text-amber-600 flex items-center gap-1 text-[10px] font-bold">Medium</span>;
      default: return <span className="text-emerald-600 flex items-center gap-1 text-[10px] font-bold">Low</span>;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in h-[80vh] flex flex-col">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex-shrink-0">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-indigo-500" />
          Customer Support & Dispute Desk
        </h3>
        <p className="text-[11px] text-slate-500 font-bold uppercase mt-1">Manage and resolve user tickets, SMS disputes, and deposit issues.</p>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Ticket List */}
        <div className={`w-full md:w-1/3 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden ${selectedTicketId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="flex-1 bg-white border border-slate-200 rounded text-[10px] font-bold p-1.5 text-slate-700"
              >
                <option value="ALL">All Status</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded text-[10px] font-bold p-1.5 text-slate-700"
              >
                <option value="ALL">All Categories</option>
                <option value="SMS_ISSUE">SMS Issues</option>
                <option value="SMM_ISSUE">SMM Issues</option>
                <option value="DEPOSIT_ISSUE">Deposits</option>
                <option value="ACCOUNT_ISSUE">Accounts</option>
              </select>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
            {filteredTickets.map(ticket => (
              <div 
                key={ticket.id}
                onClick={() => setSelectedTicketId(ticket.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedTicketId === ticket.id ? 'border-indigo-500 bg-indigo-50/50 shadow-sm' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono font-bold text-slate-500">{ticket.id}</span>
                  {getStatusBadge(ticket.status)}
                </div>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">{ticket.subject}</h4>
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1"><User className="h-3 w-3" /> {ticket.username}</span>
                  <span>{new Date(ticket.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="text-center p-6 text-slate-400">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs font-bold">No tickets found</p>
              </div>
            )}
          </div>
        </div>

        {/* Ticket Detail */}
        <div className={`w-full md:w-2/3 bg-white border border-slate-200 rounded-xl flex flex-col overflow-hidden ${!selectedTicketId ? 'hidden md:flex' : 'flex'}`}>
          {selectedTicket ? (
            <>
              {/* Detail Header */}
              <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-base font-black text-slate-800">{selectedTicket.subject}</h2>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-bold text-slate-500">
                      <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {selectedTicket.id}</span>
                      <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" /> {selectedTicket.username} ({selectedTicket.userEmail})</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(selectedTicket.createdAt).toLocaleString()}</span>
                      {selectedTicket.relatedOrderId && (
                         <span className="flex items-center gap-1 text-indigo-600 bg-indigo-50 px-1.5 rounded"><ShoppingBag className="h-3 w-3" /> {selectedTicket.relatedOrderId}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setSelectedTicketId(null)} className="md:hidden p-1.5 text-slate-400 hover:bg-slate-100 rounded">
                       <X className="h-5 w-5" />
                    </button>
                    <div className="hidden md:flex bg-slate-50 border border-slate-200 rounded p-1">
                      <select 
                        value={selectedTicket.status}
                        onChange={(e) => handleStatusChange(e.target.value as any)}
                        className="bg-transparent text-[11px] font-bold text-slate-700 focus:outline-none pr-4"
                      >
                        <option value="OPEN">Mark as Open</option>
                        <option value="IN_PROGRESS">Mark as In Progress</option>
                        <option value="RESOLVED">Mark as Resolved</option>
                        <option value="CLOSED">Mark as Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Quick Actions (Admin specific) */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-50 overflow-x-auto custom-scrollbar pb-1">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mr-1">Admin Tools:</span>
                  <button className="text-[10px] font-bold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors whitespace-nowrap">
                    <User className="h-3 w-3" /> View Profile
                  </button>
                  {selectedTicket.category === 'SMS_ISSUE' && (
                    <>
                       <button className="text-[10px] font-bold px-2 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 transition-colors whitespace-nowrap">
                        <RotateCcw className="h-3 w-3" /> Issue Partial Refund
                      </button>
                      <button className="text-[10px] font-bold px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 transition-colors whitespace-nowrap">
                        <XCircle className="h-3 w-3" /> Cancel Number
                      </button>
                    </>
                  )}
                  {selectedTicket.category === 'DEPOSIT_ISSUE' && (
                    <button className="text-[10px] font-bold px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 transition-colors whitespace-nowrap">
                      <CheckCircle2 className="h-3 w-3" /> Force Approve Deposit
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Thread */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 custom-scrollbar">
                {selectedTicket.messages.map((msg) => {
                  const isAdmin = msg.senderRole === 'ADMIN';
                  return (
                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3 ${isAdmin ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                        <div className="flex items-center justify-between mb-1 gap-4">
                          <span className={`text-[10px] font-black ${isAdmin ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {msg.senderName} {isAdmin && ' (Support)'}
                          </span>
                          <span className={`text-[9px] ${isAdmin ? 'text-indigo-300' : 'text-slate-400'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Reply Box */}
              <div className="p-3 border-t border-slate-200 bg-white shrink-0">
                {selectedTicket.status === 'CLOSED' ? (
                  <div className="text-center p-2 text-sm text-slate-500 font-medium">
                    This ticket is closed. You can change the status above to reopen it.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <textarea 
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply here..."
                      className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none custom-scrollbar"
                      rows={3}
                    />
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                         <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-colors">
                           <Paperclip className="h-4 w-4" />
                         </button>
                      </div>
                      <button 
                        onClick={handleReply}
                        disabled={!replyContent.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        Send Reply <Send className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
              <MessageSquare className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm font-bold text-slate-500">Select a ticket to view details</p>
              <p className="text-xs mt-1 text-center">Manage customer inquiries, disputes, and issues from the sidebar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
