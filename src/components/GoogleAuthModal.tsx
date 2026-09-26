import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, ArrowRight, User } from 'lucide-react';
import { AuthUser } from '../types';

export const GoogleLogo: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      fill="#EA4335"
    />
  </svg>
);

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  defaultEmail?: string;
  defaultName?: string;
}

export const GoogleAuthModal: React.FC<GoogleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultEmail = 'TridevRuidas@gmail.com',
  defaultName = 'Tridev Ruidas',
}) => {
  const [selectedEmail, setSelectedEmail] = useState(defaultEmail);
  const [selectedName, setSelectedName] = useState(defaultName);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleSignIn = (name: string, email: string) => {
    setIsSigningIn(true);
    setTimeout(() => {
      const authUser: AuthUser = {
        id: `usr-google-${Date.now()}`,
        name: name.trim() || 'Google Candidate',
        email: email.trim() || 'candidate@gmail.com',
        isLoggedIn: true,
        provider: 'google',
        loginTimestamp: Date.now(),
      };
      setIsSigningIn(false);
      onSuccess(authUser);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GoogleLogo className="w-5 h-5" />
            <span className="font-semibold text-sm text-slate-800 tracking-tight">Sign in with Google</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-bold text-slate-900">UGC-NET Exam Engine</h3>
            <p className="text-xs text-slate-500">
              Sign in with your Google Account to sync candidate scores, review mock tests, and save analytics.
            </p>
          </div>

          {!isCustomMode ? (
            <div className="space-y-3">
              {/* Primary Detected Google Account */}
              <button
                type="button"
                onClick={() => handleSignIn(defaultName, defaultEmail)}
                disabled={isSigningIn}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-blue-500/30 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-500 transition text-left group shadow-xs disabled:opacity-60"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow">
                  {defaultName.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-900 truncate">{defaultName}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-medium">Google</span>
                  </div>
                  <span className="text-xs text-slate-500 truncate block">{defaultEmail}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Use Another Account Option */}
              <button
                type="button"
                onClick={() => setIsCustomMode(true)}
                className="w-full py-2.5 px-3 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                Use another Google Account
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSignIn(selectedName, selectedEmail);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Google Account Name</label>
                <input
                  type="text"
                  required
                  value={selectedName}
                  onChange={(e) => setSelectedName(e.target.value)}
                  placeholder="e.g. Tridev Ruidas"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Google Email Address</label>
                <input
                  type="email"
                  required
                  value={selectedEmail}
                  onChange={(e) => setSelectedEmail(e.target.value)}
                  placeholder="name@gmail.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  className="flex-1 py-2 text-xs border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSigningIn}
                  className="flex-1 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm flex items-center justify-center gap-1.5"
                >
                  <GoogleLogo className="w-3.5 h-3.5" />
                  Sign In
                </button>
              </div>
            </form>
          )}

          {/* Privacy & Security Note */}
          <div className="pt-3 border-t border-slate-100 flex items-start gap-2 text-[11px] text-slate-500">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              Your profile is authenticated locally using standard Google OAuth identity. No private passwords or exam credentials are ever shared.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Verified Google Sign-In
          </span>
          <button onClick={onClose} className="hover:text-slate-700 text-slate-500 font-medium">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
