/**
 * Utility to scrub and redact sensitive information (secrets, API keys, JWTs, passwords)
 * from errors, logs, and stack traces before sending to AI or storing.
 */

export interface RedactionResult {
  text: string;
  redactionsCount: number;
  detectedTypes: string[];
}

interface RedactionPattern {
  name: string;
  regex: RegExp;
  replacement: string | ((substring: string, ...args: any[]) => string);
}

const REDACTION_PATTERNS: RedactionPattern[] = [
  // Private Key Blocks (RSA, OPENSSH, DSA, EC, ENCRYPTED, or Generic)
  {
    name: 'Private Key Block',
    regex: /-----BEGIN\s+(?:[A-Z0-9_-]+\s+)?PRIVATE\s+KEY-----[\s\S]*?-----END\s+(?:[A-Z0-9_-]+\s+)?PRIVATE\s+KEY-----/gi,
    replacement: '[REDACTED_PRIVATE_KEY_BLOCK]',
  },
  // AWS Access Keys (AKIA and ASIA prefixes for long-term and temporary credentials)
  {
    name: 'AWS Access Key',
    regex: /\b(A[KS]IA[0-9A-Z]{16})\b/g,
    replacement: '[REDACTED_AWS_ACCESS_KEY]',
  },
  // AWS Secret Access Keys
  {
    name: 'AWS Secret Key',
    regex: /(aws_secret_access_key\s*[:=]\s*)[A-Za-z0-9\/+=]{40}/gi,
    replacement: '$1[REDACTED_AWS_SECRET_KEY]',
  },
  // Bearer Tokens (JWT or opaque token)
  {
    name: 'Bearer Token',
    regex: /\bBearer\s+[A-Za-z0-9_\-\.]{20,}/gi,
    replacement: 'Bearer [REDACTED_BEARER_TOKEN]',
  },
  // Raw JWTs (3 segments separated by dots starting with eyJ)
  {
    name: 'Raw JWT',
    regex: /\beyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\b/g,
    replacement: '[REDACTED_JWT]',
  },
  // OpenAI API Keys
  {
    name: 'OpenAI API Key',
    regex: /\bsk-(?:proj-|live-)?[a-zA-Z0-9_-]{20,80}\b/g,
    replacement: '[REDACTED_OPENAI_KEY]',
  },
  // Google / Firebase API Keys
  {
    name: 'Google API Key',
    regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
    replacement: '[REDACTED_GOOGLE_API_KEY]',
  },
  // GitHub Personal Access Tokens
  {
    name: 'GitHub Token',
    regex: /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{36,255}\b/g,
    replacement: '[REDACTED_GITHUB_TOKEN]',
  },
  // Database Connection Strings with Passwords
  {
    name: 'Database URL Password',
    regex: /((?:mongodb(?:\+srv)?|postgres(?:ql)?|mysql|redis):\/\/[^:]+:)([^@\s\r\n]+)(@)/gi,
    replacement: '$1[REDACTED_DB_PASSWORD]$3',
  },
  // Explicit Password & Secret assignments in JSON, env files, or YAML
  {
    name: 'Password/Secret Assignment',
    regex: /(["']?(?:password|passwd|secret|client_secret|auth_token)["']?\s*[:=]\s*["']?)([^"',\s\r\n]{4,})(["']?)/gi,
    replacement: '$1[REDACTED_SECRET]$3',
  },
  // Generic API Key assignments (e.g. api_key: "abc...")
  {
    name: 'Generic API Key Assignment',
    regex: /\b(api[_-]?key|secret[_-]?token)\s*[:=]\s*["']?([a-zA-Z0-9_\-]{20,60})["']?/gi,
    replacement: '$1="[REDACTED_API_KEY]"',
  },
  // Basic or Token Authorization Headers
  {
    name: 'Authorization Header',
    regex: /(Authorization:\s*)(?:Basic|Token)\s+[A-Za-z0-9+/=]{10,}/gi,
    replacement: '$1[REDACTED_AUTH_CREDENTIALS]',
  },
];

export function redactSensitiveData(rawText: string): RedactionResult {
  if (!rawText) return { text: '', redactionsCount: 0, detectedTypes: [] };

  let sanitized = rawText;
  let totalRedactions = 0;
  const detectedTypesSet = new Set<string>();

  for (const pattern of REDACTION_PATTERNS) {
    const matches = sanitized.match(pattern.regex);
    if (matches && matches.length > 0) {
      totalRedactions += matches.length;
      detectedTypesSet.add(pattern.name);
      sanitized = sanitized.replace(pattern.regex, pattern.replacement as any);
    }
  }

  return {
    text: sanitized,
    redactionsCount: totalRedactions,
    detectedTypes: Array.from(detectedTypesSet),
  };
}
