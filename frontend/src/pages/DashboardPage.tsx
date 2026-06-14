import { useEffect, useState } from 'react';
import { api } from '../api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Server, Wallet, Activity, Wifi, WifiOff, ListTodo, Shield } from 'lucide-react';

interface Stats {
  totalHashrate: number;
  totalNodes: number;
  totalStaked: number;
  totalGpus: number;
  totalEarnings: number;
  totalTasks: number;
  hashrateSeries: { time: string; hashrate: number }[];
  statusBreakdown: Record<string, number>;
  taskStatusBreakdown: Record<string, number>;
  topWorkers: { id: number; name: string; gpuType: string; reputation: number; completedTasks: number; hashrate: number }[];
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.dashboard.stats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  const s = stats!;
  const online = s.statusBreakdown['online'] ?? 0;
  const offline = s.statusBreakdown['offline'] ?? 0;
  const succeededTasks = s.taskStatusBreakdown['succeeded'] ?? 0;

  const cards = [
    { label: 'Total Hashrate', value: `${s.totalHashrate.toFixed(0)} TFLOPS`, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-900/20' },
    { label: 'Active Nodes', value: `${online} / ${s.totalNodes}`, icon: Server, color: 'text-green-400', bg: 'bg-green-900/20' },
    { label: 'Total Tasks', value: s.totalTasks.toString(), icon: ListTodo, color: 'text-indigo-400', bg: 'bg-indigo-900/20' },
    { label: 'Tasks Succeeded', value: succeededTasks.toString(), icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-900/20' },
    { label: 'Total Staked', value: `${s.totalStaked.toLocaleString()} ETHER`, icon: Wallet, color: 'text-orange-400', bg: 'bg-orange-900/20' },
    { label: 'Total Earnings', value: `${s.totalEarnings.toFixed(2)} ETHER`, icon: Wallet, color: 'text-yellow-400', bg: 'bg-yellow-900/20' },
  ];

  const chartData = s.hashrateSeries.map(h => ({ time: new Date(h.time).toLocaleString(), hashrate: h.hashrate }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-1">AI compute network overview and task throughput</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400">{c.label}</span>
              <c.icon className={`w-4 h-4 ${c.color}`} />
            </div>
            <p className="text-lg font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Hashrate History</h2>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="hr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#e5e7eb' }} />
              <Area type="monotone" dataKey="hashrate" stroke="#3b82f6" fill="url(#hr)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Node Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-green-400" />
                <span className="text-sm">Online</span>
              </div>
              <span className="font-bold text-green-400">{online}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Offline</span>
              </div>
              <span className="font-bold text-gray-400">{offline}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${s.totalNodes ? (online / s.totalNodes) * 100 : 0}%` }} />
            </div>
            <p className="text-xs text-gray-500 text-center mt-1">
              {s.totalNodes ? `${((online / s.totalNodes) * 100).toFixed(0)}% online` : 'No nodes'}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Top Workers</h3>
            <div className="space-y-2">
              {s.topWorkers.map(w => (
                <div key={w.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{w.name}</p>
                    <p className="text-xs text-gray-400">{w.gpuType}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400">{w.reputation.toFixed(0)}</p>
                    <p className="text-xs text-gray-400">{w.completedTasks} tasks</p>
                  </div>
                </div>
              ))}
              {s.topWorkers.length === 0 && <p className="text-xs text-gray-500">No workers online</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
