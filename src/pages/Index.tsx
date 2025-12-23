import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { Proposals } from '@/components/Proposals';
import { Settings } from '@/components/Settings';
import { PlaceholderView } from '@/components/PlaceholderView';
import { NavigationTab, User, Job, BDProfile, AppSettings } from '@/types';
import { getJobs, getProfiles, getSettings, getUsers } from '@/services/dataService';

const Index = () => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [currentUser, setCurrentUser] = useState<User>(getUsers()[0]);
  const [jobs, setJobs] = useState<Job[]>(getJobs());
  const [profiles] = useState<BDProfile[]>(getProfiles());
  const [settings, setSettings] = useState<AppSettings>(getSettings());

  const refreshJobs = () => {
    setJobs(getJobs());
  };

  const refreshSettings = () => {
    setSettings(getSettings());
  };

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
        onUserChange={setCurrentUser}
      />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;
