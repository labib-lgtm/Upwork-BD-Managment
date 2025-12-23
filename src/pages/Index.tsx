import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { Proposals } from '@/components/Proposals';
import { Settings } from '@/components/Settings';
import { PlaceholderView } from '@/components/PlaceholderView';
import { NavigationTab, User, Job, BDProfile, AppSettings, UserRole } from '@/types';
import { getJobs, getProfiles, getSettings, getUsers } from '@/services/dataService';
import { useProposals } from '@/hooks/useProposals';

const Index = () => {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [jobs, setJobs] = useState<Job[]>(getJobs());
  const [profiles] = useState<BDProfile[]>(getProfiles());
  const [settings, setSettings] = useState<AppSettings>(getSettings());

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

  const refreshJobs = () => {
    setJobs(getJobs());
  };

  const refreshSettings = () => {
    setSettings(getSettings());
  };

  // Show loading state while checking auth
  if (authLoading) {
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
            jobs={jobs}
            profiles={profiles}
            settings={settings}
            user={currentUser}
          />
        );
      case 'proposals':
        return (
          <Proposals
            jobs={jobs}
            profiles={profiles}
            onJobsChange={refreshJobs}
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
