export interface RootCauseHypothesis {
  rank: number;
  title: string;
  probability: 'high' | 'medium' | 'low';
  explanation: string;
  supportingEvidence: string[];
  contradictingEvidence: string[];
  isConfirmedFact: false; // Crucial: A hypothesis is never a confirmed fact
}

export interface ProposedPatch {
  filePath?: string;
  description: string;
  patchType: 'replacement' | 'diff' | 'config_update';
  patchNature: 'evidence_backed' | 'conditional_example';
  contractProblemAnalysis?: string; // Distinguishes API contract problems from frontend defensive programming
  originalSnippet?: string;
  proposedCode: string;
  language: string;
  explanation: string;
  assumptions: string[];
  safetyWarning?: string;
}

export interface RegressionTest {
  testFramework: string;
  testTitle: string;
  testCode: string;
  description: string;
  validationPurpose: string; // Explains what test validates: normal behavior, null/undefined inputs, malformed responses, etc.
  executionStatus: 'proposed_unexecuted' | 'executed_passed' | 'executed_failed';
}

export interface DebuggingAction {
  order: number;
  action: string;
  commandOrSnippet?: string;
  purpose: string;
}

export interface VerificationStatus {
  isExecuted: boolean;
  executionSummary: string;
  runnerUsed?: string;
}

export interface StructuredAnalysisResult {
  // 1. Executive summary
  errorSummary: string;
  summaryBullets: string[];

  // 2. Confirmed evidence (strictly witnessed facts from logs/traces)
  confirmedEvidence: string[];

  // 3. Evidence inconsistencies (e.g. exception says undefined but log shows null)
  evidenceInconsistencies: string[];

  // 4. Ranked root-cause hypotheses with supporting and contradicting evidence
  hypotheses: RootCauseHypothesis[];

  // 5. Missing information & requested source code
  missingInformation: string[];
  requestedSourceCode?: string[];

  // 6. Conditional or evidence-backed code patch
  proposedPatches: ProposedPatch[];

  // 7. Reproduction instructions
  reproductionSteps: string[];

  // 8. Regression tests (labeled as proposed until actually executed)
  regressionTests: RegressionTest[];

  // 9. Next actions
  nextActions: DebuggingAction[];

  // 10. Verification status
  verificationStatus: VerificationStatus;

  // Calibrated confidence metrics
  evidenceCompletenessScore: number; // 0 - 100% based on calibrated scoring
  confidenceScore: number;
  confidenceReasoning: string;
  calibratedMethodology: string;

  // Safety & Redaction audit
  executionDisclaimer: string;
  secretsScrubbedCount?: number;
  redactedTypes?: string[];
}

export interface InvestigationData {
  id: string;
  userId: string;
  projectId?: string;
  projectName?: string;
  title: string;
  errorMessage: string;
  stackTrace?: string;
  logSnippet?: string;
  sourceCode?: string;
  sourceFilePath?: string;
  language: string;
  framework?: string;
  environment: 'development' | 'staging' | 'production' | 'ci_cd' | 'local' | 'other';
  userActions?: string;
  analysisResult?: StructuredAnalysisResult;
  status: 'active' | 'resolved' | 'archived';
  confidenceScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectData {
  id: string;
  userId: string;
  name: string;
  description?: string;
  defaultLanguage: string;
  defaultFramework?: string;
  defaultEnvironment?: string;
  investigationCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfileData {
  userId: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  tier: 'free' | 'pro' | 'team';
  dailyAnalysisLimit: number;
  analysesUsedToday: number;
  createdAt: string;
  updatedAt: string;
}
