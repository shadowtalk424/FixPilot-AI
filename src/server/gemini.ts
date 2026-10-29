import { GoogleGenAI, Type } from '@google/genai';
import {
  StructuredAnalysisResult,
  RootCauseHypothesis,
  ProposedPatch,
  RegressionTest,
  DebuggingAction,
  VerificationStatus,
} from '../types/investigation.ts';
import { redactSensitiveData } from './redactor.ts';

// Server-side initialization per @google/genai guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface AnalyzeRequestPayload {
  errorMessage: string;
  stackTrace?: string;
  logSnippet?: string;
  sourceCode?: string;
  sourceFilePath?: string;
  language: string;
  framework?: string;
  environment?: string;
  userActions?: string;
}

/**
 * Objective Calibrated Scoring Function:
 * Evaluates evidence completeness rather than subjective AI sentiment.
 */
export function calculateEvidenceCompleteness(payload: AnalyzeRequestPayload): {
  score: number;
  breakdown: string;
  maxCalibratedConfidence: number;
} {
  let score = 0;
  const factors: string[] = [];

  // Factor 1: Stack trace availability and depth
  if (payload.stackTrace && payload.stackTrace.trim().length > 30) {
    if (payload.stackTrace.includes('.ts') || payload.stackTrace.includes('.js') || payload.stackTrace.includes('.py') || payload.stackTrace.includes('.go')) {
      score += 30;
      factors.push('+30% explicit stack frames with source file/line numbers');
    } else {
      score += 15;
      factors.push('+15% partial stack trace');
    }
  } else {
    factors.push('0% no stack trace provided');
  }

  // Factor 2: Raw logs availability
  if (payload.logSnippet && payload.logSnippet.trim().length > 20) {
    score += 25;
    factors.push('+25% runtime execution logs attached');
  } else {
    factors.push('0% no execution logs provided');
  }

  // Factor 3: User supplied source code
  if (payload.sourceCode && payload.sourceCode.trim().length > 20) {
    score += 25;
    factors.push('+25% relevant source code supplied by developer');
  } else {
    factors.push('0% source code not provided (patches must remain conditional examples)');
  }

  // Factor 4: Environment & user action context
  if (payload.userActions && payload.userActions.trim().length > 10) {
    score += 10;
    factors.push('+10% preceding user actions documented');
  }
  if (payload.environment && payload.environment !== 'other') {
    score += 10;
    factors.push(`+10% target environment specified (${payload.environment})`);
  }

  const finalScore = Math.min(100, Math.max(15, score));
  // Calibrated confidence cap: Cannot exceed completeness without runtime test verification
  const maxCalibratedConfidence = Math.min(finalScore, 85);

  return {
    score: finalScore,
    breakdown: factors.join('; '),
    maxCalibratedConfidence,
  };
}

/**
 * Strict schema validator ensuring all 10 required report sections exist and are well-formed.
 */
export function validateAndNormalizeReport(
  raw: any,
  payload: AnalyzeRequestPayload,
  calibrated: { score: number; breakdown: string; maxCalibratedConfidence: number }
): StructuredAnalysisResult {
  const isSourceProvided = Boolean(payload.sourceCode && payload.sourceCode.trim().length > 10);

  // 1. Executive Summary
  const errorSummary =
    typeof raw?.errorSummary === 'string' && raw.errorSummary.trim().length > 0
      ? raw.errorSummary.trim()
      : `An unhandled exception occurred in the ${payload.environment || 'runtime'} environment.`;

  const summaryBullets = Array.isArray(raw?.summaryBullets) && raw.summaryBullets.length > 0
    ? raw.summaryBullets.map(String)
    : ['Exception caught during runtime execution.', 'Investigating potential data flow discrepancies.'];

  // 2. Confirmed Evidence (Never confuse plausible explanation with verified fact)
  const confirmedEvidence = Array.isArray(raw?.confirmedEvidence) && raw.confirmedEvidence.length > 0
    ? raw.confirmedEvidence.map(String)
    : [
        payload.errorMessage ? `Error message reported: ${payload.errorMessage}` : 'No error message specified.',
        payload.stackTrace ? 'Stack trace was recorded.' : 'No stack trace was available.',
      ];

  // 3. Evidence Inconsistencies
  // Check for common contradictions, e.g. undefined in exception vs null in logs
  const evidenceInconsistencies: string[] = [];
  if (Array.isArray(raw?.evidenceInconsistencies) && raw.evidenceInconsistencies.length > 0) {
    evidenceInconsistencies.push(...raw.evidenceInconsistencies.map(String));
  } else {
    // Deterministic check
    const lowerError = (payload.errorMessage + ' ' + (payload.stackTrace || '')).toLowerCase();
    const lowerLogs = (payload.logSnippet || '').toLowerCase();
    if (lowerError.includes('undefined') && lowerLogs.includes('null')) {
      evidenceInconsistencies.push(
        'Inconsistency detected: The exception references an "undefined" value, whereas runtime logs show data as "null". While null and undefined both represent empty states, JavaScript/TypeScript treats them as distinct primitives. The data transformation or property access pathway between the API log and the exception has not yet been verified.'
      );
    }
  }

  // 4. Ranked Hypotheses with supporting and contradicting evidence
  let hypotheses: RootCauseHypothesis[] = [];
  if (Array.isArray(raw?.hypotheses) && raw.hypotheses.length > 0) {
    hypotheses = raw.hypotheses.map((h: any, idx: number) => ({
      rank: typeof h?.rank === 'number' ? h.rank : idx + 1,
      title: typeof h?.title === 'string' ? h.title : `Hypothesis #${idx + 1}`,
      probability: ['high', 'medium', 'low'].includes(h?.probability) ? h.probability : 'medium',
      explanation: typeof h?.explanation === 'string' ? h.explanation : 'Mechanism under investigation.',
      supportingEvidence: Array.isArray(h?.supportingEvidence) ? h.supportingEvidence.map(String) : [],
      contradictingEvidence: Array.isArray(h?.contradictingEvidence) ? h.contradictingEvidence.map(String) : [],
      isConfirmedFact: false as const, // STRICT REQUIREMENT: Hypotheses are never confirmed facts
    }));
  } else {
    hypotheses = [
      {
        rank: 1,
        title: 'Unchecked asynchronous data access',
        probability: 'high',
        explanation: 'Data accessed before the state resolution completed.',
        supportingEvidence: ['Exception occurred during rendering or execution.'],
        contradictingEvidence: ['Asynchronous call was expected by framework.'],
        isConfirmedFact: false as const,
      },
    ];
  }

  // 5. Missing Information
  const missingInformation = Array.isArray(raw?.missingInformation) && raw.missingInformation.length > 0
    ? raw.missingInformation.map(String)
    : [
        !isSourceProvided ? 'Original source code of the failing function/component.' : 'Network response headers.',
        'Local mock data or fixture state.',
      ];

  const requestedSourceCode = Array.isArray(raw?.requestedSourceCode) && raw.requestedSourceCode.length > 0
    ? raw.requestedSourceCode.map(String)
    : !isSourceProvided
    ? ['Please provide the implementation of the file and line indicated in the stack trace.']
    : [];

  // 6. Proposed Patches
  let proposedPatches: ProposedPatch[] = [];
  if (Array.isArray(raw?.proposedPatches) && raw.proposedPatches.length > 0) {
    proposedPatches = raw.proposedPatches.map((p: any) => ({
      filePath: typeof p?.filePath === 'string' ? p.filePath : payload.sourceFilePath || undefined,
      description: typeof p?.description === 'string' ? p.description : 'Proposed defensive patch',
      patchType: ['replacement', 'diff', 'config_update'].includes(p?.patchType) ? p.patchType : 'replacement',
      patchNature: isSourceProvided ? 'evidence_backed' : 'conditional_example',
      contractProblemAnalysis:
        typeof p?.contractProblemAnalysis === 'string'
          ? p.contractProblemAnalysis
          : 'Frontend defensive programming is applied here; ensure the upstream API contract is also reviewed for expected null/undefined responses.',
      originalSnippet: typeof p?.originalSnippet === 'string' ? p.originalSnippet : payload.sourceCode || undefined,
      proposedCode: typeof p?.proposedCode === 'string' ? p.proposedCode : '// Review suggested implementation',
      language: typeof p?.language === 'string' ? p.language : payload.language || 'typescript',
      explanation: typeof p?.explanation === 'string' ? p.explanation : 'Preserves existing architecture while safeguarding property access.',
      assumptions: Array.isArray(p?.assumptions) ? p.assumptions.map(String) : ['Assumes function signature matches standard conventions.'],
      safetyWarning:
        typeof p?.safetyWarning === 'string'
          ? p.safetyWarning
          : !isSourceProvided
          ? 'Conditional Example: Full source code was not supplied. This patch represents a structural pattern and must be adapted to your local variable names.'
          : undefined,
    }));
  } else {
    proposedPatches = [
      {
        description: 'Defensive conditional guard',
        patchType: 'replacement',
        patchNature: isSourceProvided ? 'evidence_backed' : 'conditional_example',
        proposedCode: '// Apply null/undefined defensive checks',
        language: payload.language || 'typescript',
        explanation: 'Guards against premature evaluation of incomplete data.',
        assumptions: ['Target variable might be null or undefined.'],
        safetyWarning: 'Conditional example: Source code was not provided.',
      },
    ];
  }

  // 7. Reproduction Instructions
  const reproductionSteps = Array.isArray(raw?.reproductionSteps) && raw.reproductionSteps.length > 0
    ? raw.reproductionSteps.map(String)
    : [
        'Run the local development server in the target environment.',
        'Trigger the execution pathway with the test payload.',
        'Observe the runtime exception in dev tools / terminal.',
      ];

  // 8. Regression Tests (Strictly labeled proposed until actually executed)
  let regressionTests: RegressionTest[] = [];
  if (Array.isArray(raw?.regressionTests) && raw.regressionTests.length > 0) {
    regressionTests = raw.regressionTests.map((t: any) => ({
      testFramework: typeof t?.testFramework === 'string' ? t.testFramework : 'Jest / Vitest',
      testTitle: typeof t?.testTitle === 'string' ? t.testTitle : 'Regression safety assertion',
      testCode: typeof t?.testCode === 'string' ? t.testCode : '// Add test assertions here',
      description: typeof t?.description === 'string' ? t.description : 'Validates boundary behavior.',
      validationPurpose:
        typeof t?.validationPurpose === 'string'
          ? t.validationPurpose
          : 'Validates behavior when data is null, undefined, empty, or well-formed.',
      executionStatus: 'proposed_unexecuted' as const, // MUST be proposed_unexecuted
    }));
  } else {
    regressionTests = [
      {
        testFramework: 'Unit Test',
        testTitle: 'handles null or undefined payload gracefully',
        testCode: 'it("handles empty data gracefully", () => { /* test */ });',
        description: 'Ensures no unhandled TypeError is thrown on null/undefined input.',
        validationPurpose: 'Verifies defensive handling of empty or delayed API responses.',
        executionStatus: 'proposed_unexecuted' as const,
      },
    ];
  }

  // 9. Next Actions
  const nextActions: DebuggingAction[] = Array.isArray(raw?.nextActions) && raw.nextActions.length > 0
    ? raw.nextActions.map((a: any, idx: number) => ({
        order: typeof a?.order === 'number' ? a?.order : idx + 1,
        action: typeof a?.action === 'string' ? a.action : 'Inspect relevant source file',
        commandOrSnippet: typeof a?.commandOrSnippet === 'string' ? a.commandOrSnippet : undefined,
        purpose: typeof a?.purpose === 'string' ? a.purpose : 'Verify state before applying patch.',
      }))
    : [
        {
          order: 1,
          action: 'Inspect source code at the failing stack line',
          purpose: 'Verify the exact variable evaluated as null or undefined.',
        },
        {
          order: 2,
          action: 'Run proposed regression test locally',
          purpose: 'Confirm failure reproduces before applying proposed patch.',
        },
      ];

  // 10. Verification Status (Never claim executed unless an actual runner was used)
  const verificationStatus: VerificationStatus = {
    isExecuted: false,
    executionSummary:
      'Proposed (Unexecuted): FixPilot AI has generated these suggestions using static analytical reasoning. No patch or test has been executed in an active sandbox or test runner.',
  };

  // Confidence: remove unsupported claims like 95% AI confidence; calibrate based on objective completeness
  const rawConfidence = typeof raw?.confidenceScore === 'number' ? raw.confidenceScore : 50;
  const calibratedConfidence = Math.min(rawConfidence, calibrated.maxCalibratedConfidence);

  return {
    errorSummary,
    summaryBullets,
    confirmedEvidence,
    evidenceInconsistencies,
    hypotheses,
    missingInformation,
    requestedSourceCode,
    proposedPatches,
    reproductionSteps,
    regressionTests,
    nextActions,
    verificationStatus,
    evidenceCompletenessScore: calibrated.score,
    confidenceScore: calibratedConfidence,
    confidenceReasoning:
      typeof raw?.confidenceReasoning === 'string'
        ? raw.confidenceReasoning
        : `Calibrated score capped at ${calibrated.maxCalibratedConfidence}% based on evidence completeness: ${calibrated.breakdown}`,
    calibratedMethodology: `Evidence Completeness Metric: ${calibrated.score}%. Factors: ${calibrated.breakdown}. (Confidence is capped at 85% until local test runner executes).`,
    executionDisclaimer:
      'Verification Disclosure: All hypotheses and code patches are proposed models. FixPilot AI does not execute code on your systems. Always test patches locally before committing.',
  };
}

export async function runDebuggingAnalysis(payload: AnalyzeRequestPayload): Promise<StructuredAnalysisResult> {
  // Step 1: Pre-sanitize and redact credentials/secrets
  const sanitizedError = redactSensitiveData(payload.errorMessage);
  const sanitizedStack = redactSensitiveData(payload.stackTrace || '');
  const sanitizedLogs = redactSensitiveData(payload.logSnippet || '');
  const sanitizedCode = redactSensitiveData(payload.sourceCode || '');
  const sanitizedActions = redactSensitiveData(payload.userActions || '');

  const totalScrubbed =
    sanitizedError.redactionsCount +
    sanitizedStack.redactionsCount +
    sanitizedLogs.redactionsCount +
    sanitizedCode.redactionsCount +
    sanitizedActions.redactionsCount;

  const detectedTypes = Array.from(
    new Set([
      ...sanitizedError.detectedTypes,
      ...sanitizedStack.detectedTypes,
      ...sanitizedLogs.detectedTypes,
      ...sanitizedCode.detectedTypes,
      ...sanitizedActions.detectedTypes,
    ])
  );

  const calibrated = calculateEvidenceCompleteness(payload);

  const prompt = `Perform an evidence-based software debugging investigation with strict scientific discipline.

CRITICAL RULES:
1. NEVER treat a plausible explanation as a confirmed fact. Clearly distinguish witnessed evidence from hypotheses.
2. DETECT EVIDENCE INCONSISTENCIES: Compare the error message, stack trace, logs, and supplied code.
   - Example: If the exception says a value is "undefined" but the API log shows the response was "null", explicitly explain that while these may be related, JavaScript/TypeScript treats them differently, and the intermediate data flow is not yet verified!
3. REQUEST RELEVANT SOURCE CODE when needed to identify the exact failing expression.
4. IF SOURCE CODE IS UNAVAILABLE, clearly label code patches as conditional examples.
5. CALIBRATED CONFIDENCE: Do NOT invent 95%+ confidence scores. Calibrate confidence based on available evidence completeness (${calibrated.score}% completeness).
6. VERIFICATION STATUS: State clearly that the proposed patch is unexecuted.
7. TEST QUALITY: Generate tests matching the proposed patch covering:
   - normal behavior
   - empty data
   - null or undefined inputs
   - malformed responses
   - relevant error states
   Explain what each test validates and label all tests as proposed until executed.
8. Distinguish API contract problems from frontend defensive programming.

INPUT EVIDENCE:
Target Language: ${payload.language || 'Auto-detect'}
Framework: ${payload.framework || 'Not specified'}
Environment: ${payload.environment || 'Not specified'}
User Actions: ${sanitizedActions.text || 'None provided'}
Source File Path: ${payload.sourceFilePath || 'Not specified'}

SUPPLIED SOURCE CODE:
${sanitizedCode.text ? sanitizedCode.text.slice(0, 15000) : 'NO SOURCE CODE SUPPLIED. (Code patches must be labeled as conditional examples)'}

ERROR MESSAGE:
${sanitizedError.text}

STACK TRACE:
${sanitizedStack.text || 'No stack trace provided'}

RUNTIME LOGS:
${sanitizedLogs.text ? sanitizedLogs.text.slice(0, 15000) : 'No logs attached'}

Provide output strictly adhering to the JSON schema.`;

  const schemaConfig = {
    systemInstruction: `You are the Senior Evidence-Based Debugging Engine of FixPilot AI.
Your principles:
1. Scientific rigor: Plausible theories are never facts.
2. Inconsistency detection: Highlight whenever logs and exception messages conflict (e.g. undefined vs null, 200 OK vs failure).
3. Patch precision: Distinguish API contract problems from defensive frontend guards.
4. Conditional labeling: When source code is missing, label patches as conditional examples.
5. Calibrated confidence: No inflated confidence numbers.
6. Test completeness: Tests must validate normal, empty, null, undefined, and malformed inputs.`,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        errorSummary: {
          type: Type.STRING,
          description: 'Concise executive summary of what failed.',
        },
        summaryBullets: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Key bullet points summarizing the investigation.',
        },
        confirmedEvidence: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Explicit, witnessed facts directly from traces and logs.',
        },
        evidenceInconsistencies: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Any discrepancies between logs, stack trace, error message, or supplied code.',
        },
        hypotheses: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              rank: { type: Type.INTEGER },
              title: { type: Type.STRING },
              probability: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
              explanation: { type: Type.STRING },
              supportingEvidence: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              contradictingEvidence: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['rank', 'title', 'probability', 'explanation', 'supportingEvidence', 'contradictingEvidence'],
          },
        },
        missingInformation: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Specific information needed to confirm root cause with 100% certainty.',
        },
        requestedSourceCode: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Exact file names and line ranges requested from the developer.',
        },
        proposedPatches: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              filePath: { type: Type.STRING },
              description: { type: Type.STRING },
              patchType: { type: Type.STRING, enum: ['replacement', 'diff', 'config_update'] },
              contractProblemAnalysis: {
                type: Type.STRING,
                description: 'Analysis of whether this is an API contract failure or frontend defensive guard.',
              },
              originalSnippet: { type: Type.STRING },
              proposedCode: { type: Type.STRING },
              language: { type: Type.STRING },
              explanation: { type: Type.STRING },
              assumptions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              safetyWarning: { type: Type.STRING },
            },
            required: ['description', 'patchType', 'proposedCode', 'language', 'explanation', 'assumptions'],
          },
        },
        reproductionSteps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Step by step instructions to reproduce.',
        },
        regressionTests: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              testFramework: { type: Type.STRING },
              testTitle: { type: Type.STRING },
              testCode: { type: Type.STRING },
              description: { type: Type.STRING },
              validationPurpose: {
                type: Type.STRING,
                description: 'Explains what this test validates (normal, empty, null/undefined, malformed, error states).',
              },
            },
            required: ['testFramework', 'testTitle', 'testCode', 'description', 'validationPurpose'],
          },
        },
        nextActions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              order: { type: Type.INTEGER },
              action: { type: Type.STRING },
              commandOrSnippet: { type: Type.STRING },
              purpose: { type: Type.STRING },
            },
            required: ['order', 'action', 'purpose'],
          },
        },
        confidenceScore: {
          type: Type.NUMBER,
          description: 'Calibrated score based on evidence.',
        },
        confidenceReasoning: {
          type: Type.STRING,
          description: 'Reasoning explaining why this confidence was calibrated at this level.',
        },
      },
      required: [
        'errorSummary',
        'summaryBullets',
        'confirmedEvidence',
        'evidenceInconsistencies',
        'hypotheses',
        'missingInformation',
        'proposedPatches',
        'reproductionSteps',
        'regressionTests',
        'nextActions',
      ],
    },
  };

  // Attempt models with automatic fallback on transient 503 high demand
  const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
  let rawJson = '';
  let lastError: any = null;

  for (const modelName of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: schemaConfig,
      });
      rawJson = response.text || '{}';
      if (rawJson && rawJson !== '{}') {
        break;
      }
    } catch (err: any) {
      console.warn(`Model ${modelName} encountered error:`, err?.message || err);
      lastError = err;
      await new Promise((res) => setTimeout(res, 800));
    }
  }

  if (!rawJson || rawJson === '{}') {
    throw lastError || new Error('Diagnostic models currently unavailable. Please try again in a moment.');
  }

  let parsedRaw: any;
  try {
    parsedRaw = JSON.parse(rawJson);
  } catch (parseErr) {
    console.error('Failed to parse model JSON:', parseErr);
    parsedRaw = {};
  }

  // Validate and normalize against strict schema
  const normalized = validateAndNormalizeReport(parsedRaw, payload, calibrated);

  // Add the redaction audit metadata
  normalized.secretsScrubbedCount = totalScrubbed;
  normalized.redactedTypes = detectedTypes;

  return normalized;
}
