import React, { useState } from 'react';
import { Radio, Filter, RefreshCw, AlertCircle, CheckCircle2, Info, ShieldAlert, ArrowUpRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiveTelemetryEvent } from '../../../types/telemetry';

interface LiveEventStreamFeedProps {
  events: LiveTelemetryEvent[];
  onClearEvents: () => void;
}

export function LiveEventStreamFeed({ events, onClearEvents }: LiveEventStreamFeedProps) {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'danger'>('all');

  const filteredEvents = events.filter(e => {
    if (severityFilter === 'all') return true;
    return e.severity === severityFilter;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400 animate-pulse" />
            Live Visitor Event Stream (Real-Time Feed)
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Real-time socket events: Logins, Orders, Navigations, VPN alerts</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Severity Pills */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-bold">
            {(['all', 'info', 'success', 'warning', 'danger'] as const).map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-md uppercase transition-all cursor-pointer ${
                  severityFilter === sev 
                    ? 'bg-cyan-500 text-slate-950 font-black' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <button 
            onClick={onClearEvents}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer"
          >
            Clear Log
          </button>
        </div>
      </div>

      {/* Stream List */}
      <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
        <AnimatePresence initial={false}>
          {filteredEvents.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500 italic">
              No events matched the selected filter in the live stream.
            </div>
          )}

          {filteredEvents.map(evt => {
            const getIcon = () => {
              if (evt.severity === 'danger') return <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0" />;
              if (evt.severity === 'warning') return <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />;
              if (evt.severity === 'success') return <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />;
              return <Info className="h-4 w-4 text-cyan-400 shrink-0" />;
            };

            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-start gap-3 hover:border-slate-700 transition-all text-xs"
              >
                {getIcon()}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white truncate">{evt.visitorName}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[9px] font-mono font-bold text-cyan-400 border border-slate-700">
                        {evt.type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-slate-300 mt-1">{evt.description}</p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
