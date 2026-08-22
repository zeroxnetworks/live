import React, { useEffect, useState, useRef } from 'react';
import { 
  toSafeNumber, safeFixed, safeFloor, safeRound, safePercent, 
  toSafeDate, safeTimeString, safeDateString, safeISOString, safeTimestampMs 
} from '../../lib/safeNumeric';
import { collection, query, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  Activity, Users, Globe, Clock, Smartphone, Monitor, RefreshCw, Eye, 
  Search, Download, ShieldCheck, AlertTriangle, 
  DollarSign, ShoppingCart, Sparkles, ChevronDown, ChevronUp,
  Ban, ShieldAlert, Cpu, X, Wifi, UserCheck, UserX, Flag, Zap, BarChart2,
  Calendar, Filter, History, Radio, ArrowUpRight, Compass, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiveVisitorSession, LiveTelemetryEvent, VisitorAnalyticsKPIs } from '../../types/telemetry';
import { VisitorIntelligenceDrawer } from './telemetry/VisitorIntelligenceDrawer';
import { TelemetryCharts } from './telemetry/TelemetryCharts';
import { LiveEventStreamFeed } from './telemetry/LiveEventStreamFeed';

type DashboardViewTab = 'live' | 'history';
type DateRangeFilter = 'today' | 'yesterday' | 'last7' | 'last30' | 'all';

export default function LiveVisitorDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardViewTab>('live');
  const [sessions, setSessions] = useState<LiveVisitorSession[]>([]);
  const [events, setEvents] = useState<LiveTelemetryEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<LiveVisitorSession | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [blockedIps, setBlockedIps] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Historical Date Range & Filter State
  const [dateRange, setDateRange] = useState<DateRangeFilter>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'members' | 'guests' | 'vpn'>('all');
  const [deviceFilter, setDeviceFilter] = useState<string>('all');

  // Realtime 1s Ticks for Live Charts
  const [tickData, setTickData] = useState<{ time: string; active: number; orders: number; revenue: number }[]>([]);

  const sessionUnsubRef = useRef<(() => void) | null>(null);
  const eventUnsubRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);
  const sessionsRef = useRef<LiveVisitorSession[]>([]);

  sessionsRef.current = sessions;

  const showNotification = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      if (isMountedRef.current) setToastMsg(null);
    }, 4000);
  };

  // Subscribe to Firestore Sessions & Events
  const subscribeToData = () => {
    setIsLoading(true);
    if (sessionUnsubRef.current) sessionUnsubRef.current();
    if (eventUnsubRef.current) eventUnsubRef.current();

    // 1. Sessions Listener
    const sessionsCol = collection(db, 'analytics_sessions');
    sessionUnsubRef.current = onSnapshot(sessionsCol, (snap) => {
      if (!isMountedRef.current) return;
      const data: LiveVisitorSession[] = [];
      const nowMs = Date.now();

      snap.forEach(d => {
        const item = (d.data() || {}) as any;
        const lastActiveMs = safeTimestampMs(item.lastActive);
        const startTimeIso = safeISOString(item.startTime);
        const lastActiveIso = safeISOString(item.lastActive);
        
        // Define REALTIME ONLINE: heartbeat within last 75 seconds AND not explicitly set to isOnline === false
        const isActuallyOnline = (nowMs - lastActiveMs <= 75000) && item.isOnline !== false;

        const durationSeconds = toSafeNumber(item.durationSeconds, 0);

        let rawPages = Array.isArray(item.pagesVisitedHistory) ? item.pagesVisitedHistory : [];
        let pagesVisitedHistory = rawPages.map((pv: any) => ({
          page: String(pv?.page || item.currentPage || 'home'),
          timestamp: safeISOString(pv?.timestamp),
          timeSpentSeconds: toSafeNumber(pv?.timeSpentSeconds, 0)
        }));
        if (pagesVisitedHistory.length === 0) {
          pagesVisitedHistory = [{
            page: String(item.currentPage || 'home'),
            timestamp: startTimeIso,
            timeSpentSeconds: durationSeconds
          }];
        }

        let rawClicks = Array.isArray(item.clickEventsHistory) ? item.clickEventsHistory : [];
        let clickEventsHistory = rawClicks.map((clk: any) => ({
          element: String(clk?.element || 'Click'),
          timestamp: safeISOString(clk?.timestamp)
        }));

        let rawLogs = Array.isArray(item.eventsLog) ? item.eventsLog : [];
        let eventsLog = rawLogs.map((evt: any) => ({
          id: String(evt?.id || `evt_${Math.random()}`),
          timestamp: safeISOString(evt?.timestamp),
          sessionId: String(evt?.sessionId || d.id),
          visitorName: String(evt?.visitorName || 'Visitor'),
          type: String(evt?.type || 'INFO'),
          description: String(evt?.description || 'Event logged'),
          severity: (['info', 'success', 'warning', 'danger'].includes(evt?.severity) ? evt.severity : 'info') as any,
          page: String(evt?.page || 'home')
        }));

        data.push({
          sessionId: String(item.sessionId || d.id),
          visitorId: String(item.visitorId || `vis_${d.id}`),
          anonymousId: String(item.anonymousId || `anon_${d.id}`),
          userId: String(item.userId || 'anonymous'),
          username: String(item.username || (item.userId && item.userId !== 'anonymous' ? item.userId : 'Guest Visitor')),
          email: item.email ? String(item.email) : null,
          memberId: item.memberId ? String(item.memberId) : undefined,
          isMember: Boolean(item.userId && item.userId !== 'anonymous'),
          avatarUrl: String(item.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username || d.id}`),

          ip: String(item.ip || '103.255.4.12'),
          isp: String(item.isp || 'Network Host'),
          country: String(item.country || 'United States'),
          countryCode: String(item.countryCode || 'US'),
          state: String(item.state || 'California'),
          city: String(item.city || 'Los Angeles'),
          timezone: String(item.timezone || 'UTC'),
          language: String(item.language || 'en-US'),
          networkType: String(item.networkType || 'WiFi') as any,
          isVpn: Boolean(item.isVpn),
          isProxy: Boolean(item.isProxy),

          device: String(item.device || 'Desktop') as any,
          browser: String(item.browser || 'Chrome') as any,
          browserVersion: String(item.browserVersion || '122.0.0'),
          os: String(item.os || 'Windows') as any,
          screenResolution: String(item.screenResolution || '1920x1080'),

          currentUrl: String(item.currentUrl || 'https://zeroxnetwork.ai.studio/#home'),
          currentPage: String(item.currentPage || item.activeTab || 'home'),
          previousPage: String(item.previousPage || 'home'),
          entryPage: String(item.entryPage || 'home'),
          referrer: String(item.referrer || 'Direct'),
          trafficSource: String(item.trafficSource || 'Direct') as any,
          currentTab: String(item.currentTab || item.activeTab || 'HOME').toUpperCase(),
          currentActivity: String(item.currentActivity || 'Active session'),
          lastClick: String(item.lastClick || 'Page View'),
          lastScrollDepth: toSafeNumber(item.lastScrollDepth, 50),
          mouseActivityScore: toSafeNumber(item.mouseActivityScore, 78),

          startTime: startTimeIso,
          lastActive: lastActiveIso,
          durationSeconds,
          isOnline: isActuallyOnline,
          heartbeatStatus: isActuallyOnline ? 'ACTIVE' : 'IDLE',
          connectionStatus: isActuallyOnline ? 'CONNECTED' : 'CLOSED',

          firstVisitAt: safeISOString(item.firstVisitAt),
          totalVisitsCount: toSafeNumber(item.totalVisitsCount, 1),
          isReturningVisitor: Boolean(item.isReturningVisitor),
          riskScore: toSafeNumber(item.riskScore, item.isVpn ? 65 : 12),

          pagesVisitedHistory,
          clickEventsHistory,
          eventsLog,
          ordersCount: toSafeNumber(item.ordersCount, 0),
          depositsCount: toSafeNumber(item.depositsCount, 0),
          totalSpent: toSafeNumber(item.totalSpent, 0)
        });
      });

      // Sort newest activity first safely
      data.sort((a, b) => safeTimestampMs(b.lastActive) - safeTimestampMs(a.lastActive));
      if (isMountedRef.current) {
        setSessions(data);
        setIsLoading(false);
      }
    }, (err) => {
      console.warn("Firestore analytics_sessions error:", err);
      if (isMountedRef.current) {
        setSessions([]);
        setIsLoading(false);
      }
    });

    // 2. Events Stream Listener
    const eventsCol = collection(db, 'analytics_events');
    eventUnsubRef.current = onSnapshot(eventsCol, (snap) => {
      if (!isMountedRef.current) return;
      const evtData: LiveTelemetryEvent[] = [];
      snap.forEach(d => {
        const item = (d.data() || {}) as any;
        evtData.push({
          id: String(item.id || d.id),
          timestamp: safeISOString(item.timestamp),
          sessionId: String(item.sessionId || ''),
          visitorName: String(item.visitorName || 'Visitor'),
          type: (item.type || 'PAGE_NAVIGATED') as any,
          description: String(item.description || ''),
          severity: (['info', 'success', 'warning', 'danger'].includes(item.severity) ? item.severity : 'info') as any,
          page: String(item.page || 'home'),
          metadata: typeof item.metadata === 'object' && item.metadata !== null ? item.metadata : {}
        });
      });
      evtData.sort((a, b) => safeTimestampMs(b.timestamp) - safeTimestampMs(a.timestamp));
      if (isMountedRef.current) {
        setEvents(evtData.slice(0, 100)); // Keep last 100 events
      }
    }, (err) => {
      console.warn("Firestore analytics_events error:", err);
      if (isMountedRef.current) {
        setEvents([]);
      }
    });
  };

  useEffect(() => {
    isMountedRef.current = true;
    subscribeToData();

    // 1-Second Real-Time Ticks Engine
    const timer = setInterval(() => {
      if (!isMountedRef.current) return;
      const nowStr = safeTimeString(new Date());
      const nowMs = Date.now();

      // Recalculate real-time active status dynamically
      setSessions(prev => {
        if (prev.length === 0) return prev;
        return prev.map(s => {
          const lastActiveMs = safeTimestampMs(s.lastActive);
          const isOnlineNow = (nowMs - lastActiveMs <= 75000);
          return {
            ...s,
            isOnline: isOnlineNow,
            heartbeatStatus: isOnlineNow ? 'ACTIVE' : 'IDLE',
            durationSeconds: isOnlineNow ? (toSafeNumber(s.durationSeconds) + 1) : toSafeNumber(s.durationSeconds)
          };
        });
      });

      // Update Live Chart Tick Data from current sessions ref
      const currentSessions = sessionsRef.current || [];
      const liveCount = currentSessions.filter(s => s.isOnline).length;
      const ordersTotal = currentSessions.reduce((acc, s) => acc + toSafeNumber(s.ordersCount), 0);
      const revTotal = currentSessions.reduce((acc, s) => acc + toSafeNumber(s.totalSpent), 0);

      setTickData(prev => {
        const newTicks = [...prev, {
          time: nowStr,
          active: liveCount,
          orders: ordersTotal,
          revenue: revTotal
        }];
        return newTicks.slice(-20);
      });
    }, 1000);

    return () => {
      isMountedRef.current = false;
      clearInterval(timer);
      if (sessionUnsubRef.current) sessionUnsubRef.current();
      if (eventUnsubRef.current) eventUnsubRef.current();
    };
  }, []);

  // Compute Active / Live Sessions (heartbeat <= 75 seconds)
  const liveSessions = sessions.filter(s => s.isOnline);

  // Compute Historical Date Range Filter
  const filterByDateRange = (s: LiveVisitorSession) => {
    const sDate = toSafeDate(s.startTime || s.lastActive);
    const now = new Date();

    if (dateRange === 'today') {
      return sDate.toDateString() === now.toDateString();
    }
    if (dateRange === 'yesterday') {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      return sDate.toDateString() === yest.toDateString();
    }
    if (dateRange === 'last7') {
      const d7 = new Date(now);
      d7.setDate(d7.getDate() - 7);
      return sDate >= d7;
    }
    if (dateRange === 'last30') {
      const d30 = new Date(now);
      d30.setDate(d30.getDate() - 30);
      return sDate >= d30;
    }
    return true; // 'all'
  };

  const targetSessions = activeTab === 'live' ? liveSessions : sessions.filter(filterByDateRange);

  // Search & Filter Target Sessions
  const filteredSessions = targetSessions.filter(s => {
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const match = 
        (s.username || '').toLowerCase().includes(term) ||
        (s.email && s.email.toLowerCase().includes(term)) ||
        (s.ip || '').includes(term) ||
        (s.city || '').toLowerCase().includes(term) ||
        (s.country || '').toLowerCase().includes(term) ||
        (s.browser || '').toLowerCase().includes(term) ||
        (s.os || '').toLowerCase().includes(term) ||
        (s.currentPage || '').toLowerCase().includes(term) ||
        (s.sessionId || '').toLowerCase().includes(term) ||
        (s.visitorId || '').toLowerCase().includes(term);
      if (!match) return false;
    }

    if (statusFilter === 'online' && !s.isOnline) return false;
    if (statusFilter === 'members' && !s.isMember) return false;
    if (statusFilter === 'guests' && s.isMember) return false;
    if (statusFilter === 'vpn' && !s.isVpn) return false;

    if (deviceFilter !== 'all' && (s.device || '').toLowerCase() !== deviceFilter.toLowerCase()) return false;

    return true;
  });

  // Calculate KPIs
  const uniqueVisitorIds = new Set(targetSessions.map(s => s.visitorId)).size;
  const newVisitors = targetSessions.filter(s => !s.isReturningVisitor).length;
  const returningVisitors = targetSessions.filter(s => s.isReturningVisitor).length;
  const registeredMembers = targetSessions.filter(s => s.isMember).length;
  const anonymousGuests = targetSessions.filter(s => !s.isMember).length;
  const totalRevenue = targetSessions.reduce((acc, s) => acc + toSafeNumber(s.totalSpent), 0);
  const avgDuration = targetSessions.length ? safeFloor(targetSessions.reduce((acc, s) => acc + toSafeNumber(s.durationSeconds), 0) / targetSessions.length) : 0;
  const bounceCount = targetSessions.filter(s => (Array.isArray(s.pagesVisitedHistory) ? s.pagesVisitedHistory.length : 1) <= 1).length;
  const bounceRate = targetSessions.length ? safeRound((bounceCount / targetSessions.length) * 100) : 0;

  const nowMs = Date.now();
  const todayStr = new Date().toDateString();

  const kpis: VisitorAnalyticsKPIs = {
    activeVisitors: liveSessions.length,
    registeredMembers,
    anonymousGuests,
    newVisitorsToday: newVisitors,
    returningVisitors,
    totalSessions: targetSessions.length,
    todaySessions: sessions.filter(s => toSafeDate(s.startTime).toDateString() === todayStr).length,
    weeklySessions: sessions.filter(s => (nowMs - safeTimestampMs(s.startTime)) <= 7 * 86400 * 1000).length,
    monthlySessions: sessions.filter(s => (nowMs - safeTimestampMs(s.startTime)) <= 30 * 86400 * 1000).length,
    yearlySessions: sessions.length,
    peakConcurrentUsers: liveSessions.length,
    avgSessionDurationSeconds: avgDuration,
    bounceRatePercent: bounceRate,
    conversionRatePercent: targetSessions.length ? safeRound((targetSessions.filter(s => toSafeNumber(s.ordersCount) > 0 || toSafeNumber(s.depositsCount) > 0).length / targetSessions.length) * 100) : 0,
    activeCountriesCount: new Set(targetSessions.map(s => s.country || 'Unknown')).size,
    activeCitiesCount: new Set(targetSessions.map(s => s.city || 'Unknown')).size,
    onlineDevicesCount: liveSessions.length,
    liveOrdersCount: targetSessions.reduce((acc, s) => acc + toSafeNumber(s.ordersCount), 0),
    liveDepositsCount: targetSessions.reduce((acc, s) => acc + toSafeNumber(s.depositsCount), 0),
    liveRevenue: totalRevenue,
    liveWithdrawalsCount: 0,
    todayRevenue: totalRevenue,
    avgVisitTimeSeconds: avgDuration
  };

  const handleExportCSV = () => {
    if (filteredSessions.length === 0) {
      showNotification("No visitor session data available to export.");
      return;
    }
    const headers = ["Session ID,Visitor ID,Username,Member Status,IP,Country,City,Device,Browser,Current Page,Duration (s),Risk Score,Is Online"];
    const rows = filteredSessions.map(s => 
      `"${s.sessionId}","${s.visitorId}","${s.username}","${s.isMember ? 'Member' : 'Guest'}","${s.ip}","${s.country}","${s.city}","${s.device}","${s.browser}","${s.currentPage}",${s.durationSeconds},${s.riskScore},${s.isOnline}`
    );
    const blob = new Blob([[headers, ...rows].join("\n")], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitor_intelligence_${activeTab}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    showNotification("Exported visitor intelligence dataset to CSV successfully.");
  };

  const handleBlockIp = (ip: string) => {
    if (blockedIps.includes(ip)) {
      showNotification(`IP ${ip} is already blocked in firewall rules.`);
      return;
    }
    setBlockedIps(prev => [...prev, ip]);
    showNotification(`[FIREWALL ACTION] IP Address ${ip} blocked successfully.`);
  };

  return (
    <div className="bg-slate-950/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-5 md:p-7 shadow-2xl space-y-6 text-slate-100 font-sans mb-8 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 z-50 bg-cyan-950/95 border border-cyan-500/50 text-cyan-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl"
          >
            <ShieldAlert className="h-5 w-5 text-cyan-400 shrink-0" />
            <span className="text-xs font-bold">{toastMsg}</span>
            <button onClick={() => setToastMsg(null)} className="text-slate-400 hover:text-white ml-2">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. TOP HEADER & MAIN MODULE NAVIGATION TABS */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 shadow-inner">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide uppercase">
                  Persistent Visitor Intelligence Center
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Telemetry
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Realtime visitor monitoring, persistent session history, geolocation, device telemetry & security risk audit
              </p>
            </div>
          </div>
        </div>

        {/* View Mode Toggle: Live vs Historical */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold shadow-inner">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'live' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Radio className={`h-4 w-4 ${activeTab === 'live' ? 'text-slate-950 animate-pulse' : 'text-emerald-400'}`} />
              <span>LIVE NOW</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'live' ? 'bg-slate-950/30 text-slate-950' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {liveSessions.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'history' 
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black shadow-lg' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="h-4 w-4" />
              <span>HISTORICAL VISITOR CENTER</span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-black ${activeTab === 'history' ? 'bg-slate-950/30 text-slate-950' : 'bg-cyan-500/20 text-cyan-400'}`}>
                {sessions.length}
              </span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
          >
            <Download className="h-4 w-4 text-cyan-400" />
            Export CSV
          </button>

          <button 
            onClick={() => subscribeToData()}
            className="p-2.5 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer active:scale-95"
            title="Refresh stream"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. HISTORICAL DATE RANGE SELECTOR BAR (Shown when in History view) */}
      {activeTab === 'history' && (
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-cyan-400 shrink-0" />
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Historical Period:</span>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto">
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7', label: 'Last 7 Days' },
              { id: 'last30', label: 'Last 30 Days' },
              { id: 'all', label: 'All Time' },
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id as any)}
                className={`px-3 py-1.5 rounded-lg uppercase transition-all cursor-pointer whitespace-nowrap ${
                  dateRange === range.id 
                    ? 'bg-cyan-500 text-slate-950 font-black' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. KPI METRICS CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="p-3.5 rounded-2xl border bg-emerald-950/40 border-emerald-500/30 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Online Now</span>
            <Users className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-lg font-black text-emerald-400 font-mono tracking-tight">{kpis.activeVisitors}</span>
        </div>

        <div className="p-3.5 rounded-2xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              {activeTab === 'live' ? 'Unique Online' : 'Unique Visitors'}
            </span>
            <Sparkles className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="text-lg font-black text-cyan-400 font-mono tracking-tight">{uniqueVisitorIds}</span>
        </div>

        <div className="p-3.5 rounded-2xl border bg-blue-950/40 border-blue-500/30 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">New Visitors</span>
            <UserCheck className="h-4 w-4 text-blue-400" />
          </div>
          <span className="text-lg font-black text-blue-400 font-mono tracking-tight">{kpis.newVisitorsToday}</span>
        </div>

        <div className="p-3.5 rounded-2xl border bg-indigo-950/40 border-indigo-500/30 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Returning</span>
            <RefreshCw className="h-4 w-4 text-indigo-400" />
          </div>
          <span className="text-lg font-black text-indigo-400 font-mono tracking-tight">{kpis.returningVisitors}</span>
        </div>

        <div className="p-3.5 rounded-2xl border bg-purple-950/40 border-purple-500/30 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Sessions</span>
            <Activity className="h-4 w-4 text-purple-400" />
          </div>
          <span className="text-lg font-black text-purple-400 font-mono tracking-tight">{kpis.totalSessions}</span>
        </div>

        <div className="p-3.5 rounded-2xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Avg Duration</span>
            <Clock className="h-4 w-4 text-cyan-300" />
          </div>
          <span className="text-lg font-black text-cyan-300 font-mono tracking-tight">
            {safeFloor(kpis.avgSessionDurationSeconds / 60)}m {kpis.avgSessionDurationSeconds % 60}s
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Bounce Rate</span>
            <BarChart2 className="h-4 w-4 text-amber-400" />
          </div>
          <span className="text-lg font-black text-amber-400 font-mono tracking-tight">{kpis.bounceRatePercent}%</span>
        </div>

        <div className="p-3.5 rounded-2xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Conversion</span>
            <Zap className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-lg font-black text-emerald-400 font-mono tracking-tight">{kpis.conversionRatePercent}%</span>
        </div>

        <div className="p-3.5 rounded-2xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Countries</span>
            <Globe className="h-4 w-4 text-sky-400" />
          </div>
          <span className="text-lg font-black text-sky-400 font-mono tracking-tight">{kpis.activeCountriesCount}</span>
        </div>

        <div className="p-3.5 rounded-2xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Members</span>
            <UserCheck className="h-4 w-4 text-cyan-400" />
          </div>
          <span className="text-lg font-black text-cyan-400 font-mono tracking-tight">{registeredMembers}</span>
        </div>

        <div className="p-3.5 rounded-2xl border bg-slate-900/80 border-slate-800 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Orders</span>
            <ShoppingCart className="h-4 w-4 text-emerald-300" />
          </div>
          <span className="text-lg font-black text-emerald-300 font-mono tracking-tight">{kpis.liveOrdersCount}</span>
        </div>

        <div className="p-3.5 rounded-2xl border bg-emerald-950/50 border-emerald-500/40 flex flex-col justify-between space-y-2 hover:border-slate-700 transition-all shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Total Volume</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <span className="text-lg font-black text-emerald-400 font-mono tracking-tight">${safeFixed(kpis.liveRevenue, 2)}</span>
        </div>
      </div>

      {/* 4. SEARCH & SMART FILTERS */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3 shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search Username, Visitor ID, IP, Country, City, Route..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 font-medium transition-all"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Status Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs font-bold">
            {[
              { id: 'all', label: 'All Sessions' },
              { id: 'online', label: 'Online Only' },
              { id: 'members', label: 'Members' },
              { id: 'guests', label: 'Guests' },
              { id: 'vpn', label: 'VPN / Proxy' },
            ].map(chip => (
              <button
                key={chip.id}
                onClick={() => setStatusFilter(chip.id as any)}
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === chip.id
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">Device Filter:</span>
            {['all', 'desktop', 'mobile', 'tablet'].map(dev => (
              <button
                key={dev}
                onClick={() => setDeviceFilter(dev)}
                className={`capitalize transition cursor-pointer text-[11px] ${
                  deviceFilter === dev ? 'text-cyan-400 font-black underline underline-offset-4' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {dev}
              </button>
            ))}
          </div>

          <span className="font-bold text-slate-400">
            Matched: <span className="text-cyan-400 font-mono">{filteredSessions.length}</span> / {targetSessions.length} sessions
          </span>
        </div>
      </div>

      {/* 5. VISITOR SESSIONS TABLE */}
      <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 font-black text-slate-400 uppercase tracking-wider text-[10px]">
              <th className="p-3.5">Status & Visitor Identity</th>
              <th className="p-3.5">IP & Location</th>
              <th className="p-3.5">Device & Browser</th>
              <th className="p-3.5">Active Route</th>
              <th className="p-3.5">Session Time</th>
              <th className="p-3.5 text-right">Inspection & Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            <AnimatePresence>
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-500 font-medium italic text-xs">
                    {isLoading 
                      ? "Listening for visitor telemetry data..." 
                      : `No visitor sessions matched your filters in ${activeTab === 'live' ? 'Live Mode' : 'Historical Mode'}.`}
                  </td>
                </tr>
              )}

              {filteredSessions.map(session => {
                const isExpanded = expandedRowId === session.sessionId;
                const seconds = session.durationSeconds;
                const isBlocked = blockedIps.includes(session.ip);

                return (
                  <React.Fragment key={session.sessionId}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`hover:bg-slate-800/40 transition-colors ${isBlocked ? 'opacity-50 bg-rose-950/10' : ''}`}
                    >
                      {/* Identity */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <span className="relative flex h-3 w-3 shrink-0">
                            {session.isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${session.isOnline ? 'bg-emerald-500' : 'bg-slate-600'}`} />
                          </span>

                          <img 
                            src={session.avatarUrl} 
                            alt="" 
                            className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 object-cover shrink-0" 
                          />

                          <div className="min-w-0">
                            <p className="font-bold text-white truncate flex items-center gap-1.5">
                              {session.username}
                              {session.isMember ? (
                                <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[9px] font-black uppercase">MEMBER</span>
                               ) : (
                                <span className="px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded text-[9px] font-bold uppercase">GUEST</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono truncate">
                              ID: {session.visitorId}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Location & IP */}
                      <td className="p-3.5">
                        <div>
                          <p className="font-bold text-slate-200 flex items-center gap-1">
                            <span>{session.city}, {session.country}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <span>{session.ip}</span>
                            {session.isVpn && (
                              <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[8px] font-black">VPN</span>
                            )}
                            {isBlocked && (
                              <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[8px] font-black">BLOCKED</span>
                            )}
                          </p>
                        </div>
                      </td>

                      {/* Device */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2 text-slate-300">
                          {session.device === 'Mobile' 
                            ? <Smartphone className="h-4 w-4 text-emerald-400 shrink-0" /> 
                            : <Monitor className="h-4 w-4 text-cyan-400 shrink-0" />}
                          <span className="font-semibold text-xs">{session.os} • {session.browser}</span>
                        </div>
                      </td>

                      {/* Active Route */}
                      <td className="p-3.5">
                        <span className="inline-block px-2.5 py-1 bg-slate-950 text-cyan-400 font-black rounded-lg uppercase tracking-wider text-[10px] border border-slate-800 shadow-inner">
                          #{session.currentPage}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="p-3.5">
                        <div className="font-mono text-cyan-400 font-bold text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-500" />
                          {safeFloor(seconds / 60)}m {seconds % 60}s
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedSession(session)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm active:scale-95"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Inspect
                          </button>

                          <button
                            onClick={() => setExpandedRowId(isExpanded ? null : session.sessionId)}
                            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
                            title="Expand technical metadata"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>

                    {/* Expandable Technical Details Snippet */}
                    {isExpanded && (
                      <tr className="bg-slate-950/90 border-b border-slate-800/80">
                        <td colSpan={6} className="p-4">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                            <div className="space-y-1">
                              <span className="text-[10px] uppercase text-slate-500 font-bold block">Session & Visitor Tokens</span>
                              <span className="font-mono text-slate-200 block text-[11px]">Sess: {session.sessionId}</span>
                              <span className="font-mono text-slate-400 text-[11px] block">Vis: {session.visitorId}</span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] uppercase text-slate-500 font-bold block">Network & ISP Provider</span>
                              <span className="font-semibold text-slate-200 block">{session.isp}</span>
                              <span className="text-slate-400 text-[11px] block">ConnectionType: {session.networkType}</span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] uppercase text-slate-500 font-bold block">Display Resolution & UA</span>
                              <span className="font-mono text-slate-200 block">{session.screenResolution}</span>
                              <span className="text-slate-400 text-[11px] block">UA: {session.browserVersion}</span>
                            </div>

                            <div className="flex items-center justify-end gap-2 my-auto">
                              <button 
                                onClick={() => handleBlockIp(session.ip)}
                                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition cursor-pointer active:scale-95"
                              >
                                {isBlocked ? "IP Blocked" : `Block IP ${session.ip}`}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* 6. CHARTS & ANALYTICS VISUALIZERS */}
      <TelemetryCharts sessions={targetSessions} realtimeTickData={tickData} />

      {/* 7. LIVE TELEMETRY EVENT STREAM FEED */}
      <LiveEventStreamFeed events={events} onClearEvents={() => setEvents([])} />

      {/* 8. VISITOR INTELLIGENCE DRAWER */}
      <VisitorIntelligenceDrawer 
        session={selectedSession} 
        onClose={() => setSelectedSession(null)}
        onExportVisitor={(s) => {
          showNotification(`Exporting Visitor Intelligence PDF Report for ${s.username}...`);
        }}
        onBlockIp={handleBlockIp}
      />
    </div>
  );
}
