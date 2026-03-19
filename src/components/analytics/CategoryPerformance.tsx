import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getChartTooltipStyle, getAxisStyle, CHART_COLORS } from '@/lib/chartConfig';

interface CategoryPerformanceProps {
  proposals: Proposal[];
}

const PROFILE_COLORS = [
  CHART_COLORS.primary, CHART_COLORS.info, CHART_COLORS.warning,
  CHART_COLORS.purple, CHART_COLORS.success, CHART_COLORS.pink,
];

export const CategoryPerformance: React.FC<CategoryPerformanceProps> = ({ proposals }) => {
  const profileData = useMemo(() => {
    const byProfile: Record<string, Proposal[]> = {};
    proposals.forEach(p => {
      if (!byProfile[p.profile_name]) byProfile[p.profile_name] = [];
      byProfile[p.profile_name].push(p);
    });

    return Object.entries(byProfile).map(([name, props]) => {
      const total = props.length;
      const won = props.filter(p => p.status === 'won').length;
      const winRate = total > 0 ? (won / total) * 100 : 0;
      const dealValue = props.filter(p => p.status === 'won').reduce((s, p) => s + (p.deal_value || 0), 0);
      const avgDeal = won > 0 ? dealValue / won : 0;
      const totalConnects = props.reduce((s, p) => s + (p.connects_used || 0) - (p.returned_connects || 0), 0);
      const connectEfficiency = totalConnects > 0 ? dealValue / totalConnects : 0;

      return { name, total, won, winRate, avgDeal, totalDealValue: dealValue, totalConnects, connectEfficiency };
    }).sort((a, b) => b.totalDealValue - a.totalDealValue);
  }, [proposals]);

  const bubbleData = profileData.map(p => ({
    x: p.winRate,
    y: p.avgDeal,
    z: p.total,
    name: p.name,
  }));

  const jobTypeData = useMemo(() => {
    const types: Record<string, { total: number; won: number; revenue: number }> = {};
    proposals.forEach(p => {
      const type = p.job_type || 'fixed';
      if (!types[type]) types[type] = { total: 0, won: 0, revenue: 0 };
      types[type].total++;
      if (p.status === 'won') {
        types[type].won++;
        types[type].revenue += p.deal_value || 0;
      }
    });
    return Object.entries(types).map(([type, data]) => ({
      type,
      ...data,
      winRate: data.total > 0 ? (data.won / data.total) * 100 : 0,
    }));
  }, [proposals]);

  const axisStyle = getAxisStyle();

  return (
    <div className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <h3 className="text-lg font-bold text-foreground">Category & Profile Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th className="text-center">Proposals</th>
                <th className="text-center">Won</th>
                <th className="text-center">Win Rate</th>
                <th className="text-right">Avg Deal</th>
                <th className="text-right">Total Revenue</th>
                <th className="text-center">Net Connects</th>
                <th className="text-right">$/Connect</th>
              </tr>
            </thead>
            <tbody>
              {profileData.map((p, i) => (
                <tr key={p.name}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: PROFILE_COLORS[i % PROFILE_COLORS.length] }} />
                      <span className="font-medium text-foreground">{p.name}</span>
                    </div>
                  </td>
                  <td className="text-center tabular-nums">{p.total}</td>
                  <td className="text-center tabular-nums">{p.won}</td>
                  <td className="text-center">
                    <span className={`font-medium tabular-nums ${p.winRate > 10 ? 'text-success' : p.winRate > 5 ? 'text-warning' : 'text-muted-foreground'}`}>
                      {p.winRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-right tabular-nums">${Math.round(p.avgDeal).toLocaleString()}</td>
                  <td className="text-right tabular-nums font-semibold">${Math.round(p.totalDealValue).toLocaleString()}</td>
                  <td className="text-center tabular-nums">{p.totalConnects}</td>
                  <td className="text-right tabular-nums">${p.connectEfficiency.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bubble chart */}
      {bubbleData.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <h4 className="text-sm font-bold text-foreground">Profile Comparison</h4>
            <span className="text-xs text-muted-foreground">Win Rate vs Avg Deal • size = volume</span>
          </div>
          <div className="section-card-body">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ left: 20, bottom: 20 }}>
                  <XAxis type="number" dataKey="x" name="Win Rate" unit="%" {...axisStyle} label={{ value: 'Win Rate %', position: 'bottom', fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="number" dataKey="y" name="Avg Deal" unit="$" {...axisStyle} label={{ value: 'Avg Deal $', angle: -90, position: 'left', fill: 'hsl(var(--muted-foreground))' }} />
                  <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Proposals" />
                  <Tooltip
                    contentStyle={getChartTooltipStyle()}
                    formatter={(value: number, name: string) => {
                      if (name === 'Win Rate') return [`${value.toFixed(1)}%`, name];
                      if (name === 'Avg Deal') return [`$${Math.round(value).toLocaleString()}`, name];
                      return [value, name];
                    }}
                  />
                  <Scatter data={bubbleData}>
                    {bubbleData.map((_, i) => (
                      <Cell key={i} fill={PROFILE_COLORS[i % PROFILE_COLORS.length]} fillOpacity={0.75} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Job type breakdown */}
      <div>
        <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-[0.15em]">By Job Type</h4>
        <div className="grid grid-cols-2 gap-4">
          {jobTypeData.map(jt => (
            <div key={jt.type} className="metric-card">
              <p className="text-sm font-bold text-foreground capitalize mb-3">{jt.type}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Proposals</span><span className="font-medium tabular-nums">{jt.total}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Won</span><span className="font-medium tabular-nums">{jt.won}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Win Rate</span><span className="font-medium tabular-nums">{jt.winRate.toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Revenue</span><span className="font-semibold tabular-nums">${Math.round(jt.revenue).toLocaleString()}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};