import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { NodesPage } from './pages/NodesPage';
import { EarningsPage } from './pages/EarningsPage';
import { TasksPage } from './pages/TasksPage';
import { Layout } from './components/Layout';
import type { ReactNode } from 'react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="nodes" element={<NodesPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="earnings" element={<EarningsPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
