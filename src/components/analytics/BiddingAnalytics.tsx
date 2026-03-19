import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, BarChart, Bar } from 'recharts';
import { getChartTooltipStyle, getAxisStyle, CHART_COLORS } from '@/lib/chartConfig';
import { Target } from 'lucide-react';

interface BiddingAnalyticsProps {
  proposals: Proposal[];
}

export const BiddingAnalytics: React.FC<BiddingAnalyticsProps> = ({ proposals }) => {
  const bidAnalysis = useMemo(() => {
    const withBudget = proposals.filter((p) => p.budget && p.budget > 0 && p.proposed_amount && p.proposed_amount > 0);
    const buckets = [
    { label: 'Under 50%', min: 0, max: 50 },
    { label: '50-80%', min: 50, max: 80 },
    { label: '80-100%', min: 80, max: 100 },
    { label: '100-120%', min: 100, max: 120 },
    { label: 'Over 120%', min: 120, max: Infinity }];

    return buckets.map((b) => {
      const inBucket = withBudget.filter((p) => {
        const pct = (p.proposed_amount || 0) / (p.budget || 1) * 100;
        return pct >= b.min && pct < b.max;
      });
      const won = inBucket.filter((p) => p.status === 'won').length;
      return { range: b.label, count: inBucket.length, won, winRate: inBucket.length > 0 ? won / inBucket.length * 100 : 0 };
    });
  }, [proposals]);

  const scatterData = useMemo(() => {
    return proposals.
    filter((p) => p.proposed_amount && p.proposed_amount > 0).
    map((p) => ({ bid: p.proposed_amount || 0, won: p.status === 'won' ? 1 : 0, status: p.status, title: p.job_title }));
  }, [proposals]);

  const avgBidRatio = useMemo(() => {
    const withBudget = proposals.filter((p) => p.budget && p.budget > 0 && p.proposed_amount && p.proposed_amount > 0);
    if (withBudget.length === 0) return 0;
    return withBudget.reduce((s, p) => s + (p.proposed_amount || 0) / (p.budget || 1), 0) / withBudget.length * 100;
  }, [proposals]);

  const sweetSpot = bidAnalysis.reduce((best, b) => b.winRate > best.winRate && b.count >= 3 ? b : best, bidAnalysis[0]);
  const axisStyle = getAxisStyle();

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Avg Bid vs Budget</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{avgBidRatio.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground mt-1">{avgBidRatio > 100 ? 'Bidding above budget' : 'Bidding below budget'}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-black" />
            <p className="text-xs text-muted-foreground font-medium">Sweet Spot</p>
          </div>
          <p className="text-2xl font-bold text-black">{sweetSpot?.range || '-'}</p>
          <p className="text-xs text-muted-foreground mt-1">{sweetSpot?.winRate.toFixed(1)}% win rate ({sweetSpot?.count} proposals)</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground font-medium mb-1">Total Bids Analyzed</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">{scatterData.length}</p>
        </div>
      </div>

      {/* Win rate by bid position */}
      <div className="section-card">
        <div className="section-card-header">
          <h4 className="text-sm font-bold text-foreground">Win Rate by Bid Position</h4>
        </div>
        <div className="section-card-body">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bidAnalysis}>
                <XAxis dataKey="range" {...axisStyle} />
                <YAxis {...axisStyle} unit="%" />
                <Tooltip contentStyle={getChartTooltipStyle()} />
                <Bar dataKey="winRate" name="Win Rate %" radius={[8, 8, 0, 0]} fill={CHART_COLORS.primary} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Scatter */}
      {scatterData.length > 0 &&
      <div className="section-card">
          <div className="section-card-header">
            <h4 className="text-sm font-bold text-foreground">Bid Distribution</h4>
          </div>
          <div className="section-card-body">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <XAxis type="number" dataKey="bid" name="Bid Amount" unit="$" {...axisStyle} />
                  <YAxis type="number" dataKey="won" name="Won" {...axisStyle} domain={[0, 1]} ticks={[0, 1]} tickFormatter={(v) => v === 1 ? 'Won' : 'Other'} />
                  <Tooltip contentStyle={getChartTooltipStyle()} />
                  <Scatter data={scatterData}>
                    {scatterData.map((entry, i) =>
                  <Cell key={i} fill={entry.status === 'won' ? CHART_COLORS.success : CHART_COLORS.muted} fillOpacity={0.6} />
                  )}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      }

      {/* Bid analysis table */}
      <div className="section-card">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Bid Range (% of Budget)</th>
                <th className="text-center">Proposals</th>
                <th className="text-center">Won</th>
                <th className="text-center">Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {bidAnalysis.map((b) =>
              <tr key={b.range}>
                  <td className="font-medium">{b.range}</td>
                  <td className="text-center tabular-nums">{b.count}</td>
                  <td className="text-center tabular-nums">{b.won}</td>
                  <td className="text-center">
                    <span className={`font-medium tabular-nums ${b.winRate > 10 ? 'text-success' : 'text-muted-foreground'}`}>
                      {b.winRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

};