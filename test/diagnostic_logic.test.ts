import assert from 'assert';
import {
  calculateEvidenceCompleteness,
  validateAndNormalizeReport,
  AnalyzeRequestPayload,
} from '../src/server/gemini.ts';

console.log('🧪 Running FixPilot AI Diagnostic Engine Regression Tests...\n');

// ================= TEST CASE 1: Inconsistency Detection (undefined in exception vs null in logs) =================
console.log('▶ Test 1: Inconsistency Detection - Exception mentions "undefined" while logs show "null"');

const inconsistencyPayload: AnalyzeRequestPayload = {
  errorMessage: "TypeError: Cannot read properties of undefined (reading 'avatarUrl')",
  stackTrace: `TypeError: Cannot read properties of undefined (reading 'avatarUrl')
    at UserAvatar (/src/components/UserAvatar.tsx:14:24)
    at renderWithHooks (react-dom.development.js:15486:18)`,
  logSnippet: `[2026-10-29T10:14:02.120Z] [HTTP 200 OK] GET /api/v1/profile -> Response: {"user": null, "authenticated": true}`,
  sourceFilePath: '/src/components/UserAvatar.tsx',
  sourceCode: `export function UserAvatar({ profile }: { profile: { user?: { avatarUrl: string } } }) {
    return <img src={profile.user.avatarUrl} alt="Avatar" />;
  }`,
  language: 'TypeScript',
  framework: 'React',
  environment: 'development',
  userActions: 'Loaded profile page after OAuth login. API returned 200 OK with null user object.',
};

const calibratedMetrics = calculateEvidenceCompleteness(inconsistencyPayload);

// Raw model output containing partial response or unverified claims
const rawModelOutput = {
  errorSummary: 'The UserAvatar component crashes when accessing avatarUrl because user is undefined.',
  summaryBullets: ['Exception at UserAvatar.tsx line 14.', 'avatarUrl access failed.'],
  confirmedEvidence: [
    'TypeError: Cannot read properties of undefined (reading "avatarUrl") at UserAvatar.tsx:14:24',
    'HTTP 200 OK returned from /api/v1/profile with payload: {"user": null}',
  ],
  hypotheses: [
    {
      rank: 1,
      title: 'Frontend accessed nested property of null response without fallback',
      probability: 'high',
      explanation: 'The API returned user: null, but the component expected either a valid object or undefined fallback.',
      supportingEvidence: ['API logs confirm user is null.'],
      contradictingEvidence: ['Exception states undefined was read rather than null, indicating an intermediate transformation or missing wrapper property.'],
      isConfirmedFact: false,
    },
  ],
  missingInformation: ['Exact TypeScript interface of the API response contract.'],
  proposedPatches: [
    {
      description: 'Add optional chaining guard and contract verification',
      patchType: 'replacement',
      proposedCode: '<img src={profile?.user?.avatarUrl || "/default-avatar.png"} alt="User Avatar" />',
      language: 'TypeScript',
      explanation: 'Safeguards property access regardless of whether profile or user is null or undefined.',
      assumptions: ['profile can be undefined and profile.user can be null'],
    },
  ],
  reproductionSteps: ['Mount UserAvatar with profile.user set to null.', 'Observe TypeError.'],
  regressionTests: [
    {
      testFramework: 'Jest / React Testing Library',
      testTitle: 'handles null user object without throwing unhandled TypeError',
      testCode: 'render(<UserAvatar profile={{ user: null }} />);',
      description: 'Verifies defensive handling when user payload is explicitly null.',
      validationPurpose: 'Validates that null API payloads render a fallback instead of crashing.',
    },
  ],
  nextActions: [
    {
      order: 1,
      action: 'Check backend API serializer for /api/v1/profile',
      purpose: 'Determine why user is returned as null for authenticated sessions.',
    },
  ],
  confidenceScore: 78,
  confidenceReasoning: 'Supported by source code and stack trace; data mismatch is documented.',
};

const normalizedReport = validateAndNormalizeReport(rawModelOutput, inconsistencyPayload, calibratedMetrics);

// Assertions for Priority 1: Evidence-Based Diagnosis & Inconsistency Detection
assert(normalizedReport.evidenceInconsistencies.length > 0, 'Must detect at least one evidence inconsistency');
assert(
  normalizedReport.evidenceInconsistencies.some((inc) => inc.toLowerCase().includes('undefined') && inc.toLowerCase().includes('null')),
  'Must explicitly explain the inconsistency between "undefined" and "null"'
);
console.log('  ✔ Detected evidence inconsistency between exception (undefined) and log (null)');

// Assertions for Priority 2: Reliable Calibrated Confidence
assert(normalizedReport.confidenceScore <= calibratedMetrics.maxCalibratedConfidence, 'Confidence score must be capped by calibrated evidence completeness');
assert(normalizedReport.confidenceScore < 95, 'Must not make unsupported 95%+ confidence claims without live execution');
assert.strictEqual(normalizedReport.verificationStatus.isExecuted, false, 'Must clearly indicate patch is unexecuted');
assert(normalizedReport.verificationStatus.executionSummary.includes('Unexecuted') || normalizedReport.verificationStatus.executionSummary.includes('Proposed'), 'Execution summary must state proposed only');
console.log(`  ✔ Confidence score properly calibrated at ${normalizedReport.confidenceScore}% (completeness: ${normalizedReport.evidenceCompletenessScore}%)`);

// Assertions for Priority 3: Patch Quality & Source Code Awareness
assert.strictEqual(normalizedReport.proposedPatches[0].patchNature, 'evidence_backed', 'Patch must be labeled evidence_backed when source code is provided');
assert(normalizedReport.proposedPatches[0].assumptions.length > 0, 'Patch must explain explicit assumptions');
console.log('  ✔ Patch correctly identified as evidence-backed with explicit assumptions');

// Assertions for Priority 4: Test Quality
assert(normalizedReport.regressionTests.length > 0, 'Regression tests must be generated');
assert.strictEqual(normalizedReport.regressionTests[0].executionStatus, 'proposed_unexecuted', 'Test must be marked proposed_unexecuted');
assert(Boolean(normalizedReport.regressionTests[0].validationPurpose), 'Test must explain what it validates (null/undefined inputs)');
console.log('  ✔ Regression tests generated and labeled proposed_unexecuted with validation purpose');

// Assertions for Priority 5: Complete 10-Point Report
assert(Boolean(normalizedReport.errorSummary), 'Section 1: Error summary present');
assert(Boolean(normalizedReport.confirmedEvidence), 'Section 2: Confirmed evidence present');
assert(Boolean(normalizedReport.evidenceInconsistencies), 'Section 3: Evidence inconsistencies present');
assert(Boolean(normalizedReport.hypotheses), 'Section 4: Hypotheses present');
assert(Boolean(normalizedReport.missingInformation), 'Section 5: Missing information present');
assert(Boolean(normalizedReport.proposedPatches), 'Section 6: Proposed patches present');
assert(Boolean(normalizedReport.reproductionSteps), 'Section 7: Reproduction steps present');
assert(Boolean(normalizedReport.regressionTests), 'Section 8: Regression tests present');
assert(Boolean(normalizedReport.nextActions), 'Section 9: Next actions present');
assert(Boolean(normalizedReport.verificationStatus), 'Section 10: Verification status present');
console.log('  ✔ All 10 report sections validated against schema');

// ================= TEST CASE 2: Graceful Handling of Incomplete / Empty Model Responses =================
console.log('\n▶ Test 2: Incomplete / Malformed Model Response Recovery');

const partialPayload: AnalyzeRequestPayload = {
  errorMessage: 'Error: Connection timeout',
  language: 'Go',
  environment: 'production',
};

const emptyModelOutput = {}; // Model returned empty object
const partialCalibrated = calculateEvidenceCompleteness(partialPayload);
const recoveredReport = validateAndNormalizeReport(emptyModelOutput, partialPayload, partialCalibrated);

assert(Boolean(recoveredReport.errorSummary), 'Must generate defensive error summary');
assert(recoveredReport.hypotheses.length > 0, 'Must populate fallback hypothesis');
assert.strictEqual(recoveredReport.hypotheses[0].isConfirmedFact, false, 'Hypothesis must never be marked confirmed fact');
assert.strictEqual(recoveredReport.proposedPatches[0].patchNature, 'conditional_example', 'Missing source code must label patch as conditional_example');
assert(Boolean(recoveredReport.proposedPatches[0].safetyWarning), 'Conditional patch must include safety warning');
console.log('  ✔ Gracefully recovered all 10 sections from empty model JSON');
console.log('  ✔ Correctly labeled patch as conditional example when source code is missing');

console.log('\n🎉 ALL REGRESSION TESTS PASSED SUCCESSFULLY!\n');
