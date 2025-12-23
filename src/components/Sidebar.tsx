import React, { useState } from 'react';
import { NavigationTab, User, UserRole } from '@/types';
import { MOCK_USERS, MOCK_PROFILES } from '@/data/constants';
import { 
  LayoutDashboard, 
  FileText, 
  Inbox, 
  Package, 
  Settings, 
  ChevronDown,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  currentUser: User;
  onUserChange: (user: User) => void;
  onSignOut?: () => void;
}

const navItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'proposals', label: 'Proposals', icon: <FileText className="w-5 h-5" /> },
  { id: 'inbound', label: 'Inbound', icon: <Inbox className="w-5 h-5" /> },
  { id: 'catalogs', label: 'Catalogs', icon: <Package className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

// Lynx Media Logo SVG Component
const LynxLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    viewBox="0 0 40 40" 
    fill="currentColor" 
    className={className}
  >
    {/* Shield shape */}
    <path 
      d="M20 2 L36 10 L36 24 C36 32 28 38 20 40 C12 38 4 32 4 24 L4 10 Z" 
      fill="currentColor"
    />
    {/* Lynx head silhouette */}
    <path 
      d="M20 8 L28 14 L26 18 L30 22 L28 24 L24 22 L22 26 L20 24 L18 26 L16 22 L12 24 L10 22 L14 18 L12 14 L20 8 Z M16 16 L18 18 L17 20 L19 19 L20 21 L21 19 L23 20 L22 18 L24 16 L20 12 L16 16 Z" 
      fill="hsl(var(--primary-foreground))"
    />
  </svg>
);

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onUserChange,
  onSignOut,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <aside className="w-64 bg-sidebar-background border-r border-sidebar-border flex flex-col h-screen">
      {/* Lynx Media Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <LynxLogo className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground tracking-tight">LYNX MEDIA</h1>
            <p className="text-xs text-sidebar-foreground/60 font-medium">BD Tracker</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Switcher */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-sidebar-accent hover:bg-sidebar-accent/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">
                  {currentUser.name.charAt(0)}
                </span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-sidebar-foreground">{currentUser.name}</p>
                <p className="text-xs text-sidebar-foreground/60 capitalize">{currentUser.role.replace('_', ' ')}</p>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 text-sidebar-foreground/60 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {userDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-lg overflow-hidden animate-fade-in">
              <div className="p-2 border-b border-border">
                <p className="text-xs text-muted-foreground px-2 py-1">Account</p>
              </div>
              {onSignOut && (
                <button
                  onClick={() => {
                    onSignOut();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-destructive/10 transition-colors text-destructive"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
