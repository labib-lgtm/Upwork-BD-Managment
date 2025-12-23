import React from 'react';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';

interface GoalProgressCardProps {
  icon: React.ReactNode;
  title: string;
  current: number;
  target: number;
  format?: 'currency' | 'number';
  currency?: string;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
  icon,
  title,
  current,
  target,
  format = 'number',
  currency = 'USD',
}) => {
  const percentage = target > 0 ? Math.min((current / target) * 100, 150) : 0;
  const displayPercentage = target > 0 ? (current / target) * 100 : 0;
  const isOnTrack = percentage >= 80;
  const isWarning = percentage >= 50 && percentage < 80;
  const exceededGoal = percentage >= 100;

  const formatValue = (value: number) => {
    if (format === 'currency') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    }
    return value.toLocaleString();
  };

  const getProgressColor = () => {
    if (exceededGoal) return 'bg-green-500';
    if (isOnTrack) return 'bg-green-500';
    if (isWarning) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getGlowClass = () => {
    if (exceededGoal) return 'shadow-green-500/20';
    if (isOnTrack) return 'shadow-green-500/10';
    if (isWarning) return 'shadow-yellow-500/10';
    return 'shadow-red-500/10';
  };

  return (
    <div className={`bg-card border border-border rounded-xl p-5 shadow-lg ${getGlowClass()} transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10 [&>svg]:stroke-primary [&>svg]:fill-foreground">
          {icon}
        </div>
        <div className="flex items-center gap-1">
          {displayPercentage >= 100 ? (
            <TrendingUp className="w-4 h-4 text-green-500" />
          ) : displayPercentage >= 50 ? (
            <Target className="w-4 h-4 text-yellow-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-bold ${
            displayPercentage >= 100 ? 'text-green-500' : 
            displayPercentage >= 50 ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {displayPercentage.toFixed(0)}%
          </span>
        </div>
      </div>

      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-bold text-foreground tabular-nums">
          {formatValue(current)}
        </span>
        <span className="text-sm text-muted-foreground">
          / {formatValue(target)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressColor()} transition-all duration-500 ease-out ${
            exceededGoal ? 'animate-pulse' : ''
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {target === 0 && (
        <p className="text-xs text-muted-foreground mt-2 italic">No target set</p>
      )}
    </div>
  );
};
