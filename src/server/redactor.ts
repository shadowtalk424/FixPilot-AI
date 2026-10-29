/**
 * Utility to scrub and redact sensitive information (secrets, API keys, JWTs, passwords)
 * from errors, logs, and stack traces before sending to AI or storing.
 */

interface RedactionResult {
  text: string;
  redactionsCount: number;
  detectedTypes: string[];
}

const REDACTION_PATTERNS: { name: string; regex: RegExp; replacement: string }[] = [
  // OpenAI / generic API keys
  { name: 'API Key', regex: /sk-[a-zA-Z0-9]{20,60}/gi, replacement: '[REDACTED_API_KEY]' },
  // Google / Firebase API keys
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z\-_]{35}/g, replacement: '[REDACTED_GOOGLE_API_KEY]' },
  // AWS Access Keys
  { name: 'AWS Access Key', regex: /AKIA[0-9A-Z]{16}/g, replacement: '[REDACTED_AWS_ACCESS_KEY]' },
  // AWS Secret Keys
  { name: 'AWS Secret Key', regex: /(aws_secret_access_key\s*[:=]\s*)[A-Za-z0-9\/+=]{40}/gi, replacement: '$1[REDACTED_AWS_SECRET]' },
  // JWT tokens (Bearer)
  { name: 'JWT Token', regex: /Bearer\s+eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/gi, replacement: 'Bearer [REDACTED_JWT_TOKEN]' },
  { name: 'Raw JWT', regex: /eyJ[a-zA-Z0-9_-]{15,}\.[a-zA-Z0-9_-]{15,}\.[a-zA-Z0-9_-]{15,}/gi, replacement: '[REDACTED_JWT]' },
  // GitHub Tokens
  { name: 'GitHub Token', regex: /(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}/g, replacement: '[REDACTED_GITHUB_TOKEN]' },
  // Passwords in connection strings or JSON
  { name: 'Connection Password', regex: /(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)(@)/gi, replacement: '$1[REDACTED_PASSWORD]$3' },
  { name: 'Postgres/MySQL URL Password', regex: /((?:postgres(?:ql)?|mysql):\/\/[^:]+:)([^@]+)(@)/gi, replacement: '$1[REDACTED_PASSWORD]$3' },
  { name: 'Password Field', regex: /(password|passwd|secret|client_secret|auth_token)\s*[:=]\s*["']?([^"',\s\r\n]{4,})["']?/gi, replacement: '$1="[REDACTED_SECRET]"' },
  // Private keys
  { name: 'Private Key', regex: /-----BEGIN\s+(?:RSA|OPENSSH|DSA|EC)?\s*PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:RSA|OPENSSH|DSA|EC)?\s*PRIVATE\s+KEY-----/gi, replacement: '[REDACTED_PRIVATE_KEY]' },
  // Authorization headers
  { name: 'Auth Header', regex: /(Authorization:\s*)(?:Basic|Token)\s+[A-Za-z0-9+/=]{10,}/gi, replacement: '$1[REDACTED_AUTH_CREDENTIALS]' },
];

export function redactSensitiveData(rawText: string): RedactionResult {
  if (!rawText) return { text: '', redactionsCount: 0, detectedTypes: [] };

  let sanitized = rawText;
  let redactionsCount = 0;
  const detectedTypesSet = new Set<string>();

  for (const pattern of REDACTION_PATTERNS) {
    const matches = sanitized.match(pattern.regex);
    if (matches && matches.length > 0) {
      redactionsCount += matches.length;
      detectedTypesSet.add(pattern.name);
      sanitized = sanitized.replace(pattern.regex, pattern.replacement);
    }
  }

  return {
    text: sanitized,
    redactionsCount,
    detectedTypes: Array.from(detectedTypesSet),
  };
}
