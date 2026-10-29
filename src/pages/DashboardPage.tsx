import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCode,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  listUserInvestigations,
  listUserProjects,
  deleteInvestigation,
} from '../lib/firestoreService.ts';
import { InvestigationData, ProjectData } from '../types/investigation.ts';

interface DashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
  onSelectSample: (sampleKey: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onSelectSample }) => {
  const { user, userProfile } = useAuth();
  const [investigations, setInvestigations] = useState<InvestigationData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [invList, prjList] = await Promise.all([
        listUserInvestigations(user.uid),
        listUserProjects(user.uid),
      ]);
      setInvestigations(invList);
      setProjects(prjList);
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this investigation?')) {
      try {
        await deleteInvestigation(id);
        setInvestigations((prev) => prev.filter((i) => i.id !== id));
      } catch (err) {
        console.error('Failed to delete investigation:', err);
      }
    }
  };

  const activeCount = investigations.filter((i) => i.status === 'active').length;
  const resolvedCount = investigations.filter((i) => i.status === 'resolved').length;
  const avgConfidence =
    investigations.length > 0
      ? Math.round(
          investigations.reduce((acc, cur) => acc + (cur.confidenceScore || 75), 0) /
            investigations.length
        )
      : 88;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-6 h-6 text-violet-400" />
            Engineering Workspace
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, {user?.displayName || 'Developer'}. Monitor investigations and root cause metrics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('projects')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-2 transition-colors"
          >
            <FolderKanban className="w-4 h-4 text-slate-400" />
            Manage Projects
          </button>
          <button
            onClick={() => onNavigate('new')}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-600/25 flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            New Investigation
          </button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Fair-Use Quota */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Daily Fair-Use Quota</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <div className="text-2xl font-bold text-white font-mono">
            {userProfile?.analysesUsedToday || 0}{' '}
            <span className="text-sm font-normal text-slate-500">
              / {userProfile?.dailyAnalysisLimit || 25}
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-violet-500 h-full rounded-full transition-all"
              style={{
                width: `${Math.min(
                  100,
                  (((userProfile?.analysesUsedToday || 0) / (userProfile?.dailyAnalysisLimit || 25)) * 100)
                )}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-500">Free manual error analyses reset daily</p>
        </div>

        {/* Metric 2: Active Issues */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Open Investigations</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{activeCount}</div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>Currently under active review</span>
          </p>
        </div>

        {/* Metric 3: Resolved Issues */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Resolved Bugs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{resolvedCount}</div>
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Patches verified and closed</span>
          </p>
        </div>

        {/* Metric 4: Diagnostic Accuracy */}
        <div className="p-5 rounded-xl border border-slate-800 bg-[#0d1322] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg. Evidence Confidence</span>
            <ShieldCheck className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{avgConfidence}%</div>
          <p className="text-[11px] text-slate-500">Supported by stack trace telemetry</p>
        </div>
      </div>

      {/* Main Content: Recent Investigations & Projects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Investigations (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-violet-400" />
              Recent Investigations
            </h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors"
            >
              View all ({investigations.length}) →
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 border border-slate-800/80 rounded-xl bg-[#0d1322]/40">
              <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-xs">Loading investigations...</p>
            </div>
          ) : investigations.length === 0 ? (
            /* Empty state with prompt and sample starters */
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-[#0d1322]/40 space-y-4">
              <div className="w-12 h-12 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto">
                <h3 className="text-sm font-semibold text-white">No investigations yet</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Start your first investigation by pasting a runtime error or try one of our realistic debugging examples.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() => {
                    onSelectSample('hydration');
                    onNavigate('new');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
                >
                  React 19 Hydration Mismatch
                </button>
                <button
                  onClick={() => {
                    onSelectSample('mongo');
                    onNavigate('new');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
                >
                  Node Mongo Auth Failure
                </button>
                <button
                  onClick={() => {
                    onSelectSample('python');
                    onNavigate('new');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 transition-colors"
                >
                  FastAPI ValidationError
                </button>
              </div>

              <div>
                <button
                  onClick={() => onNavigate('new')}
                  className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition-all inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Paste Custom Error Trace
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {investigations.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  onClick={() => onNavigate('investigation', { investigationId: inv.id, investigation: inv })}
                  className="p-4 rounded-xl border border-slate-800 bg-[#0d1322] hover:border-violet-500/40 hover:bg-[#0f172a] transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                            inv.status === 'resolved'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : inv.status === 'archived'
                              ? 'bg-slate-700/40 text-slate-400 border border-slate-700'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {inv.status}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                          {inv.language} {inv.framework ? `• ${inv.framework}` : ''}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(inv.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors truncate">
                        {inv.title}
                      </h3>

                      <p className="text-xs text-slate-400 font-mono line-clamp-1">
                        {inv.errorMessage}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {inv.confidenceScore ? (
                        <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2 py-1 rounded">
                          {inv.confidenceScore}% conf
                        </span>
                      ) : null}
                      <button
                        onClick={(e) => handleDelete(e, inv.id)}
                        title="Delete investigation"
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Projects & Workspaces */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-violet-400" />
              Your Projects
            </h2>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium transition-colors"
            >
              All Projects →
            </button>
          </div>

          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] text-center space-y-3">
                <p className="text-xs text-slate-400">
                  Group investigations by service, repository, or microservice.
                </p>
                <button
                  onClick={() => onNavigate('projects')}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-violet-400" />
                  Create First Project
                </button>
              </div>
            ) : (
              projects.slice(0, 4).map((prj) => {
                const count = investigations.filter((i) => i.projectId === prj.id).length;
                return (
                  <div
                    key={prj.id}
                    onClick={() => onNavigate('history', { projectId: prj.id })}
                    className="p-4 rounded-xl border border-slate-800 bg-[#0d1322] hover:border-slate-700 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-semibold text-white group-hover:text-violet-300 transition-colors">
                        {prj.name}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500">
                        {count} {count === 1 ? 'issue' : 'issues'}
                      </span>
                    </div>
                    {prj.description && (
                      <p className="text-xs text-slate-400 line-clamp-1 mb-2">
                        {prj.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800">
                        {prj.defaultLanguage}
                      </span>
                      {prj.defaultFramework && (
                        <span className="px-1.5 py-0.5 rounded bg-slate-800">
                          {prj.defaultFramework}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {/* Feature Flags Preview Card */}
            <div className="p-4 rounded-xl border border-slate-800/80 bg-gradient-to-br from-violet-950/20 to-slate-900/40 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                Future Roadmap
              </span>
              <h4 className="text-xs font-semibold text-white">GitHub PR & Issue Sync</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Connect your repository to auto-create reproducible bug tickets directly from FixPilot investigations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
