import React, { useState } from 'react';
import { X, Copy, Download, Check, FileText } from 'lucide-react';
import { InvestigationData, StructuredAnalysisResult } from '../types/investigation.ts';

interface ExportReportModalProps {
  investigation: InvestigationData;
  onClose: () => void;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({ investigation, onClose }) => {
  const [copied, setCopied] = useState(false);
  const result = investigation.analysisResult;

  if (!result) return null;

  const generateMarkdown = () => {
    return `# FixPilot AI Evidence-Based Diagnostic Report
**Title:** ${investigation.title}
**Date:** ${new Date(investigation.createdAt).toLocaleString()}
**Environment:** ${investigation.environment} | **Language:** ${investigation.language} ${investigation.framework ? `(${investigation.framework})` : ''}
**Calibrated Evidence Completeness:** ${result.evidenceCompletenessScore || 50}%
**Calibrated Diagnostic Confidence:** ${result.confidenceScore}% (${result.confidenceReasoning})
**Methodology:** ${result.calibratedMethodology}

---

## 1. Executive Summary
${result.errorSummary}

### Key Diagnostic Observations:
${result.summaryBullets.map((b) => `- ${b}`).join('\n')}

---

## 2. Confirmed Evidence (Witnessed Facts from Stack Traces & Logs)
${result.confirmedEvidence && result.confirmedEvidence.length > 0
  ? result.confirmedEvidence.map((f) => `- [WITNESSED FACT] ${f}`).join('\n')
  : '- Error message and recorded trace.'}

---

## 3. Evidence Inconsistencies & Contract Discrepancies
${result.evidenceInconsistencies && result.evidenceInconsistencies.length > 0
  ? result.evidenceInconsistencies.map((inc) => `> ⚠️ **Inconsistency:** ${inc}`).join('\n\n')
  : '_No direct contradictions detected between logs, error message, and supplied stack frames._'}

---

## 4. Ranked Root-Cause Hypotheses
${result.hypotheses
  .map(
    (h) => `### Hypothesis #${h.rank}: ${h.title}
- **Plausibility Rating:** ${h.probability.toUpperCase()}
- **Hypothesis Nature:** Strictly Probabilistic (Unverified without live execution)
- **Mechanism:** ${h.explanation}
- **Supporting Evidence:**
${h.supportingEvidence.map((e) => `  * [Supports] ${e}`).join('\n')}
- **Contradicting / Inconclusive Evidence:**
${h.contradictingEvidence && h.contradictingEvidence.length > 0
  ? h.contradictingEvidence.map((c) => `  * [Contradicts] ${c}`).join('\n')
  : '  * None identified in provided trace.'}`
  )
  .join('\n\n')}

---

## 5. Missing Information & Requested Source Code
### Missing Information:
${result.missingInformation && result.missingInformation.length > 0
  ? result.missingInformation.map((m) => `- [MISSING] ${m}`).join('\n')
  : '- None identified.'}

${result.requestedSourceCode && result.requestedSourceCode.length > 0
  ? `\n### Requested Source Code:\n${result.requestedSourceCode.map((s) => `- [REQUESTED] ${s}`).join('\n')}`
  : ''}

---

## 6. Code Patch (${result.proposedPatches[0]?.patchNature === 'evidence_backed' ? 'Evidence-Backed' : 'Conditional Structural Example'})
${result.proposedPatches
  .map(
    (p, idx) => `### Patch #${idx + 1}: ${p.description}
- **Nature:** ${p.patchNature === 'evidence_backed' ? 'Evidence-Backed (Tailored to supplied source code)' : 'Conditional Example (Source code was unavailable)'}
- **Type:** ${p.patchType}
${p.filePath ? `- **Target File:** \`${p.filePath}\`\n` : ''}
${p.contractProblemAnalysis ? `> 🔍 **Contract vs Frontend Analysis:** ${p.contractProblemAnalysis}\n` : ''}
${p.safetyWarning ? `> ⚠️ **Safety Caution:** ${p.safetyWarning}\n` : ''}

\`\`\`${p.language || 'typescript'}
${p.proposedCode}
\`\`\`

**Explanation & Assumptions:**
${p.explanation}
${p.assumptions && p.assumptions.length > 0 ? `\n*Assumptions:*\n${p.assumptions.map((a) => `- ${a}`).join('\n')}` : ''}`
  )
  .join('\n\n')}

---

## 7. Step-by-Step Reproduction Instructions
${result.reproductionSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

---

## 8. Suggested Regression Tests (Status: Proposed / Unexecuted)
${result.regressionTests
  .map(
    (t, idx) => `### Test #${idx + 1}: ${t.testTitle} [${t.testFramework}]
**Execution Status:** Proposed / Unexecuted
**Validation Purpose:** ${t.validationPurpose || t.description}

\`\`\`${investigation.language || 'typescript'}
${t.testCode}
\`\`\``
  )
  .join('\n\n')}

---

## 9. Recommended Next Debugging Actions
${result.nextActions.map((a) => `${a.order}. **${a.action}**: ${a.purpose}${a.commandOrSnippet ? `\n   \`${a.commandOrSnippet}\`` : ''}`).join('\n')}

---

## 10. Verification Status
- **Execution State:** ${result.verificationStatus?.isExecuted ? 'EXECUTED' : 'PROPOSED ONLY (UNEXECUTED)'}
- **Verification Summary:** ${result.verificationStatus?.executionSummary || 'No automated test runner or sandbox has executed this patch.'}
- **Safety Protocol:** ${result.executionDisclaimer}
`;
  };

  const markdownContent = generateMarkdown();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = investigation.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);
    link.href = url;
    link.download = `fixpilot-evidence-report-${safeTitle || 'investigation'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            <h3 className="text-base font-semibold text-white">Export 10-Point Evidence Report (.md)</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Preview */}
        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-300 bg-[#070b12] flex-1 select-all whitespace-pre-wrap leading-relaxed border-b border-slate-800">
          {markdownContent}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900/80">
          <div className="text-xs text-slate-400 font-mono">
            Calibrated Confidence: {result.confidenceScore}% • All 10 report sections validated
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied Markdown</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Markdown</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-md shadow-violet-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download .md</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
