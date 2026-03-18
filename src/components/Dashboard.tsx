import React, { useState, useEffect, useMemo } from 'react';
import { BDProfile, AppSettings, KPIMetrics, UserRole, User } from '@/types';
import { useProposals, Proposal } from '@/hooks/useProposals';
import { useGoals } from '@/hooks/useGoals';
import { GoalProgressGrid } from '@/components/goals/GoalProgressGrid';
import { TrendingUp, TrendingDown, DollarSign, Eye, Award, ChevronLeft, ChevronRight, Loader2, Clock, Calendar, CalendarDays } from 'lucide-react';

interface DashboardProps {
  profiles: BDProfile[];
  settings: AppSettings;
  user: User;
  onViewProposals?: (range: '1d' | '7d' | '14d') => void;
}

// Calculate metrics from database proposals
const calculateMetricsFromProposals = (
  proposals: Proposal[],
  selectedProfileNames: string[],
  fiscalYearStart: number,
  targetYear: number,
  settings: AppSettings
): KPIMetrics[] => {
  const scopeProposals = proposals.filter((p) =>
    selectedProfileNames.includes(p.profile_name)
  );
  
  const months: KPIMetrics[] = [];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const fiscalMonthOrder: number[] = [];

  for (let i = 0; i < 12; i++) {
    fiscalMonthOrder.push((fiscalYearStart - 1 + i) % 12);
  }

  fiscalMonthOrder.forEach((monthIndex) => {
    const isSecondHalf = monthIndex < fiscalYearStart - 1;
    const year = isSecondHalf ? targetYear : targetYear - 1;

    const proposalsInMonth = scopeProposals.filter((p) => {
      const d = new Date(p.date_submitted || p.created_at);
      return d.getMonth() === monthIndex && d.getFullYear() === year;
    });

    const sent = proposalsInMonth.length;
    const connects = proposalsInMonth.reduce((sum, p) => sum + (p.connects_used || 0), 0);
    const boostedConnects = proposalsInMonth.reduce((sum, p) => sum + (p.boosted_connects || 0), 0);
    const returnedConnects = proposalsInMonth.reduce((sum, p) => sum + (p.returned_connects || 0), 0);
    const views = proposalsInMonth.filter((p) => p.status === 'viewed' || p.status === 'interviewed' || p.status === 'won').length;
    const interviews = proposalsInMonth.filter((p) => p.status === 'interviewed' || p.status === 'won').length;
    const closes = proposalsInMonth.filter((p) => p.status === 'won').length;
    const newClients = proposalsInMonth.filter((p) => p.is_new_client).length;

    const revenue = proposalsInMonth
      .filter((p) => p.status === 'won')
      .reduce((sum, p) => sum + (p.deal_value || 0), 0);
    const refunds = proposalsInMonth
      .filter((p) => p.status === 'won')
      .reduce((sum, p) => sum + (p.refund_amount || 0), 0);
    const spend = (connects - returnedConnects) * settings.connect_cost;
    const netRevenue = revenue - refunds;

    months.push({
      periodLabel: monthNames[monthIndex],
      connects,
      boostedConnects,
      returnedConnects,
      sent,
      views,
      interviews,
      closes,
      viewRate: sent > 0 ? (views / sent) * 100 : 0,
      interviewRate: views > 0 ? (interviews / views) * 100 : 0,
      closeRate: interviews > 0 ? (closes / interviews) * 100 : 0,
      newClientRate: sent > 0 ? (newClients / sent) * 100 : 0,
      spend,
      revenue: netRevenue,
      refunds,
      roas: spend > 0 ? netRevenue / spend : 0,
      aov: closes > 0 ? netRevenue / closes : 0,
      aovNeeded: settings.target_roas > 0 && closes > 0 
        ? (spend * settings.target_roas) / closes 
        : 0,
      costPerProposal: sent > 0 ? spend / sent : 0,
      costPerView: views > 0 ? spend / views : 0,
      costPerInterview: interviews > 0 ? spend / interviews : 0,
      costPerClose: closes > 0 ? spend / closes : 0,
    });
  });

  return months;
};

const calculateTotals = (metrics: KPIMetrics[]): KPIMetrics => {
  const total: KPIMetrics = {
    periodLabel: 'TOTAL',
    connects: 0,
    boostedConnects: 0,
    returnedConnects: 0,
    sent: 0,
    views: 0,
    interviews: 0,
    closes: 0,
    viewRate: 0,
    interviewRate: 0,
    closeRate: 0,
    newClientRate: 0,
    spend: 0,
    revenue: 0,
    refunds: 0,
    roas: 0,
    aov: 0,
    aovNeeded: 0,
    costPerProposal: 0,
    costPerView: 0,
    costPerInterview: 0,
    costPerClose: 0,
  };

  metrics.forEach((m) => {
    total.connects += m.connects;
    total.boostedConnects += m.boostedConnects;
    total.returnedConnects += m.returnedConnects;
    total.sent += m.sent;
    total.views += m.views;
    total.interviews += m.interviews;
    total.closes += m.closes;
    total.spend += m.spend;
    total.revenue += m.revenue;
    total.refunds += m.refunds;
  });

  // Calculate newClientRate from weighted average of monthly rates
  const totalNewClients = metrics.reduce((sum, m) => sum + Math.round(m.newClientRate * m.sent / 100), 0);
  total.newClientRate = total.sent > 0 ? (totalNewClients / total.sent) * 100 : 0;

  total.viewRate = total.sent > 0 ? (total.views / total.sent) * 100 : 0;
  total.interviewRate = total.views > 0 ? (total.interviews / total.views) * 100 : 0;
  total.closeRate = total.interviews > 0 ? (total.closes / total.interviews) * 100 : 0;
  total.roas = total.spend > 0 ? total.revenue / total.spend : 0;
  total.aov = total.closes > 0 ? total.revenue / total.closes : 0;
  total.costPerProposal = total.sent > 0 ? total.spend / total.sent : 0;
  total.costPerView = total.views > 0 ? total.spend / total.views : 0;
  total.costPerInterview = total.interviews > 0 ? total.spend / total.interviews : 0;
  total.costPerClose = total.closes > 0 ? total.spend / total.closes : 0;

  return total;
};

export const Dashboard: React.FC<DashboardProps> = ({ profiles, settings, user, onViewProposals }) => {
  const { proposals, loading } = useProposals();
  const { goals, loading: goalsLoading } = useGoals();
  const isRestricted = user.role === UserRole.BD_MEMBER && !!user.linked_profile_id;

  const [selectedProfileNames, setSelectedProfileNames] = useState<string[]>(
    profiles.map((p) => p.name)
  );

  const [fiscalYear, setFiscalYear] = useState(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    return currentMonth >= settings.fiscal_year_start_month
      ? now.getFullYear() + 1
      : now.getFullYear();
  });

  useEffect(() => {
    if (isRestricted && user.linked_profile_id) {
      const linkedProfile = profiles.find(p => p.id === user.linked_profile_id);
      if (linkedProfile) {
        setSelectedProfileNames([linkedProfile.name]);
      }
    } else {
      setSelectedProfileNames(profiles.map((p) => p.name));
    }
  }, [user, profiles, isRestricted]);

  const metrics = useMemo(() => 
    calculateMetricsFromProposals(
      proposals,
      selectedProfileNames,
      settings.fiscal_year_start_month,
      fiscalYear,
      settings
    ),
    [proposals, selectedProfileNames, settings, fiscalYear]
  );

  const totals = useMemo(() => calculateTotals(metrics), [metrics]);

  // Recent activity calculations
  const recentActivity = useMemo(() => {
    const now = new Date();
    const ranges = [
      { key: '1d' as const, label: 'Last 24 Hours', icon: <Clock className="w-4 h-4" />, ms: 24 * 60 * 60 * 1000 },
      { key: '7d' as const, label: 'Last 7 Days', icon: <Calendar className="w-4 h-4" />, ms: 7 * 24 * 60 * 60 * 1000 },
      { key: '14d' as const, label: 'Last 14 Days', icon: <CalendarDays className="w-4 h-4" />, ms: 14 * 24 * 60 * 60 * 1000 },
    ];

    const scopeProposals = proposals.filter((p) =>
      selectedProfileNames.includes(p.profile_name)
    );

    return ranges.map(({ key, label, icon, ms }) => {
      const cutoff = new Date(now.getTime() - ms);
      const filtered = scopeProposals.filter((p) => {
        const d = new Date(p.date_submitted || p.created_at);
        return d >= cutoff;
      });
      const connects = filtered.reduce((s, p) => s + (p.connects_used || 0), 0);
      const returned = filtered.reduce((s, p) => s + (p.returned_connects || 0), 0);
      const wins = filtered.filter((p) => p.status === 'won').length;
      return { key, label, icon, count: filtered.length, netConnects: connects - returned, wins };
    });
  }, [proposals, selectedProfileNames]);

  const toggleProfile = (profileName: string) => {
    if (isRestricted) return;
    setSelectedProfileNames((prev) =>
      prev.includes(profileName)
        ? prev.filter((name) => name !== profileName)
        : [...prev, profileName]
    );
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: settings.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const renderRow = (
    key: keyof KPIMetrics,
    label: string,
    format?: 'currency' | 'percent',
    decimals = 0
  ) => {
    return (
      <tr key={key} className="hover:bg-secondary/30 transition-colors">
        <td className="p-3 text-sm font-medium text-foreground sticky left-0 bg-card z-10 border-r border-border">
          {label}
        </td>
        {metrics.map((m, idx) => {
          const value = m[key] as number;
          let display: string;
          if (format === 'currency') {
            display = formatCurrency(value);
          } else if (format === 'percent') {
            display = formatPercent(value);
          } else {
            display = value.toFixed(decimals);
          }
          return (
            <td key={idx} className="p-3 text-sm text-center text-muted-foreground tabular-nums">
              {display}
            </td>
          );
        })}
        <td className="p-3 text-sm text-center font-bold text-foreground bg-primary/5 tabular-nums">
          {format === 'currency'
            ? formatCurrency(totals[key] as number)
            : format === 'percent'
            ? formatPercent(totals[key] as number)
            : (totals[key] as number).toFixed(decimals)}
        </td>
      </tr>
    );
  };

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(totals.revenue),
      icon: <DollarSign className="w-5 h-5" />,
      trend: totals.revenue > 0,
    },
    {
      label: 'ROAS',
      value: `${totals.roas.toFixed(1)}x`,
      icon: <TrendingUp className="w-5 h-5" />,
      trend: totals.roas >= settings.target_roas,
    },
    {
      label: 'Close Rate',
      value: formatPercent(totals.closeRate),
      icon: <Award className="w-5 h-5" />,
      trend: totals.closeRate > 10,
    },
    {
      label: 'View Rate',
      value: formatPercent(totals.viewRate),
      icon: <Eye className="w-5 h-5" />,
      trend: totals.viewRate > 30,
    },
  ];

  if (loading || goalsLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Performance Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Fiscal Year {fiscalYear - 1}/{fiscalYear} • {proposals.length} total proposals
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Fiscal Year Selector */}
            <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setFiscalYear((y) => y - 1)}
                className="p-2 hover:bg-muted rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-medium tabular-nums">
                FY {fiscalYear - 1}/{fiscalYear}
              </span>
              <button
                onClick={() => setFiscalYear((y) => y + 1)}
                className="p-2 hover:bg-muted rounded-md transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Profile Filter */}
        <div className="mt-4 flex flex-wrap gap-2">
          {profiles.slice(0, 4).map((profile) => (
            <button
              key={profile.id}
              onClick={() => toggleProfile(profile.name)}
              disabled={isRestricted}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedProfileNames.includes(profile.name)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-muted'
              } ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {profile.name}
            </button>
          ))}
        </div>
      </header>

      {/* Goal Progress Grid */}
      <div className="px-6 py-4">
        <GoalProgressGrid
          goals={goals}
          metrics={metrics}
          fiscalYear={fiscalYear}
          fiscalYearStart={settings.fiscal_year_start_month}
          currency={settings.currency}
        />
      </div>

      {/* Recent Activity Cards */}
      <div className="px-6 py-4 grid grid-cols-3 gap-4">
        {recentActivity.map((card) => (
          <button
            key={card.key}
            onClick={() => onViewProposals?.(card.key)}
            className="metric-card text-left hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">{card.icon}</span>
              <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">View →</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{card.count}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              <span>Net Connects: {card.netConnects}</span>
              <span>Wins: {card.wins}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">{card.icon}</span>
              {card.trend ? (
                <TrendingUp className="w-4 h-4 text-primary" />
              ) : (
                <TrendingDown className="w-4 h-4 text-destructive" />
              )}
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* KPI Table */}
      <div className="flex-1 overflow-auto px-6 pb-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[1000px]">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-secondary z-20 min-w-[150px]">Metric</th>
                  {metrics.map((m, idx) => (
                    <th key={idx} className="text-center min-w-[80px]">
                      {m.periodLabel}
                    </th>
                  ))}
                  <th className="text-center bg-primary/10 min-w-[100px]">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {/* Investment Section */}
                <tr className="kpi-section-header">
                  <td colSpan={14} className="px-3 py-2">
                    Investment
                  </td>
                </tr>
                {renderRow('connects', 'Connects', undefined, 0)}
                {renderRow('boostedConnects', 'Boosted Connects', undefined, 0)}
                {renderRow('returnedConnects', 'Returned Connects', undefined, 0)}
                {renderRow('spend', 'Spend (Net)', 'currency')}

                {/* Activity Section */}
                <tr className="kpi-section-header">
                  <td colSpan={14} className="px-3 py-2">
                    Activity
                  </td>
                </tr>
                {renderRow('sent', 'Sent', undefined, 0)}
                {renderRow('views', 'Views', undefined, 0)}
                {renderRow('interviews', 'Interviews', undefined, 0)}
                {renderRow('closes', 'Closes (Won)', undefined, 0)}
                {renderRow('newClientRate', 'New Client %', 'percent', 1)}

                {/* Conversion Section */}
                <tr className="kpi-section-header">
                  <td colSpan={14} className="px-3 py-2">
                    Conversion
                  </td>
                </tr>
                {renderRow('viewRate', 'View Rate', 'percent', 1)}
                {renderRow('interviewRate', 'Interview Rate', 'percent', 1)}
                {renderRow('closeRate', 'Close Rate', 'percent', 1)}

                {/* Revenue Section */}
                <tr className="kpi-section-header">
                  <td colSpan={14} className="px-3 py-2">
                    Revenue
                  </td>
                </tr>
                {renderRow('revenue', 'Net Revenue', 'currency')}
                {renderRow('refunds', 'Refunds', 'currency')}
                {renderRow('roas', 'ROAS', undefined, 1)}
                {renderRow('aov', 'Avg Order Value', 'currency')}

                {/* Cost Analysis Section */}
                <tr className="kpi-section-header">
                  <td colSpan={14} className="px-3 py-2">
                    Cost Analysis
                  </td>
                </tr>
                {renderRow('costPerProposal', 'Cost/Proposal', 'currency')}
                {renderRow('costPerView', 'Cost/View', 'currency')}
                {renderRow('costPerInterview', 'Cost/Interview', 'currency')}
                {renderRow('costPerClose', 'Cost/Close', 'currency')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};