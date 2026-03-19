import React, { useState } from 'react';
import { NavigationTab, User, UserRole } from '@/types';
import { useRolePermissionsContext } from '@/contexts/RolePermissionsContext';
import { 
  LayoutDashboard, 
  FileText, 
  Inbox, 
  Package, 
  Settings, 
  ChevronDown,
  LogOut,
  BarChart3,
} from 'lucide-react';
import lynxLogo from '@/assets/lynx-logo.png';

interface SidebarProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  currentUser: User;
  onUserChange: (user: User) => void;
  onSignOut?: () => void;
}

const allNavItems: { id: NavigationTab; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'proposals', label: 'Proposals', icon: <FileText className="w-5 h-5" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
  { id: 'inbound', label: 'Inbound', icon: <Inbox className="w-5 h-5" /> },
  { id: 'catalogs', label: 'Catalogs', icon: <Package className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  onUserChange,
  onSignOut,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { hasTabAccess, loading: permissionsLoading } = useRolePermissionsContext();

  // Map UserRole enum to database role string
  const getRoleString = (role: UserRole): 'admin' | 'manager' | 'bd_member' => {
    switch (role) {
      case UserRole.ADMIN:
        return 'admin';
      case UserRole.MANAGER:
        return 'manager';
      case UserRole.BD_MEMBER:
      default:
        return 'bd_member';
    }
  };

  const roleString = getRoleString(currentUser.role);

  // Filter nav items based on user's role permissions
  const navItems = allNavItems.filter(item => hasTabAccess(roleString, item.id));

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      {/* Lynx Media Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={lynxLogo} alt="Lynx Media" className="w-10 h-10 rounded-xl object-cover" />
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
