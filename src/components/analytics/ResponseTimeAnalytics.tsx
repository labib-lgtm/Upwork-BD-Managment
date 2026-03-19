import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ResponseTimeAnalyticsProps {
  proposals: Proposal[];
}

const BRACKET_COLORS = ['hsl(142, 71%, 45%)', 'hsl(72, 100%, 50%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

export const ResponseTimeAnalytics: React.FC<ResponseTimeAnalyticsProps> = ({ proposals }) => {
  const timeData = useMemo(() => {
    // Use the time component of created_at as a proxy for submission speed
    // Group by hour of day to identify optimal submission times
    const hourBuckets: Record<string, { total: number; won: number }> = {};

    proposals.forEach(p => {
      const d = new Date(p.created_at);
      const hour = d.getHours();
      let bracket: string;
      if (hour >= 6 && hour < 10) bracket = 'Morning (6-10am)';
      else if (hour >= 10 && hour < 14) bracket = 'Midday (10am-2pm)';
      else if (hour >= 14 && hour < 18) bracket = 'Afternoon (2-6pm)';
      else bracket = 'Off-hours';

      if (!hourBuckets[bracket]) hourBuckets[bracket] = { total: 0, won: 0 };
      hourBuckets[bracket].total++;
      if (p.status === 'won') hourBuckets[bracket].won++;
    });

    return Object.entries(hourBuckets).map(([bracket, data]) => ({
      bracket,
      total: data.total,
      won: data.won,
      winRate: data.total > 0 ? (data.won / data.total) * 100 : 0,
    }));
  }, [proposals]);

  const dayData = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const buckets: Record<string, { total: number; won: number }> = {};
    days.forEach(d => { buckets[d] = { total: 0, won: 0 }; });

    proposals.forEach(p => {
      const d = new Date(p.date_submitted || p.created_at);
      const day = days[d.getDay()];
      buckets[day].total++;
      if (p.status === 'won') buckets[day].won++;
    });

    return days.map(day => ({
      day: day.slice(0, 3),
      total: buckets[day].total,
      won: buckets[day].won,
      winRate: buckets[day].total > 0 ? (buckets[day].won / buckets[day].total) * 100 : 0,
    }));
  }, [proposals]);

  const bestTime = timeData.reduce((best, t) => t.winRate > best.winRate && t.total >= 3 ? t : best, timeData[0] || { bracket: '-', winRate: 0, total: 0 });
  const bestDay = dayData.reduce((best, d) => d.winRate > best.winRate && d.total >= 3 ? d : best, dayData[0] || { day: '-', winRate: 0, total: 0 });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-foreground">Submission Timing Analysis</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Best Time Window</p>
          <p className="text-xl font-bold text-primary">{bestTime?.bracket || '-'}</p>
          <p className="text-xs text-muted-foreground">{bestTime?.winRate.toFixed(1)}% win rate</p>
        </div>
        <div className="metric-card">
          <p className="text-xs text-muted-foreground">Best Day</p>
          <p className="text-xl font-bold text-primary">{bestDay?.day || '-'}</p>
          <p className="text-xs text-muted-foreground">{bestDay?.winRate.toFixed(1)}% win rate</p>
        </div>
      </div>

      {/* Time of day chart */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Win Rate by Time of Day</h4>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timeData}>
              <XAxis dataKey="bracket" stroke="hsl(220, 10%, 55%)" fontSize={11} />
              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 15%, 11%)', border: '1px solid hsl(220, 15%, 20%)', borderRadius: '8px', color: 'hsl(0, 0%, 98%)' }} />
              <Bar dataKey="winRate" name="Win Rate %" radius={[6, 6, 0, 0]}>
                {timeData.map((_, i) => (
                  <Cell key={i} fill={BRACKET_COLORS[i % BRACKET_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Day of week chart */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">Win Rate by Day of Week</h4>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dayData}>
              <XAxis dataKey="day" stroke="hsl(220, 10%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} unit="%" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(220, 15%, 11%)', border: '1px solid hsl(220, 15%, 20%)', borderRadius: '8px', color: 'hsl(0, 0%, 98%)' }} />
              <Bar dataKey="winRate" name="Win Rate %" radius={[6, 6, 0, 0]} fill="hsl(199, 89%, 48%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
