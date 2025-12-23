import React, { useState } from 'react';
import { AppSettings, UserRole, NavigationTab } from '@/types';
import { updateSettings } from '@/services/dataService';
import { useBDProfiles, BDProfile } from '@/hooks/useBDProfiles';
import { useTeamMembers, TeamMember } from '@/hooks/useTeamMembers';
import { useUserRole } from '@/hooks/useUserRole';
import { useProfileAccess } from '@/hooks/useProfileAccess';
import { useRolePermissionsContext } from '@/contexts/RolePermissionsContext';
import { GoalSettingsSection } from '@/components/goals/GoalSettingsSection';
import { Save, DollarSign, Target, Calendar, Users, Plus, Pencil, Trash2, X, Check, Loader2, Shield, UserCog, Key, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const { profiles, loading: profilesLoading, addProfile, updateProfile, deleteProfile } = useBDProfiles();
  const { members, loading: membersLoading, updateMemberRole } = useTeamMembers();
  const { role: currentUserRole } = useUserRole();
  const { accessList, loading: accessLoading, getUserAccess, updateUserAccess } = useProfileAccess();
  const { permissions, loading: permissionsLoading, hasTabAccess, updatePermission } = useRolePermissionsContext();
  const isAdmin = currentUserRole === UserRole.ADMIN;
  
  // Profile management state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<BDProfile | null>(null);
  const [profileForm, setProfileForm] = useState({ name: '', description: '', is_active: true });
  const [submitting, setSubmitting] = useState(false);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  
  // Access management state
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [editingMemberAccess, setEditingMemberAccess] = useState<TeamMember | null>(null);
  const [selectedProfileAccess, setSelectedProfileAccess] = useState<string[]>([]);
  const [savingAccess, setSavingAccess] = useState(false);

  const handleSave = () => {
    updateSettings(localSettings);
    onSettingsChange();
    toast.success('Settings saved successfully!');
  };

  const openNewProfileModal = () => {
    setEditingProfile(null);
    setProfileForm({ name: '', description: '', is_active: true });
    setShowProfileModal(true);
  };

  const openEditProfileModal = (profile: BDProfile) => {
    setEditingProfile(profile);
    setProfileForm({
      name: profile.name,
      description: profile.description || '',
      is_active: profile.is_active,
    });
    setShowProfileModal(true);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = {
      name: profileForm.name,
      description: profileForm.description || null,
      is_active: profileForm.is_active,
    };

    let success = false;
    if (editingProfile) {
      success = await updateProfile(editingProfile.id, formData);
    } else {
      success = await addProfile(formData);
    }

    setSubmitting(false);
    if (success) {
      setShowProfileModal(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this profile? This may affect existing proposals.')) {
      await deleteProfile(id);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'manager' | 'bd_member') => {
    setUpdatingRole(userId);
    await updateMemberRole(userId, newRole);
    setUpdatingRole(null);
  };

  const openAccessModal = (member: TeamMember) => {
    setEditingMemberAccess(member);
    setSelectedProfileAccess(getUserAccess(member.id));
    setShowAccessModal(true);
  };

  const handleAccessChange = (profileId: string) => {
    setSelectedProfileAccess(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const handleSaveAccess = async () => {
    if (!editingMemberAccess) return;
    setSavingAccess(true);
    await updateUserAccess(editingMemberAccess.id, selectedProfileAccess);
    setSavingAccess(false);
    setShowAccessModal(false);
  };

  const getRoleBadgeColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'admin':
        return 'bg-destructive/20 text-destructive border-destructive/30';
      case 'manager':
        return 'bg-primary/20 text-primary border-primary/30';
      case 'bd_member':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure global metrics, preferences, and manage BD profiles
            </p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity glow-primary-sm"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </header>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          
          {/* BD Profiles Management */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-foreground" />
                BD Profiles
              </h3>
              <button
                onClick={openNewProfileModal}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" />
                Add Profile
              </button>
            </div>

            {profilesLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : profiles.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">No profiles yet. Add your first BD profile above.</p>
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${profile.is_active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      <div>
                        <p className="font-medium text-foreground">{profile.name}</p>
                        {profile.description && (
                          <p className="text-xs text-muted-foreground">{profile.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditProfileModal(profile)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        className="p-2 hover:bg-destructive/20 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="mt-4 text-xs text-muted-foreground">
              BD profiles represent different Upwork accounts or business profiles your team works on.
            </p>
          </div>

          {/* Team Members - Admin Only */}
          {isAdmin && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <UserCog className="w-5 h-5 text-foreground" />
                Team Members
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  Admin Only
                </div>
              </div>

              {membersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : members.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">No team members found.</p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => {
                    const memberAccess = getUserAccess(member.id);
                    const accessCount = memberAccess.length;
                    const isAdminRole = member.role === 'admin';
                    
                    return (
                      <div
                        key={member.id}
                        className="p-4 bg-secondary/50 rounded-lg border border-border/50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {(member.full_name || member.email || '?').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-foreground">{member.full_name || 'Unnamed User'}</p>
                              <p className="text-xs text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded border ${getRoleBadgeColor(member.role)}`}>
                              {member.role || 'No Role'}
                            </span>
                            <select
                              value={member.role || ''}
                              onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'manager' | 'bd_member')}
                              disabled={updatingRole === member.id}
                              className="px-3 py-1.5 text-sm bg-input border border-border rounded-lg input-focus"
                            >
                              <option value="bd_member">BD Member</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>
                            {updatingRole === member.id && (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            )}
                          </div>
                        </div>
                        
                        {/* Profile Access Row */}
                        <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Key className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Profile Access:</span>
                            {isAdminRole ? (
                              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">
                                All Profiles (Admin)
                              </span>
                            ) : accessCount === 0 ? (
                              <span className="text-xs text-destructive">No access assigned</span>
                            ) : (
                              <span className="text-xs text-foreground">
                                {accessCount} profile{accessCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {!isAdminRole && (
                            <button
                              onClick={() => openAccessModal(member)}
                              className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                            >
                              Manage Access
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Admins have access to all profiles. Other roles need explicit profile access to view dashboard and proposals for those profiles.
              </p>
            </div>
          )}

          {/* Role Permissions - Admin Only */}
          {isAdmin && (
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Lock className="w-5 h-5 text-foreground" />
                Role Permissions
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  Admin Only
                </div>
              </div>

              {permissionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Manager Permissions */}
                  <div>
                  <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <span className="px-2 py-1 text-xs font-medium rounded border bg-primary/20 text-foreground border-primary/30">
                      Manager
                    </span>
                      Navigation Access
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {(['dashboard', 'proposals', 'inbound', 'catalogs', 'settings'] as NavigationTab[]).map((tab) => (
                        <label
                          key={`manager-${tab}`}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={hasTabAccess('manager', tab)}
                              onChange={(e) => updatePermission('manager', tab, e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              hasTabAccess('manager', tab)
                                ? 'bg-primary border-primary' 
                                : 'border-border'
                            }`}>
                              {hasTabAccess('manager', tab) && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-foreground capitalize">{tab}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* BD Member Permissions */}
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                      <span className="px-2 py-1 text-xs font-medium rounded border bg-muted text-foreground border-border">
                        BD Member
                      </span>
                      Navigation Access
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {(['dashboard', 'proposals', 'inbound', 'catalogs', 'settings'] as NavigationTab[]).map((tab) => (
                        <label
                          key={`bd_member-${tab}`}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                        >
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={hasTabAccess('bd_member', tab)}
                              onChange={(e) => updatePermission('bd_member', tab, e.target.checked)}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              hasTabAccess('bd_member', tab)
                                ? 'bg-primary border-primary' 
                                : 'border-border'
                            }`}>
                              {hasTabAccess('bd_member', tab) && (
                                <Check className="w-3 h-3 text-primary-foreground" />
                              )}
                            </div>
                          </div>
                          <span className="text-sm text-foreground capitalize">{tab}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Configure which navigation tabs each role can access. Admins always have access to all tabs.
              </p>
            </div>
          )}

          {/* Goal Settings */}
          <GoalSettingsSection currency={localSettings.currency} />

          {/* Global Metrics */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-foreground" />
              Global Metrics Configuration
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cost Per Connect ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={localSettings.connect_cost}
                  onChange={(e) => setLocalSettings({ ...localSettings, connect_cost: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg input-focus text-lg"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Average cost per connect on Upwork (typically $0.15 - $0.18)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Target ROAS
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.target_roas}
                  onChange={(e) => setLocalSettings({ ...localSettings, target_roas: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg input-focus text-lg"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Return on Ad Spend target (e.g., 10 means $10 revenue per $1 spent)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Currency
                </label>
                <select
                  value={localSettings.currency}
                  onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg input-focus text-lg"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fiscal Year */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Fiscal Year Configuration
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fiscal Year Start Month
              </label>
              <select
                value={localSettings.fiscal_year_start_month}
                onChange={(e) => setLocalSettings({ ...localSettings, fiscal_year_start_month: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg input-focus text-lg"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                The first month of your fiscal year (commonly July or January)
              </p>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
            <h4 className="font-bold text-foreground mb-2">💡 How metrics are calculated</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li><strong>Spend:</strong> Connects Used × Cost Per Connect</li>
              <li><strong>ROAS:</strong> Net Revenue ÷ Spend</li>
              <li><strong>View Rate:</strong> Client Views ÷ Proposals Sent</li>
              <li><strong>Close Rate:</strong> Wins ÷ Interviews</li>
              <li><strong>AOV Needed:</strong> (Spend × Target ROAS) ÷ Closes</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-bold text-foreground">
                {editingProfile ? 'Edit Profile' : 'New BD Profile'}
              </h3>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Profile Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  placeholder="e.g. Main Profile, Design Profile"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                <input
                  type="text"
                  value={profileForm.description}
                  onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  placeholder="Optional description"
                />
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={profileForm.is_active}
                    onChange={(e) => setProfileForm({ ...profileForm, is_active: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    profileForm.is_active 
                      ? 'bg-primary border-primary' 
                      : 'border-border'
                  }`}>
                    {profileForm.is_active && (
                      <Check className="w-3 h-3 text-primary-foreground" />
                    )}
                  </div>
                </div>
                <span className="text-sm text-foreground">Active profile</span>
              </label>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProfile ? 'Update' : 'Create'} Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Profile Access Modal */}
      {showAccessModal && editingMemberAccess && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-xl font-bold text-foreground">Manage Profile Access</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {editingMemberAccess.full_name || editingMemberAccess.email}
                </p>
              </div>
              <button
                onClick={() => setShowAccessModal(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Select which BD profiles this user can access:
              </p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {profiles.map((profile) => (
                  <label
                    key={profile.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors"
                  >
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={selectedProfileAccess.includes(profile.id)}
                        onChange={() => handleAccessChange(profile.id)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        selectedProfileAccess.includes(profile.id)
                          ? 'bg-primary border-primary' 
                          : 'border-border'
                      }`}>
                        {selectedProfileAccess.includes(profile.id) && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{profile.name}</p>
                      {profile.description && (
                        <p className="text-xs text-muted-foreground">{profile.description}</p>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${profile.is_active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                  </label>
                ))}
              </div>

              {profiles.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No BD profiles available. Create profiles first.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowAccessModal(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  disabled={savingAccess}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAccess}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  disabled={savingAccess}
                >
                  {savingAccess && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Access
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
