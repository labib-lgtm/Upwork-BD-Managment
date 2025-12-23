import React, { useState, useEffect } from 'react';
import { Job, BDProfile, AppSettings, KPIMetrics, UserRole, User } from '@/types';
import { calculateKPIMetrics, calculateTotals } from '@/services/dataService';
import { TrendingUp, TrendingDown, DollarSign, Eye, MessageSquare, Award, ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardProps {
  jobs: Job[];
  profiles: BDProfile[];
  settings: AppSettings;
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ jobs, profiles, settings, user }) => {
  const isRestricted = user.role === UserRole.BD_MEMBER && !!user.linked_profile_id;

  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(
    isRestricted && user.linked_profile_id
      ? [user.linked_profile_id]
      : profiles.map((p) => p.id)
  );

  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (isRestricted && user.linked_profile_id) {
      setSelectedProfileIds([user.linked_profile_id]);
    } else {
      setSelectedProfileIds(profiles.map((p) => p.id));
    }
  }, [user, profiles, isRestricted]);

  const metrics = calculateKPIMetrics(
    jobs,
    selectedProfileIds,
    settings.fiscal_year_start_month,
    fiscalYear,
    settings
  );

  const totals = calculateTotals(metrics);

  const toggleProfile = (profileId: string) => {
    if (isRestricted) return;
    setSelectedProfileIds((prev) =>
      prev.includes(profileId)
        ? prev.filter((id) => id !== profileId)
        : [...prev, profileId]
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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Performance Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Fiscal Year {fiscalYear - 1}/{fiscalYear}
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
              onClick={() => toggleProfile(profile.id)}
              disabled={isRestricted}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedProfileIds.includes(profile.id)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-muted-foreground hover:bg-muted'
              } ${isRestricted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {profile.name}
            </button>
          ))}
        </div>
      </header>

      {/* Summary Cards */}
      <div className="px-6 py-4 grid grid-cols-4 gap-4">
        {summaryCards.map((card, idx) => (
          <div key={idx} className="metric-card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-muted-foreground">{card.icon}</span>
              {card.trend ? (
                <TrendingUp className="w-4 h-4 text-green-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-400" />
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
                {renderRow('spend', 'Spend', 'currency')}

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
