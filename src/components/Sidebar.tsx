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
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
  { id: 'proposals', label: 'Proposals', icon: <FileText className="w-[18px] h-[18px]" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-[18px] h-[18px]" /> },
  { id: 'inbound', label: 'Inbound', icon: <Inbox className="w-[18px] h-[18px]" /> },
  { id: 'catalogs', label: 'Catalogs', icon: <Package className="w-[18px] h-[18px]" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-[18px] h-[18px]" /> },
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
  const navItems = allNavItems.filter(item => hasTabAccess(roleString, item.id));

  return (
    <aside className="w-60 bg-sidebar flex flex-col h-screen border-r border-sidebar-border">
      {/* Lynx Media Logo */}
      <div className="px-5 py-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <img src={lynxLogo} alt="Lynx Media" className="w-9 h-9 rounded-lg object-cover" />
          <div>
            <h1 className="font-bold text-[15px] text-sidebar-foreground tracking-tight leading-tight">LYNX MEDIA</h1>
            <p className="text-[11px] text-sidebar-foreground/50 font-medium tracking-wide">BD TRACKER</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <p className="px-3 mb-2 text-[10px] font-bold text-sidebar-foreground/30 uppercase tracking-[0.15em]">Menu</p>
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/60'
                }`}
                style={activeTab === item.id ? { boxShadow: '0 2px 8px hsl(72 100% 50% / 0.2)' } : undefined}
              >
                {item.icon}
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Section */}
      <div className="px-3 pb-4 border-t border-sidebar-border pt-3">
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">
                  {currentUser.name.charAt(0)}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[13px] font-medium text-sidebar-foreground leading-tight truncate max-w-[120px]">{currentUser.name}</p>
                <p className="text-[11px] text-sidebar-foreground/40 capitalize">{currentUser.role.replace('_', ' ')}</p>
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-sidebar-foreground/40 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {userDropdownOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-popover border border-border rounded-lg shadow-xl overflow-hidden animate-scale-in">
              <div className="p-2 border-b border-border">
                <p className="text-[11px] text-muted-foreground px-2 py-1 font-medium">Account</p>
              </div>
              {onSignOut && (
                <button
                  onClick={() => {
                    onSignOut();
                    setUserDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-destructive/10 transition-colors text-destructive"
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