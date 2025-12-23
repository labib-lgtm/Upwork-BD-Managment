import React from 'react';
import { DollarSign, FileText, Trophy } from 'lucide-react';
import { GoalProgressCard } from './GoalProgressCard';
import { Goal } from '@/hooks/useGoals';
import { KPIMetrics } from '@/types';

interface GoalProgressGridProps {
  goals: Goal[];
  metrics: KPIMetrics[];
  fiscalYear: number;
  fiscalYearStart: number;
  currency: string;
}

export const GoalProgressGrid: React.FC<GoalProgressGridProps> = ({
  goals,
  metrics,
  fiscalYear,
  fiscalYearStart,
  currency,
}) => {
  // Calculate current month in fiscal year
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentCalYear = now.getFullYear();

  // Determine if we're in first or second half of fiscal year
  const isSecondHalf = currentMonth < fiscalYearStart;
  const fiscalMonthIndex = isSecondHalf 
    ? currentMonth + (12 - fiscalYearStart) + 1
    : currentMonth - fiscalYearStart + 1;

  // Calculate YTD totals from metrics
  const ytdMetrics = metrics.slice(0, Math.min(fiscalMonthIndex, metrics.length));
  const ytdRevenue = ytdMetrics.reduce((sum, m) => sum + m.revenue, 0);
  const ytdProposals = ytdMetrics.reduce((sum, m) => sum + m.sent, 0);
  const ytdCloses = ytdMetrics.reduce((sum, m) => sum + m.closes, 0);

  // Calculate YTD targets from goals
  const ytdGoals = goals.filter(g => {
    if (g.fiscal_year !== fiscalYear) return false;
    const goalFiscalMonth = g.month >= fiscalYearStart 
      ? g.month - fiscalYearStart + 1 
      : g.month + (12 - fiscalYearStart) + 1;
    return goalFiscalMonth <= fiscalMonthIndex;
  });

  const ytdRevenueTarget = ytdGoals.reduce((sum, g) => sum + Number(g.revenue_target || 0), 0);
  const ytdProposalTarget = ytdGoals.reduce((sum, g) => sum + Number(g.proposal_target || 0), 0);
  const ytdClosesTarget = ytdGoals.reduce((sum, g) => sum + Number(g.closes_target || 0), 0);

  // Check if any goals exist
  const hasGoals = goals.length > 0;

  if (!hasGoals) {
    return (
      <div className="bg-card/50 border border-border border-dashed rounded-xl p-6 text-center">
        <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">
          No goals set for FY {fiscalYear - 1}/{fiscalYear}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Set monthly targets in Settings → Goals
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <GoalProgressCard
        icon={<DollarSign className="w-5 h-5" />}
        title="YTD Revenue"
        current={ytdRevenue}
        target={ytdRevenueTarget}
        format="currency"
        currency={currency}
      />
      <GoalProgressCard
        icon={<FileText className="w-5 h-5" />}
        title="YTD Proposals"
        current={ytdProposals}
        target={ytdProposalTarget}
        format="number"
      />
      <GoalProgressCard
        icon={<Trophy className="w-5 h-5" />}
        title="YTD Closes"
        current={ytdCloses}
        target={ytdClosesTarget}
        format="number"
      />
    </div>
  );
};
