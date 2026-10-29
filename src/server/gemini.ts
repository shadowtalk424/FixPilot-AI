import { GoogleGenAI, Type } from '@google/genai';
import { StructuredAnalysisResult } from '../types/investigation.ts';
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
  language: string;
  framework?: string;
  environment?: string;
  userActions?: string;
}

export async function runDebuggingAnalysis(payload: AnalyzeRequestPayload): Promise<StructuredAnalysisResult> {
  // Step 1: Pre-sanitize and redact credentials/secrets
  const sanitizedError = redactSensitiveData(payload.errorMessage);
  const sanitizedStack = redactSensitiveData(payload.stackTrace || '');
  const sanitizedLogs = redactSensitiveData(payload.logSnippet || '');
  const sanitizedActions = redactSensitiveData(payload.userActions || '');

  const totalScrubbed =
    sanitizedError.redactionsCount +
    sanitizedStack.redactionsCount +
    sanitizedLogs.redactionsCount +
    sanitizedActions.redactionsCount;

  const detectedTypes = Array.from(
    new Set([
      ...sanitizedError.detectedTypes,
      ...sanitizedStack.detectedTypes,
      ...sanitizedLogs.detectedTypes,
      ...sanitizedActions.detectedTypes,
    ])
  );

  const prompt = `Analyze this software debugging case thoroughly and provide structured output.

TARGET CONTEXT:
Language: ${payload.language || 'Auto-detect / Not specified'}
Framework/Library: ${payload.framework || 'Not specified'}
Environment: ${payload.environment || 'Not specified'}
User Actions Leading to Error: ${sanitizedActions.text || 'None provided'}

ERROR MESSAGE / EXCEPTION:
${sanitizedError.text}

STACK TRACE:
${sanitizedStack.text || 'No stack trace provided'}

ATTACHED LOG SNIPPET:
${sanitizedLogs.text ? sanitizedLogs.text.slice(0, 15000) : 'No additional logs attached'}

DIAGNOSTIC REQUIREMENTS:
1. Provide a plain-language summary of what broke and why.
2. Formulate 2 to 4 ranked root causes. Clearly indicate whether evidence constitutes a confirmed fact or a hypothesis.
3. List explicit evidence supporting each root cause hypothesis.
4. List missing information that would increase diagnostic confidence (e.g., config files, DB state, network payload).
5. Provide actionable proposed code patches with file hints and explanatory comments.
6. Provide clear reproduction steps.
7. Provide regression test code snippets.
8. Provide immediate next debugging steps for the developer.
9. Estimate a diagnostic confidence score between 10 and 98 percent based on available evidence.
10. Remind the developer that FixPilot AI proposes patches that must be verified by local test suites.`;

  const schemaConfig = {
    systemInstruction: `You are the lead engineering diagnostic engine of FixPilot AI. 
You specialize in deep root-cause debugging across languages (TypeScript/JS, Python, Go, Rust, Java, C#, PHP, Ruby, etc.).
Rigorous rules:
1. Never pretend a test was executed; you are generating proposed fixes.
2. Distinguish confirmed facts (traceable from stack frames, explicit error codes) from hypotheses.
3. Highlight missing info if logs or code context are truncated.
4. All code in patches and tests must be syntactically valid and modern.`,
    responseMimeType: 'application/json',
    responseSchema: {
      type: Type.OBJECT,
      properties: {
        errorSummary: {
          type: Type.STRING,
          description: 'Clear, concise 2-3 sentence explanation of the error suitable for developers.',
        },
        summaryBullets: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: '3-4 key bullet points highlighting what occurred.',
        },
        confidenceScore: {
          type: Type.NUMBER,
          description: 'Confidence percentage from 1 to 100 based on clarity of logs and trace.',
        },
        confidenceReasoning: {
          type: Type.STRING,
          description: 'Why this confidence score was assigned.',
        },
        confirmedFacts: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'List of undeniable facts extracted directly from the logs/trace.',
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
              refutingEvidence: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              isConfirmedFact: { type: Type.BOOLEAN },
            },
            required: ['rank', 'title', 'probability', 'explanation', 'supportingEvidence', 'isConfirmedFact'],
          },
        },
        missingInformation: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'What files or context would be needed to reach 100% certainty.',
        },
        proposedPatches: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              filePath: { type: Type.STRING },
              description: { type: Type.STRING },
              patchType: { type: Type.STRING, enum: ['replacement', 'diff', 'config_update'] },
              originalSnippet: { type: Type.STRING },
              proposedCode: { type: Type.STRING },
              language: { type: Type.STRING },
              explanation: { type: Type.STRING },
              safetyWarning: { type: Type.STRING },
            },
            required: ['description', 'patchType', 'proposedCode', 'language', 'explanation'],
          },
        },
        reproductionSteps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Step by step instructions to reliably trigger this bug.',
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
            },
            required: ['testFramework', 'testTitle', 'testCode', 'description'],
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
        executionDisclaimer: {
          type: Type.STRING,
          description: 'Mandatory disclaimer statement.',
        },
      },
      required: [
        'errorSummary',
        'summaryBullets',
        'confidenceScore',
        'confidenceReasoning',
        'confirmedFacts',
        'hypotheses',
        'missingInformation',
        'proposedPatches',
        'reproductionSteps',
        'regressionTests',
        'nextActions',
        'executionDisclaimer',
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
      // Brief sleep before trying next model candidate
      await new Promise((res) => setTimeout(res, 800));
    }
  }

  if (!rawJson || rawJson === '{}') {
    throw lastError || new Error('Diagnostic models currently unavailable. Please try again in a moment.');
  }

  const parsed = JSON.parse(rawJson) as StructuredAnalysisResult;

  // Add the redaction audit metadata
  parsed.secretsScrubbedCount = totalScrubbed;
  parsed.redactedTypes = detectedTypes;
  parsed.executionDisclaimer =
    parsed.executionDisclaimer ||
    'FixPilot AI generated this patch based on probabilistic diagnostic reasoning. This patch has NOT been executed in a live sandbox or verified by an automated test runner. Always review and run unit tests prior to deployment.';

  return parsed;
}
