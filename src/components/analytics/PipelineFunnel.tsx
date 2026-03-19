import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PipelineFunnelProps {
  proposals: Proposal[];
}

const STAGE_COLORS = [
  'hsl(220, 10%, 55%)',   // submitted (muted)
  'hsl(199, 89%, 48%)',   // viewed (info)
  'hsl(38, 92%, 50%)',    // interviewed (warning)
  'hsl(142, 71%, 45%)',   // won (success)
  'hsl(0, 84%, 60%)',     // lost (destructive)
];

export const PipelineFunnel: React.FC<PipelineFunnelProps> = ({ proposals }) => {
  const funnelData = useMemo(() => {
    const total = proposals.length;
    const viewed = proposals.filter(p => ['viewed', 'interviewed', 'won', 'lost'].includes(p.status)).length;
    const interviewed = proposals.filter(p => ['interviewed', 'won'].includes(p.status)).length;
    const won = proposals.filter(p => p.status === 'won').length;
    const lost = proposals.filter(p => p.status === 'lost').length;

    const stages = [
      { name: 'Submitted', count: total, rate: 100 },
      { name: 'Viewed', count: viewed, rate: total > 0 ? (viewed / total) * 100 : 0 },
      { name: 'Interviewed', count: interviewed, rate: viewed > 0 ? (interviewed / viewed) * 100 : 0 },
      { name: 'Won', count: won, rate: interviewed > 0 ? (won / interviewed) * 100 : 0 },
      { name: 'Lost', count: lost, rate: interviewed > 0 ? (lost / interviewed) * 100 : 0 },
    ];
    return stages;
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4">Pipeline Funnel</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData.slice(0, 4)} layout="vertical" margin={{ left: 80 }}>
              <XAxis type="number" stroke="hsl(220, 10%, 55%)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={12} width={80} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(220, 15%, 11%)', border: '1px solid hsl(220, 15%, 20%)', borderRadius: '8px', color: 'hsl(0, 0%, 98%)' }}
                formatter={(value: number, name: string) => [value, 'Count']}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {funnelData.slice(0, 4).map((_, i) => (
                  <Cell key={i} fill={STAGE_COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Drop-off Analysis */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Stage Drop-off</h4>
        <div className="grid grid-cols-3 gap-4">
          {dropoffData.map((d, i) => (
            <div key={i} className="metric-card">
              <p className="text-xs text-muted-foreground mb-1">{d.stage}</p>
              <p className={`text-2xl font-bold ${Number(d.dropoff) > 70 ? 'text-destructive' : Number(d.dropoff) > 50 ? 'text-amber-400' : 'text-foreground'}`}>
                {d.dropoff}%
              </p>
              <p className="text-xs text-muted-foreground">{d.lost} proposals lost</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stage counts grid */}
      <div className="grid grid-cols-5 gap-3">
        {funnelData.map((stage, i) => (
          <div key={i} className="text-center p-3 rounded-lg bg-secondary/50">
            <div className="w-3 h-3 rounded-full mx-auto mb-2" style={{ backgroundColor: STAGE_COLORS[i] }} />
            <p className="text-xl font-bold text-foreground">{stage.count}</p>
            <p className="text-xs text-muted-foreground">{stage.name}</p>
            <p className="text-xs text-muted-foreground">{stage.rate.toFixed(1)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
};
