import React, { useState } from 'react';
import { useProposals } from '@/hooks/useProposals';
import { PipelineFunnel } from '@/components/analytics/PipelineFunnel';
import { WinLossAnalysis } from '@/components/analytics/WinLossAnalysis';
import { CategoryPerformance } from '@/components/analytics/CategoryPerformance';
import { ClientIntelligence } from '@/components/analytics/ClientIntelligence';
import { BiddingAnalytics } from '@/components/analytics/BiddingAnalytics';
import { ResponseTimeAnalytics } from '@/components/analytics/ResponseTimeAnalytics';
import { ConnectROI } from '@/components/analytics/ConnectROI';
import { Loader2, BarChart3, PieChart, Users, DollarSign, Clock, Zap } from 'lucide-react';
import { AppSettings } from '@/types';

interface AnalyticsProps {
  settings: AppSettings;
}

type AnalyticsSubTab = 'pipeline' | 'categories' | 'clients' | 'bidding' | 'connects';

const SUB_TABS: { id: AnalyticsSubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'pipeline', label: 'Pipeline', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'categories', label: 'Categories', icon: <PieChart className="w-4 h-4" /> },
  { id: 'clients', label: 'Clients', icon: <Users className="w-4 h-4" /> },
  { id: 'bidding', label: 'Bidding', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'connects', label: 'Connects', icon: <Zap className="w-4 h-4" /> },
];

export const Analytics: React.FC<AnalyticsProps> = ({ settings }) => {
  const { proposals, loading } = useProposals();
  const [activeSubTab, setActiveSubTab] = useState<AnalyticsSubTab>('pipeline');

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderSubContent = () => {
    switch (activeSubTab) {
      case 'pipeline':
        return (
          <div className="space-y-8">
            <PipelineFunnel proposals={proposals} />
            <WinLossAnalysis proposals={proposals} />
          </div>
        );
      case 'categories':
        return <CategoryPerformance proposals={proposals} />;
      case 'clients':
        return <ClientIntelligence proposals={proposals} />;
      case 'bidding':
        return (
          <div className="space-y-8">
            <BiddingAnalytics proposals={proposals} />
            <ResponseTimeAnalytics proposals={proposals} />
          </div>
        );
      case 'connects':
        return <ConnectROI proposals={proposals} connectCost={settings.connect_cost} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-card/50">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics</h2>
          <p className="text-sm text-muted-foreground">
            Business intelligence from {proposals.length} proposals
          </p>
        </div>
      </header>

      {/* Sub-tabs */}
      <div className="px-6 py-3 border-b border-border bg-card/30 flex gap-1">
        {SUB_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSubTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {renderSubContent()}
      </div>
    </div>
  );
};
