import React, { useMemo } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { getChartTooltipStyle, getAxisStyle, CHART_COLORS } from '@/lib/chartConfig';
import { Clock, Calendar } from 'lucide-react';

interface ResponseTimeAnalyticsProps {
  proposals: Proposal[];
}

const BRACKET_COLORS = [CHART_COLORS.success, CHART_COLORS.primary, CHART_COLORS.warning, CHART_COLORS.destructive];

export const ResponseTimeAnalytics: React.FC<ResponseTimeAnalyticsProps> = ({ proposals }) => {
  const timeData = useMemo(() => {
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
      bracket, total: data.total, won: data.won,
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
      day: day.slice(0, 3), total: buckets[day].total, won: buckets[day].won,
      winRate: buckets[day].total > 0 ? (buckets[day].won / buckets[day].total) * 100 : 0,
    }));
  }, [proposals]);

  const bestTime = timeData.reduce((best, t) => t.winRate > best.winRate && t.total >= 3 ? t : best, timeData[0] || { bracket: '-', winRate: 0, total: 0 });
  const bestDay = dayData.reduce((best, d) => d.winRate > best.winRate && d.total >= 3 ? d : best, dayData[0] || { day: '-', winRate: 0, total: 0 });
  const axisStyle = getAxisStyle();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Best Time Window</p>
          </div>
          <p className="text-xl font-bold text-primary">{bestTime?.bracket || '-'}</p>
          <p className="text-xs text-muted-foreground mt-1">{bestTime?.winRate.toFixed(1)}% win rate</p>
        </div>
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground font-medium">Best Day</p>
          </div>
          <p className="text-xl font-bold text-primary">{bestDay?.day || '-'}</p>
          <p className="text-xs text-muted-foreground mt-1">{bestDay?.winRate.toFixed(1)}% win rate</p>
        </div>
      </div>

      {/* Time of day chart */}
      <div className="section-card">
        <div className="section-card-header">
          <h4 className="text-sm font-bold text-foreground">Win Rate by Time of Day</h4>
        </div>
        <div className="section-card-body">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeData}>
                <XAxis dataKey="bracket" {...axisStyle} fontSize={11} />
                <YAxis {...axisStyle} unit="%" />
                <Tooltip contentStyle={getChartTooltipStyle()} />
                <Bar dataKey="winRate" name="Win Rate %" radius={[8, 8, 0, 0]} barSize={40}>
                  {timeData.map((_, i) => (
                    <Cell key={i} fill={BRACKET_COLORS[i % BRACKET_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Day of week chart */}
      <div className="section-card">
        <div className="section-card-header">
          <h4 className="text-sm font-bold text-foreground">Win Rate by Day of Week</h4>
        </div>
        <div className="section-card-body">
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayData}>
                <XAxis dataKey="day" {...axisStyle} />
                <YAxis {...axisStyle} unit="%" />
                <Tooltip contentStyle={getChartTooltipStyle()} />
                <Bar dataKey="winRate" name="Win Rate %" radius={[8, 8, 0, 0]} fill={CHART_COLORS.info} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};