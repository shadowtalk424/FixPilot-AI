import React, { useState } from 'react';
import {
  Terminal,
  Shield,
  Cpu,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Bug,
  FileCode,
  Zap,
  HelpCircle,
  Code2,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LandingPageProps {
  onNavigate: (page: string, params?: any) => void;
  onSelectSample: (sampleKey: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onSelectSample }) => {
  const { user, signInWithGoogle } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Is FixPilot AI really free to use?',
      a: 'Yes! FixPilot AI provides free manual error investigations with a generous daily fair-use quota (25 full analyses/day). There are no paywalls for the core debugging workspace, proposed patches, or test plans.',
    },
    {
      q: 'Does FixPilot AI execute my code or logs?',
      a: 'Never. FixPilot AI is an analytical reasoning assistant. It treats all logs and error traces as untrusted input, sanitizes sensitive tokens, and produces proposed patches for you to review and run locally. No arbitrary code execution ever occurs on our servers.',
    },
    {
      q: 'How does secret scrubbing protect my API keys?',
      a: 'Before sending any evidence to the Gemini API, our redaction engine runs regex patterns to scrub known credential formats like OpenAI keys, Google API keys, JWT bearer tokens, database connection passwords, and private SSH keys.',
    },
    {
      q: 'Can I use FixPilot AI without creating an account?',
      a: 'Yes! You can run manual investigations anonymously right away. Signing in with Google allows you to persist investigations, organize them into projects, and revisit your debugging history across devices.',
    },
    {
      q: 'What languages and frameworks are supported?',
      a: 'FixPilot AI understands virtually all modern software ecosystems, including TypeScript, JavaScript, Python, Go, Rust, Java, C#, PHP, Ruby, C++, Swift, and SQL.',
    },
  ];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hero Section */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 text-center overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-violet-600/15 blur-[120px] rounded-full pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Free-First Developer Debugging Workspace</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15] max-w-4xl mx-auto font-sans">
          Stop staring at stack traces. <br />
          <span className="bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
            Diagnose root causes in seconds.
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          FixPilot AI dissects runtime errors, separates verified facts from hypotheses, generates targeted code patches, and writes reproduction tests.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => onNavigate('new')}
            className="w-full sm:w-auto px-7 py-3.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 transition-all group"
          >
            <span>Start Free Investigation</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          {!user ? (
            <button
              onClick={signInWithGoogle}
              className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Sign in with Google</span>
            </button>
          ) : (
            <button
              onClick={() => onNavigate('dashboard')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              <span>Go to Dashboard</span>
            </button>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Automatic secret redaction</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>25 Free analyses / day</span>
          </div>
        </div>

        {/* Interactive Terminal Demo Widget */}
        <div className="mt-14 max-w-4xl mx-auto rounded-xl border border-slate-800 bg-[#090d16] shadow-2xl overflow-hidden text-left">
          {/* Terminal Titlebar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0d1322] border-b border-slate-800 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              </div>
              <span className="ml-2 text-slate-300 font-semibold flex items-center gap-1">
                <Terminal className="w-3.5 h-3.5 text-violet-400" />
                fixpilot-cli • structured root-cause diagnostic
              </span>
            </div>
            <span className="text-[11px] text-slate-500">Gemini 3.8 Flash Engine</span>
          </div>

          {/* Terminal Content Mock */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Left side: The Crash */}
            <div className="space-y-3 bg-[#060910] p-4 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between">
                <span className="text-rose-400 font-semibold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Bug className="w-3.5 h-3.5" />
                  Runtime Exception
                </span>
                <span className="text-slate-500 text-[10px]">Node.js / Express</span>
              </div>
              <p className="text-slate-300 font-mono text-[11px] leading-relaxed">
                MongoServerError: Authentication failed.
                <br />
                <span className="text-slate-500">
                  at Connection.onMessage (/app/node_modules/mongodb/lib/cmap/connection.js:207:20)
                  <br />
                  at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
                </span>
              </p>
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 text-[11px]">Context: </span>
                <span className="text-slate-400 text-[11px]">Deploying staging service to container cluster</span>
              </div>
              <button
                onClick={() => {
                  onSelectSample('mongo');
                  onNavigate('new');
                }}
                className="w-full mt-2 py-2 px-3 rounded bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-center font-sans font-medium text-xs transition-colors"
              >
                Inspect this case in FixPilot →
              </button>
            </div>

            {/* Right side: Structured Output */}
            <div className="space-y-3 bg-[#060910] p-4 rounded-lg border border-violet-500/30">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-semibold uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  FixPilot Diagnostic (92% Conf.)
                </span>
                <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Confirmed Fact
                </span>
              </div>
              <div className="space-y-2 text-slate-300 text-[11px]">
                <p className="text-slate-200">
                  <strong className="text-violet-300">Root Cause #1:</strong> Password containing unencoded special characters (e.g. <code className="text-amber-300 font-mono">@</code> or <code className="text-amber-300 font-mono">/</code>) passed directly in connection URI without URL encoding.
                </p>
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">
                  <span className="text-emerald-400">{'+ const safeUri = `mongodb+srv://user:${encodeURIComponent(password)}@cluster.mongodb.net`;'}</span>
                </div>
                <p className="text-slate-400 text-[11px]">
                  ✓ Proposed patch includes <code className="text-slate-300">encodeURIComponent()</code> guard and connection retry logic.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Try Sample Cases Bar */}
      <section className="w-full bg-[#0d1322] border-y border-slate-800/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
            Test 1-Click Real World Debugging Scenarios
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                onSelectSample('inconsistency');
                onNavigate('new');
              }}
              className="px-3.5 py-2 rounded-lg bg-violet-600/30 hover:bg-violet-600/40 border border-violet-500/40 text-xs font-semibold text-violet-200 transition-colors flex items-center gap-2 shadow-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Inconsistency: TypeError vs API Log</span>
            </button>
            <button
              onClick={() => {
                onSelectSample('hydration');
                onNavigate('new');
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-violet-600/20 border border-slate-700 hover:border-violet-500/40 text-xs font-medium text-slate-200 hover:text-violet-200 transition-colors flex items-center gap-2"
            >
              <FileCode className="w-3.5 h-3.5 text-violet-400" />
              <span>React 19 / Next.js Hydration Mismatch</span>
            </button>
            <button
              onClick={() => {
                onSelectSample('mongo');
                onNavigate('new');
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-violet-600/20 border border-slate-700 hover:border-violet-500/40 text-xs font-medium text-slate-200 hover:text-violet-200 transition-colors flex items-center gap-2"
            >
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span>Node.js / Mongo Auth Failure</span>
            </button>
            <button
              onClick={() => {
                onSelectSample('python');
                onNavigate('new');
              }}
              className="px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-violet-600/20 border border-slate-700 hover:border-violet-500/40 text-xs font-medium text-slate-200 hover:text-violet-200 transition-colors flex items-center gap-2"
            >
              <Code2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Python FastAPI / Pydantic ValidationError</span>
            </button>
          </div>
        </div>
      </section>

      {/* What Makes FixPilot Different Section */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-2 font-mono">
            Structured Engineering Rigor
          </h2>
          <h3 className="text-3xl font-bold text-white tracking-tight">
            Not a generic conversational chatbot. A dedicated debugging workstation.
          </h3>
          <p className="mt-4 text-slate-400 text-sm leading-relaxed">
            Standard LLM chat interfaces hallucinate confident answers and obscure where assumptions begin. FixPilot AI produces structured scientific investigations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/60 hover:border-violet-500/30 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-white">Fact vs. Hypothesis Clarity</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              We separate verified trace evidence (e.g. explicit null checks, line numbers) from probabilistic theories, giving you confidence scores and reasoning for each hypothesis.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/60 hover:border-violet-500/30 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileCode className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-white">Proposed Patches & Diff View</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Get targeted replacement code or diffs with explanations. FixPilot clearly labels generated fixes as AI proposals that need local test verification before deployment.
            </p>
          </div>

          <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322]/60 hover:border-violet-500/30 transition-colors space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="text-lg font-semibold text-white">Automated Secret Scrubbing</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Paste logs with peace of mind. Our local and server-side redactor strips JWT tokens, database passwords, and API keys before analysis is performed.
            </p>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="w-full bg-[#090d16] border-y border-slate-800/80 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-2 font-mono">
              Built For Builders
            </h2>
            <h3 className="text-3xl font-bold text-white">Who uses FixPilot AI?</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-lg border border-slate-800 bg-[#0c111e] space-y-2.5">
              <span className="text-2xl">🚀</span>
              <h4 className="font-semibold text-white text-sm">Indie Hackers & Founders</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Debug unfamiliar backend exceptions or deployment errors quickly without wasting hours browsing stale forums.
              </p>
            </div>
            <div className="p-5 rounded-lg border border-slate-800 bg-[#0c111e] space-y-2.5">
              <span className="text-2xl">🎓</span>
              <h4 className="font-semibold text-white text-sm">Students & Bootcamper Devs</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Understand cryptic compiler warnings, async race conditions, and framework nuances with clear plain-language explanations.
              </p>
            </div>
            <div className="p-5 rounded-lg border border-slate-800 bg-[#0c111e] space-y-2.5">
              <span className="text-2xl">⚡</span>
              <h4 className="font-semibold text-white text-sm">Fullstack Engineers</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Instantly turn confusing production stack traces into reproducible steps and ready-to-paste unit tests.
              </p>
            </div>
            <div className="p-5 rounded-lg border border-slate-800 bg-[#0c111e] space-y-2.5">
              <span className="text-2xl">🛠️</span>
              <h4 className="font-semibold text-white text-sm">Small Engineering Teams</h4>
              <p className="text-slate-400 text-xs leading-relaxed">
                Organize shared bug investigations by project, export Markdown reports to GitHub issues, and document resolutions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-2 font-mono">
            Got Questions?
          </h2>
          <h3 className="text-3xl font-bold text-white">Frequently Asked Questions</h3>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-slate-800 bg-[#0d1322]/80 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between text-sm font-semibold text-slate-200 hover:text-white transition-colors"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-4 h-4 text-violet-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                )}
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-4 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="rounded-2xl bg-gradient-to-r from-violet-900/40 via-indigo-900/30 to-purple-900/40 border border-violet-500/30 p-8 sm:p-12 text-center relative overflow-hidden">
          <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
            Ready to solve your next bug faster?
          </h3>
          <p className="text-slate-300 text-sm max-w-xl mx-auto mb-6">
            Paste your error trace now or explore our sample scenarios. Free forever with daily fair-use limits.
          </p>
          <button
            onClick={() => onNavigate('new')}
            className="px-8 py-3.5 rounded-lg bg-white text-slate-950 hover:bg-slate-100 font-semibold text-sm shadow-xl transition-all"
          >
            Launch Debugging Workspace
          </button>
        </div>
      </section>
    </div>
  );
};
