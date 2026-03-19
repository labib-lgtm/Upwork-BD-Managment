import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { getChartTooltipStyle, getAxisStyle, getGridStyle, CHART_COLORS } from '@/lib/chartConfig';
import { Trophy, XCircle, TrendingUp } from 'lucide-react';

interface WinLossAnalysisProps {
  proposals: Proposal[];
}

const LOSS_COLORS = [CHART_COLORS.destructive, CHART_COLORS.warning, CHART_COLORS.info, CHART_COLORS.purple, CHART_COLORS.teal, CHART_COLORS.pink, CHART_COLORS.muted];

export const WinLossAnalysis: React.FC<WinLossAnalysisProps> = ({ proposals }) => {
  const lossReasonData = useMemo(() => {
    const lost = proposals.filter(p => p.status === 'lost');
    const counts: Record<string, number> = {};
    lost.forEach(p => {
      const reason = (p as any).loss_reason || 'Not Specified';
      counts[reason] = (counts[reason] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [proposals]);

  const winFactorData = useMemo(() => {
    const won = proposals.filter(p => p.status === 'won');
    const counts: Record<string, number> = {};
    won.forEach(p => {
      const factor = (p as any).win_factor || 'Not Specified';
      counts[factor] = (counts[factor] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [proposals]);

  const monthlyTrend = useMemo(() => {
    const months: Record<string, { month: string; won: number; lost: number }> = {};
    proposals.filter(p => p.status === 'won' || p.status === 'lost').forEach(p => {
      const d = new Date(p.date_submitted || p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { month: label, won: 0, lost: 0 };
      if (p.status === 'won') months[key].won++;
      else months[key].lost++;
    });
    return Object.entries(months).sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [proposals]);

  const totalWon = proposals.filter(p => p.status === 'won').length;
  const totalLost = proposals.filter(p => p.status === 'lost').length;
  const total = proposals.length;
  const axisStyle = getAxisStyle();

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-success" />
            <p className="text-xs text-muted-foreground font-medium">Won</p>
          </div>
          <p className="text-2xl font-bold text-success tabular-nums">{totalWon}</p>
          <p className="text-xs text-muted-foreground mt-1">{total > 0 ? ((totalWon / total) * 100).toFixed(1) : 0}% of all</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <p className="text-xs text-muted-foreground font-medium">Lost</p>
          </div>
          <p className="text-2xl font-bold text-destructive tabular-nums">{totalLost}</p>
          <p className="text-xs text-muted-foreground mt-1">{total > 0 ? ((totalLost / total) * 100).toFixed(1) : 0}% of all</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-foreground" />
            <p className="text-xs text-muted-foreground font-medium">Win/Loss Ratio</p>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{totalLost > 0 ? (totalWon / totalLost).toFixed(2) : totalWon > 0 ? '∞' : '0'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Loss Reasons Pie */}
        <div className="section-card">
          <div className="section-card-header">
            <h4 className="text-sm font-bold text-foreground">Loss Reasons</h4>
          </div>
          <div className="section-card-body">
            {lossReasonData.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={lossReasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11} strokeWidth={2} stroke="hsl(var(--card))">
                      {lossReasonData.map((_, i) => (
                        <Cell key={i} fill={LOSS_COLORS[i % LOSS_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={getChartTooltipStyle()} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                No loss reasons recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Win Factors */}
        <div className="section-card">
          <div className="section-card-header">
            <h4 className="text-sm font-bold text-foreground">Win Factors</h4>
          </div>
          <div className="section-card-body">
            {winFactorData.length > 0 ? (
              <div className="space-y-2.5">
                {winFactorData.map((f, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30">
                    <span className="text-sm text-foreground font-medium">{f.name}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-28 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${(f.value / (winFactorData[0]?.value || 1)) * 100}%` }} />
                      </div>
                      <span className="text-sm font-bold text-foreground w-8 text-right tabular-nums">{f.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                No win factors recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      {monthlyTrend.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <h4 className="text-sm font-bold text-foreground">Monthly Win/Loss Trend</h4>
          </div>
          <div className="section-card-body">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrend}>
                  <CartesianGrid {...getGridStyle()} />
                  <XAxis dataKey="month" {...axisStyle} />
                  <YAxis {...axisStyle} />
                  <Tooltip contentStyle={getChartTooltipStyle()} />
                  <Legend />
                  <Line type="monotone" dataKey="won" stroke={CHART_COLORS.success} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="lost" stroke={CHART_COLORS.destructive} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};