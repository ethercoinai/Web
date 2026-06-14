import { useEffect, useState, useCallback } from 'react';
import { api } from '../api';
import { Plus, ListTodo, CheckCircle, AlertTriangle, Loader2, Shield, Upload } from 'lucide-react';

interface Task {
  id: number;
  title: string;
  description: string | null;
  taskHash: string | null;
  proofType: string;
  status: string;
  rewardAmount: number;
  lockedAmount: number;
  gpuRequirement: string | null;
  deadline: string | null;
  createdAt: string;
  requestor: { id: number; username: string };
  worker: { id: number; name: string; gpuType: string } | null;
  _count: { proofs: number };
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  assigned: 'bg-blue-900/50 text-blue-300 border-blue-700',
  running: 'bg-indigo-900/50 text-indigo-300 border-indigo-700',
  proof_submitted: 'bg-purple-900/50 text-purple-300 border-purple-700',
  verifying: 'bg-cyan-900/50 text-cyan-300 border-cyan-700',
  succeeded: 'bg-green-900/50 text-green-300 border-green-700',
  failed: 'bg-red-900/50 text-red-300 border-red-700',
  disputed: 'bg-orange-900/50 text-orange-300 border-orange-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  assigned: 'Assigned',
  running: 'Running',
  proof_submitted: 'Proof Submitted',
  verifying: 'Verifying',
  succeeded: 'Succeeded',
  failed: 'Failed',
  disputed: 'Disputed',
};

const PROOF_TYPES = ['zk', 'tee', 'hybrid'];

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', proofType: 'zk', rewardAmount: 10, gpuRequirement: '', deadline: '' });
  const [assigning, setAssigning] = useState<number | null>(null);
  const [selectNode, setSelectNode] = useState<Record<number, number>>({});
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const load = useCallback(() => {
    Promise.all([
      api.tasks.list(),
      api.nodes.list(),
    ]).then(([t, n]) => {
      setTasks(t);
      setNodes(n);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.tasks.create(form);
    setShowForm(false);
    setForm({ title: '', description: '', proofType: 'zk', rewardAmount: 10, gpuRequirement: '', deadline: '' });
    load();
  };

  const assignTask = async (taskId: number) => {
    const nodeId = selectNode[taskId];
    if (!nodeId) return;
    setActionLoading(taskId);
    try {
      await api.tasks.assign(taskId, nodeId);
      setAssigning(null);
      setSelectNode(prev => { const n = { ...prev }; delete n[taskId]; return n; });
      await load();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const submitProof = async (taskId: number) => {
    setActionLoading(taskId);
    try {
      await api.tasks.submitProof(taskId);
      await load();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const verifyTask = async (taskId: number, accepted: boolean) => {
    setActionLoading(taskId);
    try {
      await api.tasks.verify(taskId, accepted);
      await load();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const startTask = async (taskId: number) => {
    setActionLoading(taskId);
    try {
      await api.tasks.updateStatus(taskId, 'running');
      await load();
    } catch (e) { console.error(e); }
    setActionLoading(null);
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[status] || 'bg-gray-800 text-gray-300 border-gray-600'}`}>
      {STATUS_LABELS[status] || status}
    </span>
  );

  if (loading) return <div className="flex items-center justify-center h-full"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">AI compute task lifecycle management</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" /> Submit Task
        </button>
      </div>

      {showForm && (
        <form onSubmit={createTask} className="bg-gray-800 rounded-xl p-4 border border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Title</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none" required />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs text-gray-400 block mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none" rows={3} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Proof Type</label>
            <select value={form.proofType} onChange={e => setForm({ ...form, proofType: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none">
              {PROOF_TYPES.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Reward (ETHER)</label>
            <input type="number" min={0} step={0.01} value={form.rewardAmount} onChange={e => setForm({ ...form, rewardAmount: parseFloat(e.target.value) || 0 })}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">GPU Requirement</label>
            <input value={form.gpuRequirement} onChange={e => setForm({ ...form, gpuRequirement: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Deadline</label>
            <input type="datetime-local" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none" />
          </div>
          <div className="md:col-span-2 flex gap-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium">Create Task</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {tasks.map(task => (
          <div key={task.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{task.title}</h3>
                  <StatusBadge status={task.status} />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {task.description || 'No description'} — {task.proofType.toUpperCase()} proof
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>Hash: {task.taskHash || '-'}</p>
                <p>Reward: {task.rewardAmount} ETHER</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center gap-4">
                <span>Requestor: {task.requestor.username}</span>
                {task.worker && <span>Worker: {task.worker.name} ({task.worker.gpuType})</span>}
                {task.gpuRequirement && <span>GPU: {task.gpuRequirement}</span>}
              </div>
              <div className="flex items-center gap-2">
                {task.status === 'pending' && (
                  <button onClick={() => setAssigning(assigning === task.id ? null : task.id)}
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-xs">
                    <Upload className="w-3 h-3" /> Assign
                  </button>
                )}
                {task.status === 'assigned' && (
                  <button onClick={() => startTask(task.id)} disabled={actionLoading === task.id}
                    className="text-indigo-400 hover:text-indigo-300 disabled:opacity-50 flex items-center gap-1 text-xs">
                    {actionLoading === task.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Loader2 className="w-3 h-3" />} Start
                  </button>
                )}
                {task.status === 'running' && (
                  <button onClick={() => submitProof(task.id)} disabled={actionLoading === task.id}
                    className="text-purple-400 hover:text-purple-300 disabled:opacity-50 flex items-center gap-1 text-xs">
                    <Shield className="w-3 h-3" /> {actionLoading === task.id ? 'Submitting...' : 'Submit Proof'}
                  </button>
                )}
                {task.status === 'proof_submitted' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => verifyTask(task.id, true)} disabled={actionLoading === task.id}
                      className="text-green-400 hover:text-green-300 disabled:opacity-50 flex items-center gap-1 text-xs">
                      <CheckCircle className="w-3 h-3" /> Accept
                    </button>
                    <button onClick={() => verifyTask(task.id, false)} disabled={actionLoading === task.id}
                      className="text-red-400 hover:text-red-300 disabled:opacity-50 flex items-center gap-1 text-xs">
                      <AlertTriangle className="w-3 h-3" /> Reject
                    </button>
                  </div>
                )}
                {task.status === 'succeeded' && <CheckCircle className="w-3.5 h-3.5 text-green-400" />}
                {task.status === 'failed' && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
              </div>
            </div>
            {assigning === task.id && (
              <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-3">
                <select value={selectNode[task.id] || ''} onChange={e => setSelectNode(prev => ({ ...prev, [task.id]: parseInt(e.target.value) }))}
                  className="bg-gray-700 rounded-lg px-3 py-1.5 text-xs border border-gray-600 focus:border-blue-500 focus:outline-none">
                  <option value="">Select worker node...</option>
                  {nodes.filter(n => n.status === 'online').map(n => (
                    <option key={n.id} value={n.id}>{n.name} — {n.gpuType} (rep: {n.reputation})</option>
                  ))}
                </select>
                <button onClick={() => assignTask(task.id)} disabled={!selectNode[task.id] || actionLoading === task.id}
                  className="bg-blue-600 disabled:opacity-50 hover:bg-blue-700 px-3 py-1.5 rounded-lg text-xs font-medium">
                  {actionLoading === task.id ? 'Assigning...' : 'Assign'}
                </button>
              </div>
            )}
          </div>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <ListTodo className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tasks yet. Submit your first AI compute task.</p>
          </div>
        )}
      </div>
    </div>
  );
}
