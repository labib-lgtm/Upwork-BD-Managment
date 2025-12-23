import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { Proposals } from '@/components/Proposals';
import { Settings } from '@/components/Settings';
import { PlaceholderView } from '@/components/PlaceholderView';
import { NavigationTab, User, AppSettings, UserRole } from '@/types';
import { getSettings } from '@/services/dataService';
import { useBDProfiles } from '@/hooks/useBDProfiles';

const Index = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { profiles: bdProfiles, loading: profilesLoading } = useBDProfiles();
  
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  // Convert DB profiles to the format expected by components
  const profiles = bdProfiles.filter(p => p.is_active).map(p => ({
    id: p.id,
    name: p.name,
    specialization: p.description || '',
    hourly_rate: 0,
    active: p.is_active,
  }));

  // Create a user object from auth profile
  const currentUser: User = {
    id: user?.id || 'guest',
    email: user?.email || '',
    role: UserRole.MANAGER,
    name: profile?.full_name || user?.email || 'Team Member',
  };

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const refreshSettings = () => {
    setSettings(getSettings());
  };

  // Show loading state while checking auth or loading profiles
  if (authLoading || profilesLoading) {
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
            profiles={profiles}
            settings={settings}
            user={currentUser}
          />
        );
      case 'proposals':
        return (
          <Proposals
            profiles={profiles}
            user={currentUser}
          />
        );
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
            onSettingsChange={refreshSettings}
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
        onTabChange={setActiveTab}
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

export default Index;
