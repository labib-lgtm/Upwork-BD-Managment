import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { RolePermissionsProvider } from '@/contexts/RolePermissionsContext';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { Proposals } from '@/components/Proposals';
import { Analytics } from '@/components/Analytics';
import { Settings } from '@/components/Settings';
import { PlaceholderView } from '@/components/PlaceholderView';
import { NavigationTab, User, AppSettings, UserRole } from '@/types';
import { useBDProfiles, useAccessibleProfiles } from '@/hooks/useBDProfiles';
import { useUserRole } from '@/hooks/useUserRole';
import { useAppSettings } from '@/hooks/useAppSettings';

const IndexContent = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { profiles: bdProfiles, loading: profilesLoading } = useBDProfiles();
  const { accessibleProfiles, loading: accessLoading } = useAccessibleProfiles();
  const { role: userRole, loading: roleLoading } = useUserRole();
  const { settings: appSettings, loading: settingsLoading, updateSetting, updateMultipleSettings } = useAppSettings();
  
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [proposalDateFilter, setProposalDateFilter] = useState<'1d' | '7d' | '14d' | null>(null);

  const handleViewProposals = (range: '1d' | '7d' | '14d') => {
    setProposalDateFilter(range);
    setActiveTab('proposals');
  };

  const handleTabChange = (tab: NavigationTab) => {
    setActiveTab(tab);
    setProposalDateFilter(null);
  };

  // Map app settings from database to AppSettings type
  const settings: AppSettings = {
    fiscal_year_start_month: appSettings.fiscal_year_start,
    connect_cost: appSettings.connect_cost,
    target_roas: appSettings.target_roas,
    currency: appSettings.currency,
  };

  // All profiles (for settings/admin)
  const allProfiles = bdProfiles.filter(p => p.is_active).map(p => ({
    id: p.id,
    name: p.name,
    specialization: p.description || '',
    hourly_rate: 0,
    active: p.is_active,
  }));

  // Accessible profiles (filtered by user access)
  const userAccessibleProfiles = accessibleProfiles.map(p => ({
    id: p.id,
    name: p.name,
    specialization: p.description || '',
    hourly_rate: 0,
    active: p.is_active,
  }));

  // Create a user object from auth profile with role from database
  const currentUser: User = {
    id: user?.id || 'guest',
    email: user?.email || '',
    role: userRole,
    name: profile?.full_name || user?.email || 'Team Member',
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Settings are now synced via real-time from database

  // Show loading state while checking auth or loading profiles
  if (authLoading || profilesLoading || roleLoading || accessLoading || settingsLoading) {
    return (
      <div className="flex h-screen bg-background items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render main app if not authenticated
  if (!user) {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            profiles={userAccessibleProfiles}
            settings={settings}
            user={currentUser}
            onViewProposals={handleViewProposals}
          />
        );
      case 'proposals':
        return (
          <Proposals
            profiles={userAccessibleProfiles}
            user={currentUser}
            dateFilter={proposalDateFilter}
            onClearDateFilter={() => setProposalDateFilter(null)}
          />
        );
      case 'analytics':
        return <Analytics settings={settings} />;
      case 'inbound':
        return (
          <PlaceholderView
            title="Inbound Tracking"
            description="Track profile impressions, invites, and inbound conversions from your Upwork profile visibility."
            icon="inbox"
          />
        );
      case 'catalogs':
        return (
          <PlaceholderView
            title="Catalog Management"
            description="Manage your project catalog items, track performance, and optimize listings."
            icon="package"
          />
        );
      case 'settings':
        return (
          <Settings
            settings={settings}
            onSettingsChange={updateMultipleSettings}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        currentUser={currentUser}
        onUserChange={() => {}}
        onSignOut={signOut}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

const Index = () => {
  return (
    <RolePermissionsProvider>
      <IndexContent />
    </RolePermissionsProvider>
  );
};

export default Index;
