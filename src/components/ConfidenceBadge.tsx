import React from 'react';
import { ShieldCheck, HelpCircle, AlertTriangle, AlertOctagon } from 'lucide-react';

interface ConfidenceBadgeProps {
  score: number;
  reasoning?: string;
}

export const ConfidenceBadge: React.FC<ConfidenceBadgeProps> = ({ score, reasoning }) => {
  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let icon = <ShieldCheck className="w-4 h-4 text-emerald-400" />;
  let label = 'High Confidence';

  if (score < 50) {
    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    icon = <AlertOctagon className="w-4 h-4 text-rose-400" />;
    label = 'Low Confidence (Sparse Data)';
  } else if (score < 75) {
    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    icon = <AlertTriangle className="w-4 h-4 text-amber-400" />;
    label = 'Moderate Confidence';
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${badgeColor}`}>
        {icon}
        <span>{score}% {label}</span>
      </div>
      {reasoning && (
        <span className="text-xs text-slate-400 italic">
          "{reasoning}"
        </span>
      )}
    </div>
  );
};
