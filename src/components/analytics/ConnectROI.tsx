import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface ConnectROIProps {
  proposals: Proposal[];
  connectCost?: number;
}

export const ConnectROI: React.FC<ConnectROIProps> = ({ proposals, connectCost = 0.15 }) => {
  const profileROI = useMemo(() => {
    const byProfile: Record<string, Proposal[]> = {};
    proposals.forEach(p => {
      if (!byProfile[p.profile_name]) byProfile[p.profile_name] = [];
      byProfile[p.profile_name].push(p);
    });

    return Object.entries(byProfile).map(([name, props]) => {
      const totalConnects = props.reduce((s, p) => s + (p.connects_used || 0), 0);
      const returned = props.reduce((s, p) => s + (p.returned_connects || 0), 0);
      const netConnects = totalConnects - returned;
      const spend = netConnects * connectCost;
      const revenue = props.filter(p => p.status === 'won').reduce((s, p) => s + (p.deal_value || 0), 0);
      const won = props.filter(p => p.status === 'won').length;
      const roas = spend > 0 ? revenue / spend : 0;
      const revenuePerConnect = netConnects > 0 ? revenue / netConnects : 0;
      const costPerWin = won > 0 ? spend / won : 0;

      return { name, totalConnects, returned, netConnects, spend, revenue, won, roas, revenuePerConnect, costPerWin, total: props.length };
    }).sort((a, b) => b.roas - a.roas);
  }, [proposals, connectCost]);

  const monthlyBurn = useMemo(() => {
    const months: Record<string, { connects: number; returned: number; revenue: number }> = {};
    proposals.forEach(p => {
      const d = new Date(p.date_submitted || p.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { connects: 0, returned: 0, revenue: 0 };
      months[key].connects += p.connects_used || 0;
      months[key].returned += p.returned_connects || 0;
      if (p.status === 'won') months[key].revenue += p.deal_value || 0;
    });

    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, data]) => ({
        month: key.split('-').map((p, i) => i === 1 ? new Date(2000, Number(p) - 1).toLocaleString('default', { month: 'short' }) : p.slice(2)).reverse().join(' '),
        netConnects: data.connects - data.returned,
        spend: (data.connects - data.returned) * connectCost,
        revenue: data.revenue,
      }));
  }, [proposals, connectCost]);

  const totals = profileROI.reduce((t, p) => ({
    connects: t.connects + p.netConnects,
    spend: t.spend + p.spend,
    revenue: t.revenue + p.revenue,
    won: t.won + p.won,
  }), { connects: 0, spend: 0, revenue: 0, won: 0 });

  const overallROAS = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const overallRevenuePerConnect = totals.connects > 0 ? totals.revenue / totals.connects : 0;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-foreground">Connect ROI Dashboard</h3>

      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Overall ROAS</p>
          <p className="text-2xl font-bold text-foreground">{overallROAS.toFixed(1)}x</p>
          <div className="mt-1">
            {overallROAS >= 5 ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-destructive" />}
          </div>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Revenue / Connect</p>
          <p className="text-2xl font-bold text-foreground">${overallRevenuePerConnect.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Total Net Connects</p>
          <p className="text-2xl font-bold text-foreground">{totals.connects}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Total Spend</p>
          <p className="text-2xl font-bold text-foreground">${Math.round(totals.spend).toLocaleString()}</p>
        </div>
      </div>

      {/* Monthly burn trend */}
      {monthlyBurn.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Monthly Connect Burn vs Revenue</h4>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyBurn}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                <XAxis dataKey="month" stroke="hsl(220, 10%, 55%)" fontSize={11} />
                <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 15%, 11%)', border: '1px solid hsl(220, 15%, 20%)', borderRadius: '8px', color: 'hsl(0, 0%, 98%)' }} />
                <Line type="monotone" dataKey="netConnects" name="Net Connects" stroke="hsl(38, 92%, 50%)" strokeWidth={2} />
                <Line type="monotone" dataKey="revenue" name="Revenue ($)" stroke="hsl(142, 71%, 45%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Profile ROI table */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">ROI by Profile</h4>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th className="text-center">Proposals</th>
                <th className="text-center">Net Connects</th>
                <th className="text-right">Spend</th>
                <th className="text-right">Revenue</th>
                <th className="text-center">ROAS</th>
                <th className="text-right">$/Connect</th>
                <th className="text-center">Signal</th>
              </tr>
            </thead>
            <tbody>
              {profileROI.map(p => (
                <tr key={p.name}>
                  <td className="font-medium text-foreground">{p.name}</td>
                  <td className="text-center">{p.total}</td>
                  <td className="text-center">{p.netConnects}</td>
                  <td className="text-right tabular-nums">${Math.round(p.spend).toLocaleString()}</td>
                  <td className="text-right tabular-nums font-semibold">${Math.round(p.revenue).toLocaleString()}</td>
                  <td className="text-center">
                    <span className={p.roas >= 5 ? 'text-green-400' : p.roas >= 1 ? 'text-amber-400' : 'text-destructive'}>
                      {p.roas.toFixed(1)}x
                    </span>
                  </td>
                  <td className="text-right tabular-nums">${p.revenuePerConnect.toFixed(2)}</td>
                  <td className="text-center">
                    {p.roas >= 5 ? (
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Double Down</span>
                    ) : p.roas >= 1 ? (
                      <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">Maintain</span>
                    ) : p.revenue > 0 ? (
                      <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">Review</span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-full">Stop</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
