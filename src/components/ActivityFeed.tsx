import React, { useState, useMemo } from 'react';
import { format, formatDistanceToNow, subDays, startOfDay, endOfDay, isWithinInterval, startOfToday, startOfYesterday, endOfYesterday } from 'date-fns';
import { CalendarIcon, Clock, TrendingUp, TrendingDown, FileText, Eye, MessageSquare, Zap, Filter } from 'lucide-react';
import { useProposals, Proposal } from '@/hooks/useProposals';
import { useFollowUps } from '@/hooks/useFollowUps';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { DateRange } from 'react-day-picker';

interface ActivityEvent {
  id: string;
  type: 'submitted' | 'won' | 'lost' | 'status_change' | 'follow_up';
  title: string;
  description: string;
  profile: string;
  timestamp: Date;
  dealValue?: number;
}

const quickFilters = [
  { label: 'Today', key: 'today' },
  { label: 'Yesterday', key: 'yesterday' },
  { label: 'Last 3 Days', key: '3d' },
  { label: 'Last 7 Days', key: '7d' },
  { label: 'Last 30 Days', key: '30d' },
] as const;

type QuickFilterKey = typeof quickFilters[number]['key'];

function getQuickFilterRange(key: QuickFilterKey): { from: Date; to: Date } {
  const now = new Date();
  switch (key) {
    case 'today': return { from: startOfToday(), to: now };
    case 'yesterday': return { from: startOfYesterday(), to: endOfYesterday() };
    case '3d': return { from: startOfDay(subDays(now, 3)), to: now };
    case '7d': return { from: startOfDay(subDays(now, 7)), to: now };
    case '30d': return { from: startOfDay(subDays(now, 30)), to: now };
  }
}

export const ActivityFeed: React.FC = () => {
  const { proposals, loading: proposalsLoading } = useProposals();
  const { followUps, loading: followUpsLoading } = useFollowUps();

  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilterKey>('7d');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [profileFilter, setProfileFilter] = useState<string>('all');

  const dateRange = useMemo(() => {
    if (customRange?.from && customRange?.to) {
      return { from: startOfDay(customRange.from), to: endOfDay(customRange.to) };
    }
    return getQuickFilterRange(activeQuickFilter);
  }, [activeQuickFilter, customRange]);

  const handleQuickFilter = (key: QuickFilterKey) => {
    setActiveQuickFilter(key);
    setCustomRange(undefined);
  };

  const handleCustomRange = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      setActiveQuickFilter(undefined as any);
    }
  };

  const profileNames = useMemo(() => {
    const names = new Set(proposals.map(p => p.profile_name));
    return Array.from(names).sort();
  }, [proposals]);

  const filteredProposals = useMemo(() => {
    return proposals.filter(p => {
      const createdAt = new Date(p.created_at);
      const updatedAt = new Date(p.updated_at);
      const inRange = isWithinInterval(createdAt, dateRange) || isWithinInterval(updatedAt, dateRange);
      if (!inRange) return false;
      if (profileFilter !== 'all' && p.profile_name !== profileFilter) return false;
      return true;
    });
  }, [proposals, dateRange, profileFilter]);

  const activityEvents = useMemo(() => {
    const events: ActivityEvent[] = [];

    filteredProposals.forEach(p => {
      const createdAt = new Date(p.created_at);
      const updatedAt = new Date(p.updated_at);

      if (isWithinInterval(createdAt, dateRange)) {
        events.push({
          id: `${p.id}-created`,
          type: 'submitted',
          title: p.job_title,
          description: `New proposal submitted`,
          profile: p.profile_name,
          timestamp: createdAt,
        });
      }

      if (p.status === 'won' && isWithinInterval(updatedAt, dateRange)) {
        events.push({
          id: `${p.id}-won`,
          type: 'won',
          title: p.job_title,
          description: `Deal won${p.deal_value ? ` — $${p.deal_value.toLocaleString()}` : ''}`,
          profile: p.profile_name,
          timestamp: updatedAt,
          dealValue: p.deal_value,
        });
      }

      if (p.status === 'lost' && isWithinInterval(updatedAt, dateRange)) {
        events.push({
          id: `${p.id}-lost`,
          type: 'lost',
          title: p.job_title,
          description: `Proposal lost${p.loss_reason ? ` — ${p.loss_reason}` : ''}`,
          profile: p.profile_name,
          timestamp: updatedAt,
        });
      }
    });

    followUps.forEach(f => {
      const fDate = new Date(f.created_at);
      if (isWithinInterval(fDate, dateRange)) {
        const proposal = proposals.find(p => p.id === f.proposal_id);
        events.push({
          id: `fu-${f.id}`,
          type: 'follow_up',
          title: proposal?.job_title || 'Unknown Proposal',
          description: `Follow-up ${f.status === 'completed' ? 'completed' : f.status === 'pending' ? 'scheduled' : f.status}`,
          profile: proposal?.profile_name || '',
          timestamp: fDate,
        });
      }
    });

    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [filteredProposals, followUps, proposals, dateRange]);

  // Stats
  const stats = useMemo(() => {
    const totalProposals = filteredProposals.length;
    const totalConnects = filteredProposals.reduce((sum, p) => sum + (p.connects_used || 0) + (p.boosted_connects || 0), 0);
    const wins = filteredProposals.filter(p => p.status === 'won').length;
    const losses = filteredProposals.filter(p => p.status === 'lost').length;
    const revenue = filteredProposals.filter(p => p.status === 'won').reduce((sum, p) => sum + (p.deal_value || 0), 0);
    const pendingFollowUps = followUps.filter(f => {
      const fDate = new Date(f.created_at);
      return f.status === 'pending' && isWithinInterval(fDate, dateRange);
    }).length;
    return { totalProposals, totalConnects, wins, losses, revenue, pendingFollowUps };
  }, [filteredProposals, followUps, dateRange]);

  const getEventIcon = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'submitted': return <FileText className="h-4 w-4" />;
      case 'won': return <TrendingUp className="h-4 w-4" />;
      case 'lost': return <TrendingDown className="h-4 w-4" />;
      case 'follow_up': return <MessageSquare className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: ActivityEvent['type']) => {
    switch (type) {
      case 'submitted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'won': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'lost': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'follow_up': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const loading = proposalsLoading || followUpsLoading;

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Activity Feed</h1>
        <p className="text-sm text-muted-foreground mt-1">Track proposal events and updates across any timeframe</p>
      </div>

      {/* Controls */}
      <div className="px-6 py-4 border-b border-border flex flex-wrap items-center gap-3">
        {/* Quick Filters */}
        <div className="flex items-center gap-1.5">
          {quickFilters.map(f => (
            <Button
              key={f.key}
              variant={activeQuickFilter === f.key && !customRange ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-8"
              onClick={() => handleQuickFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Custom Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className={cn("text-xs h-8 gap-1.5", customRange?.from && customRange?.to && "border-primary text-primary")}>
              <CalendarIcon className="h-3.5 w-3.5" />
              {customRange?.from && customRange?.to
                ? `${format(customRange.from, 'MMM d')} – ${format(customRange.to, 'MMM d')}`
                : 'Custom Range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={handleCustomRange}
              numberOfMonths={2}
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        {/* Profile Filter */}
        <Select value={profileFilter} onValueChange={setProfileFilter}>
          <SelectTrigger className="w-[180px] h-8 text-xs">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="All Profiles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Profiles</SelectItem>
            {profileNames.map(name => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Proposals', value: stats.totalProposals },
              { label: 'Connects Spent', value: stats.totalConnects },
              { label: 'Wins', value: stats.wins },
              { label: 'Losses', value: stats.losses },
              { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}` },
              { label: 'Pending Follow-ups', value: stats.pendingFollowUps },
            ].map(s => (
              <Card key={s.label} className="bg-card">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Activity Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Activity Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activityEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No activity found for this period</p>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {activityEvents.slice(0, 50).map(event => (
                        <div key={event.id} className="flex items-start gap-3">
                          <div className={cn("mt-0.5 p-1.5 rounded-md border", getEventColor(event.type))}>
                            {getEventIcon(event.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{event.profile}</Badge>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Data Table */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Proposals ({filteredProposals.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Date</TableHead>
                          <TableHead className="text-xs">Profile</TableHead>
                          <TableHead className="text-xs">Job Title</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs text-right">Connects</TableHead>
                          <TableHead className="text-xs text-right">Budget</TableHead>
                          <TableHead className="text-xs">Country</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProposals.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                              No proposals found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredProposals.slice(0, 100).map(p => (
                            <TableRow key={p.id}>
                              <TableCell className="text-xs">{p.date_submitted ? format(new Date(p.date_submitted), 'MMM d') : '—'}</TableCell>
                              <TableCell className="text-xs">{p.profile_name}</TableCell>
                              <TableCell className="text-xs max-w-[180px] truncate">{p.job_title}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={cn("text-[10px]",
                                  p.status === 'won' && 'border-emerald-500/30 text-emerald-400',
                                  p.status === 'lost' && 'border-red-500/30 text-red-400',
                                  p.status === 'pending' && 'border-amber-500/30 text-amber-400',
                                )}>
                                  {p.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-right">{p.connects_used + p.boosted_connects}</TableCell>
                              <TableCell className="text-xs text-right">${p.budget?.toLocaleString() || 0}</TableCell>
                              <TableCell className="text-xs">{p.client_country || '—'}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
