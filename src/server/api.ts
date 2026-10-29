import express, { Request, Response } from 'express';
import { runDebuggingAnalysis } from './gemini.ts';
import { redactSensitiveData } from './redactor.ts';

export const apiRouter = express.Router();

// Middleware: parse JSON with strict size limit (max 1MB to prevent DoS)
apiRouter.use(express.json({ limit: '1mb' }));

// Simple in-memory rate limiter per IP / User identifier to prevent abuse
const requestTracker = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_MINUTE = 20;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const userRecord = requestTracker.get(identifier);

  if (!userRecord || now > userRecord.resetTime) {
    requestTracker.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (userRecord.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  userRecord.count++;
  return true;
}

// Health check
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'FixPilot AI Engine',
    timestamp: new Date().toISOString(),
  });
});

// App Config & Fair-use parameters
apiRouter.get('/config', (_req: Request, res: Response) => {
  res.json({
    appName: 'FixPilot AI',
    version: '1.2.0',
    model: 'gemini-3.8-flash',
    fairUse: {
      freeTierDailyLimit: 25,
      maxLogSizeBytes: 200 * 1024, // 200KB upload limit
      supportedExtensions: ['.txt', '.log', '.json', '.out', '.err'],
    },
    featureFlags: {
      githubSyncAvailable: false, // Roadmapped for Pro/Team
      teamWorkspacesAvailable: true,
      customModelRouting: false,
    },
  });
});

// Secret sanitization preview endpoint
apiRouter.post('/sanitize', (req: Request, res: Response) => {
  const { text } = req.body;
  if (typeof text !== 'string') {
    res.status(400).json({ error: 'Text field must be a string' });
    return;
  }

  const result = redactSensitiveData(text);
  res.json(result);
});

// Main AI Debugging analysis endpoint
apiRouter.post('/analyze', async (req: Request, res: Response) => {
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
  if (!checkRateLimit(String(clientIp))) {
    res.status(429).json({
      error: 'Rate limit exceeded. Please wait a minute before requesting another analysis.',
    });
    return;
  }

  const { errorMessage, stackTrace, logSnippet, language, framework, environment, userActions } = req.body;

  if (!errorMessage && !logSnippet && !stackTrace) {
    res.status(400).json({
      error: 'Please provide at least an error message, stack trace, or log snippet to investigate.',
    });
    return;
  }

  // Validate lengths to prevent oversized payload abuse
  if (errorMessage && errorMessage.length > 30000) {
    res.status(400).json({ error: 'Error message is too long (maximum 30,000 characters).' });
    return;
  }
  if (stackTrace && stackTrace.length > 60000) {
    res.status(400).json({ error: 'Stack trace is too long (maximum 60,000 characters).' });
    return;
  }
  if (logSnippet && logSnippet.length > 100000) {
    res.status(400).json({ error: 'Log snippet is too long (maximum 100,000 characters).' });
    return;
  }

  try {
    const analysis = await runDebuggingAnalysis({
      errorMessage: errorMessage || 'Unspecified runtime exception in attached logs',
      stackTrace,
      logSnippet,
      language: language || 'Auto-detect',
      framework,
      environment,
      userActions,
    });

    res.json({
      success: true,
      analysis,
    });
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to complete analysis. Please check that GEMINI_API_KEY is configured.',
    });
  }
});
