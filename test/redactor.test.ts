import assert from 'assert';
import { redactSensitiveData } from '../src/server/redactor.ts';

console.log('🔒 Running Server-Side Secret Redactor Security Unit Tests...\n');

let assertionCount = 0;
function check(condition: boolean, msg: string) {
  assert(condition, msg);
  assertionCount++;
  console.log(`  ✔ ${msg}`);
}

// ================= TEST CASE 1: AWS Access Keys & Secrets =================
console.log('▶ Test 1: AWS Access Key and Secret Key Redaction');

// Synthetic dummy test patterns (never print or use real production credentials)
const testAwsAccessKey = 'AKIA' + 'IOSFODNN7EXAMPLE';
const testAwsTempKey = 'ASIA' + 'VXZ7EXAMPLEABC12';
const testAwsSecret = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

const awsInput = `Config loaded from environment:
AWS_ACCESS_KEY_ID=${testAwsAccessKey}
AWS_SESSION_TOKEN=${testAwsTempKey}
aws_secret_access_key = ${testAwsSecret}
Deployment to us-east-1 initiated.`;

const awsRedacted = redactSensitiveData(awsInput);

check(!awsRedacted.text.includes(testAwsAccessKey), 'AWS long-term access key is scrubbed');
check(!awsRedacted.text.includes(testAwsTempKey), 'AWS temporary access key is scrubbed');
check(!awsRedacted.text.includes(testAwsSecret), 'AWS secret access key is scrubbed');
check(awsRedacted.text.includes('[REDACTED_AWS_ACCESS_KEY]'), 'AWS access key replacement token is present');
check(awsRedacted.text.includes('[REDACTED_AWS_SECRET_KEY]'), 'AWS secret key replacement token is present');
check(awsRedacted.detectedTypes.includes('AWS Access Key'), 'Detected types list includes AWS Access Key');
check(awsRedacted.detectedTypes.includes('AWS Secret Key'), 'Detected types list includes AWS Secret Key');

// ================= TEST CASE 2: Private Key Blocks =================
console.log('\n▶ Test 2: Private Key Blocks (RSA, EC, Generic PEM)');

const syntheticRsaKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y7...SYNTHETIC_TEST_BLOCK_DATA...
-----END RSA PRIVATE KEY-----`;

const syntheticGenericKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD...SYNTHETIC...
-----END PRIVATE KEY-----`;

const pemInput = `Server initialization log:
Loaded TLS certificates:
${syntheticRsaKey}
Also loaded fallback service key:
${syntheticGenericKey}
Listening on port 443`;

const pemRedacted = redactSensitiveData(pemInput);

check(!pemRedacted.text.includes('SYNTHETIC_TEST_BLOCK_DATA'), 'RSA Private key content scrubbed');
check(!pemRedacted.text.includes('SYNTHETIC...'), 'Generic Private key content scrubbed');
check(pemRedacted.text.includes('[REDACTED_PRIVATE_KEY_BLOCK]'), 'Private key block token inserted');
check(pemRedacted.text.includes('Listening on port 443'), 'Surrounding log text is preserved');

// ================= TEST CASE 3: Bearer Tokens & Raw JWTs =================
console.log('\n▶ Test 3: Bearer Authorization Tokens and Raw JWTs');

const syntheticJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IlRlc3RVc2VyIn0.dozGz_SYNTHETIC_SIGNATURE_HERE_ABC123456';
const authLog = `HTTP 401 Unauthorized request received:
Authorization: Bearer ${syntheticJwt}
Secondary header: Cookie: session_jwt=${syntheticJwt}`;

const authRedacted = redactSensitiveData(authLog);

check(!authRedacted.text.includes('SYNTHETIC_SIGNATURE'), 'JWT payload and signature scrubbed');
check(authRedacted.text.includes('Bearer [REDACTED_BEARER_TOKEN]'), 'Bearer token placeholder inserted');
check(authRedacted.detectedTypes.includes('Bearer Token'), 'Bearer Token detected in audit log');

// ================= TEST CASE 4: Passwords & Connection Strings =================
console.log('\n▶ Test 4: Passwords in Connection Strings & JSON Payloads');

const testDbPass = 'SuperSecretDbPass#987!';
const testJsonPass = 'AdminSecret2026!';
const dbLog = `[Connection] Connecting to:
mongodb+srv://admin_user:${testDbPass}@production.cluster0.mongodb.net/app_db
postgresql://postgres:${testDbPass}@db.internal:5432/core
Payload: {"user": "admin", "password": "${testJsonPass}", "auth_token": "token123456789"}`;

const dbRedacted = redactSensitiveData(dbLog);

check(!dbRedacted.text.includes(testDbPass), 'Mongo/Postgres password scrubbed from connection URLs');
check(!dbRedacted.text.includes(testJsonPass), 'JSON password field scrubbed');
check(dbRedacted.text.includes('[REDACTED_DB_PASSWORD]'), 'Database password placeholder inserted');
check(dbRedacted.text.includes('[REDACTED_SECRET]'), 'Secret assignment placeholder inserted');

// ================= TEST CASE 5: API Keys (OpenAI, Google, GitHub, Generic) =================
console.log('\n▶ Test 5: API Keys (OpenAI, Google, GitHub, Generic)');

const openAiKey = 'sk-proj-ABC1234567890abcdefghijklmnopqrstuvwxyz1234567890';
const googleKey = 'AIzaSyA1234567890abcdefghijklmnopqrstuv';
const githubKey = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz12';
const genericKey = 'api_key: "abc123xyz789sec0011223344"';

const apiInput = `Environment check:
OPENAI_API_KEY=${openAiKey}
GOOGLE_API_KEY=${googleKey}
GITHUB_TOKEN=${githubKey}
Config: ${genericKey}`;

const apiRedacted = redactSensitiveData(apiInput);

check(!apiRedacted.text.includes(openAiKey), 'OpenAI key scrubbed');
check(!apiRedacted.text.includes(googleKey), 'Google API key scrubbed');
check(!apiRedacted.text.includes(githubKey), 'GitHub token scrubbed');
check(apiRedacted.text.includes('[REDACTED_OPENAI_KEY]'), 'OpenAI placeholder present');
check(apiRedacted.text.includes('[REDACTED_GOOGLE_API_KEY]'), 'Google API key placeholder present');
check(apiRedacted.text.includes('[REDACTED_GITHUB_TOKEN]'), 'GitHub token placeholder present');

// ================= TEST CASE 6: Ordinary Text Preservation (Negative Test) =================
console.log('\n▶ Test 6: Ordinary Technical Text Preservation (Zero Over-Scrubbing)');

const ordinaryInput = `Normal application log:
User navigated to the password reset page.
Secret Santa feature completed in sprint 12.
Database column is_active is boolean, not null.
Calling akianService.processRequest() for client ID 42.
The key takeaway from the sprint review is improving uptime.
API endpoint /api/v1/users returned HTTP 200 OK.`;

const ordinaryRedacted = redactSensitiveData(ordinaryInput);

check(ordinaryRedacted.redactionsCount === 0, 'No redactions triggered on ordinary text');
check(ordinaryRedacted.text === ordinaryInput, 'Ordinary text was 100% preserved byte-for-byte');

console.log(`\n🎉 Redactor Security Suite Passed! (${assertionCount} assertions verified)\n`);
