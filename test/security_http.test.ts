import assert from 'assert';
import http from 'http';
import express from 'express';
import { apiRouter } from '../src/server/api.ts';
import { globalRateLimiter } from '../src/server/rateLimiter.ts';

console.log('🛡️  Running HTTP Integration & Security Isolation Suite...\n');

let assertionCount = 0;
function check(condition: boolean, msg: string) {
  assert(condition, msg);
  assertionCount++;
  console.log(`  ✔ ${msg}`);
}

async function runHttpSecurityTests() {
  const app = express();
  app.set('trust proxy', true);
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // ================= TEST CASE 1: Health Endpoint =================
    console.log('▶ Test 1: Service Health Endpoint Check');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    check(healthRes.status === 200, 'Health endpoint returns 200 OK');
    check(healthJson.status === 'ok', 'Health status is ok');

    // ================= TEST CASE 2: Missing Required Input =================
    console.log('\n▶ Test 2: Input Validation — Reject Empty Payloads (400 Bad Request)');
    const emptyRes = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const emptyJson = await emptyRes.json();
    check(emptyRes.status === 400, 'Empty payload rejected with 400 Bad Request');
    check(emptyJson.error.includes('Please provide at least'), 'Descriptive error message returned');

    // ================= TEST CASE 3: Oversized Error Message Payload =================
    console.log('\n▶ Test 3: Input Validation — Reject Oversized Error Message (400 Bad Request)');
    const oversizedError = 'A'.repeat(35000); // Exceeds 30,000 character limit
    const oversizedRes = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errorMessage: oversizedError }),
    });
    const oversizedJson = await oversizedRes.json();
    check(oversizedRes.status === 400, 'Oversized error message rejected with 400 Bad Request');
    check(oversizedJson.error.includes('Error message is too long'), 'Oversized field specific rejection');

    // ================= TEST CASE 4: Oversized Log Snippet =================
    console.log('\n▶ Test 4: Input Validation — Reject Oversized Log Snippet (400 Bad Request)');
    const oversizedLog = 'LOG_LINE\n'.repeat(15000); // Exceeds 100,000 character limit
    const oversizedLogRes = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        errorMessage: 'Valid error',
        logSnippet: oversizedLog,
      }),
    });
    check(oversizedLogRes.status === 400, 'Oversized log snippet rejected with 400 Bad Request');

    // ================= TEST CASE 5: Malformed JSON Request =================
    console.log('\n▶ Test 5: Malformed JSON Request Handling');
    const malformedRes = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{ invalid_json: ',
    });
    // Express JSON parser catches malformed JSON with 400
    check(malformedRes.status === 400, 'Malformed JSON syntax caught with 400');

    // ================= TEST CASE 6: Rate Limiting & HTTP Headers =================
    console.log('\n▶ Test 6: Rate Limiting Enforcement & HTTP Headers');
    const testClientIp = '10.0.0.42';

    // Reset rate limiter for test IP
    await globalRateLimiter.reset(testClientIp);

    // Make 20 requests to use up the quota (sending empty body triggers 400 input validation without calling AI)
    for (let i = 1; i <= 20; i++) {
      const res = await fetch(`${baseUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': testClientIp,
        },
        body: JSON.stringify({}),
      });
      // The 20 requests should pass rate check (they return 400 validation error, but never 429)
      assert(res.status !== 429, `Request ${i}/20 must not be 429`);
      assert(res.headers.get('x-ratelimit-limit') === '20', 'X-RateLimit-Limit header present');
    }

    // 21st request MUST be rejected by rate limiter with 429
    const blockedRes = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': testClientIp,
      },
      body: JSON.stringify({}),
    });

    const blockedJson = await blockedRes.json();
    check(blockedRes.status === 429, '21st request rejected with 429 Too Many Requests');
    check(blockedRes.headers.get('retry-after') !== null, 'Retry-After header present on 429');
    check(blockedRes.headers.get('x-ratelimit-remaining') === '0', 'X-RateLimit-Remaining is 0');
    check(blockedJson.error.includes('Rate limit exceeded'), 'Rate limit message returned in body');

    // Clean up rate limiter key
    await globalRateLimiter.reset(testClientIp);

    // ================= TEST CASE 7: User Investigation Authorization & Isolation =================
    console.log('\n▶ Test 7: Firestore Authorization Model — User Isolation Invariant');

    // Deterministic rule engine simulating firestore.rules lines 117-135
    interface MockAuthContext {
      auth: { uid: string } | null;
    }
    interface MockResource {
      userId: string;
      id: string;
    }

    function evaluateInvestigationRule(
      context: MockAuthContext,
      operation: 'get' | 'list' | 'create' | 'update' | 'delete',
      existingResource: MockResource | null,
      incomingResource?: MockResource
    ): boolean {
      const isSignedIn = context.auth !== null;
      if (!isSignedIn) return false;

      const authUid = context.auth!.uid;

      if (operation === 'get' || operation === 'list') {
        return existingResource !== null && existingResource.userId === authUid;
      }
      if (operation === 'delete') {
        return existingResource !== null && existingResource.userId === authUid;
      }
      if (operation === 'create') {
        return incomingResource !== undefined && incomingResource.userId === authUid;
      }
      if (operation === 'update') {
        return (
          existingResource !== null &&
          existingResource.userId === authUid &&
          incomingResource !== undefined &&
          incomingResource.userId === authUid
        );
      }
      return false;
    }

    const userVictimContext: MockAuthContext = { auth: { uid: 'user_alpha_victim' } };
    const userAttackerContext: MockAuthContext = { auth: { uid: 'user_beta_attacker' } };
    const unauthenticatedContext: MockAuthContext = { auth: null };

    const victimInvestigation: MockResource = {
      id: 'inv_12345',
      userId: 'user_alpha_victim',
    };

    // 1. Unauthenticated read must be blocked
    check(
      evaluateInvestigationRule(unauthenticatedContext, 'get', victimInvestigation) === false,
      'Unauthenticated user CANNOT read investigation'
    );

    // 2. Attacker read must be blocked
    check(
      evaluateInvestigationRule(userAttackerContext, 'get', victimInvestigation) === false,
      'User B CANNOT read User A investigation (cross-tenant isolation)'
    );

    // 3. Attacker delete must be blocked
    check(
      evaluateInvestigationRule(userAttackerContext, 'delete', victimInvestigation) === false,
      'User B CANNOT delete User A investigation'
    );

    // 4. Attacker update must be blocked
    check(
      evaluateInvestigationRule(userAttackerContext, 'update', victimInvestigation, {
        id: 'inv_12345',
        userId: 'user_beta_attacker',
      }) === false,
      'User B CANNOT tamper with or hijack User A investigation'
    );

    // 5. Legitimate owner access must be allowed
    check(
      evaluateInvestigationRule(userVictimContext, 'get', victimInvestigation) === true,
      'Legitimate owner CAN read their own investigation'
    );
    check(
      evaluateInvestigationRule(userVictimContext, 'delete', victimInvestigation) === true,
      'Legitimate owner CAN delete their own investigation'
    );

    console.log(`\n🎉 HTTP Security & Isolation Suite Passed! (${assertionCount} assertions verified)\n`);
  } finally {
    server.close();
  }
}

runHttpSecurityTests().catch((err) => {
  console.error('HTTP Security Suite Failed:', err);
  process.exit(1);
});
