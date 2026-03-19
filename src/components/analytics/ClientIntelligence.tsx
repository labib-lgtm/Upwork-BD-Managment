import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { getTierStats, ClientTier } from '@/lib/clientTier';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getChartTooltipStyle, getAxisStyle, CHART_COLORS } from '@/lib/chartConfig';
import { Shield, AlertTriangle, Lightbulb } from 'lucide-react';

interface ClientIntelligenceProps {
  proposals: Proposal[];
}

const TIER_CONFIG: Record<ClientTier, { label: string; color: string; description: string }> = {
  tier1: { label: 'Tier 1', color: CHART_COLORS.success, description: 'Verified, 10+ hires, $50K+ spent' },
  tier2: { label: 'Tier 2', color: CHART_COLORS.info, description: 'Verified, 3-9 hires, $10K-$50K spent' },
  tier3: { label: 'Tier 3', color: CHART_COLORS.warning, description: 'Verified, 1-2 hires, <$10K spent' },
  red_flag: { label: 'Red Flag', color: CHART_COLORS.destructive, description: 'Unverified or $0 spent' },
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
  const axisStyle = getAxisStyle();

  return (
    <div className="space-y-6">
      {/* Tier cards */}
      <div className="grid grid-cols-4 gap-4">
        {tierStats.map(t => {
          const config = TIER_CONFIG[t.tier];
          return (
            <div key={t.tier} className="metric-card">
              <div className="flex items-center gap-2 mb-3">
                {t.tier === 'red_flag' ? (
                  <AlertTriangle className="w-4 h-4" style={{ color: config.color }} />
                ) : (
                  <Shield className="w-4 h-4" style={{ color: config.color }} />
                )}
                <span className="text-sm font-bold" style={{ color: config.color }}>{config.label}</span>
              </div>
              <p className="text-3xl font-bold text-foreground tabular-nums">{t.count}</p>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Win Rate</span>
                  <span className="font-semibold text-foreground tabular-nums">{t.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Won</span>
                  <span className="font-semibold text-foreground tabular-nums">{t.wonCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Deal</span>
                  <span className="font-semibold text-foreground tabular-nums">${Math.round(t.avgDealValue).toLocaleString()}</span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-3 pt-2 border-t border-border/40">{config.description}</p>
            </div>
          );
        })}
      </div>

      {/* Win rate by tier chart */}
      <div className="section-card">
        <div className="section-card-header">
          <h4 className="text-sm font-bold text-foreground">Win Rate by Client Tier</h4>
        </div>
        <div className="section-card-body">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" {...axisStyle} />
                <YAxis {...axisStyle} unit="%" />
                <Tooltip contentStyle={getChartTooltipStyle()} />
                <Bar dataKey="Win Rate" radius={[8, 8, 0, 0]} barSize={48}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights */}
      {bestTier && worstTier && bestTier.count > 0 && (
        <div className="section-card border-primary/20 bg-primary/[0.03]">
          <div className="section-card-body">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-bold text-foreground">Insights</h4>
            </div>
            <div className="space-y-2">
              {bestTier.winRate > 0 && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-success">{TIER_CONFIG[bestTier.tier].label}</span> clients have the highest win rate at <span className="font-semibold text-foreground">{bestTier.winRate.toFixed(1)}%</span>.
                  {bestTier.avgDealValue > 0 && ` Average deal: $${Math.round(bestTier.avgDealValue).toLocaleString()}.`}
                </p>
              )}
              {worstTier.tier === 'red_flag' && worstTier.count > 5 && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold text-destructive">⚠️ {worstTier.count} proposals</span> sent to red-flag clients. Consider being more selective with unverified clients.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};