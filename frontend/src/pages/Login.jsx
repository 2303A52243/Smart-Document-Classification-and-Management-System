import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, AlertCircle, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (!err.response || err.message === 'Network Error') {
        setError('Cannot connect to backend server. Make sure your backend server/tunnel is running.');
      } else {
        setError('Failed to sign in. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@smartdoc.ai');
    setPassword('Demo123456');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight text-xl">SmartDoc NLP</span>
        </Link>
        <h2 className="text-center text-2xl font-bold tracking-tight text-slate-900">
          Sign in to your document vault
        </h2>
        <p className="mt-2 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
            Create an account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials helper */}
          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-[11px] text-slate-400 mb-2">First time here? Try registering or click below:</p>
            <button
              type="button"
              onClick={handleFillDemo}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
            >
              Fill demo email placeholder
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

