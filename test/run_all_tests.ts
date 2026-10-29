import { execSync } from 'child_process';

interface TestSuite {
  name: string;
  file: string;
}

const suites: TestSuite[] = [
  { name: 'Secret Redactor Security Unit Tests', file: 'test/redactor.test.ts' },
  { name: 'Word-Boundary Inconsistency Detection Tests', file: 'test/inconsistency.test.ts' },
  { name: 'Distributed Rate Limiting & Fallback Tests', file: 'test/rate_limiter.test.ts' },
  { name: 'Diagnostic Engine & Report Schema Tests', file: 'test/diagnostic_logic.test.ts' },
  { name: 'HTTP Security, Payload Limits & User Isolation Tests', file: 'test/security_http.test.ts' },
];

console.log('====================================================');
console.log('🚀 FixPilot AI — Automated Production Test Suite');
console.log('====================================================\n');

let totalSuites = suites.length;
let passedSuites = 0;
let failedSuites = 0;

const startTime = Date.now();

for (const suite of suites) {
  console.log(`\n----------------------------------------------------`);
  console.log(`RUNNING: ${suite.name} (${suite.file})`);
  console.log(`----------------------------------------------------`);

  try {
    const output = execSync(`npx tsx ${suite.file}`, {
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 15000,
    });
    console.log(output);
    passedSuites++;
  } catch (err: any) {
    console.error(`❌ FAILED: ${suite.name}`);
    if (err.stdout) console.error(err.stdout.toString());
    if (err.stderr) console.error(err.stderr.toString());
    failedSuites++;
  }
}

const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

console.log('\n====================================================');
console.log('📊 TEST SUMMARY RESULTS');
console.log('====================================================');
console.log(`Total Suites:   ${totalSuites}`);
console.log(`Passed Suites:  ${passedSuites}`);
console.log(`Failed Suites:  ${failedSuites}`);
console.log(`Execution Time: ${durationSec}s`);

if (failedSuites > 0) {
  console.error('\n❌ SOME TEST SUITES FAILED. Exit code 1.');
  process.exit(1);
} else {
  console.log('\n✅ ALL TEST SUITES PASSED SUCCESSFULLY. Exit code 0.');
  process.exit(0);
}
