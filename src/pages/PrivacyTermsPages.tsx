import React, { useState } from 'react';
import { Shield, Lock, FileText, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';

interface PrivacyTermsPagesProps {
  initialTab?: 'privacy' | 'terms';
  onNavigate: (page: string) => void;
}

export const PrivacyTermsPages: React.FC<PrivacyTermsPagesProps> = ({
  initialTab = 'privacy',
  onNavigate,
}) => {
  const [tab, setTab] = useState<'privacy' | 'terms'>(initialTab);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Navigation & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('landing')}
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Legal, Privacy & Trust Policies
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              Transparent, developer-first policies on data protection and code safety.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            onClick={() => setTab('privacy')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              tab === 'privacy'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Privacy Policy
          </button>
          <button
            onClick={() => setTab('terms')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              tab === 'terms'
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Terms of Service
          </button>
        </div>
      </div>

      {tab === 'privacy' ? (
        /* PRIVACY POLICY */
        <div className="p-8 rounded-xl border border-slate-800 bg-[#0d1322] space-y-6 text-slate-300 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-violet-400 font-mono font-semibold text-xs uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            <span>Last Updated: October 2026</span>
          </div>

          <h2 className="text-xl font-bold text-white">FixPilot AI Privacy Policy</h2>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">1. Core Privacy Philosophy</h3>
            <p>
              FixPilot AI is built for software engineers. We believe your code, error traces, and debugging logs are private intellectual property. We do not sell your personal data or submitted logs to third parties.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">2. Secret Redaction & Log Ingestion</h3>
            <p>
              When you submit error traces, console output, or log files, FixPilot AI applies automated regex scrubbing to sanitize common credentials before inference. This includes:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 font-mono">
              <li>OpenAI, Google, AWS, and GitHub API keys and secret tokens</li>
              <li>JWT Bearer authorization tokens</li>
              <li>Database connection passwords (MongoDB, PostgreSQL, MySQL URIs)</li>
              <li>RSA / OpenSSH private key blocks</li>
            </ul>
            <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Automated scrubbing is a safety net. You should never upload confidential production databases or unredacted personal customer information.
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">3. Information We Collect</h3>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Account Information:</strong> When signing in with Google, we store your Google UID, email address, display name, and avatar URL to manage your account.</li>
              <li><strong>Investigation Data:</strong> Titles, error messages, stack traces, and proposed patches saved to your personal Cloud Firestore workspace.</li>
              <li><strong>Usage Metrics:</strong> Number of daily investigations conducted to enforce the fair-use limit.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">4. User Rights & Data Deletion</h3>
            <p>
              You maintain total ownership of your debugging data. You may delete individual investigations at any time. Furthermore, under your Account Settings, you may exercise your Right to be Forgotten by clicking <em>"Wipe My Account Data"</em>, which instantly and permanently deletes your user profile and all associated Firestore records.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">5. Subprocessors</h3>
            <p>
              FixPilot AI utilizes Google Cloud Platform (Cloud Firestore and Firebase Authentication) and Google Gemini API for analytical inference.
            </p>
          </div>
        </div>
      ) : (
        /* TERMS OF SERVICE */
        <div className="p-8 rounded-xl border border-slate-800 bg-[#0d1322] space-y-6 text-slate-300 text-xs leading-relaxed">
          <div className="flex items-center gap-2 text-violet-400 font-mono font-semibold text-xs uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>Effective: October 2026</span>
          </div>

          <h2 className="text-xl font-bold text-white">FixPilot AI Terms of Service</h2>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">1. Acceptance of Terms</h3>
            <p>
              By accessing or using FixPilot AI, you agree to be bound by these Terms. If you disagree with any part, you may not use the platform.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">2. Free-First Usage & Fair-Use Policy</h3>
            <p>
              FixPilot AI provides free manual error investigations subject to an automated daily fair-use quota (currently 25 analyses per calendar day). FixPilot AI reserves the right to rate-limit or block abusive automated scraping or Denial of Service attempts.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">3. Zero-Execution & Developer Responsibility</h3>
            <p>
              <strong>Critical Notice:</strong> FixPilot AI is an advisory diagnostic tool that generates hypothetical root causes and proposed patches.
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>FixPilot AI never executes code or automatically applies patches to your systems.</li>
              <li>Generated patches have not been run against automated test runners by FixPilot AI.</li>
              <li>You are solely responsible for reviewing, testing, and verifying any code before merging or deploying to production environments.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">4. Disclaimer of Warranties</h3>
            <p>
              FixPilot AI is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied, including fitness for a particular purpose or bug-free operation.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white">5. Limitation of Liability</h3>
            <p>
              In no event shall FixPilot AI, its operators, or affiliates be liable for any direct, indirect, incidental, or consequential damages resulting from downtime, software regressions, data loss, or server failure.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
