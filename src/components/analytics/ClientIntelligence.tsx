import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { getTierStats, ClientTier } from '@/lib/clientTier';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Shield, AlertTriangle } from 'lucide-react';

interface ClientIntelligenceProps {
  proposals: Proposal[];
}

const TIER_CONFIG: Record<ClientTier, { label: string; color: string; description: string }> = {
  tier1: { label: 'Tier 1', color: 'hsl(142, 71%, 45%)', description: 'Verified, 10+ hires, $50K+ spent' },
  tier2: { label: 'Tier 2', color: 'hsl(199, 89%, 48%)', description: 'Verified, 3-9 hires, $10K-$50K spent' },
  tier3: { label: 'Tier 3', color: 'hsl(38, 92%, 50%)', description: 'Verified, 1-2 hires, <$10K spent' },
  red_flag: { label: 'Red Flag', color: 'hsl(0, 84%, 60%)', description: 'Unverified or $0 spent' },
};

export const ClientIntelligence: React.FC<ClientIntelligenceProps> = ({ proposals }) => {
  const tierStats = useMemo(() => getTierStats(proposals), [proposals]);

  const chartData = tierStats.map(t => ({
    name: TIER_CONFIG[t.tier].label,
    'Win Rate': Number(t.winRate.toFixed(1)),
    'Count': t.count,
    color: TIER_CONFIG[t.tier].color,
  }));

  const bestTier = tierStats.reduce((best, t) => t.winRate > best.winRate ? t : best, tierStats[0]);
  const worstTier = tierStats.reduce((worst, t) => t.winRate < worst.winRate && t.count > 0 ? t : worst, tierStats[0]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-foreground">Client Intelligence</h3>

      {/* Tier cards */}
      <div className="grid grid-cols-4 gap-4">
        {tierStats.map(t => {
          const config = TIER_CONFIG[t.tier];
          return (
            <div key={t.tier} className="metric-card">
              <div className="flex items-center gap-2 mb-2">
                {t.tier === 'red_flag' ? (
                  <AlertTriangle className="w-4 h-4" style={{ color: config.color }} />
                ) : (
                  <Shield className="w-4 h-4" style={{ color: config.color }} />
                )}
                <span className="text-sm font-semibold" style={{ color: config.color }}>{config.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{t.count}</p>
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Win Rate</span>
                  <span className="font-medium text-foreground">{t.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Won</span>
                  <span className="font-medium text-foreground">{t.wonCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Deal</span>
                  <span className="font-medium text-foreground">${Math.round(t.avgDealValue).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">{config.description}</p>
            </div>
          );
        })}
      </div>

      {/* Win rate by tier chart */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Win Rate by Client Tier</h4>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 15%, 11%)', border: '1px solid hsl(220, 15%, 20%)', borderRadius: '8px', color: 'hsl(0, 0%, 98%)' }} />
              <Bar dataKey="Win Rate" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      {bestTier && worstTier && bestTier.count > 0 && (
        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-semibold text-foreground">💡 Insights</h4>
          {bestTier.winRate > 0 && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-green-400">{TIER_CONFIG[bestTier.tier].label}</span> clients have the highest win rate at <span className="font-medium text-foreground">{bestTier.winRate.toFixed(1)}%</span>.
              {bestTier.avgDealValue > 0 && ` Average deal: $${Math.round(bestTier.avgDealValue).toLocaleString()}.`}
            </p>
          )}
          {worstTier.tier === 'red_flag' && worstTier.count > 5 && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-destructive">⚠️ {worstTier.count} proposals</span> sent to red-flag clients. Consider being more selective with unverified clients.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
