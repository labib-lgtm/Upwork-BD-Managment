import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface WinLossAnalysisProps {
  proposals: Proposal[];
}

const LOSS_COLORS = ['hsl(0, 84%, 60%)', 'hsl(38, 92%, 50%)', 'hsl(199, 89%, 48%)', 'hsl(280, 65%, 60%)', 'hsl(160, 60%, 45%)', 'hsl(330, 70%, 55%)', 'hsl(220, 10%, 55%)'];
const LOSS_REASONS = ['Outbid', 'No Response', 'Job Cancelled', 'Under-qualified', 'Price Mismatch', 'Slow Response', 'Other'];

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

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Won</p>
          <p className="text-2xl font-bold text-green-400">{totalWon}</p>
          <p className="text-xs text-muted-foreground">{total > 0 ? ((totalWon / total) * 100).toFixed(1) : 0}% of all</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Lost</p>
          <p className="text-2xl font-bold text-destructive">{totalLost}</p>
          <p className="text-xs text-muted-foreground">{total > 0 ? ((totalLost / total) * 100).toFixed(1) : 0}% of all</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Win/Loss Ratio</p>
          <p className="text-2xl font-bold text-foreground">{totalLost > 0 ? (totalWon / totalLost).toFixed(2) : totalWon > 0 ? '∞' : '0'}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Loss Reasons Pie */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Loss Reasons</h4>
          {lossReasonData.length > 0 ? (
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={lossReasonData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                    {lossReasonData.map((_, i) => (
                      <Cell key={i} fill={LOSS_COLORS[i % LOSS_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 15%, 11%)', border: '1px solid hsl(220, 15%, 20%)', borderRadius: '8px', color: 'hsl(0, 0%, 98%)' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No loss reasons recorded yet. Mark proposals as "lost" and add a reason.
            </div>
          )}
        </div>

        {/* Win Factors */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Win Factors</h4>
          {winFactorData.length > 0 ? (
            <div className="space-y-2">
              {winFactorData.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-secondary/50">
                  <span className="text-sm text-foreground">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${(f.value / (winFactorData[0]?.value || 1)) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-8 text-right">{f.value}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No win factors recorded yet. Mark proposals as "won" and add a factor.
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      {monthlyTrend.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Monthly Win/Loss Trend</h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 15%, 11%)', border: '1px solid hsl(220, 15%, 20%)', borderRadius: '8px', color: 'hsl(0, 0%, 98%)' }} />
                <Legend />
                <Line type="monotone" dataKey="won" stroke="hsl(142, 71%, 45%)" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="lost" stroke="hsl(0, 84%, 60%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
