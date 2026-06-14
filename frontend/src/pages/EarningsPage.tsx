import { useEffect, useState } from 'react';
import { api } from '../api';
import { Wallet, TrendingUp, Clock, CheckCircle } from 'lucide-react';

interface Summary {
  total: number;
  pending: number;
  paid: number;
  daily: number;
}

interface Earning {
  id: number;
  amount: number;
  type: string;
  status: string;
  createdAt: string;
  node: { name: string; gpuType: string };
}

export function EarningsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.earnings.summary(), api.earnings.list()])
      .then(([s, e]) => { setSummary(s); setEarnings(e); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  const cards = [
    { label: 'Daily Earnings', value: `${summary?.daily.toFixed(4) ?? 0} ETHER`, icon: TrendingUp, color: 'text-green-400' },
    { label: 'Total Earned', value: `${summary?.total.toFixed(4) ?? 0} ETHER`, icon: Wallet, color: 'text-blue-400' },
    { label: 'Pending', value: `${summary?.pending.toFixed(4) ?? 0} ETHER`, icon: Clock, color: 'text-yellow-400' },
    { label: 'Paid Out', value: `${summary?.paid.toFixed(4) ?? 0} ETHER`, icon: CheckCircle, color: 'text-teal-400' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-gray-400 text-sm mt-1">Mining revenue and payment history</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="bg-gray-800 rounded-xl border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-semibold text-gray-300">Earning History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-700">
                <th className="text-left p-3 font-medium">Date</th>
                <th className="text-left p-3 font-medium">Node</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-right p-3 font-medium">Amount</th>
                <th className="text-right p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {earnings.map(e => (
                <tr key={e.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="p-3 text-gray-300">{new Date(e.createdAt).toLocaleDateString()}</td>
                  <td className="p-3">{e.node.name}</td>
                  <td className="p-3 text-gray-400 capitalize">{e.type}</td>
                  <td className="p-3 text-right font-medium">{e.amount.toFixed(4)}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      e.status === 'paid' ? 'bg-green-900/50 text-green-300' :
                      e.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                      'bg-red-900/50 text-red-300'
                    }`}>{e.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
