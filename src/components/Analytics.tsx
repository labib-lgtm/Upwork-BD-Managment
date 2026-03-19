import React, { useState } from 'react';
import { useProposals } from '@/hooks/useProposals';
import { PipelineFunnel } from '@/components/analytics/PipelineFunnel';
import { WinLossAnalysis } from '@/components/analytics/WinLossAnalysis';
import { CategoryPerformance } from '@/components/analytics/CategoryPerformance';
import { ClientIntelligence } from '@/components/analytics/ClientIntelligence';
import { BiddingAnalytics } from '@/components/analytics/BiddingAnalytics';
import { ResponseTimeAnalytics } from '@/components/analytics/ResponseTimeAnalytics';
import { ConnectROI } from '@/components/analytics/ConnectROI';
import { Loader2, BarChart3, PieChart, Users, DollarSign, Zap } from 'lucide-react';
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
          <div className="space-y-8 animate-fade-in">
            <PipelineFunnel proposals={proposals} />
            <WinLossAnalysis proposals={proposals} />
          </div>
        );
      case 'categories':
        return <div className="animate-fade-in"><CategoryPerformance proposals={proposals} /></div>;
      case 'clients':
        return <div className="animate-fade-in"><ClientIntelligence proposals={proposals} /></div>;
      case 'bidding':
        return (
          <div className="space-y-8 animate-fade-in">
            <BiddingAnalytics proposals={proposals} />
            <ResponseTimeAnalytics proposals={proposals} />
          </div>
        );
      case 'connects':
        return <div className="animate-fade-in"><ConnectROI proposals={proposals} connectCost={settings.connect_cost} /></div>;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="page-title">Analytics</h2>
            <p className="page-subtitle">
              Business intelligence from {proposals.length} proposals
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Live data
          </div>
        </div>
      </header>

      {/* Sub-tabs */}
      <div className="px-6 py-3 border-b border-border">
        <div className="sub-tab-nav">
          {SUB_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`sub-tab-btn ${
                activeSubTab === tab.id ? 'sub-tab-btn-active' : 'sub-tab-btn-inactive'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 bg-lynx-pattern">
        {renderSubContent()}
      </div>
    </div>
  );
};