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
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { NavigationTab } from '@/types';

interface OverviewProps {
  onNavigate?: (tab: NavigationTab) => void;
}

const features = [
  {
    icon: LayoutDashboard,
    title: 'Performance Dashboard',
    description:
      'Real-time KPIs across your fiscal year — revenue, ROAS, close rates, and cost analysis at a glance with sparkline trends.',
    tab: 'dashboard' as NavigationTab,
    cta: 'Open Dashboard',
  },
  {
    icon: FileText,
    title: 'Proposal Management',
    description:
      'Track every proposal from submission to close. Log connects, client details, deal values, and win/loss attribution.',
    tab: 'proposals' as NavigationTab,
    cta: 'Manage Proposals',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description:
      'Deep-dive into bidding patterns, pipeline funnels, client intelligence, win/loss analysis, and connect ROI.',
    tab: 'analytics' as NavigationTab,
    cta: 'View Analytics',
  },
  {
    icon: Inbox,
    title: 'Inbound Tracking',
    description:
      'Monitor profile impressions, invites received, and inbound conversion rates from your profile visibility.',
    tab: 'inbound' as NavigationTab,
    cta: 'Track Inbound',
  },
  {
    icon: Package,
    title: 'Catalog Management',
    description:
      'Manage project catalog items, track their performance metrics, and optimize your listings for better results.',
    tab: 'catalogs' as NavigationTab,
    cta: 'Open Catalogs',
  },
  {
    icon: Settings,
    title: 'Settings & Configuration',
    description:
      'Configure fiscal year, connect costs, target ROAS, team roles, BD profile access, and role-based permissions.',
    tab: 'settings' as NavigationTab,
    cta: 'Configure',
  },
];

const highlights = [
  {
    icon: Target,
    title: 'Goal Tracking',
    description: 'Monthly targets for proposals, closes, and revenue with visual progress.',
  },
  {
    icon: TrendingUp,
    title: 'ROAS Optimization',
    description: 'Measure return on every connect invested and find profitable strategies.',
  },
  {
    icon: Users,
    title: 'Multi-Profile Support',
    description: 'Independent tracking and cross-profile analytics for every BD profile.',
  },
  {
    icon: Zap,
    title: 'Connect Economics',
    description: 'Track net, boosted, and returned connects with cost-per-action.',
  },
  {
    icon: Shield,
    title: 'Role-Based Access',
    description: 'Admin, Manager, and BD Member roles with granular permissions.',
  },
];

export const Overview: React.FC<OverviewProps> = ({ onNavigate }) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative px-6 md:px-10 py-10 md:py-14">
          <div className="flex flex-col gap-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold tracking-widest uppercase text-primary">
                Overview
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight">
              Lynx Media <span className="text-primary">BD Tracker</span>
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl">
              Your all-in-one business development command center. Track proposals, analyze
              performance, optimize connect spend, and close more deals — all in one place.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <button
                onClick={() => onNavigate?.('dashboard')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
              >
                Open Dashboard
                <ArrowUpRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate?.('proposals')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-secondary/80 transition-colors border border-border"
              >
                View Proposals
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Key Capabilities */}
      <section className="px-6 md:px-10 py-8">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Key Capabilities
            </h2>
            <p className="text-lg font-semibold text-foreground">What this platform unlocks</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {highlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="group relative p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mb-4 group-hover:bg-primary/25 transition-colors">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1.5">{item.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Modules Grid */}
      <section className="px-6 md:px-10 py-8 pb-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
              Modules
            </h2>
            <p className="text-lg font-semibold text-foreground">Jump into any workspace</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <button
                key={idx}
                onClick={() => onNavigate?.(feature.tab)}
                className="group relative text-left p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                <div className="relative flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center group-hover:bg-primary/25 group-hover:scale-110 transition-all">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="relative text-base font-bold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="relative text-sm text-muted-foreground leading-relaxed mb-4">
                  {feature.description}
                </p>
                <div className="relative inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                  {feature.cta}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
