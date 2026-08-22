import React, { useState } from 'react';
import { safeFixed, safeFloor } from '../../../lib/safeNumeric';
import { 
  X, User, Globe, Smartphone, Monitor, Shield, AlertTriangle, CheckCircle2, Clock, 
  CreditCard, ShoppingBag, Eye, ExternalLink, Activity, ArrowRight, Lock, Unlock, 
  Key, RefreshCw, Layers, MousePointer, Compass, ShieldCheck, ShieldAlert, MapPin, Zap, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiveVisitorSession } from '../../../types/telemetry';

interface VisitorIntelligenceDrawerProps {
  session: LiveVisitorSession | null;
  onClose: () => void;
  onExportVisitor: (session: LiveVisitorSession) => void;
  onBlockIp: (ip: string) => void;
}

export function VisitorIntelligenceDrawer({ session, onClose, onExportVisitor, onBlockIp }: VisitorIntelligenceDrawerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'journey' | 'replay' | 'security' | 'commerce'>('overview');

  if (!session) return null;

  const isVpnRisk = session.isVpn || session.isProxy || session.riskScore > 50;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden flex justify-end font-sans">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        />

        {/* Drawer Panel */}
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-2xl bg-slate-900 border-l border-slate-800 text-slate-100 shadow-2xl flex flex-col h-full z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={session.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.username}`} 
                  alt="Avatar" 
                  className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 p-0.5 object-cover"
                />
                <span className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-slate-900 ${session.isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-white">{session.username}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${session.isMember ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                    {session.isMember ? 'REGISTERED MEMBER' : 'ANONYMOUS GUEST'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>ID: <span className="font-mono text-cyan-400">{session.visitorId}</span></span>
                  <span>•</span>
                  <span>Session: <span className="font-mono text-slate-300">{session.sessionId}</span></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => onExportVisitor(session)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Export PDF
              </button>
              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="grid grid-cols-4 gap-2 p-4 bg-slate-950/50 border-b border-slate-800 text-center shrink-0">
            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-slate-500">Risk Score</div>
              <div className={`text-sm font-black ${isVpnRisk ? 'text-amber-400' : 'text-emerald-400'}`}>
                {session.riskScore} / 100
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-slate-500">Location</div>
              <div className="text-xs font-black text-white truncate">{session.city}, {session.countryCode}</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-slate-500">Session Time</div>
              <div className="text-xs font-black text-cyan-400 font-mono">
                {safeFloor(session.durationSeconds / 60)}m {session.durationSeconds % 60}s
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
              <div className="text-[10px] font-bold uppercase text-slate-500">Total Spent</div>
              <div className="text-xs font-black text-emerald-400 font-mono">${safeFixed(session.totalSpent, 2)}</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-900/80 px-4 pt-2 gap-1 overflow-x-auto shrink-0">
            {[
              { id: 'overview', label: 'Overview & Specs', icon: Activity },
              { id: 'journey', label: 'Navigation Journey', icon: Compass },
              { id: 'replay', label: 'Session Replay Summary', icon: Eye },
              { id: 'security', label: 'Security & Risk Audit', icon: ShieldAlert },
              { id: 'commerce', label: 'Orders & Payments', icon: ShoppingBag },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap border-b-2 ${
                    isActive 
                      ? 'border-cyan-500 text-cyan-400 bg-slate-800/60' 
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* 1. OVERVIEW & SPECS */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Geolocation & Network */}
                <div className="bg-slate-850/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-cyan-400" />
                    Geolocation & Network Telemetry
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Public IP Address</span>
                      <span className="font-mono font-bold text-white flex items-center gap-1">
                        {session.ip}
                        <button 
                          onClick={() => onBlockIp(session.ip)}
                          className="text-[9px] px-1.5 py-0.2 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded font-bold hover:bg-rose-500/30 cursor-pointer ml-1"
                        >
                          Block IP
                        </button>
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">ISP / Network Host</span>
                      <span className="font-semibold text-slate-200 truncate block">{session.isp}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Country & Region</span>
                      <span className="font-semibold text-slate-200">{session.city}, {session.state}, {session.country} ({session.countryCode})</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Timezone & Language</span>
                      <span className="font-semibold text-slate-200">{session.timezone} • {session.language}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Connection Type</span>
                      <span className="font-semibold text-slate-200">{session.networkType}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">VPN / Proxy Shield</span>
                      <span className={`font-bold ${session.isVpn ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {session.isVpn ? '⚠️ Commercial VPN Detected' : session.isProxy ? '⚠️ Proxy Node' : '✅ Clean Residential IP'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Device & Browser Environment */}
                <div className="bg-slate-850/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Monitor className="h-4 w-4 text-indigo-400" />
                    Device & Browser Specifications
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Device Type & OS</span>
                      <span className="font-semibold text-slate-200">{session.device} ({session.os})</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Browser & Version</span>
                      <span className="font-semibold text-slate-200">{session.browser} v{session.browserVersion}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Screen Resolution</span>
                      <span className="font-mono text-slate-200">{session.screenResolution}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Traffic Channel</span>
                      <span className="font-semibold text-cyan-400">{session.trafficSource} ({session.referrer})</span>
                    </div>
                  </div>
                </div>

                {/* Live Activity State */}
                <div className="bg-slate-850/60 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    Current Session Activity State
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Active Tab / Route</span>
                      <span className="font-extrabold text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-2 py-0.5 rounded text-[11px] uppercase tracking-wider inline-block mt-0.5">
                        {session.currentPage}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Entry Page</span>
                      <span className="font-semibold text-slate-300">#{session.entryPage}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Last Action / Click</span>
                      <span className="font-medium text-slate-300">{session.lastClick}</span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Scroll Depth %</span>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${session.lastScrollDepth}%` }} />
                        </div>
                        <span className="font-mono text-cyan-400 font-bold">{session.lastScrollDepth}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. NAVIGATION JOURNEY */}
            {activeTab === 'journey' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Compass className="h-4 w-4 text-cyan-400" />
                    Page Navigation Timeline
                  </h3>
                  <span className="text-[10px] text-slate-400">{session.pagesVisitedHistory.length} Pages Visited</span>
                </div>

                <div className="relative border-l-2 border-slate-800 ml-3 space-y-5 pl-4">
                  {session.pagesVisitedHistory.map((pv, index) => (
                    <div key={index} className="relative group">
                      <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-500 ring-4 ring-slate-900" />
                      <div className="bg-slate-850 border border-slate-800 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-white text-sm">#{pv.page}</span>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(pv.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Time spent on page: <span className="font-mono text-cyan-400 font-bold">{pv.timeSpentSeconds}s</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3. SESSION REPLAY SUMMARY */}
            {activeTab === 'replay' && (
              <div className="space-y-4">
                <div className="bg-slate-850/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Eye className="h-4 w-4 text-indigo-400" />
                      Session Replay Key Frame Summary
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[10px] font-bold">
                      PRIVACY COMPLIANT
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Calculated mouse velocity score: <span className="font-mono text-white font-bold">{session.mouseActivityScore}/100</span>.
                    No sensitive user inputs, passwords, or keyboard strokes are stored.
                  </p>

                  <div className="space-y-2 pt-2">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-300">Navigation Entry:</span>
                      <span className="font-mono text-cyan-400 font-bold">{session.referrer || 'Direct Bookmark'}</span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-300">Interaction Engagement Score:</span>
                      <span className="font-mono text-emerald-400 font-bold">HIGH ENGAGEMENT</span>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                      <span className="text-slate-300">Max Scroll Velocity:</span>
                      <span className="font-mono text-amber-400 font-bold">{session.lastScrollDepth}% Page Height</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-850/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Logged Interaction Events</h4>
                  <div className="space-y-2 text-xs">
                    {session.clickEventsHistory.map((clk, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-2">
                          <MousePointer className="h-3.5 w-3.5 text-cyan-400" />
                          <span className="font-bold text-slate-200">{clk.element}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(clk.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. SECURITY & RISK AUDIT */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                <div className={`p-4 rounded-2xl border ${isVpnRisk ? 'bg-amber-950/20 border-amber-500/40' : 'bg-emerald-950/20 border-emerald-500/40'} space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-cyan-400" />
                      Security Audit Assessment
                    </span>
                    <span className={`text-xs font-black uppercase ${isVpnRisk ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {isVpnRisk ? 'RISK ALERT' : 'SECURE SESSION'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {isVpnRisk 
                      ? 'This session uses a known commercial VPN or datacenter proxy IP. Proceed with standard security verification.' 
                      : 'Session passed standard anomaly checks. Residential IP confirmed with consistent browser fingerprint.'}
                  </p>
                </div>

                <div className="bg-slate-850/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">Event Audit Log</h4>
                  <div className="space-y-2 text-xs">
                    {session.eventsLog.map((evt) => (
                      <div key={evt.id} className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            evt.severity === 'danger' ? 'bg-rose-500/20 text-rose-400' :
                            evt.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                            evt.severity === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}>
                            {evt.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-300">{evt.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. COMMERCE & PAYMENTS */}
            {activeTab === 'commerce' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Total Orders</div>
                    <div className="text-base font-black text-white">{session.ordersCount}</div>
                  </div>
                  <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Deposits</div>
                    <div className="text-base font-black text-cyan-400">{session.depositsCount}</div>
                  </div>
                  <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Total Revenue</div>
                    <div className="text-base font-black text-emerald-400">${safeFixed(session.totalSpent, 2)}</div>
                  </div>
                </div>

                <div className="bg-slate-850/70 border border-slate-800 rounded-2xl p-4 text-xs text-center text-slate-400">
                  {session.ordersCount > 0 ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-white text-left">ORD-8942 • SMM Instagram Followers</div>
                          <div className="text-[10px] text-slate-500 text-left">Completed via SMM Provider 1</div>
                        </div>
                        <span className="font-mono text-emerald-400 font-bold">$12.50</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6">No commerce orders submitted in this specific session yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
            <button
              onClick={() => onBlockIp(session.ip)}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              Block IP {session.ip}
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all cursor-pointer"
            >
              Close Drawer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
