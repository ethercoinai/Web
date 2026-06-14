import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Gauge } from 'lucide-react';

export function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (isRegister) {
        await register(username, email, password);
      } else {
        await login(username, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Gauge className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-white">Ethercoin</h1>
          <p className="text-gray-400 text-sm mt-1">Hashrate Management System</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-gray-800 rounded-xl p-6 space-y-4 border border-gray-700">
          <h2 className="text-lg font-semibold">{isRegister ? 'Create Account' : 'Sign In'}</h2>
          {error && <div className="bg-red-900/50 text-red-300 text-sm p-3 rounded-lg">{error}</div>}
          <div>
            <label className="text-sm text-gray-400 block mb-1">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none" required />
          </div>
          {isRegister && (
            <div>
              <label className="text-sm text-gray-400 block mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none" required />
            </div>
          )}
          <div>
            <label className="text-sm text-gray-400 block mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-white border border-gray-600 focus:border-blue-500 focus:outline-none" required />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">
            {isRegister ? 'Register' : 'Sign In'}
          </button>
          <p className="text-center text-sm text-gray-400">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-blue-400 hover:underline">
              {isRegister ? 'Sign In' : 'Register'}
            </button>
          </p>
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">Demo: admin / admin123</p>
      </div>
    </div>
  );
}
