const API = '/api';

async function request(path: string, options?: RequestInit) {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/dashboard/#/login';
    throw new Error('unauthorized');
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`non-json response (${res.status}): ${text.slice(0, 100)}`);
  }
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    register: (username: string, email: string, password: string) =>
      request('/auth/register', { method: 'POST', body: JSON.stringify({ username, email, password }) }),
    me: () => request('/auth/me'),
  },
  dashboard: {
    stats: () => request('/dashboard/stats'),
    nodeStatus: () => request('/dashboard/nodes/status'),
  },
  nodes: {
    list: () => request('/nodes'),
    get: (id: number) => request(`/nodes/${id}`),
    create: (data: any) => request('/nodes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/nodes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/nodes/${id}`, { method: 'DELETE' }),
    stake: (id: number, amount: number) => request(`/nodes/${id}/stake`, { method: 'POST', body: JSON.stringify({ amount }) }),
  },
  earnings: {
    list: () => request('/earnings'),
    summary: () => request('/earnings/summary'),
  },
  tasks: {
    list: () => request('/tasks'),
    get: (id: number) => request(`/tasks/${id}`),
    create: (data: any) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
    assign: (id: number, nodeId: number) => request(`/tasks/${id}/assign`, { method: 'POST', body: JSON.stringify({ nodeId }) }),
    submitProof: (id: number, proofData?: string) => request(`/tasks/${id}/proof`, { method: 'POST', body: JSON.stringify({ proofData }) }),
    verify: (id: number, accepted: boolean) => request(`/tasks/${id}/verify`, { method: 'POST', body: JSON.stringify({ accepted }) }),
    updateStatus: (id: number, status: string) => request(`/tasks/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) }),
    stats: () => request('/tasks/stats/overview'),
  },
};
