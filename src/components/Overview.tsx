import React from 'react';
import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Inbox,
  Package,
  Settings,
  TrendingUp,
  Users,
  Target,
  Zap,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { NavigationTab } from '@/types';

interface OverviewProps {
  onNavigate?: (tab: NavigationTab) => void;
}

const features = [
  {
    icon: <LayoutDashboard className="w-5 h-5" />,
    title: 'Performance Dashboard',
    description: 'Real-time KPIs across your fiscal year — revenue, ROAS, close rates, and cost analysis at a glance with sparkline trends.',
    tab: 'dashboard' as NavigationTab,
    color: 'from-primary/20 to-primary/5',
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: 'Proposal Management',
    description: 'Track every proposal from submission to close. Log connects, client details, deal values, and win/loss attribution with Quick or Full entry modes.',
    tab: 'proposals' as NavigationTab,
    color: 'from-blue-500/20 to-blue-500/5',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: 'Advanced Analytics',
    description: 'Deep-dive into bidding patterns, pipeline funnels, client intelligence, win/loss analysis, and connect ROI breakdowns.',
    tab: 'analytics' as NavigationTab,
    color: 'from-violet-500/20 to-violet-500/5',
  },
  {
    icon: <Inbox className="w-5 h-5" />,
    title: 'Inbound Tracking',
    description: 'Monitor profile impressions, invites received, and inbound conversion rates from your profile visibility.',
    tab: 'inbound' as NavigationTab,
    color: 'from-amber-500/20 to-amber-500/5',
  },
  {
    icon: <Package className="w-5 h-5" />,
    title: 'Catalog Management',
    description: 'Manage project catalog items, track their performance metrics, and optimize your listings for better results.',
    tab: 'catalogs' as NavigationTab,
    color: 'from-emerald-500/20 to-emerald-500/5',
  },
  {
    icon: <Settings className="w-5 h-5" />,
    title: 'Settings & Configuration',
    description: 'Configure fiscal year, connect costs, target ROAS, team roles, BD profile access, and role-based permissions.',
    tab: 'settings' as NavigationTab,
    color: 'from-rose-500/20 to-rose-500/5',
  },
];

const highlights = [
  {
    icon: <Target className="w-5 h-5 text-primary" />,
    title: 'Goal Tracking',
    description: 'Set monthly targets for proposals, closes, and revenue. Track progress with visual indicators.',
  },
  {
    icon: <TrendingUp className="w-5 h-5 text-primary" />,
    title: 'ROAS Optimization',
    description: 'Measure return on ad spend for every connect invested. Identify the most profitable bidding strategies.',
  },
  {
    icon: <Users className="w-5 h-5 text-primary" />,
    title: 'Multi-Profile Support',
    description: 'Manage multiple BD profiles with independent tracking and cross-profile analytics.',
  },
  {
    icon: <Zap className="w-5 h-5 text-primary" />,
    title: 'Connect Economics',
    description: 'Track net connects, boosted connects, returned connects, and cost-per-action at every funnel stage.',
  },
  {
    icon: <Shield className="w-5 h-5 text-primary" />,
    title: 'Role-Based Access',
    description: 'Admin, Manager, and BD Member roles with granular tab-level permissions and profile-level access control.',
  },
];

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* Hero Section */}
      <header className="page-header">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-widest uppercase text-primary">Overview</span>
          </div>
          <h2 className="page-title text-3xl">Lynx Media BD Tracker</h2>
          <p className="page-subtitle max-w-2xl">
            Your all-in-one business development command center. Track proposals, analyze performance,
            optimize connect spend, and close more deals — all in one place.
          </p>
        </div>
      </header>

      {/* Key Capabilities */}
      <div className="px-6 py-4">
        <h3 className="text-sm font-bold text-foreground/70 uppercase tracking-widest mb-4">Key Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {highlights.map((item, idx) => (
            <div key={idx} className="metric-card flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {item.icon}
                <span className="text-sm font-semibold text-foreground">{item.title}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modules Grid */}
      <div className="px-6 py-4 pb-8">
        <h3 className="text-sm font-bold text-foreground/70 uppercase tracking-widest mb-4">Modules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, idx) => (
            <button
              key={idx}
              onClick={() => onNavigate?.(feature.tab)}
              className="section-card text-left group cursor-pointer hover:border-primary/30 transition-all duration-200"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 text-foreground`}>
                {feature.icon}
              </div>
              <h4 className="text-sm font-bold text-foreground mb-1.5">{feature.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{feature.description}</p>
              <div className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Go to {feature.title.split(' ')[0]} <ArrowRight className="w-3 h-3" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
