import React, { useState, useRef, useEffect } from 'react';
import { 
  GraduationCap, 
  LayoutDashboard, 
  Database, 
  PlayCircle, 
  History, 
  BarChart3, 
  Settings, 
  RotateCw, 
  AlertCircle,
  User,
  ChevronDown,
  ShieldCheck,
  LogOut,
  LogIn
} from 'lucide-react';
import { ActiveTestSession } from '../types';
import { GoogleLogo } from './GoogleAuthModal';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string, subTab?: string) => void;
  activeSession: ActiveTestSession | null;
  onResumeActiveTest: () => void;
  onDiscardActiveTest: () => void;
  candidateName?: string;
  candidateEmail?: string;
  activeProfileSubTab?: string;
  isLoggedIn?: boolean;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  activeSession,
  onResumeActiveTest,
  onDiscardActiveTest,
  candidateName = 'Tridev Ruidas',
  candidateEmail = 'TridevRuidas@gmail.com',
  activeProfileSubTab = 'overview',
  isLoggedIn = true,
  onOpenLoginModal,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase() || 'TR';
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isProfileActive = currentTab === 'profile' || ['question-banks', 'history', 'analytics', 'admin'].includes(currentTab);

  const profileMenuItems = [
    { id: 'overview', label: 'Candidate Profile', icon: User, desc: 'Personal details & goals' },
    { id: 'question-banks', label: 'Question Banks', icon: Database, desc: 'Manage & import test questions' },
    { id: 'history', label: 'Test History', icon: History, desc: 'Past attempts & reviews' },
    { id: 'analytics', label: 'Performance Analytics', icon: BarChart3, desc: 'Unit strengths & weak spots' },
    { id: 'admin', label: 'Admin Settings', icon: Settings, desc: 'Marking scheme & rules' },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      {/* Top Banner if Active Test exists and not currently taking test */}
      {activeSession && currentTab !== 'exam' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-xs md:text-sm text-amber-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
            <span>
              <strong>Active Mock Test In Progress:</strong> {activeSession.question_bank_name} ({Math.floor(activeSession.remaining_seconds / 60)}m {activeSession.remaining_seconds % 60}s remaining)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onResumeActiveTest}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold px-3 py-1 rounded transition text-xs flex items-center gap-1.5 shadow"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Resume Mock Test
            </button>
            <button
              onClick={onDiscardActiveTest}
              className="text-amber-400 hover:text-amber-300 underline text-xs"
            >
              Discard Test
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & App Title */}
          <div 
            onClick={() => onSelectTab('dashboard')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white">UGC-NET-MOCK TEST</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  MOCK ENGINE V.2
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-medium transition ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard
            </button>

            <button
              onClick={() => onSelectTab('start-test')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition ${
                currentTab === 'start-test'
                  ? 'bg-emerald-500 text-slate-950 shadow-md ring-2 ring-emerald-400/50'
                  : 'bg-emerald-600/90 text-white hover:bg-emerald-600'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              Start Mock Test
            </button>

            {/* Profile Dropdown Container hosting Profile, Components, & Google Login/Logout */}
            <div className="relative" ref={dropdownRef}>
              <div className="flex items-center">
                <button
                  onClick={() => {
                    onSelectTab('profile', 'overview');
                    setDropdownOpen(!dropdownOpen);
                  }}
                  className={`flex items-center gap-2 pl-3 pr-2.5 py-2 rounded-md text-sm font-medium transition ${
                    isProfileActive
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={isLoggedIn ? `Logged in with Google: ${candidateEmail}` : 'Guest Profile - Sign in with Google'}
                >
                  {isLoggedIn ? (
                    <div className="relative">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                        {getInitials(candidateName)}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-1 ring-slate-900" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                      <GoogleLogo className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <span className="font-medium">
                    {isLoggedIn ? 'Profile' : 'Log In'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Profile Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {/* Google Account Status Header */}
                  <div className="px-4 py-2.5 border-b border-slate-800 bg-slate-950/40">
                    {isLoggedIn ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Signed In Account</span>
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium">
                            <GoogleLogo className="w-2.5 h-2.5" />
                            Google Connected
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 pt-1">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow">
                            {getInitials(candidateName)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-white truncate leading-tight">{candidateName}</p>
                            <p className="text-[11px] text-slate-400 truncate">{candidateEmail}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-white">Guest Session</span>
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">Not Logged In</span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Sign in with Google to save mock test history and unit analytics.
                        </p>
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onOpenLoginModal?.();
                          }}
                          className="w-full mt-1 flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold transition shadow"
                        >
                          <GoogleLogo className="w-4 h-4" />
                          <span>Sign in with Google</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Profile & Sub-components Links */}
                  <div className="py-1">
                    {profileMenuItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = isProfileActive && activeProfileSubTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectTab('profile', item.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-left text-xs transition ${
                            isActive 
                              ? 'bg-blue-600/20 text-blue-400 font-semibold border-l-2 border-blue-500' 
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                          <div className="truncate">
                            <div className="font-medium leading-none">{item.label}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5 truncate">{item.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Google Login / Logout Option in Dropdown */}
                  <div className="pt-1.5 border-t border-slate-800 mt-1">
                    {isLoggedIn ? (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onLogout?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log out of Google Account</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          onOpenLoginModal?.();
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-xs text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition font-medium"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>Log in with Google</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Small screens actions */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => onSelectTab('start-test')}
              className="bg-emerald-600 text-white text-xs font-semibold px-2.5 py-1.5 rounded flex items-center gap-1.5"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Start Test
            </button>
            
            {isLoggedIn ? (
              <button
                onClick={() => onSelectTab('profile', 'overview')}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded flex items-center gap-1.5 transition ${
                  isProfileActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
                }`}
                title="Candidate Profile"
              >
                <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center text-[8px] font-bold text-white">
                  {getInitials(candidateName)}
                </div>
                <span>Profile</span>
              </button>
            ) : (
              <button
                onClick={onOpenLoginModal}
                className="bg-white text-slate-800 text-xs font-semibold px-2.5 py-1.5 rounded flex items-center gap-1.5 shadow"
              >
                <GoogleLogo className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden overflow-x-auto py-2 border-t border-slate-800 gap-1 scrollbar-none text-xs">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${currentTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => onSelectTab('start-test')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${currentTab === 'start-test' ? 'bg-emerald-600 text-white font-semibold' : 'text-slate-400'}`}
          >
            Start Test
          </button>
          <button
            onClick={() => onSelectTab('profile', 'overview')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${isProfileActive && activeProfileSubTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            Profile
          </button>
          <button
            onClick={() => onSelectTab('profile', 'question-banks')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${isProfileActive && activeProfileSubTab === 'question-banks' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            Banks
          </button>
          <button
            onClick={() => onSelectTab('profile', 'history')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${isProfileActive && activeProfileSubTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            History
          </button>
          <button
            onClick={() => onSelectTab('profile', 'analytics')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${isProfileActive && activeProfileSubTab === 'analytics' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            Analytics
          </button>
          <button
            onClick={() => onSelectTab('profile', 'admin')}
            className={`px-3 py-1.5 rounded whitespace-nowrap ${isProfileActive && activeProfileSubTab === 'admin' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}
          >
            Admin
          </button>
          {isLoggedIn ? (
            <button
              onClick={onLogout}
              className="px-3 py-1.5 rounded whitespace-nowrap text-rose-400 hover:text-rose-300"
            >
              Log Out
            </button>
          ) : (
            <button
              onClick={onOpenLoginModal}
              className="px-3 py-1.5 rounded whitespace-nowrap text-blue-400 font-semibold"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
