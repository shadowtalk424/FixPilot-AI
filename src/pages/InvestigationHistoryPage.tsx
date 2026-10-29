import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  PlusCircle,
  FileCode,
  Trash2,
  Calendar,
  Layers,
  Sparkles,
  FolderKanban,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  listUserInvestigations,
  listUserProjects,
  deleteInvestigation,
} from '../lib/firestoreService.ts';
import { InvestigationData, ProjectData } from '../types/investigation.ts';

interface InvestigationHistoryPageProps {
  onNavigate: (page: string, params?: any) => void;
  filterProjectId?: string;
}

export const InvestigationHistoryPage: React.FC<InvestigationHistoryPageProps> = ({
  onNavigate,
  filterProjectId,
}) => {
  const { user } = useAuth();
  const [investigations, setInvestigations] = useState<InvestigationData[]>([]);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resolved' | 'archived'>('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [selectedProject, setSelectedProject] = useState(filterProjectId || 'all');

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [invs, prjs] = await Promise.all([
        listUserInvestigations(user.uid),
        listUserProjects(user.uid),
      ]);
      setInvestigations(invs);
      setProjects(prjs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Permanently delete this saved investigation report?')) {
      try {
        await deleteInvestigation(id);
        setInvestigations((prev) => prev.filter((i) => i.id !== id));
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Filtered list
  const filtered = investigations.filter((inv) => {
    // Search query
    const matchQuery =
      !searchQuery.trim() ||
      inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.errorMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.framework && inv.framework.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status
    const matchStatus = statusFilter === 'all' || inv.status === statusFilter;

    // Language
    const matchLang = languageFilter === 'all' || inv.language === languageFilter;

    // Project
    const matchProj = selectedProject === 'all' || inv.projectId === selectedProject;

    return matchQuery && matchStatus && matchLang && matchProj;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-violet-400" />
            Investigation History
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Search, revisit, and filter all previous root-cause diagnoses and proposed patches.
          </p>
        </div>
        <button
          onClick={() => onNavigate('new')}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-600/25 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          New Investigation
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1322] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search error or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#070b12] border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Status */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 rounded-lg bg-[#070b12] border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Issues</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#070b12] border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Languages</option>
            <option value="TypeScript">TypeScript</option>
            <option value="JavaScript">JavaScript</option>
            <option value="Python">Python</option>
            <option value="Go">Go</option>
            <option value="Rust">Rust</option>
            <option value="Java">Java</option>
            <option value="C#">C# / .NET</option>
            <option value="PHP">PHP</option>
          </select>
        </div>

        {/* Project */}
        <div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#070b12] border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="p-16 text-center text-slate-500">
          <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs">Loading records from Cloud Firestore...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-slate-800 rounded-xl bg-[#0d1322] space-y-3">
          <p className="text-slate-400 text-sm">
            {investigations.length === 0
              ? 'No investigations saved yet. Run your first debugging session!'
              : 'No investigations matched your current filters.'}
          </p>
          {investigations.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setLanguageFilter('all');
                setSelectedProject('all');
              }}
              className="text-xs text-violet-400 hover:text-violet-300 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => {
            const project = projects.find((p) => p.id === inv.projectId);
            return (
              <div
                key={inv.id}
                onClick={() => onNavigate('investigation', { investigationId: inv.id, investigation: inv })}
                className="p-4 sm:p-5 rounded-xl border border-slate-800 bg-[#0d1322] hover:border-violet-500/40 hover:bg-[#0f172a] transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {inv.language} {inv.framework ? `• ${inv.framework}` : ''}
                      </span>

                      {project && (
                        <span className="text-[11px] font-medium text-violet-300 bg-violet-600/15 border border-violet-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                          <FolderKanban className="w-3 h-3 text-violet-400" />
                          {project.name}
                        </span>
                      )}

                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-semibold text-white group-hover:text-violet-300 transition-colors truncate">
                      {inv.title}
                    </h3>

                    <p className="text-xs text-slate-400 font-mono line-clamp-1">
                      {inv.errorMessage}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                    {inv.confidenceScore ? (
                      <span className="text-xs font-mono font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-1 rounded">
                        {inv.confidenceScore}% conf
                      </span>
                    ) : null}

                    <button
                      onClick={(e) => handleDelete(e, inv.id)}
                      title="Delete report"
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
