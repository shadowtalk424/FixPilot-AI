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
    return `# FixPilot AI Bug Investigation Report
**Title:** ${investigation.title}
**Date:** ${new Date(investigation.createdAt).toLocaleString()}
**Environment:** ${investigation.environment} | **Language:** ${investigation.language} ${investigation.framework ? `(${investigation.framework})` : ''}
**Diagnostic Confidence:** ${result.confidenceScore}% (${result.confidenceReasoning})

---

## 1. Executive Summary
${result.errorSummary}

### Key Observations:
${result.summaryBullets.map((b) => `- ${b}`).join('\n')}

---

## 2. Confirmed Facts vs. Probabilistic Hypotheses
### Confirmed Facts (Extracted from traces/logs):
${result.confirmedFacts.map((f) => `- [CONFIRMED] ${f}`).join('\n')}

### Ranked Root Cause Hypotheses:
${result.hypotheses
  .map(
    (h) => `#### #${h.rank}. ${h.title} [Probability: ${h.probability.toUpperCase()}]
- **Nature:** ${h.isConfirmedFact ? 'Confirmed Fact' : 'Investigative Hypothesis'}
- **Mechanism:** ${h.explanation}
- **Supporting Evidence:**
${h.supportingEvidence.map((e) => `  * ${e}`).join('\n')}`
  )
  .join('\n\n')}

${
  result.missingInformation && result.missingInformation.length > 0
    ? `\n### Missing Information for Full Certainty:
${result.missingInformation.map((m) => `- [MISSING] ${m}`).join('\n')}`
    : ''
}

---

## 3. Proposed Code Patch
${result.proposedPatches
  .map(
    (p, idx) => `### Patch #${idx + 1}: ${p.description}
${p.filePath ? `**Target File:** \`${p.filePath}\`\n` : ''}
${p.safetyWarning ? `> ⚠️ **Safety Caution:** ${p.safetyWarning}\n` : ''}
\`\`\`${p.language || 'typescript'}
${p.proposedCode}
\`\`\`
**Explanation:** ${p.explanation}`
  )
  .join('\n\n')}

---

## 4. Reproduction Instructions
${result.reproductionSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

---

## 5. Suggested Regression Tests
${result.regressionTests
  .map(
    (t) => `### ${t.testTitle} (${t.testFramework})
_${t.description}_

\`\`\`${investigation.language || 'typescript'}
${t.testCode}
\`\`\``
  )
  .join('\n\n')}

---

## 6. Recommended Next Debugging Actions
${result.nextActions.map((a) => `${a.order}. **${a.action}**: ${a.purpose}${a.commandOrSnippet ? `\n   \`${a.commandOrSnippet}\`` : ''}`).join('\n')}

---

> **Verification Notice:** ${result.executionDisclaimer}
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
    link.download = `fixpilot-report-${safeTitle || 'investigation'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-400" />
            <h3 className="text-base font-semibold text-white">Export Markdown Bug Report</h3>
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
          <div className="text-xs text-slate-400">
            Export ready • Markdown format (.md)
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied to clipboard</span>
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
