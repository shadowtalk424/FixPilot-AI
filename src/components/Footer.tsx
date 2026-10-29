import React from 'react';
import { Terminal, Shield, Lock, Cpu, Github, ExternalLink, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#080c14] text-slate-400 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-violet-600 flex items-center justify-center text-white">
                <Terminal className="w-3.5 h-3.5" />
              </div>
              <span className="font-bold text-white font-mono text-sm">FixPilot AI</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              The free-first AI debugging assistant for software developers, indie hackers, and engineering teams.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/60 px-2.5 py-1 rounded w-fit">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              All systems operational
            </div>
          </div>

          {/* Product & Debugging */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3 uppercase tracking-wider text-[11px]">Workspace</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('new')} className="hover:text-violet-300 transition-colors">
                  New Investigation
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-violet-300 transition-colors">
                  Developer Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('history')} className="hover:text-violet-300 transition-colors">
                  Saved Investigations
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('projects')} className="hover:text-violet-300 transition-colors">
                  Project Workspaces
                </button>
              </li>
            </ul>
          </div>

          {/* Security & Trust */}
          <div>
            <h4 className="text-slate-200 font-semibold mb-3 uppercase tracking-wider text-[11px]">Security & Trust</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5 text-slate-300">
                <Shield className="w-3.5 h-3.5 text-violet-400" />
                <span>Zero-Execution Sandbox</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Lock className="w-3.5 h-3.5 text-violet-400" />
                <span>Automated Secret Scrubbing</span>
              </li>
              <li className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-violet-400" />
                <span>Isolated Per-User Firestore</span>
              </li>
              <li>
                <button onClick={() => onNavigate('privacy')} className="hover:text-violet-300 transition-colors">
                  Privacy Policy & Data Rights
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('terms')} className="hover:text-violet-300 transition-colors">
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Free-first philosophy */}
          <div className="space-y-2">
            <h4 className="text-slate-200 font-semibold mb-3 uppercase tracking-wider text-[11px]">Fair-Use Promise</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Manual debugging remains free with daily analysis quotas. We never inject fake limits or artificial roadblocks.
            </p>
            <div className="pt-2 text-[11px] text-slate-500">
              Powered by Google Gemini 3.8 Flash & Firebase
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} FixPilot AI. Built for developers worldwide.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('privacy')} className="hover:text-slate-300 transition-colors">
              Privacy
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('terms')} className="hover:text-slate-300 transition-colors">
              Terms
            </button>
            <span>•</span>
            <span className="text-slate-400">Patches are AI hypotheses. Verify before production.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
