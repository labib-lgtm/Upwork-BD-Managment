import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';

interface ComparisonIndicatorProps {
  match: boolean | null; // null = can't compare
  label?: string;
}

export const ComparisonIndicator: React.FC<ComparisonIndicatorProps> = ({ match, label }) => {
  if (match === null) return null;

  return match ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-500" title={label || 'Match'}>
      <Check className="w-3 h-3" />
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-amber-500" title={label || 'Mismatch'}>
      <AlertTriangle className="w-3 h-3" />
    </span>
  );
};
