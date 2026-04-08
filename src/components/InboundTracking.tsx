import React, { useState, useMemo } from 'react';
import { useInboundMetrics, InboundMetric } from '@/hooks/useInboundMetrics';
import { useAuth } from '@/contexts/AuthContext';
import { useBDProfiles, useAccessibleProfiles } from '@/hooks/useBDProfiles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Users, MessageSquare, TrendingUp, DollarSign, Zap, BarChart3, FlaskConical } from 'lucide-react';
import { InboundMetricsTable } from '@/components/inbound/InboundMetricsTable';
import { InviteSourceChart } from '@/components/inbound/InviteSourceChart';
import { ABTestTracker } from '@/components/inbound/ABTestTracker';
import { ScrollArea } from '@/components/ui/scroll-area';

export const InboundTracking: React.FC = () => {
  const { metrics, loading, addMetric, updateMetric, deleteMetric } = useInboundMetrics();
  const { accessibleProfiles } = useAccessibleProfiles();
  const [selectedProfile, setSelectedProfile] = useState<string>('all');

  const filteredMetrics = useMemo(() => {
    if (selectedProfile === 'all') return metrics;
    return metrics.filter(m => m.bd_profile_id === selectedProfile);
  }, [metrics, selectedProfile]);

  const kpis = useMemo(() => {
    const totals = filteredMetrics.reduce((acc, m) => ({
      impressions: acc.impressions + m.impressions,
      profileViews: acc.profileViews + m.profile_views,
      invites: acc.invites + m.invites,
      conversations: acc.conversations + m.conversations,
      closes: acc.closes + m.closes,
      sales: acc.sales + Number(m.total_sales),
      spend: acc.spend + Number(m.manual_spend),
    }), { impressions: 0, profileViews: 0, invites: 0, conversations: 0, closes: 0, sales: 0, spend: 0 });
    
    const convRate = totals.invites > 0 ? ((totals.closes / totals.invites) * 100) : 0;
    const boostROI = totals.spend > 0 ? (totals.sales / totals.spend) : 0;
    
    return { ...totals, convRate, boostROI };
  }, [filteredMetrics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpiCards = [
    { label: 'Impressions', value: kpis.impressions.toLocaleString(), icon: Eye, color: 'text-blue-400' },
    { label: 'Profile Views', value: kpis.profileViews.toLocaleString(), icon: Users, color: 'text-purple-400' },
    { label: 'Invites', value: kpis.invites.toLocaleString(), icon: MessageSquare, color: 'text-emerald-400' },
    { label: 'Conversations', value: kpis.conversations.toLocaleString(), icon: MessageSquare, color: 'text-cyan-400' },
    { label: 'Closes', value: kpis.closes.toLocaleString(), icon: TrendingUp, color: 'text-primary' },
    { label: 'Revenue', value: `$${kpis.sales.toLocaleString()}`, icon: DollarSign, color: 'text-green-400' },
    { label: 'Conv. Rate', value: `${kpis.convRate.toFixed(1)}%`, icon: Zap, color: 'text-yellow-400' },
    { label: 'Boost ROI', value: `${kpis.boostROI.toFixed(1)}x`, icon: BarChart3, color: 'text-orange-400' },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inbound Tracking</h1>
            <p className="text-sm text-muted-foreground mt-1">Track profile visibility, invites, and inbound conversions</p>
          </div>
          <Select value={selectedProfile} onValueChange={setSelectedProfile}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Profiles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Profiles</SelectItem>
              {accessibleProfiles.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {kpiCards.map(kpi => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                    <p className="text-xl font-bold text-foreground mt-1">{kpi.value}</p>
                  </div>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="metrics" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="sources">Invite Sources</TabsTrigger>
            <TabsTrigger value="abtests">A/B Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="metrics">
            <InboundMetricsTable
              metrics={filteredMetrics}
              profiles={accessibleProfiles}
              onAdd={addMetric}
              onUpdate={updateMetric}
              onDelete={deleteMetric}
            />
          </TabsContent>

          <TabsContent value="sources">
            <InviteSourceChart metrics={filteredMetrics} />
          </TabsContent>

          <TabsContent value="abtests">
            <ABTestTracker profiles={accessibleProfiles} />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};
