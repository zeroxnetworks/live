import React, { useState, useEffect, useRef } from "react";
import { 
  MessageSquare, Search, Filter, RefreshCw, User, Calendar, 
  Clock, ShieldCheck, Eye, Bot, Sparkles, CheckCircle2, ChevronRight,
  Database, FileText, ArrowRight
} from "lucide-react";

interface ChatConversation {
  id: string;
  userId: string;
  username: string;
  lastMessage: string;
  lastActivity: string | any;
  messageCount: number;
  status: "active" | "closed";
  updatedAt?: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  createdAt?: any;
}

export const ChatConversationsTab: React.FC = () => {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<ChatMessage[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "yesterday" | "7days" | "30days">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Conversation List
  const fetchConversations = async () => {
    try {
      setLoadingList(true);
      const res = await fetch(`/api/admin/chat-conversations?status=${statusFilter}&date=${dateFilter}&search=${encodeURIComponent(searchQuery)}`, {
        headers: { "x-admin-key": "admin123" }
      });
      const data = await res.json();
      if (data.success) {
        setConversations(data.conversations || []);
        if (!selectedConvId && data.conversations?.length > 0) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load chat conversations", err);
    } finally {
      setLoadingList(false);
    }
  };

  // Fetch Messages for Selected Conversation
  const fetchMessages = async (convId: string) => {
    try {
      setLoadingMessages(true);
      const res = await fetch(`/api/admin/chat-conversations/${convId}`, {
        headers: { "x-admin-key": "admin123" }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedMessages(data.messages || []);
      }
    } catch (err) {
      console.error("Failed to load messages", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [statusFilter, dateFilter]);

  useEffect(() => {
    if (selectedConvId) {
      fetchMessages(selectedConvId);
    }
  }, [selectedConvId]);

  // Auto-refresh timer
  useEffect(() => {
    let interval: any = null;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchConversations();
        if (selectedConvId) {
          fetchMessages(selectedConvId);
        }
      }, 15000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, selectedConvId, statusFilter, dateFilter]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedMessages]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);

  // Format timestamp helper
  const formatTimeAgo = (timeVal: any) => {
    if (!timeVal) return "Recently";
    try {
      const date = typeof timeVal === "string" ? new Date(timeVal) : new Date(timeVal._seconds * 1000);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch (e) {
      return "Recently";
    }
  };

  return (
    <div className="space-y-6 text-white font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950/40 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <MessageSquare className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide">
                  Chatbot Conversation Center
                </h2>
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black uppercase px-2 py-0.5 rounded-full font-mono">
                  Live Admin Monitoring
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium mt-0.5">
                Inspect customer interactions, verify AI responses, and audit user inquiries in real-time.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                autoRefresh 
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                  : "bg-zinc-800 text-zinc-400 border-zinc-700"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-ping" : "bg-zinc-500"}`}></span>
              Auto-Sync (15s)
            </button>

            <button
              onClick={() => {
                fetchConversations();
                if (selectedConvId) fetchMessages(selectedConvId);
              }}
              disabled={loadingList || loadingMessages}
              className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs border border-zinc-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingList || loadingMessages ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Total Conversations</span>
            <MessageSquare className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {conversations.length}
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">Recorded user sessions</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Active Sessions</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {conversations.filter(c => c.status === "active").length}
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">Currently open threads</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Total Messages</span>
            <FileText className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {conversations.reduce((acc, c) => acc + (c.messageCount || 0), 0)}
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">Combined exchange count</p>
        </div>

        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-bold font-mono uppercase tracking-wider">Security Access</span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            AUDITED
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">Admin view logged in security audit</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Username, User ID, or message content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchConversations()}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <button
            onClick={fetchConversations}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
          >
            Search
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800/60 pt-3 text-xs">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-bold font-mono">Status:</span>
            {(["all", "active", "closed"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase transition cursor-pointer ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-bold font-mono">Date:</span>
            {(["all", "today", "yesterday", "7days", "30days"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDateFilter(d)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase transition cursor-pointer ${
                  dateFilter === d
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:text-white"
                }`}
              >
                {d === "7days" ? "7 Days" : d === "30days" ? "30 Days" : d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Conversations Split-View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
        {/* Left Column: Conversations List */}
        <div className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col h-[600px]">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <h3 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
              Conversations ({conversations.length})
            </h3>
            <span className="text-[10px] text-zinc-500">Sorted by recent activity</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 mt-3 pr-1">
            {loadingList ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                <span>Loading conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs text-center p-4">
                <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-indigo-400" />
                <p className="font-bold text-zinc-300">No conversations found</p>
                <p className="text-[10px] text-zinc-500 mt-1">Customer chatbot messages will appear here live when users chat with Mr.Zx AI.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? "bg-indigo-600/20 border-indigo-500/50 text-white shadow-md"
                        : "bg-zinc-950/60 border-zinc-800/80 hover:bg-zinc-800/50 text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs font-black">
                          {conv.username?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block leading-tight">
                            {conv.username || "Guest User"}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500">
                            ID: {conv.userId || conv.id}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-mono text-zinc-400 block">
                          {formatTimeAgo(conv.lastActivity)}
                        </span>
                        <span className="text-[9px] bg-indigo-950 border border-indigo-800/60 text-indigo-300 font-mono px-1.5 py-0.5 rounded-md font-bold">
                          {conv.messageCount || 0} msgs
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-1 italic">
                      "{conv.lastMessage || "No messages yet"}"
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Conversation Log View */}
        <div className="lg:col-span-7 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col h-[600px] relative">
          {selectedConv ? (
            <>
              {/* Active Conversation Top Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{selectedConv.username}</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md uppercase">
                        {selectedConv.status}
                      </span>
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-400">
                      User ID: {selectedConv.userId}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-zinc-800 text-zinc-400 text-[10px] font-mono px-2 py-1 rounded-lg border border-zinc-700 flex items-center gap-1">
                    <Eye className="w-3 h-3 text-indigo-400" />
                    Read-Only Monitor
                  </span>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto space-y-3 my-3 pr-2 font-sans">
                {loadingMessages ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs space-y-2">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                    <span>Loading message thread...</span>
                  </div>
                ) : selectedMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs text-center p-4">
                    <FileText className="w-8 h-8 mb-2 opacity-40 text-indigo-400" />
                    <p>No message history recorded for this conversation thread.</p>
                  </div>
                ) : (
                  selectedMessages.map((msg) => {
                    const isUser = msg.sender === "user";
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 mb-1">
                          {isUser ? (
                            <>
                              <span>{selectedConv.username}</span>
                              <User className="w-3 h-3 text-blue-400" />
                            </>
                          ) : (
                            <>
                              <Bot className="w-3 h-3 text-indigo-400" />
                              <span className="text-indigo-300 font-bold">Mr.Zx AI Assistant</span>
                            </>
                          )}
                          <span>• {msg.timestamp}</span>
                        </div>

                        <div
                          className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed shadow-md ${
                            isUser
                              ? "bg-indigo-600 text-white rounded-tr-none"
                              : "bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-none whitespace-pre-line"
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Read-Only Notice Footer */}
              <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-xl p-2.5 text-[10px] text-zinc-400 flex items-center justify-between font-mono">
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                  Live Chat View (Read-Only) • Customer conversations are preserved securely.
                </span>
                <span className="text-zinc-500">Auto-Refreshed</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs text-center p-6 space-y-2">
              <MessageSquare className="w-12 h-12 text-indigo-400/40" />
              <p className="font-bold text-zinc-300 text-sm">Select a Conversation</p>
              <p className="text-zinc-500 text-[11px] max-w-xs">
                Choose any customer thread from the left list to inspect full chat history and AI responses.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatConversationsTab;
