import React, { useState } from 'react';
import {
  Settings,
  User,
  Shield,
  Trash2,
  Lock,
  Database,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { deleteAllUserData } from '../lib/firestoreService.ts';

interface AccountSettingsPageProps {
  onNavigate: (page: string) => void;
}

export const AccountSettingsPage: React.FC<AccountSettingsPageProps> = ({ onNavigate }) => {
  const { user, userProfile, logout } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <User className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-slate-400 text-sm">
          Please sign in to configure your FixPilot AI account settings.
        </p>
        <button
          onClick={() => onNavigate('landing')}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-xs font-semibold"
        >
          Return Home
        </button>
      </div>
    );
  }

  const handleDeleteAllData = async () => {
    if (deleteConfirmation.trim() !== 'DELETE') {
      setErrorMsg('Please type DELETE to confirm data destruction.');
      return;
    }

    setIsDeleting(true);
    setErrorMsg('');
    try {
      await deleteAllUserData(user.uid);
      await logout();
      onNavigate('landing');
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Failed to wipe user data. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-violet-400" />
          Account & Privacy Settings
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your developer profile, fair-use tier, and account data deletion.
        </p>
      </div>

      {/* Profile Overview */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-6">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-violet-400" />
          Developer Profile
        </h2>

        <div className="flex items-center gap-4">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.displayName || 'User'}
              className="w-14 h-14 rounded-full ring-2 ring-violet-500/30"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-violet-600/30 text-violet-300 font-mono text-base flex items-center justify-center font-bold">
              {user.email ? user.email.slice(0, 2).toUpperCase() : 'FP'}
            </div>
          )}
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white">
              {user.displayName || 'Developer'}
            </h3>
            <p className="text-xs text-slate-400 font-mono">{user.email}</p>
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30 font-semibold uppercase text-[10px]">
                {userProfile?.tier || 'free'} Tier
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400">UID: {user.uid.slice(0, 12)}...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription & Fair-Use Ledger */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            Usage Ledger & Free Tier Limits
          </h2>
          <span className="text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-1 rounded font-mono">
            Fair-Use Active
          </span>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          FixPilot AI operates under a free-first model. Developers receive 25 full root-cause investigations per day at no cost.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-[#070b12] border border-slate-800">
            <span className="text-[11px] text-slate-500">Analyses Used Today</span>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {userProfile?.analysesUsedToday || 0}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[#070b12] border border-slate-800">
            <span className="text-[11px] text-slate-500">Daily Allocation</span>
            <div className="text-xl font-bold text-white font-mono mt-1">
              {userProfile?.dailyAnalysisLimit || 25}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-[#070b12] border border-slate-800">
            <span className="text-[11px] text-slate-500">Billing Status</span>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
              $0.00 / Free
            </div>
          </div>
        </div>
      </div>

      {/* Security & Secret Scrubber Info */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-violet-400" />
          Security Architecture
        </h2>
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Zero-Execution Sandbox: Submitted logs and proposed patches are never executed automatically.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Credential Redaction: JWTs, bearer tokens, passwords, and API keys are scrubbed before inference.</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Isolated Firestore Storage: User records are bounded by verified Firebase security rules.</span>
          </div>
        </div>
      </div>

      {/* Danger Zone: GDPR Data Erasure */}
      <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-950/10 space-y-4">
        <div>
          <h2 className="text-base font-semibold text-rose-300 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            Delete All Account Data (Right to be Forgotten)
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Permanently erase all your saved investigations, reports, and project workspaces from Cloud Firestore. This action is irreversible.
          </p>
        </div>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-colors"
        >
          Wipe My Account Data
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-rose-500/40 rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Permanently Delete All Data?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will wipe your profile and all saved investigation records from Cloud Firestore. To proceed, please type <strong className="text-rose-400 font-mono">DELETE</strong> below:
            </p>
            <input
              type="text"
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-3 py-2 rounded-lg bg-[#070b12] border border-slate-700 text-white font-mono text-xs focus:outline-none focus:border-rose-500"
            />
            {errorMsg && <p className="text-xs text-rose-400">{errorMsg}</p>}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteAllData}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                {isDeleting ? 'Deleting Everything...' : 'Confirm Destruction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
