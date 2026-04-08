import React, { useMemo } from 'react';
import { InboundMetric } from '@/hooks/useInboundMetrics';
import { useInboundInviteSources } from '@/hooks/useInboundInviteSources';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Props {
  metrics: InboundMetric[];
}

const SOURCE_COLORS: Record<string, string> = {
  search: 'hsl(210, 80%, 60%)',
  recommendation: 'hsl(270, 60%, 60%)',
  boosted: 'hsl(45, 90%, 55%)',
  direct: 'hsl(150, 60%, 50%)',
  other: 'hsl(0, 0%, 50%)',
};

export const InviteSourceChart: React.FC<Props> = ({ metrics }) => {
  const metricIds = useMemo(() => metrics.map(m => m.id), [metrics]);
  const { sources, loading } = useInboundInviteSources(metricIds);

  const pieData = useMemo(() => {
    const bySource: Record<string, number> = {};
    sources.forEach(s => {
      bySource[s.source] = (bySource[s.source] || 0) + s.count;
    });
    return Object.entries(bySource).map(([source, count]) => ({ name: source, value: count }));
  }, [sources]);

  const barData = useMemo(() => {
    const byPeriod: Record<string, Record<string, number>> = {};
    metrics.forEach(m => {
      const key = `${m.month_name} ${m.week_label || ''}`.trim();
      if (!byPeriod[key]) byPeriod[key] = {};
    });
    sources.forEach(s => {
      const metric = metrics.find(m => m.id === s.inbound_metric_id);
      if (metric) {
        const key = `${metric.month_name} ${metric.week_label || ''}`.trim();
        if (!byPeriod[key]) byPeriod[key] = {};
        byPeriod[key][s.source] = (byPeriod[key][s.source] || 0) + s.count;
      }
    });
    return Object.entries(byPeriod).map(([period, vals]) => ({ period, ...vals }));
  }, [metrics, sources]);

  const allSources = useMemo(() => {
    const s = new Set<string>();
    sources.forEach(src => s.add(src.source));
    return Array.from(s);
  }, [sources]);

  if (loading) return <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  if (sources.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No invite source data yet. Add invite source breakdowns to your inbound metrics to see charts here.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-base">Invite Sources Distribution</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map(entry => <Cell key={entry.name} fill={SOURCE_COLORS[entry.name] || SOURCE_COLORS.other} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(220, 15%, 11%)', border: '1px solid hsl(220, 15%, 20%)', borderRadius: '8px', color: 'hsl(0, 0%, 98%)' }} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-base">Sources by Period</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
              <XAxis dataKey="period" tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'hsl(220, 10%, 55%)', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(220, 15%, 11%)', border: '1px solid hsl(220, 15%, 20%)', borderRadius: '8px', color: 'hsl(0, 0%, 98%)' }} />
              <Legend />
              {allSources.map(s => <Bar key={s} dataKey={s} stackId="a" fill={SOURCE_COLORS[s] || SOURCE_COLORS.other} />)}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
