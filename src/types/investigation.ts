export interface RootCauseHypothesis {
  rank: number;
  title: string;
  probability: 'high' | 'medium' | 'low';
  explanation: string;
  supportingEvidence: string[];
  refutingEvidence?: string[];
  isConfirmedFact: boolean;
}

export interface ProposedPatch {
  filePath?: string;
  description: string;
  patchType: 'replacement' | 'diff' | 'config_update';
  originalSnippet?: string;
  proposedCode: string;
  language: string;
  explanation: string;
  safetyWarning?: string;
}

export interface RegressionTest {
  testFramework: string;
  testTitle: string;
  testCode: string;
  description: string;
}

export interface DebuggingAction {
  order: number;
  action: string;
  commandOrSnippet?: string;
  purpose: string;
}

export interface StructuredAnalysisResult {
  errorSummary: string;
  summaryBullets: string[];
  confidenceScore: number; // 0 to 100
  confidenceReasoning: string;
  confirmedFacts: string[];
  hypotheses: RootCauseHypothesis[];
  missingInformation: string[];
  proposedPatches: ProposedPatch[];
  reproductionSteps: string[];
  regressionTests: RegressionTest[];
  nextActions: DebuggingAction[];
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
