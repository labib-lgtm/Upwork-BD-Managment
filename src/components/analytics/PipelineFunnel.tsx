import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getChartTooltipStyle, getAxisStyle, CHART_COLORS } from '@/lib/chartConfig';
import { TrendingDown, ArrowRight } from 'lucide-react';

interface PipelineFunnelProps {
  proposals: Proposal[];
}

const STAGE_COLORS = [
  CHART_COLORS.muted,
  CHART_COLORS.info,
  CHART_COLORS.warning,
  CHART_COLORS.success,
  CHART_COLORS.destructive,
];

export const PipelineFunnel: React.FC<PipelineFunnelProps> = ({ proposals }) => {
  const funnelData = useMemo(() => {
    const total = proposals.length;
    const viewed = proposals.filter(p => ['viewed', 'interviewed', 'won', 'lost'].includes(p.status)).length;
    const interviewed = proposals.filter(p => ['interviewed', 'won'].includes(p.status)).length;
    const won = proposals.filter(p => p.status === 'won').length;
    const lost = proposals.filter(p => p.status === 'lost').length;

    return [
      { name: 'Submitted', count: total, rate: 100 },
      { name: 'Viewed', count: viewed, rate: total > 0 ? (viewed / total) * 100 : 0 },
      { name: 'Interviewed', count: interviewed, rate: viewed > 0 ? (interviewed / viewed) * 100 : 0 },
      { name: 'Won', count: won, rate: interviewed > 0 ? (won / interviewed) * 100 : 0 },
      { name: 'Lost', count: lost, rate: interviewed > 0 ? (lost / interviewed) * 100 : 0 },
    ];
  }, [proposals]);

  const dropoffData = useMemo(() => {
    const total = proposals.length;
    const viewed = proposals.filter(p => ['viewed', 'interviewed', 'won', 'lost'].includes(p.status)).length;
    const interviewed = proposals.filter(p => ['interviewed', 'won'].includes(p.status)).length;
    const won = proposals.filter(p => p.status === 'won').length;

    return [
      { stage: 'Submit → View', dropoff: total > 0 ? ((total - viewed) / total * 100).toFixed(1) : '0', lost: total - viewed },
      { stage: 'View → Interview', dropoff: viewed > 0 ? ((viewed - interviewed) / viewed * 100).toFixed(1) : '0', lost: viewed - interviewed },
      { stage: 'Interview → Won', dropoff: interviewed > 0 ? ((interviewed - won) / interviewed * 100).toFixed(1) : '0', lost: interviewed - won },
    ];
  }, [proposals]);

  const axisStyle = getAxisStyle();

  return (
    <div className="space-y-6">
      <div className="section-card">
        <div className="section-card-header">
          <h3 className="text-lg font-bold text-foreground">Pipeline Funnel</h3>
          <span className="text-xs text-muted-foreground">{proposals.length} total proposals</span>
        </div>
        <div className="section-card-body">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData.slice(0, 4)} layout="vertical" margin={{ left: 80, right: 20 }}>
                <XAxis type="number" {...axisStyle} />
                <YAxis type="category" dataKey="name" {...axisStyle} width={80} />
                <Tooltip contentStyle={getChartTooltipStyle()} formatter={(value: number) => [value, 'Count']} />
                <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={32}>
                  {funnelData.slice(0, 4).map((_, i) => (
                    <Cell key={i} fill={STAGE_COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Drop-off Analysis */}
      <div>
        <h4 className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-[0.15em] flex items-center gap-2">
          <TrendingDown className="w-3.5 h-3.5" />
          Stage Drop-off
        </h4>
        <div className="grid grid-cols-3 gap-4">
          {dropoffData.map((d, i) => (
            <div key={i} className="metric-card">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                <span>{d.stage.split(' → ')[0]}</span>
                <ArrowRight className="w-3 h-3" />
                <span>{d.stage.split(' → ')[1]}</span>
              </div>
              <p className={`text-2xl font-bold tabular-nums ${Number(d.dropoff) > 70 ? 'text-destructive' : Number(d.dropoff) > 50 ? 'text-warning' : 'text-foreground'}`}>
                {d.dropoff}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">{d.lost} proposals dropped</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stage counts grid */}
      <div className="grid grid-cols-5 gap-3">
        {funnelData.map((stage, i) => (
          <div key={i} className="text-center p-4 rounded-xl bg-card border border-border/60">
            <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: STAGE_COLORS[i] }} />
            <p className="text-xl font-bold text-foreground tabular-nums">{stage.count}</p>
            <p className="text-xs text-muted-foreground font-medium">{stage.name}</p>
            <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">{stage.rate.toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};