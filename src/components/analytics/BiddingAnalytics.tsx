import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, BarChart, Bar } from 'recharts';

interface BiddingAnalyticsProps {
  proposals: Proposal[];
}

export const BiddingAnalytics: React.FC<BiddingAnalyticsProps> = ({ proposals }) => {
  const bidAnalysis = useMemo(() => {
    const withBudget = proposals.filter(p => p.budget && p.budget > 0 && p.proposed_amount && p.proposed_amount > 0);

    const buckets = [
      { label: 'Under 50%', min: 0, max: 50 },
      { label: '50-80%', min: 50, max: 80 },
      { label: '80-100%', min: 80, max: 100 },
      { label: '100-120%', min: 100, max: 120 },
      { label: 'Over 120%', min: 120, max: Infinity },
    ];

    return buckets.map(b => {
      const inBucket = withBudget.filter(p => {
        const pct = ((p.proposed_amount || 0) / (p.budget || 1)) * 100;
        return pct >= b.min && pct < b.max;
      });
      const won = inBucket.filter(p => p.status === 'won').length;
      return {
        range: b.label,
        count: inBucket.length,
        won,
        winRate: inBucket.length > 0 ? (won / inBucket.length) * 100 : 0,
      };
    });
  }, [proposals]);

  const scatterData = useMemo(() => {
    return proposals
      .filter(p => p.proposed_amount && p.proposed_amount > 0)
      .map(p => ({
        bid: p.proposed_amount || 0,
        won: p.status === 'won' ? 1 : 0,
        status: p.status,
        title: p.job_title,
      }));
  }, [proposals]);

  const avgBidRatio = useMemo(() => {
    const withBudget = proposals.filter(p => p.budget && p.budget > 0 && p.proposed_amount && p.proposed_amount > 0);
    if (withBudget.length === 0) return 0;
    const totalRatio = withBudget.reduce((s, p) => s + ((p.proposed_amount || 0) / (p.budget || 1)), 0);
    return (totalRatio / withBudget.length) * 100;
  }, [proposals]);

  const sweetSpot = bidAnalysis.reduce((best, b) => b.winRate > best.winRate && b.count >= 3 ? b : best, bidAnalysis[0]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-foreground">Smart Bidding Analytics</h3>

      {/* Key metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Avg Bid vs Budget</p>
          <p className="text-2xl font-bold text-foreground">{avgBidRatio.toFixed(0)}%</p>
          <p className="text-xs text-muted-foreground">{avgBidRatio > 100 ? 'Bidding above budget' : 'Bidding below budget'}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Sweet Spot</p>
          <p className="text-2xl font-bold text-primary">{sweetSpot?.range || '-'}</p>
          <p className="text-xs text-muted-foreground">{sweetSpot?.winRate.toFixed(1)}% win rate ({sweetSpot?.count} proposals)</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Total Bids Analyzed</p>
          <p className="text-2xl font-bold text-foreground">{scatterData.length}</p>
        </div>
      </div>

      {/* Win rate by bid position */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Win Rate by Bid Position</h4>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={bidAnalysis}>
              <XAxis dataKey="range" stroke="hsl(220, 10%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 15%, 11%)', border: '1px solid hsl(220, 15%, 20%)', borderRadius: '8px', color: 'hsl(0, 0%, 98%)' }} />
              <Bar dataKey="winRate" name="Win Rate %" radius={[6, 6, 0, 0]} fill="hsl(72, 100%, 50%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Scatter: bid amount distribution */}
      {scatterData.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Bid Distribution</h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <XAxis type="number" dataKey="bid" name="Bid Amount" unit="$" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                <YAxis type="number" dataKey="won" name="Won" stroke="hsl(220, 10%, 55%)" fontSize={12} domain={[0, 1]} ticks={[0, 1]} tickFormatter={v => v === 1 ? 'Won' : 'Other'} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 15%, 11%)', border: '1px solid hsl(220, 15%, 20%)', borderRadius: '8px', color: 'hsl(0, 0%, 98%)' }} />
                <Scatter data={scatterData}>
                  {scatterData.map((entry, i) => (
                    <Cell key={i} fill={entry.status === 'won' ? 'hsl(142, 71%, 45%)' : 'hsl(220, 10%, 55%)'} fillOpacity={0.6} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Bid analysis table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
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
            {bidAnalysis.map(b => (
              <tr key={b.range}>
                <td className="font-medium">{b.range}</td>
                <td className="text-center">{b.count}</td>
                <td className="text-center">{b.won}</td>
                <td className="text-center">
                  <span className={b.winRate > 10 ? 'text-green-400' : 'text-muted-foreground'}>
                    {b.winRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
