import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Activity, Server, Wallet, LogOut, Gauge, ListTodo } from 'lucide-react';

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`;

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-5 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Gauge className="w-6 h-6 text-blue-400" />
            Ethercoin
          </h1>
          <p className="text-xs text-gray-400 mt-1">AI Distributed Compute Platform</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <NavLink to="/" end className={linkClass}>
            <Activity className="w-5 h-5" /> Dashboard
          </NavLink>
          <NavLink to="/nodes" className={linkClass}>
            <Server className="w-5 h-5" /> Nodes
          </NavLink>
          <NavLink to="/tasks" className={linkClass}>
            <ListTodo className="w-5 h-5" /> Tasks
          </NavLink>
          <NavLink to="/earnings" className={linkClass}>
            <Wallet className="w-5 h-5" /> Earnings
          </NavLink>
        </nav>
        <div className="p-3 border-t border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
