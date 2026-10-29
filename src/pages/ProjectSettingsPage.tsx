import React, { useState, useEffect } from 'react';
import {
  FolderKanban,
  PlusCircle,
  Edit2,
  Trash2,
  Check,
  X,
  FileCode,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  listUserProjects,
  createProject,
  updateProject,
  deleteProject,
  listUserInvestigations,
} from '../lib/firestoreService.ts';
import { ProjectData, InvestigationData } from '../types/investigation.ts';

interface ProjectSettingsPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ProjectSettingsPage: React.FC<ProjectSettingsPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [investigations, setInvestigations] = useState<InvestigationData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState('TypeScript');
  const [defaultFramework, setDefaultFramework] = useState('React');
  const [defaultEnvironment, setDefaultEnvironment] = useState('development');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [prjs, invs] = await Promise.all([
        listUserProjects(user.uid),
        listUserInvestigations(user.uid),
      ]);
      setProjects(prjs);
      setInvestigations(invs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setDefaultLanguage('TypeScript');
    setDefaultFramework('React');
    setDefaultEnvironment('development');
    setShowModal(true);
  };

  const handleOpenEdit = (p: ProjectData) => {
    setEditingId(p.id);
    setName(p.name);
    setDescription(p.description || '');
    setDefaultLanguage(p.defaultLanguage);
    setDefaultFramework(p.defaultFramework || '');
    setDefaultEnvironment(p.defaultEnvironment || 'development');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateProject(editingId, user.uid, {
          name,
          description,
          defaultLanguage,
          defaultFramework,
          defaultEnvironment,
        });
        setProjects((prev) =>
          prev.map((p) =>
            p.id === editingId
              ? { ...p, name, description, defaultLanguage, defaultFramework, defaultEnvironment }
              : p
          )
        );
      } else {
        const created = await createProject(user.uid, {
          name,
          description,
          defaultLanguage,
          defaultFramework,
          defaultEnvironment,
        });
        setProjects((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this project workspace? Associated investigations will remain saved.')) {
      try {
        await deleteProject(id);
        setProjects((prev) => prev.filter((p) => p.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <FolderKanban className="w-6 h-6 text-violet-400" />
            Project Workspaces
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Organize error investigations by codebase, microservice, or staging environment.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-600/25 flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="p-16 text-center text-slate-500">
          <div className="animate-spin w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-3"></div>
          <p className="text-xs">Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-slate-800 rounded-xl bg-[#0d1322] space-y-4">
          <FolderKanban className="w-10 h-10 text-slate-600 mx-auto" />
          <div>
            <h3 className="text-sm font-semibold text-white">No projects created yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Create your first project to automatically tag investigations with your primary language and stack.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition-all inline-flex items-center gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            New Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((p) => {
            const count = investigations.filter((i) => i.projectId === p.id).length;
            return (
              <div
                key={p.id}
                className="p-5 rounded-xl border border-slate-800 bg-[#0d1322] flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-white">{p.name}</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                        title="Edit project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                        title="Delete project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {p.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description}</p>
                  )}

                  <div className="flex items-center gap-2 mt-3 flex-wrap text-[11px] font-mono text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {p.defaultLanguage}
                    </span>
                    {p.defaultFramework && (
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {p.defaultFramework}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                      {p.defaultEnvironment}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono">
                    {count} {count === 1 ? 'investigation' : 'investigations'}
                  </span>
                  <button
                    onClick={() => onNavigate('history', { projectId: p.id })}
                    className="text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <span>View Issues</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <h3 className="text-base font-semibold text-white">
                {editingId ? 'Edit Project' : 'Create Project Workspace'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Project Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Payments Microservice, Web App Frontend"
                  className="w-full px-3.5 py-2 rounded-lg bg-[#070b12] border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief note about this repository or service..."
                  className="w-full px-3.5 py-2 rounded-lg bg-[#070b12] border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Default Language</label>
                  <select
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#070b12] border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                  >
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

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-slate-300">Default Framework</label>
                  <input
                    type="text"
                    value={defaultFramework}
                    onChange={(e) => setDefaultFramework(e.target.value)}
                    placeholder="e.g. Next.js, FastAPI"
                    className="w-full px-3 py-2 rounded-lg bg-[#070b12] border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">Default Environment</label>
                <select
                  value={defaultEnvironment}
                  onChange={(e) => setDefaultEnvironment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[#070b12] border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
                >
                  <option value="development">Development (Local)</option>
                  <option value="staging">Staging / Preview</option>
                  <option value="production">Production</option>
                  <option value="ci_cd">CI / CD Pipeline</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/25 transition-all"
                >
                  {isSubmitting ? 'Saving...' : editingId ? 'Update Project' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
