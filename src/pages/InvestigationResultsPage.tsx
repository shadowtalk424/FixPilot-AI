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
  GitBranch,
  ShieldCheck,
  Flame,
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
    const textToCopy = `FixPilot AI Evidence-Based Diagnosis: ${currentInv.title}\n\n1. Executive Summary:\n${result.errorSummary}\n\n2. Calibrated Confidence: ${result.confidenceScore}% (Evidence Completeness: ${result.evidenceCompletenessScore}%)\n\n3. Confirmed Evidence:\n${result.confirmedEvidence.map((f) => `• ${f}`).join('\n')}\n\n4. Top Root Cause Hypothesis:\n#1 ${result.hypotheses[0]?.title} [${result.hypotheses[0]?.probability}]: ${result.hypotheses[0]?.explanation}\n\n5. Verification Status: Unexecuted (Proposed Patch)`;
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

      {/* Scrubbing & Verification Status Banner */}
      <div className="space-y-3">
        {/* Verification Status Banner (Priority 2 & 5) */}
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 text-xs text-amber-200/90 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-300 uppercase tracking-wider font-mono">
                Verification Status: {result.verificationStatus?.isExecuted ? 'Executed' : 'Proposed / Unexecuted'}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                Zero-Execution Policy
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {result.verificationStatus?.executionSummary ||
                'FixPilot AI generates diagnostic patches using static analytical reasoning. No code has been executed in an active runtime or automated test runner. Always verify with your local test suite before merging.'}
            </p>
          </div>
        </div>

        {result.secretsScrubbedCount && result.secretsScrubbedCount > 0 ? (
          <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Privacy Shield Active: {result.secretsScrubbedCount} sensitive credential token(s) (
              {result.redactedTypes?.join(', ')}) were automatically redacted before analysis.
            </span>
          </div>
        ) : null}
      </div>

      {/* SECTION 1: Executive Summary & Calibrated Confidence */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h2 className="text-base font-semibold text-white">1. Executive Summary</h2>
          </div>
          <ConfidenceBadge
            score={result.confidenceScore}
            evidenceCompletenessScore={result.evidenceCompletenessScore}
            reasoning={result.confidenceReasoning}
          />
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

        <div className="pt-2 text-[11px] font-mono text-slate-500 border-t border-slate-800/80">
          Methodology: {result.calibratedMethodology}
        </div>
      </div>

      {/* SECTION 2 & SECTION 3: Confirmed Evidence vs Inconsistencies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 2: Confirmed Evidence */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>2. Confirmed Evidence (Witnessed Facts)</span>
          </div>
          <p className="text-xs text-slate-400">
            Explicitly witnessed data present in traces, logs, or code. Plausible explanations are strictly barred from this section.
          </p>
          <div className="space-y-2">
            {result.confirmedEvidence && result.confirmedEvidence.length > 0 ? (
              result.confirmedEvidence.map((fact, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#070b12] border border-slate-800 text-xs text-slate-200 flex items-start gap-2.5 font-mono"
                >
                  <span className="text-emerald-400 font-bold shrink-0">✓</span>
                  <span>{fact}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No direct stack trace facts verified.</p>
            )}
          </div>
        </div>

        {/* SECTION 3: Evidence Inconsistencies */}
        <div className="p-6 rounded-xl border border-violet-500/30 bg-[#0d1322] space-y-4">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>3. Evidence Inconsistencies & Contract Clashes</span>
          </div>
          <p className="text-xs text-slate-400">
            Detected discrepancies between error exceptions, logs, environment variables, or API responses.
          </p>
          <div className="space-y-2">
            {result.evidenceInconsistencies && result.evidenceInconsistencies.length > 0 ? (
              result.evidenceInconsistencies.map((inc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-[#070b12] border border-amber-500/40 text-xs text-amber-200/95 flex items-start gap-2.5 leading-relaxed"
                >
                  <span className="text-amber-400 font-bold shrink-0">⚠️</span>
                  <span>{inc}</span>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>No contradictory claims detected across submitted logs and stack frames.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: Ranked Root-Cause Hypotheses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white">4. Ranked Root-Cause Hypotheses</h2>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Hypotheses are strictly probabilistic theories
          </span>
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
                    {h.probability} Plausibility
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                    Probabilistic Hypothesis
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{h.explanation}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Supporting */}
                <div className="space-y-1.5 p-3 rounded-lg bg-[#070b12] border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Supporting Evidence
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300 font-mono">
                    {h.supportingEvidence.map((ev, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{ev}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Contradicting */}
                <div className="space-y-1.5 p-3 rounded-lg bg-[#070b12] border border-slate-800/80">
                  <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Contradicting / Inconclusive Evidence
                  </span>
                  <ul className="space-y-1 text-xs text-slate-300 font-mono">
                    {h.contradictingEvidence && h.contradictingEvidence.length > 0 ? (
                      h.contradictingEvidence.map((ev, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{ev}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 italic">No contradicting trace markers discovered.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 5: Missing Information & Requested Source Code */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <HelpCircle className="w-4 h-4" />
          <span>5. Missing Information & Requested Source Code</span>
        </div>
        <p className="text-xs text-slate-400">
          FixPilot AI identifies unverified assumptions and prompts for exact files to reach certainty.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Missing Diagnostic Context:</h4>
            {result.missingInformation && result.missingInformation.length > 0 ? (
              result.missingInformation.map((infoItem, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#070b12] border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5"
                >
                  <span className="text-amber-400 font-bold shrink-0">?</span>
                  <span>{infoItem}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No critical diagnostic parameters missing.</p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-300">Requested Source Code Files:</h4>
            {result.requestedSourceCode && result.requestedSourceCode.length > 0 ? (
              result.requestedSourceCode.map((reqCode, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#070b12] border border-violet-500/30 text-xs text-violet-300 font-mono flex items-start gap-2.5"
                >
                  <span className="text-violet-400 font-bold shrink-0">📄</span>
                  <span>{reqCode}</span>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800 text-xs text-emerald-400">
                ✓ Relevant source code has already been supplied for this investigation.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 6: Proposed Code Patches */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-bold text-white">6. Code Patches</h2>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
            {result.proposedPatches[0]?.patchNature === 'evidence_backed'
              ? '✓ Evidence-Backed Patch'
              : '⚠️ Conditional Structural Example (Source code was omitted)'}
          </span>
        </div>

        <div className="space-y-6">
          {result.proposedPatches.map((patch, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-slate-800 bg-[#0d1322] space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        patch.patchNature === 'evidence_backed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {patch.patchNature === 'evidence_backed' ? 'Evidence-Backed Patch' : 'Conditional Example'}
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      Patch #{idx + 1}: {patch.description}
                    </h3>
                  </div>
                  {patch.filePath && (
                    <span className="text-xs font-mono text-violet-400 mt-1 block">
                      Target File: {patch.filePath}
                    </span>
                  )}
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {patch.patchType}
                </span>
              </div>

              {/* API Contract vs Frontend Defensive Programming analysis (Priority 3) */}
              {patch.contractProblemAnalysis && (
                <div className="p-3 rounded-lg bg-violet-950/20 border border-violet-500/30 text-xs text-violet-200 flex items-start gap-2">
                  <GitBranch className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-violet-300">Contract Analysis: </strong>
                    <span>{patch.contractProblemAnalysis}</span>
                  </div>
                </div>
              )}

              {patch.safetyWarning && (
                <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/20 text-xs text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{patch.safetyWarning}</span>
                </div>
              )}

              {/* Original snippet if present */}
              {patch.originalSnippet && (
                <div>
                  <span className="text-[11px] font-mono text-slate-400">Target Expression / Context:</span>
                  <CodeBlock
                    code={patch.originalSnippet}
                    language={patch.language}
                    filename={patch.filePath || 'Original Code'}
                  />
                </div>
              )}

              {/* Proposed Code */}
              <div>
                <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                  {patch.patchNature === 'evidence_backed' ? 'Minimum Necessary Patch:' : 'Suggested Structural Pattern:'}
                </span>
                <CodeBlock
                  code={patch.proposedCode}
                  language={patch.language}
                  filename={patch.filePath || 'Proposed Patch'}
                />
              </div>

              <div className="p-3 rounded-lg bg-[#070b12] border border-slate-800 text-xs text-slate-300 space-y-2">
                <p>
                  <strong className="text-violet-300">Explanation: </strong>
                  {patch.explanation}
                </p>
                {patch.assumptions && patch.assumptions.length > 0 && (
                  <div>
                    <strong className="text-slate-400 text-[11px] uppercase tracking-wider">Explicit Assumptions:</strong>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-400 font-mono mt-1">
                      {patch.assumptions.map((asm, i) => (
                        <li key={i}>{asm}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 7 & SECTION 8: Reproduction Instructions & Regression Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 7: Step-by-Step Reproduction Instructions */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
          <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
            <RotateCcw className="w-4 h-4" />
            <span>7. Reproduction Instructions</span>
          </div>
          <p className="text-xs text-slate-400">
            Step-by-step procedure to reliably trigger and observe this issue in local development:
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

        {/* SECTION 8: Suggested Regression Tests */}
        <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-violet-400 text-xs font-semibold uppercase tracking-wider">
              <Terminal className="w-4 h-4" />
              <span>8. Regression Tests (Proposed / Unexecuted)</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
              Unexecuted
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Proposed unit assertions covering normal behavior, empty data, null/undefined inputs, and malformed responses:
          </p>
          <div className="space-y-4">
            {result.regressionTests.map((t, idx) => (
              <div key={idx} className="space-y-2 p-3 rounded-lg bg-[#070b12] border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">{t.testTitle}</span>
                  <span className="font-mono text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    {t.testFramework}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  <strong className="text-violet-300">Validates: </strong>
                  {t.validationPurpose || t.description}
                </p>
                <CodeBlock code={t.testCode} language={currentInv.language} filename={`${t.testFramework} Test`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 9: Recommended Next Debugging Actions */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#0d1322] space-y-4">
        <h2 className="text-base font-semibold text-white flex items-center gap-2">
          <Terminal className="w-4 h-4 text-violet-400" />
          9. Recommended Next Debugging Actions
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

      {/* SECTION 10: Verification Status & Export */}
      <div className="p-6 rounded-xl border border-slate-800 bg-[#090d16] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono">
              10. Verification Status:
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono font-medium">
              {result.verificationStatus?.isExecuted ? 'Verified by Test Runner' : 'Proposed Only (Unexecuted)'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Export complete 10-point report formatted for GitHub issues, PR descriptions, or team review.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('new')}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            New Investigation
          </button>
          <button
            onClick={() => setShowExportModal(true)}
            className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/25 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (.md)</span>
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
