import assert from 'assert';
import { detectEvidenceInconsistencies } from '../src/server/gemini.ts';

console.log('🔍 Running Word-Boundary Inconsistency Detection Positive & Negative Suite...\n');

let assertionCount = 0;
function check(condition: boolean, msg: string) {
  assert(condition, msg);
  assertionCount++;
  console.log(`  ✔ ${msg}`);
}

// ================= POSITIVE TEST CASES: Actual Inconsistencies =================
console.log('▶ Positive Tests: Genuine Inconsistencies (undefined in error vs genuine null in logs)');

const pos1 = detectEvidenceInconsistencies(
  "TypeError: Cannot read properties of undefined (reading 'avatar')",
  'at UserAvatar.tsx:14:24',
  'HTTP 200 OK -> Payload: {"user": null, "authenticated": true}'
);
check(pos1.length === 1, 'Positive 1: Detected JSON {"user": null} inconsistency against undefined exception');
check(pos1[0].includes('Inconsistency detected'), 'Positive 1: Inconsistency explanation generated');

const pos2 = detectEvidenceInconsistencies(
  "Uncaught TypeError: user is undefined",
  '',
  '[DEBUG] resolveUser() was called, returned null to caller'
);
check(pos2.length === 1, 'Positive 2: Detected "returned null" inconsistency against undefined exception');

const pos3 = detectEvidenceInconsistencies(
  "State transition failed: profile is undefined",
  'Component.tsx:50',
  'Cache lookup status: data = null'
);
check(pos3.length === 1, 'Positive 3: Detected "data = null" inconsistency against undefined exception');

// ================= NEGATIVE TEST CASES: False-Positive Guards =================
console.log('\n▶ Negative Tests: Avoid False Positives from Unrelated Words & Negated Nulls');

// Case 1: "nullable" word
const neg1 = detectEvidenceInconsistencies(
  "TypeError: Cannot read properties of undefined",
  '',
  'Database migration schema check: column profile_url is nullable in users table.'
);
check(neg1.length === 0, 'Negative 1: "nullable" does NOT trigger false inconsistency');

// Case 2: "null_terminator" word
const neg2 = detectEvidenceInconsistencies(
  "Buffer error: pointer is undefined",
  '',
  'Parsing binary buffer: string null_terminator reached at byte offset 128.'
);
check(neg2.length === 0, 'Negative 2: "null_terminator" does NOT trigger false inconsistency');

// Case 3: "nullpointer" in logs
const neg3 = detectEvidenceInconsistencies(
  "TypeError: Cannot read properties of undefined",
  '',
  'Spring service caught NullPointerException and mapped to custom error response.'
);
check(neg3.length === 0, 'Negative 3: "nullpointer" does NOT trigger false inconsistency');

// Case 4: Negated null ("not null" / "non-null")
const neg4 = detectEvidenceInconsistencies(
  "TypeError: Cannot read properties of undefined",
  '',
  'Validation passed: payload is not null and confirmed non-null object.'
);
check(neg4.length === 0, 'Negative 4: "not null" / "non-null" does NOT trigger false inconsistency');

// Case 5: Error without "undefined"
const neg5 = detectEvidenceInconsistencies(
  "SyntaxError: Unexpected token < in JSON at position 0",
  '',
  'HTTP 200 OK -> Response: {"user": null}'
);
check(neg5.length === 0, 'Negative 5: Error without "undefined" does NOT trigger false inconsistency');

// Case 6: Word containing "undefined" as a substring (e.g. "predefined")
const neg6 = detectEvidenceInconsistencies(
  "Error: Value does not match predefined constant list",
  '',
  'HTTP 200 OK -> Response: {"user": null}'
);
check(neg6.length === 0, 'Negative 6: "predefined" does NOT match word-boundary \\bundefined\\b');

console.log(`\n🎉 Inconsistency Detection Suite Passed! (${assertionCount} assertions verified)\n`);
