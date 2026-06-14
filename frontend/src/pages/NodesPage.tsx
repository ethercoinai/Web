import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Wifi, WifiOff, AlertTriangle, Trash2, Server as ServerIcon, BadgeCheck, Coins } from 'lucide-react';

interface Node {
  id: number;
  name: string;
  gpuType: string;
  gpuCount: number;
  hashrate: number;
  vram: number;
  status: string;
  location: string | null;
  stakeAmount: number;
  reputation: number;
  completedTasks: number;
  lastSeen: string | null;
  createdAt: string;
}

export function NodesPage() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', gpuType: 'NVIDIA RTX 4090', gpuCount: 1, hashrate: 82, vram: 24, location: '', ip: '' });

  const load = () => api.nodes.list().then(setNodes).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const createNode = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.nodes.create(form);
    setShowForm(false);
    setForm({ name: '', gpuType: 'NVIDIA RTX 4090', gpuCount: 1, hashrate: 82, vram: 24, location: '', ip: '' });
    load();
  };

  const deleteNode = async (id: number) => {
    if (!confirm('Delete this node?')) return;
    await api.nodes.delete(id);
    load();
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'online') return <Wifi className="w-4 h-4 text-green-400" />;
    if (status === 'error') return <AlertTriangle className="w-4 h-4 text-red-400" />;
    return <WifiOff className="w-4 h-4 text-gray-400" />;
  };

  const RepBadge = ({ rep }: { rep: number }) => {
    let color = 'text-gray-400';
    if (rep >= 80) color = 'text-purple-400';
    else if (rep >= 50) color = 'text-blue-400';
    else if (rep >= 20) color = 'text-green-400';
    return (
      <span className={`flex items-center gap-1 text-xs ${color}`}>
        <BadgeCheck className="w-3 h-3" /> {rep.toFixed(0)}% rep
      </span>
    );
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nodes</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your GPU compute nodes (min. stake 1,000 ETHER)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Node
        </button>
      </div>

      {showForm && (
        <form onSubmit={createNode} className="bg-gray-800 rounded-xl p-4 border border-gray-700 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none" required />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">GPU Type</label>
            <select value={form.gpuType} onChange={e => setForm({ ...form, gpuType: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none">
              <option>NVIDIA RTX 4090</option>
              <option>NVIDIA RTX 4080</option>
              <option>NVIDIA A100</option>
              <option>NVIDIA RTX 3090</option>
              <option>AMD RX 7900 XTX</option>
              <option>NVIDIA RTX 4070</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">GPU Count</label>
            <input type="number" min={1} value={form.gpuCount} onChange={e => setForm({ ...form, gpuCount: parseInt(e.target.value) || 1 })}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Hashrate (TFLOPS)</label>
            <input type="number" step={0.1} value={form.hashrate} onChange={e => setForm({ ...form, hashrate: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">VRAM (GB)</label>
            <input type="number" value={form.vram} onChange={e => setForm({ ...form, vram: parseInt(e.target.value) || 0 })}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Location</label>
            <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium">Create</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {nodes.map(node => (
          <div key={node.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-medium flex items-center gap-2">
                  <StatusIcon status={node.status} />
                  {node.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">{node.gpuType} x {node.gpuCount}</p>
              </div>
              <button onClick={() => deleteNode(node.id)} className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors">
                <Trash2 className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-400">Hashrate</span><p className="font-medium">{node.hashrate.toFixed(1)} TFLOPS</p></div>
              <div><span className="text-gray-400">VRAM</span><p className="font-medium">{node.vram} GB</p></div>
              <div>
                <span className="text-gray-400">Staked</span>
                <p className="font-medium flex items-center gap-1">
                  <Coins className="w-3 h-3 text-orange-400" />
                  {node.stakeAmount.toLocaleString()} ETHER
                </p>
              </div>
              <div><span className="text-gray-400">Location</span><p className="font-medium">{node.location || '-'}</p></div>
              <div>
                <span className="text-gray-400">Reputation</span>
                <p className="font-medium"><RepBadge rep={node.reputation} /></p>
              </div>
              <div>
                <span className="text-gray-400">Tasks Done</span>
                <p className="font-medium">{node.completedTasks}</p>
              </div>
            </div>
          </div>
        ))}
        {nodes.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-500">
            <ServerIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No nodes yet. Add your first GPU node to start providing compute.</p>
          </div>
        )}
      </div>
    </div>
  );
}
