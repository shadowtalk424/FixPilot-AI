import React, { useState, useEffect, useRef } from 'react';
import {
  Bug,
  Upload,
  ShieldAlert,
  Sparkles,
  Layers,
  ArrowRight,
  FileText,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  Terminal,
  Cpu,
  RefreshCw,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { listUserProjects, saveInvestigation, incrementUserDailyUsage } from '../lib/firestoreService.ts';
import { ProjectData, StructuredAnalysisResult, InvestigationData } from '../types/investigation.ts';
import { redactSensitiveData } from '../server/redactor.ts';

interface NewInvestigationPageProps {
  onNavigate: (page: string, params?: any) => void;
  initialSampleKey?: string;
}

export const NewInvestigationPage: React.FC<NewInvestigationPageProps> = ({
  onNavigate,
  initialSampleKey,
}) => {
  const { user, userProfile, refreshUserProfile } = useAuth();
  const [projects, setProjects] = useState<ProjectData[]>([]);

  // Form inputs
  const [title, setTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [stackTrace, setStackTrace] = useState('');
  const [logSnippet, setLogSnippet] = useState('');
  const [language, setLanguage] = useState('TypeScript');
  const [framework, setFramework] = useState('React');
  const [environment, setEnvironment] = useState<'development' | 'staging' | 'production' | 'ci_cd' | 'local' | 'other'>('development');
  const [userActions, setUserActions] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // UI state
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStage, setAnalysisStage] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redaction preview
  const [redactionStats, setRedactionStats] = useState<{ count: number; types: string[] }>({ count: 0, types: [] });

  // Load user projects
  useEffect(() => {
    if (user) {
      listUserProjects(user.uid)
        .then(setProjects)
        .catch(console.error);
    }
  }, [user]);

  // Handle sample pre-fills
  const loadSample = (key: string) => {
    if (key === 'hydration') {
      setTitle('Next.js 15 Client Hydration Mismatch on Dynamic Date');
      setErrorMessage(
        'Error: Hydration failed because the initial UI does not match what was rendered on the server.'
      );
      setStackTrace(
        `Error: Hydration failed because the initial UI does not match what was rendered on the server.
    at throwOnHydrationMismatch (react-dom-client.development.js:9847:9)
    at tryToClaimNextHydratableInstance (react-dom-client.development.js:9981:7)
    at updateHostComponent$1 (react-dom-client.development.js:10484:14)
    at beginWork (react-dom-client.development.js:19183:14)
    at App (/src/app/page.tsx:18:22)`
      );
      setLogSnippet(
        `[Warning] Text content did not match. Server: "Last Login: 10/29/2026, 4:15:00 AM" Client: "Last Login: 10/29/2026, 4:15:02 AM"
  See more info here: https://nextjs.org/docs/messages/react-hydration-error`
      );
      setLanguage('TypeScript');
      setFramework('Next.js / React 19');
      setEnvironment('development');
      setUserActions('Navigated to user dashboard with dynamic new Date().toLocaleString() formatted in SSR page component.');
    } else if (key === 'mongo') {
      setTitle('MongoDB Connection Authentication Failed on Staging Cluster');
      setErrorMessage(
        'MongoServerError: Authentication failed.'
      );
      setStackTrace(
        `MongoServerError: Authentication failed.
    at Connection.onMessage (/app/node_modules/mongodb/lib/cmap/connection.js:207:20)
    at MessageStream.<anonymous> (/app/node_modules/mongodb/lib/cmap/message_stream.js:34:12)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)`
      );
      setLogSnippet(
        `[2026-10-29T11:15:20.104Z] INFO: Initializing MongoClient connection to mongodb+srv://staging_user:Pass#123@cluster0.abc.mongodb.net/app_db
[2026-10-29T11:15:20.890Z] ERROR: MongoClient failed handshake: MongoServerError: Authentication failed.`
      );
      setLanguage('JavaScript');
      setFramework('Express / Node.js');
      setEnvironment('staging');
      setUserActions('Updated staging MongoDB password in environment secrets and restarted the service pod.');
    } else if (key === 'python') {
      setTitle('FastAPI Pydantic ValidationError on Nullable UUID Field');
      setErrorMessage(
        'pydantic_core._pydantic_core.ValidationError: 1 validation error for UserPayload\nid\n  Input should be a valid UUID [type=uuid_parsing, input_value=\'\', input_type=str]'
      );
      setStackTrace(
        `Traceback (most recent call last):
  File "/venv/lib/python3.11/site-packages/fastapi/routing.py", line 180, in run_endpoint
    response_data = await dependant.call(**values)
  File "/app/routers/users.py", line 42, in create_user
    validated = UserPayload.model_validate(raw_json)
  File "pydantic/main.py", line 551, in pydantic.main.BaseModel.model_validate
pydantic_core._pydantic_core.ValidationError: 1 validation error for UserPayload`
      );
      setLogSnippet(
        `DEBUG: Incoming request POST /api/v1/users payload: {"id": "", "email": "test@example.com", "role": "member"}
INFO: 422 Unprocessable Entity returned to client.`
      );
      setLanguage('Python');
      setFramework('FastAPI / Pydantic v2');
      setEnvironment('development');
      setUserActions('Client submitted empty string for optional ID parameter during signup registration.');
    }
  };

  useEffect(() => {
    if (initialSampleKey) {
      loadSample(initialSampleKey);
    }
  }, [initialSampleKey]);

  // Client-side quick redaction preview
  useEffect(() => {
    const combined = `${errorMessage}\n${stackTrace}\n${logSnippet}\n${userActions}`;
    const scrub = redactSensitiveData(combined);
    setRedactionStats({
      count: scrub.redactionsCount,
      types: scrub.detectedTypes,
    });
  }, [errorMessage, stackTrace, logSnippet, userActions]);

  // Handle Log File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Supported extensions: .txt, .log, .json, .out, .err
    const validExtensions = ['.txt', '.log', '.json', '.out', '.err'];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValidExt) {
      setFileError('Unsupported file type. Please upload a .log, .txt, .json, .out, or .err file.');
      return;
    }

    // Size limit: 200KB
    const MAX_SIZE_BYTES = 200 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      setFileError(`File is too large (${Math.round(file.size / 1024)}KB). Maximum allowed size is 200KB to protect browser and API quota.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setLogSnippet(content.slice(0, 100000));
      setUploadedFileName(file.name);
    };
    reader.onerror = () => {
      setFileError('Failed to read file content.');
    };
    reader.readAsText(file);
  };

  // Run Investigation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalysisError('');

    if (!errorMessage.trim() && !logSnippet.trim() && !stackTrace.trim()) {
      setAnalysisError('Please provide an error message, stack trace, or attached log file.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStage('Redacting credentials & sensitive tokens...');

    try {
      // Diagnostic pipeline animation
      setTimeout(() => setAnalysisStage('Extracting call stack frames & exceptions...'), 700);
      setTimeout(() => setAnalysisStage('Querying Gemini 3.8 Flash root-cause engine...'), 1600);
      setTimeout(() => setAnalysisStage('Synthesizing proposed patches & regression test plan...'), 3200);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorMessage: errorMessage.trim(),
          stackTrace: stackTrace.trim(),
          logSnippet: logSnippet.trim(),
          language,
          framework,
          environment,
          userActions: userActions.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Diagnostic engine encountered an issue.');
      }

      const structuredResult: StructuredAnalysisResult = data.analysis;

      // Auto-generate title if none provided
      const resolvedTitle =
        title.trim() ||
        `${language} ${framework ? `(${framework})` : ''} - ${errorMessage.slice(0, 60).replace(/\n/g, ' ')}`;

      let savedRecord: InvestigationData | null = null;

      // If user is authenticated, save directly to Firestore
      if (user) {
        setAnalysisStage('Persisting investigation to your Cloud Firestore...');
        savedRecord = await saveInvestigation(user.uid, {
          projectId: selectedProjectId || undefined,
          title: resolvedTitle,
          errorMessage,
          stackTrace,
          logSnippet,
          language,
          framework,
          environment,
          userActions,
          analysisResult: structuredResult,
          status: 'active',
        });

        // Increment usage count in background
        await incrementUserDailyUsage(user.uid);
        await refreshUserProfile();
      } else {
        // Ephemeral record for anonymous free sessions
        savedRecord = {
          id: `ephemeral_${Date.now()}`,
          userId: 'anonymous',
          title: resolvedTitle,
          errorMessage,
          stackTrace,
          logSnippet,
          language,
          framework,
          environment,
          userActions,
          analysisResult: structuredResult,
          status: 'active',
          confidenceScore: structuredResult.confidenceScore,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Navigate to results
      onNavigate('investigation', {
        investigationId: savedRecord.id,
        investigation: savedRecord,
      });
    } catch (err: any) {
      console.error(err);
      setAnalysisError(err.message || 'Analysis failed. Please check connection and try again.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage('');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Title & Description */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider font-mono">
          <Terminal className="w-4 h-4" />
          <span>Diagnostic Input Station</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1">
          New Bug Investigation
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Provide your error trace, attached logs, and execution context. Gemini will isolate probable root causes and propose verifiable patches.
        </p>
      </div>

      {/* 1-Click Sample Starters Bar */}
      <div className="p-3.5 mb-6 rounded-xl border border-slate-800 bg-[#0d1322] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span className="font-medium">Need test data? Load a real-world error scenario:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => loadSample('hydration')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-violet-600/20 text-slate-300 hover:text-violet-200 border border-slate-700 hover:border-violet-500/30 transition-colors"
          >
            React 19 Hydration Mismatch
          </button>
          <button
            type="button"
            onClick={() => loadSample('mongo')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-violet-600/20 text-slate-300 hover:text-violet-200 border border-slate-700 hover:border-violet-500/30 transition-colors"
          >
            Node MongoDB Auth Failure
          </button>
          <button
            type="button"
            onClick={() => loadSample('python')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-violet-600/20 text-slate-300 hover:text-violet-200 border border-slate-700 hover:border-violet-500/30 transition-colors"
          >
            FastAPI ValidationError
          </button>
        </div>
      </div>

      {/* Security Banner & Secret Redaction notice */}
      <div className="p-4 mb-6 rounded-xl border border-violet-500/20 bg-violet-950/20 flex items-start gap-3 text-xs">
        <ShieldAlert className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
        <div className="space-y-1 text-slate-300">
          <span className="font-semibold text-violet-300">Security & Privacy Protocol:</span>
          <p className="text-slate-400 leading-relaxed">
            API keys, JWT bearer tokens, and connection passwords are automatically scrubbed before reaching the model. Please avoid uploading confidential proprietary logs or unredacted production customer PII.
          </p>
          {redactionStats.count > 0 && (
            <div className="flex items-center gap-2 pt-1 text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>
                {redactionStats.count} sensitive token(s) identified for auto-redaction ({redactionStats.types.join(', ')})
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Investigation Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Investigation Title (Optional) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Investigation Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Next.js hydration error on dynamic user avatar"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#070b12] border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
          />
        </div>

        {/* Primary Error Message & Exception */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">
              Error Message / Exception <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-slate-500 font-mono">Pasted console error or HTTP response</span>
          </div>
          <textarea
            required
            rows={3}
            value={errorMessage}
            onChange={(e) => setErrorMessage(e.target.value)}
            placeholder="e.g. TypeError: Cannot read properties of undefined (reading 'map')"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#070b12] border border-slate-800 text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
          />
        </div>

        {/* Stack Trace Area */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">
              Stack Trace (Highly Recommended)
            </label>
            <span className="text-[11px] text-slate-500 font-mono">Reveals exact file paths & line numbers</span>
          </div>
          <textarea
            rows={5}
            value={stackTrace}
            onChange={(e) => setStackTrace(e.target.value)}
            placeholder="Paste raw stack trace here..."
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#070b12] border border-slate-800 text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
          />
        </div>

        {/* Log File Upload & Snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">
              Attached Log Snippet or File Upload
            </label>
            <span className="text-[11px] text-slate-500">Max 200KB • .txt, .log, .json, .out</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <textarea
                rows={4}
                value={logSnippet}
                onChange={(e) => setLogSnippet(e.target.value)}
                placeholder="Or paste application stdout/stderr logs here..."
                className="w-full px-3.5 py-2.5 rounded-lg bg-[#070b12] border border-slate-800 text-white font-mono text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors h-full min-h-[100px]"
              />
            </div>

            {/* Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="p-4 border-2 border-dashed border-slate-800 hover:border-violet-500/50 rounded-lg bg-[#070b12]/50 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.log,.json,.out,.err"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Upload className="w-6 h-6 text-slate-500 group-hover:text-violet-400 transition-colors mb-2" />
              <span className="text-xs font-medium text-slate-300 group-hover:text-white">
                {uploadedFileName ? uploadedFileName : 'Upload Log File'}
              </span>
              <span className="text-[10px] text-slate-500 mt-1">Click to browse or drop file</span>
            </div>
          </div>

          {fileError && (
            <p className="text-xs text-rose-400 flex items-center gap-1.5 mt-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              {fileError}
            </p>
          )}
        </div>

        {/* Technical Context Grid: Language, Framework, Environment, Project */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-800 bg-[#0d1322]">
          {/* Language */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
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
              <option value="Ruby">Ruby</option>
              <option value="SQL">SQL</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Framework */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Framework / Library</label>
            <input
              type="text"
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
              placeholder="e.g. Next.js, Express, Django"
              className="w-full px-3 py-2 rounded-lg bg-[#070b12] border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Environment */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Environment</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as any)}
              className="w-full px-3 py-2 rounded-lg bg-[#070b12] border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
            >
              <option value="development">Development (Local)</option>
              <option value="staging">Staging / Preview</option>
              <option value="production">Production</option>
              <option value="ci_cd">CI / CD Pipeline</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Project Assignment */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300">Project Workspace</label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#070b12] border border-slate-800 text-white text-xs focus:outline-none focus:border-violet-500"
            >
              <option value="">No Project (Uncategorized)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* User Context: What were you doing? */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-300">
              What were you doing when the error occurred?
            </label>
            <span className="text-[11px] text-slate-500">Crucial for reproducing subtle logic race conditions</span>
          </div>
          <textarea
            rows={2}
            value={userActions}
            onChange={(e) => setUserActions(e.target.value)}
            placeholder="e.g. Running npm run build after updating React from v18 to v19, or submitting a payment webhook"
            className="w-full px-3.5 py-2.5 rounded-lg bg-[#070b12] border border-slate-800 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-colors"
          />
        </div>

        {/* Error message from server */}
        {analysisError && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}

        {/* Diagnostic Pipeline Progress (When analyzing) */}
        {isAnalyzing && (
          <div className="p-5 rounded-xl border border-violet-500/30 bg-[#0d1322] space-y-3 animate-pulse">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-violet-300 flex items-center gap-2 font-mono">
                <Cpu className="w-4 h-4 text-violet-400 animate-spin" />
                {analysisStage || 'Investigating with Gemini...'}
              </span>
              <span className="text-slate-500 font-mono text-[11px]">Server-Side Secure Processing</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full w-2/3 animate-pulse rounded-full" />
            </div>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-xs text-slate-500">
            {user ? (
              <span>Saved automatically to your history</span>
            ) : (
              <span>Free instant diagnosis • No signup needed</span>
            )}
          </div>
          <button
            type="submit"
            disabled={isAnalyzing}
            className="px-6 py-3 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-violet-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Diagnostic...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Run FixPilot Investigation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
