import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Download,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Code2,
  RotateCcw,
  ShieldAlert,
  ArrowLeft,
  Share2,
  Trash2,
  Edit2,
  Check,
  Terminal,
  ExternalLink,
  Info,
  Layers,
  Sparkles,
} from 'lucide-react';
import { InvestigationData, StructuredAnalysisResult } from '../types/investigation.ts';
import { CodeBlock } from '../components/CodeBlock.tsx';
import { ConfidenceBadge } from '../components/ConfidenceBadge.tsx';
import { ExportReportModal } from '../components/ExportReportModal.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  updateInvestigationStatusOrTitle,
  deleteInvestigation,
} from '../lib/firestoreService.ts';

interface InvestigationResultsPageProps {
  investigation: InvestigationData;
  onNavigate: (page: string, params?: any) => void;
  onUpdateInvestigation?: (updated: InvestigationData) => void;
}

export const InvestigationResultsPage: React.FC<InvestigationResultsPageProps> = ({
  investigation,
  onNavigate,
  onUpdateInvestigation,
}) => {
  const { user } = useAuth();
  const [currentInv, setCurrentInv] = useState<InvestigationData>(investigation);
  const [showExportModal, setShowExportModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState(currentInv.title);

  const result: StructuredAnalysisResult | undefined = currentInv.analysisResult;

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Investigation Data Unavailable</h2>
        <p className="text-slate-400 text-sm">
          This investigation report has no diagnostic result attached.
        </p>
        <button
          onClick={() => onNavigate('dashboard')}
          className="px-4 py-2 rounded-lg bg-slate-800 text-white text-xs font-medium"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Handle status update
  const handleStatusChange = async (newStatus: 'active' | 'resolved' | 'archived') => {
    const updated = { ...currentInv, status: newStatus };
    setCurrentInv(updated);
    if (onUpdateInvestigation) onUpdateInvestigation(updated);

    if (user && !currentInv.id.startsWith('ephemeral_')) {
      try {
        await updateInvestigationStatusOrTitle(currentInv.id, { status: newStatus });
      } catch (err) {
        console.error('Failed to update status:', err);
      }
    }
  };

  // Handle title rename
  const handleSaveTitle = async () => {
    if (!newTitle.trim()) return;
    const updated = { ...currentInv, title: newTitle.trim() };
    setCurrentInv(updated);
    setIsRenaming(false);
    if (onUpdateInvestigation) onUpdateInvestigation(updated);

    if (user && !currentInv.id.startsWith('ephemeral_')) {
      try {
        await updateInvestigationStatusOrTitle(currentInv.id, { title: newTitle.trim() });
      } catch (err) {
        console.error('Failed to update title:', err);
      }
    }
  };

  // Delete investigation
  const handleDelete = async () => {
    if (confirm('Delete this investigation and report permanently?')) {
      if (user && !currentInv.id.startsWith('ephemeral_')) {
        await deleteInvestigation(currentInv.id);
      }
      onNavigate(user ? 'history' : 'dashboard');
    }
  };

  // Copy quick diagnosis summary
  const handleCopySummary = async () => {
    const textToCopy = `FixPilot AI Diagnosis: ${currentInv.title}\n\nSummary:\n${result.errorSummary}\n\nConfidence: ${result.confidenceScore}%\n\nConfirmed Facts:\n${result.confirmedFacts.map((f) => `• ${f}`).join('\n')}\n\nTop Root Cause:\n${result.hypotheses[0]?.title}: ${result.hypotheses[0]?.explanation}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate(user ? 'history' : 'dashboard')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400">
                {currentInv.language} {currentInv.framework ? `• ${currentInv.framework}` : ''}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400 capitalize">
                {currentInv.environment} environment
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-500 font-mono">
                {new Date(currentInv.createdAt).toLocaleDateString()}
              </span>
            </div>

            {isRenaming ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-2.5 py-1 text-base font-bold bg-[#070b12] border border-violet-500 rounded text-white focus:outline-none"
                />
                <button
                  onClick={handleSaveTitle}
                  className="px-2.5 py-1 text-xs bg-violet-600 hover:bg-violet-500 rounded text-white font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsRenaming(false)}
                  className="px-2 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded text-slate-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {currentInv.title}
                </h1>
                <button
                  onClick={() => setIsRenaming(true)}
                  className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
                  title="Rename"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status selector */}
          <select
            value={currentInv.status}
            onChange={(e) => handleStatusChange(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-violet-500"
          >
            <option value="active">Status: Active</option>
            <option value="resolved">Status: Resolved</option>
            <option value="archived">Status: Archived</option>
          </select>

          <button
            onClick={handleCopySummary}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            title="Copy plain-text summary"
          >
            {copiedSummary ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Diagnosis</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/25 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (.md)</span>
          </button>

          <button
            onClick={handleDelete}
            title="Delete investigation"
            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrubbing & Execution Caution Banner */}
      <div className="space-y-3">
        {result.secretsScrubbedCount && result.secretsScrubbedCount > 0 ? (
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Privacy Shield Active: {result.secretsScrubbedCount} sensitive credential token(s) (
              {result.redactedTypes?.join(', ')}) were automatically redacted before analysis.
            </span>
          </div>
        ) : null}

        <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/20 text-xs text-amber-200/90 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <span className="font-semibold text-amber-300">Engineering Disclaimer: </span>
            <span>
              {result.executionDisclaimer ||
                'FixPilot AI generates patches based on static reasoning and stack trace patterns. No code has been executed on live servers. Always review and verify patches using your local test runner.'}
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Executive Error Summary & Diagnostic Confidence */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-semibold text-white">Executive Diagnosis</h2>
          </div>
          <ConfidenceBadge score={result.confidenceScore} reasoning={result.confidenceReasoning} />
        </div>

        <p className="text-sm text-slate-200 leading-relaxed font-sans">
          {result.errorSummary}
        </p>

        {result.summaryBullets && result.summaryBullets.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Key Diagnostic Observations:
            </h3>
            <ul className="space-y-1 text-xs text-slate-300">
              {result.summaryBullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Section 2: Confirmed Facts vs. Hypotheses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confirmed Facts */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirmed Facts (Extracted from Trace)</span>
          </div>
          <p className="text-xs text-slate-400">
            These statements represent verifiable data explicitly present in the provided stack trace and logs.
          </p>
          <div className="space-y-2">
            {result.confirmedFacts.map((fact, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#070b12] border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5 font-mono"
              >
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>{fact}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Missing Information Needed for 100% Certainty */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Missing Information Needed</span>
          </div>
          <p className="text-xs text-slate-400">
            FixPilot AI highlights what context or files are absent to prevent false certainty.
          </p>
          {result.missingInformation && result.missingInformation.length > 0 ? (
            <div className="space-y-2">
              {result.missingInformation.map((infoItem, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#070b12] border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <span className="text-amber-400 font-bold shrink-0">?</span>
                  <span>{infoItem}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">
              All essential parameters were discernible from the provided trace and logs.
            </p>
          )}
        </div>
      </div>

      {/* Section 3: Ranked Root Cause Hypotheses */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-violet-400" />
          <h2 className="text-lg font-bold text-white">Ranked Probable Root Causes</h2>
        </div>

        <div className="space-y-4">
          {result.hypotheses.map((h) => (
            <div
              key={h.rank}
              className="p-5 rounded-xl border border-slate-800 bg-[#0d1322] space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded bg-violet-600/20 text-violet-300 font-mono text-xs font-bold flex items-center justify-center border border-violet-500/30">
                    #{h.rank}
                  </span>
                  <h3 className="text-sm font-semibold text-white">{h.title}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      h.probability === 'high'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : h.probability === 'medium'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-700/30 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {h.probability} Probability
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {h.isConfirmedFact ? 'Confirmed Fact' : 'Investigative Hypothesis'}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{h.explanation}</p>

              {/* Supporting evidence */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Supporting Trace Evidence:
                </span>
                <ul className="space-y-1 text-xs text-slate-400 font-mono">
                  {h.supportingEvidence.map((ev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-violet-400 font-bold">›</span>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Proposed Code Patches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white">Proposed Code Patches</h2>
          </div>
          <span className="text-xs text-slate-500">
            Static AI proposal • Review before merging
          </span>
        </div>

        <div className="space-y-6">
          {result.proposedPatches.map((patch, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-slate-800 bg-[#0d1322] space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-white">
                    Patch #{idx + 1}: {patch.description}
                  </h3>
                  {patch.filePath && (
                    <span className="text-xs font-mono text-violet-400 mt-0.5 block">
                      Target: {patch.filePath}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {patch.patchType}
                </span>
              </div>

              {patch.safetyWarning && (
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{patch.safetyWarning}</span>
                </div>
              )}

              {/* Original snippet if present */}
              {patch.originalSnippet && (
                <div>
                  <span className="text-[11px] font-mono text-slate-400">Original / Buggy Code:</span>
                  <CodeBlock
                    code={patch.originalSnippet}
                    language={patch.language}
                    filename="Original Snippet"
                  />
                </div>
              )}

              {/* Proposed Code */}
              <div>
                <span className="text-[11px] font-mono text-emerald-400">Proposed Replacement Patch:</span>
                <CodeBlock
                  code={patch.proposedCode}
                  language={patch.language}
                  filename={patch.filePath || 'Proposed Fix'}
                />
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-[#070b12] p-3 rounded-lg border border-slate-800/80">
                <strong className="text-violet-300">Rationale: </strong>
                {patch.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section 5: Reproduction Instructions & Regression Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step-by-Step Reproduction Instructions */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
          <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
            <RotateCcw className="w-4 h-4" />
            <span>Reproduction Instructions</span>
          </div>
          <p className="text-xs text-slate-400">
            Follow these steps to reliably reproduce the error in your local dev environment:
          </p>
          <ol className="space-y-2.5 text-xs text-slate-200">
            {result.reproductionSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-violet-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* Suggested Regression Tests */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
          <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
            <Terminal className="w-4 h-4" />
            <span>Suggested Regression Tests</span>
          </div>
          <p className="text-xs text-slate-400">
            Add these test assertions to your test suite to prevent recurrence:
          </p>
          <div className="space-y-4">
            {result.regressionTests.map((t, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{t.testTitle}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {t.testFramework}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{t.description}</p>
                <CodeBlock code={t.testCode} language={currentInv.language} filename={`${t.testFramework} Test`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section 6: Recommended Next Debugging Actions */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-violet-400" />
          Recommended Next Debugging Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.nextActions.map((action) => (
            <div
              key={action.order}
              className="p-4 rounded-lg bg-[#070b12] border border-slate-800 space-y-2"
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-violet-600/20 text-violet-400 text-xs font-bold flex items-center justify-center font-mono">
                  {action.order}
                </span>
                <h4 className="text-xs font-semibold text-white">{action.action}</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">{action.purpose}</p>
              {action.commandOrSnippet && (
                <div className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-violet-300 break-all select-all">
                  {action.commandOrSnippet}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Export & Return bar */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#090d16] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-white">Share or Archive Investigation</h4>
          <p className="text-xs text-slate-400">
            Export a clean Markdown report formatted for GitHub issues or team Slack channels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('new')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            Start Another Investigation
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/25 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown</span>
          </button>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportReportModal
          investigation={currentInv}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};
