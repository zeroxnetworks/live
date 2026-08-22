import React from "react";
import { Wrench, Clock, ShieldAlert } from "lucide-react";

interface TabMaintenanceViewProps {
  tabId: string;
  tabLabel: string;
  notes?: string;
}

export function TabMaintenanceView({ tabId, tabLabel, notes }: TabMaintenanceViewProps) {
  const defaultNote = "We are currently performing essential updates to improve system stability and speed. Please check back shortly.";

  return (
    <div 
      id={`tab-maintenance-view-${tabId}`}
      className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      {/* Visual Header Icon */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-100 rounded-full scale-110 blur-md opacity-50 animate-pulse"></div>
        <div className="relative bg-white border border-blue-200 text-blue-600 p-5 rounded-full shadow-sm">
          <Wrench className="h-8 w-8 stroke-[1.75]" />
        </div>
        <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow border-2 border-white">
          <Clock className="h-3 w-3" />
        </div>
      </div>

      {/* Typography Scale Section */}
      <div className="space-y-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-200">
          <ShieldAlert className="h-3.5 w-3.5" />
          Scheduled Maintenance
        </span>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
          {tabLabel} Tab is Temporarily Offline
        </h2>
        <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
          The administration has temporarily paused access to this module for system maintenance. Normal service will resume shortly.
        </p>
      </div>

      {/* Custom Maintenance Notes Box */}
      <div className="mt-8 w-full bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm text-left relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
        <div className="flex items-start gap-4">
          <div className="bg-slate-100 p-2.5 rounded-lg text-slate-600 shrink-0">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Developer & Admin Notes:
            </h4>
            <p className="mt-2 text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
              {notes && notes.trim() !== "" ? notes : defaultNote}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 text-[10px] font-semibold text-slate-400 tracking-wide uppercase">
        Zerox Network System Integrity
      </div>
    </div>
  );
}
