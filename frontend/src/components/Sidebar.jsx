import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Files,
  UploadCloud,
  FolderTree,
  BarChart3,
  Settings,
  LogOut,
  Sparkles,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Documents', path: '/documents', icon: Files },
  { name: 'Upload Files', path: '/upload', icon: UploadCloud },
  { name: 'Categories', path: '/categories', icon: FolderTree },
  { name: 'Analytics & NLP', path: '/analytics', icon: BarChart3 },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export default function Sidebar({ onCloseMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col justify-between select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-slate-900 tracking-tight text-sm">SmartDoc NLP</div>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">Enterprise SaaS</div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* User profile & Logout */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-indigo-600 font-semibold flex items-center justify-center text-xs border border-slate-200 shrink-0">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-medium text-slate-800 truncate">{user?.name || 'User'}</div>
              <div className="text-[11px] text-slate-400 truncate">{user?.email || ''}</div>
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
