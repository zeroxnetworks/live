import React, { useState } from 'react';
import { safeRound, safeCeil, toSafeDate, toSafeNumber, safeLocaleString } from '../../../lib/safeNumeric';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { Globe, Smartphone, Monitor, Activity, TrendingUp, Layers, Cpu, PieChart as PieIcon, ArrowRight } from 'lucide-react';
import { LiveVisitorSession } from '../../../types/telemetry';

interface TelemetryChartsProps {
  sessions: LiveVisitorSession[];
  realtimeTickData: { time: string; active: number; orders: number; revenue: number }[];
}

export function TelemetryCharts({ sessions, realtimeTickData }: TelemetryChartsProps) {
  const [timelinePeriod, setTimelinePeriod] = useState<'hourly' | 'daily' | 'weekly' | 'monthly'>('hourly');

  // Compute Country Distribution
  const countryCounts: Record<string, number> = {};
  sessions.forEach(s => {
    countryCounts[s.country] = (countryCounts[s.country] || 0) + 1;
  });
  const countryData = Object.entries(countryCounts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  // Compute City Distribution
  const cityCounts: Record<string, number> = {};
  sessions.forEach(s => {
    cityCounts[s.city] = (cityCounts[s.city] || 0) + 1;
  });
  const cityData = Object.entries(cityCounts)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Device Data
  const deviceCounts: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
  sessions.forEach(s => {
    deviceCounts[s.device] = (deviceCounts[s.device] || 0) + 1;
  });
  const devicePieData = [
    { name: 'Desktop', value: deviceCounts.Desktop || 1, color: '#3b82f6' },
    { name: 'Mobile', value: deviceCounts.Mobile || 1, color: '#10b981' },
    { name: 'Tablet', value: deviceCounts.Tablet || 1, color: '#f59e0b' }
  ];

  // Browser Data
  const browserCounts: Record<string, number> = {};
  sessions.forEach(s => {
    browserCounts[s.browser] = (browserCounts[s.browser] || 0) + 1;
  });
  const browserColors = ['#0284c7', '#2563eb', '#16a34a', '#ea580c', '#9333ea', '#db2777'];
  const browserPieData = Object.entries(browserCounts).map(([name, value], i) => ({
    name,
    value,
    color: browserColors[i % browserColors.length]
  }));

  // Network Distribution
  const networkCounts: Record<string, number> = {};
  sessions.forEach(s => {
    networkCounts[s.networkType] = (networkCounts[s.networkType] || 0) + 1;
  });
  const networkBarData = Object.entries(networkCounts).map(([net, count]) => ({ net, count }));

  // Traffic Sources
  const trafficCounts: Record<string, number> = {};
  sessions.forEach(s => {
    trafficCounts[s.trafficSource] = (trafficCounts[s.trafficSource] || 0) + 1;
  });
  const trafficData = Object.entries(trafficCounts).map(([source, count]) => ({ source, count }));

  // Conversion Funnel Data (100% real)
  const totalVisitors = sessions.length;
  const registered = sessions.filter(s => s.isMember).length;
  const withOrders = sessions.filter(s => (s.ordersCount || 0) > 0).length;
  const withDeposits = sessions.filter(s => (s.depositsCount || 0) > 0).length;
  
  const funnelSteps = [
    { step: 'Total Visitors', count: totalVisitors, pct: totalVisitors ? 100 : 0, color: '#3b82f6' },
    { step: 'Registered', count: registered, pct: totalVisitors ? safeRound((registered / totalVisitors) * 100) : 0, color: '#06b6d4' },
    { step: 'Placed Orders', count: withOrders, pct: totalVisitors ? safeRound((withOrders / totalVisitors) * 100) : 0, color: '#10b981' },
    { step: 'Made Deposit', count: withDeposits, pct: totalVisitors ? safeRound((withDeposits / totalVisitors) * 100) : 0, color: '#f59e0b' },
  ];

  // Timeline Data Generator from real sessions
  const getTimelineData = () => {
    const buckets: Record<string, { sessions: number; revenue: number }> = {};

    sessions.forEach(s => {
      const d = toSafeDate(s.startTime || Date.now());
      let key = "";
      if (timelinePeriod === 'hourly') {
        key = `${d.getHours()}:00`;
      } else if (timelinePeriod === 'daily') {
        key = d.toLocaleDateString([], { weekday: 'short' });
      } else if (timelinePeriod === 'weekly') {
        key = `Week ${safeCeil(d.getDate() / 7)}`;
      } else {
        key = d.toLocaleDateString([], { month: 'short' });
      }

      if (!buckets[key]) {
        buckets[key] = { sessions: 0, revenue: 0 };
      }
      buckets[key].sessions += 1;
      buckets[key].revenue += toSafeNumber(s.totalSpent, 0);
    });

    const items = Object.entries(buckets).map(([label, val]) => ({
      label,
      sessions: val.sessions,
      revenue: val.revenue
    }));

    if (items.length === 0) {
      return [{ label: 'Now', sessions: sessions.length, revenue: 0 }];
    }
    return items;
  };

  const timelineData = getTimelineData();

  return (
    <div className="space-y-6">
      {/* 1. Real-time Live Trend & Session Timeline Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Ticks Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Activity className="h-4 w-4 text-emerald-400 animate-pulse" />
                Live Active Visitors (1s Tick Feed)
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Real-time concurrency updates stream</p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider">
              REALTIME
            </span>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={realtimeTickData}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
                <Area type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActive)" name="Active Visitors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sessions Timeline Chart with Toggle */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                Sessions Timeline Trends
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Historical visitor volume and session distribution</p>
            </div>

            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-[10px] font-bold">
              {(['hourly', 'daily', 'weekly', 'monthly'] as const).map(period => (
                <button
                  key={period}
                  onClick={() => setTimelinePeriod(period)}
                  className={`px-2.5 py-1 rounded-md uppercase transition-all cursor-pointer ${
                    timelinePeriod === period 
                      ? 'bg-cyan-500 text-slate-950 font-black' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {period}
                </button>
              ))}
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }}
                />
                <Bar dataKey="sessions" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Sessions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2. Geolocation Heatmap List & Devices/Browsers Donuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Visitors by Country */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Globe className="h-4 w-4 text-blue-400" />
            Top Active Countries
          </h4>

          <div className="space-y-3">
            {countryData.map((cd, index) => {
              const max = countryData[0]?.count || 1;
              const pct = safeRound((cd.count / max) * 100);
              return (
                <div key={cd.country} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200 flex items-center gap-2">
                      <span className="text-slate-500 font-mono text-[10px]">#{index + 1}</span>
                      {cd.country}
                    </span>
                    <span className="font-mono text-cyan-400 font-bold">{cd.count} visitors</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Devices Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-emerald-400" />
            Device Types Distribution
          </h4>

          <div className="h-44 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={devicePieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {devicePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-around text-xs border-t border-slate-800 pt-3">
            {devicePieData.map(d => (
              <div key={d.name} className="text-center">
                <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: d.color }} />
                <span className="text-slate-400 text-[11px] font-bold">{d.name}</span>
                <p className="font-mono text-white font-black">{d.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Browsers Donut Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-indigo-400" />
            Browser Distribution
          </h4>

          <div className="h-44 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={browserPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {browserPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-1 text-center text-xs border-t border-slate-800 pt-3">
            {browserPieData.slice(0, 3).map(b => (
              <div key={b.name}>
                <span className="text-slate-400 text-[10px] font-bold truncate block">{b.name}</span>
                <p className="font-mono text-white font-black text-xs">{b.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Conversion Funnel & Revenue Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-400" />
            Live Conversion Funnel
          </h4>

          <div className="space-y-3 pt-2">
            {funnelSteps.map((step, idx) => (
              <div key={step.step} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 text-[10px] flex items-center justify-center font-mono">{idx + 1}</span>
                    {step.step}
                  </span>
                  <span className="font-mono text-cyan-400">{step.count} ({step.pct}%)</span>
                </div>
                <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${step.pct}%`, backgroundColor: step.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Traffic Sources Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-rose-400" />
            Traffic Acquisition Channels
          </h4>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="source" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px', color: '#fff' }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Visitors" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
