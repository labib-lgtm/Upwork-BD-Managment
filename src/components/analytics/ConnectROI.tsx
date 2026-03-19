import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { getChartTooltipStyle, getAxisStyle, getGridStyle, CHART_COLORS } from '@/lib/chartConfig';
import { TrendingUp, TrendingDown, Zap, DollarSign } from 'lucide-react';

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
    connects: t.connects + p.netConnects, spend: t.spend + p.spend, revenue: t.revenue + p.revenue, won: t.won + p.won,
  }), { connects: 0, spend: 0, revenue: 0, won: 0 });

  const overallROAS = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  const overallRevenuePerConnect = totals.connects > 0 ? totals.revenue / totals.connects : 0;
  const axisStyle = getAxisStyle();

  return (
    <div className="space-y-6">
      {/* Key metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-foreground" />
            <p className="text-xs text-muted-foreground font-medium">Overall ROAS</p>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{overallROAS.toFixed(1)}x</p>
          <div className="mt-1.5">
            {overallROAS >= 5 ? <span className="text-xs text-success font-medium">● Excellent</span> : <span className="text-xs text-destructive font-medium">● Below target</span>}
          </div>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-foreground" />
            <p className="text-xs text-muted-foreground font-medium">Revenue / Connect</p>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">${overallRevenuePerConnect.toFixed(2)}</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-foreground" />
            <p className="text-xs text-muted-foreground font-medium">Total Net Connects</p>
          </div>
          <p className="text-2xl font-bold text-foreground tabular-nums">{totals.connects}</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground font-medium mb-2">Total Spend</p>
          <p className="text-2xl font-bold text-foreground tabular-nums">${Math.round(totals.spend).toLocaleString()}</p>
        </div>
      </div>

      {/* Monthly burn trend */}
      {monthlyBurn.length > 0 && (
        <div className="section-card">
          <div className="section-card-header">
            <h4 className="text-sm font-bold text-foreground">Monthly Connect Burn vs Revenue</h4>
          </div>
          <div className="section-card-body">
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyBurn}>
                  <CartesianGrid {...getGridStyle()} />
                  <XAxis dataKey="month" {...axisStyle} fontSize={11} />
                  <YAxis {...axisStyle} />
                  <Tooltip contentStyle={getChartTooltipStyle()} />
                  <Line type="monotone" dataKey="netConnects" name="Net Connects" stroke={CHART_COLORS.warning} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue ($)" stroke={CHART_COLORS.success} strokeWidth={2.5} dot={{ r: 4, strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Profile ROI table */}
      <div className="section-card">
        <div className="section-card-header">
          <h4 className="text-sm font-bold text-foreground">ROI by Profile</h4>
        </div>
        <div className="overflow-x-auto">
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
                  <td className="text-center tabular-nums">{p.total}</td>
                  <td className="text-center tabular-nums">{p.netConnects}</td>
                  <td className="text-right tabular-nums">${Math.round(p.spend).toLocaleString()}</td>
                  <td className="text-right tabular-nums font-semibold">${Math.round(p.revenue).toLocaleString()}</td>
                  <td className="text-center">
                    <span className={`font-semibold tabular-nums ${p.roas >= 5 ? 'text-success' : p.roas >= 1 ? 'text-warning' : 'text-destructive'}`}>
                      {p.roas.toFixed(1)}x
                    </span>
                  </td>
                  <td className="text-right tabular-nums">${p.revenuePerConnect.toFixed(2)}</td>
                  <td className="text-center">
                    {p.roas >= 5 ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 bg-green-500/15 text-success rounded-full">Double Down</span>
                    ) : p.roas >= 1 ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 bg-amber-500/15 text-warning rounded-full">Maintain</span>
                    ) : p.revenue > 0 ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 bg-red-500/15 text-destructive rounded-full">Review</span>
                    ) : (
                      <span className="text-[11px] font-bold px-2.5 py-1 bg-red-500/15 text-destructive rounded-full">Stop</span>
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