import React from 'react';
import { Terminal, Shield, PlusCircle, LayoutDashboard, History, FolderKanban, Settings, LogIn, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, params?: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const { user, userProfile, signInWithGoogle, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white font-mono">FixPilot<span className="text-violet-400">.ai</span></span>
                <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">Free</span>
              </div>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            {user ? (
              <>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                    currentPage === 'dashboard'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-violet-400" />
                  Dashboard
                </button>
                <button
                  onClick={() => onNavigate('new')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                    currentPage === 'new'
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <PlusCircle className="w-4 h-4 text-violet-400" />
                  New Investigation
                </button>
                <button
                  onClick={() => onNavigate('history')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                    currentPage === 'history'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <History className="w-4 h-4 text-slate-400" />
                  History
                </button>
                <button
                  onClick={() => onNavigate('projects')}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors ${
                    currentPage === 'projects'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <FolderKanban className="w-4 h-4 text-slate-400" />
                  Projects
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('landing')}
                  className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors"
                >
                  Overview
                </button>
                <button
                  onClick={() => onNavigate('new')}
                  className="px-3 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800/50 transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  Quick Debug
                </button>
              </>
            )}
          </nav>
        </div>

        {/* Right Section: Auth & Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Usage Pill */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{userProfile?.analysesUsedToday || 0}/{userProfile?.dailyAnalysisLimit || 25} Free analyses</span>
              </div>

              <button
                onClick={() => onNavigate('new')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-600/20 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Investigate
              </button>

              <button
                onClick={() => onNavigate('settings')}
                title="Account Settings"
                className={`p-2 rounded-md transition-colors ${
                  currentPage === 'settings' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Settings className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full ring-1 ring-violet-500/40"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-violet-600/30 text-violet-300 font-mono text-xs flex items-center justify-center font-bold">
                    {user.email ? user.email.slice(0, 2).toUpperCase() : 'FP'}
                  </div>
                )}
                <button
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('new')}
                className="hidden sm:inline-flex px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
              >
                Try without account
              </button>
              <button
                onClick={signInWithGoogle}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-violet-600 hover:bg-violet-500 text-white shadow-md shadow-violet-600/25 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
