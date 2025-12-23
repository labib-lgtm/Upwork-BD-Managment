import React, { useState, useEffect, useCallback } from 'react';
import { BDProfile, User, UserRole } from '@/types';
import { useProposals, Proposal, ProposalFormData } from '@/hooks/useProposals';
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface ProposalsProps {
  profiles: BDProfile[];
  user: User;
}

// Status and type options
const STATUS_OPTIONS = ['pending', 'viewed', 'interviewed', 'won', 'lost', 'archived'] as const;
const JOB_TYPE_OPTIONS = ['fixed', 'hourly'] as const;
const PAYMENT_STATUS_OPTIONS = ['not_started', 'in_progress', 'completed', 'refunded'] as const;

interface LocalFormData {
  profile_name: string;
  job_title: string;
  job_type: string;
  status: string;
  payment_status: string;
  budget: number;
  proposed_amount: number;
  connects_used: number;
  boosted: boolean;
  invite_sent: number;
  interviewing_at_submission: number;
  last_viewed_text: string;
  client_country: string;
  client_rating: number | null;
  client_reviews: number | null;
  client_total_spent: number | null;
  notes: string;
}

const getDefaultFormData = (profileName: string): LocalFormData => ({
  profile_name: profileName,
  job_title: '',
  job_type: 'fixed',
  status: 'pending',
  payment_status: 'not_started',
  budget: 0,
  proposed_amount: 0,
  connects_used: 6,
  boosted: false,
  invite_sent: 0,
  interviewing_at_submission: 0,
  last_viewed_text: '',
  client_country: '',
  client_rating: null,
  client_reviews: null,
  client_total_spent: null,
  notes: '',
});

export const Proposals: React.FC<ProposalsProps> = ({ profiles, user }) => {
  const { proposals, loading, addProposal, updateProposal, deleteProposal } = useProposals();
  const isRestricted = user.role === UserRole.BD_MEMBER && !!user.linked_profile_id;
  const [showModal, setShowModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [showFullForm, setShowFullForm] = useState(false);
  const [lastUsedProfile, setLastUsedProfile] = useState<string>(profiles[0]?.name || '');
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<LocalFormData>(() => 
    getDefaultFormData(lastUsedProfile)
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProfile, setFilterProfile] = useState<string>('all');

  // Auto-adjust connects when boosted changes
  useEffect(() => {
    if (!editingProposal) {
      setFormData(prev => ({
        ...prev,
        connects_used: prev.boosted ? 8 : 6
      }));
    }
  }, [formData.boosted, editingProposal]);

  // Keyboard shortcut for new proposal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !showModal) {
      e.preventDefault();
      openNewProposalModal();
    }
  }, [showModal]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const filteredProposals = proposals
    .filter((p) => filterStatus === 'all' || p.status === filterStatus)
    .filter((p) => {
      if (isRestricted && user.linked_profile_id) {
        const linkedProfile = profiles.find(pr => pr.id === user.linked_profile_id);
        return linkedProfile ? p.profile_name === linkedProfile.name : true;
      }
      return filterProfile === 'all' || p.profile_name === filterProfile;
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const openNewProposalModal = () => {
    setEditingProposal(null);
    setShowFullForm(false);
    setFormData(getDefaultFormData(lastUsedProfile));
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent, addAnother: boolean = false) => {
    e.preventDefault();
    setSubmitting(true);
    
    const proposalData: ProposalFormData = {
      profile_name: formData.profile_name,
      job_title: formData.job_title,
      job_type: formData.job_type,
      status: formData.status,
      payment_status: formData.payment_status,
      budget: formData.budget,
      proposed_amount: formData.proposed_amount,
      connects_used: formData.connects_used,
      boosted: formData.boosted,
      invite_sent: formData.invite_sent,
      interviewing_at_submission: formData.interviewing_at_submission,
      last_viewed_text: formData.last_viewed_text || null,
      client_country: formData.client_country || null,
      client_rating: formData.client_rating,
      client_reviews: formData.client_reviews,
      client_total_spent: formData.client_total_spent,
      notes: formData.notes || null,
    };

    let success = false;
    if (editingProposal) {
      success = await updateProposal(editingProposal.id, proposalData);
    } else {
      success = await addProposal(proposalData);
      if (success) {
        setLastUsedProfile(formData.profile_name);
      }
    }
    
    setSubmitting(false);
    
    if (success) {
      if (addAnother) {
        setFormData(getDefaultFormData(formData.profile_name));
        setEditingProposal(null);
        setShowFullForm(false);
        setTimeout(() => {
          const titleInput = document.getElementById('job-title-input');
          titleInput?.focus();
        }, 100);
      } else {
        setShowModal(false);
        setEditingProposal(null);
      }
    }
  };

  const handleEdit = (proposal: Proposal) => {
    setEditingProposal(proposal);
    setShowFullForm(true);
    setFormData({
      profile_name: proposal.profile_name,
      job_title: proposal.job_title,
      job_type: proposal.job_type,
      status: proposal.status,
      payment_status: proposal.payment_status,
      budget: proposal.budget,
      proposed_amount: proposal.proposed_amount,
      connects_used: proposal.connects_used,
      boosted: proposal.boosted,
      invite_sent: proposal.invite_sent,
      interviewing_at_submission: proposal.interviewing_at_submission,
      last_viewed_text: proposal.last_viewed_text || '',
      client_country: proposal.client_country || '',
      client_rating: proposal.client_rating,
      client_reviews: proposal.client_reviews,
      client_total_spent: proposal.client_total_spent,
      notes: proposal.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (proposalId: string) => {
    if (window.confirm('Are you sure you want to delete this proposal?')) {
      await deleteProposal(proposalId);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'won':
        return 'status-badge-success';
      case 'lost':
        return 'status-badge-error';
      case 'interviewed':
        return 'status-badge-info';
      case 'archived':
        return 'status-badge-neutral';
      default:
        return 'status-badge-warning';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Proposals</h2>
            <p className="text-sm text-muted-foreground">
              {filteredProposals.length} proposals • <span className="text-muted-foreground/70">Ctrl+N to add</span>
            </p>
          </div>
          <button
            onClick={openNewProposalModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity glow-primary-sm"
          >
            <Plus className="w-4 h-4" />
            Add Proposal
          </button>
        </div>

        {/* Filters */}
        <div className="mt-4 flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>

          {!isRestricted && (
            <select
              value={filterProfile}
              onChange={(e) => setFilterProfile(e.target.value)}
              className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="all">All Profiles</option>
              {profiles.slice(0, 4).map((profile) => (
                <option key={profile.id} value={profile.name}>{profile.name}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[1200px]">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Profile</th>
                  <th>Job Title</th>
                  <th className="w-24">Status</th>
                  <th className="w-20">Type</th>
                  <th className="w-24 text-right">Budget</th>
                  <th className="w-24 text-right">Proposed</th>
                  <th className="w-16 text-center">Connects</th>
                  <th className="w-24 text-center">Last Viewed</th>
                  <th className="w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProposals.map((proposal) => (
                  <tr key={proposal.id}>
                    <td className="text-muted-foreground tabular-nums">
                      {new Date(proposal.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="px-2 py-1 bg-secondary rounded text-xs font-medium">
                        {proposal.profile_name}
                      </span>
                    </td>
                    <td>
                      <span className="truncate max-w-[200px] block">{proposal.job_title}</span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(proposal.status)}`}>
                        {proposal.status}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{proposal.job_type}</td>
                    <td className="text-right tabular-nums">${proposal.budget.toLocaleString()}</td>
                    <td className="text-right tabular-nums">${proposal.proposed_amount.toLocaleString()}</td>
                    <td className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${proposal.boosted ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                        {proposal.connects_used}
                      </span>
                    </td>
                    <td className="text-center text-xs text-muted-foreground">
                      {proposal.last_viewed_text || '-'}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(proposal)}
                          className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(proposal.id)}
                          className="p-2 hover:bg-destructive/20 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredProposals.length === 0 && (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-muted-foreground">
                      No proposals found. Click "Add Proposal" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {editingProposal ? 'Edit Proposal' : 'New Proposal'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {editingProposal ? 'Update proposal details' : 'Quick entry mode • Enter what you know now'}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-5">
              {/* Quick Entry Fields - Always Visible */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Profile</label>
                  <select
                    value={formData.profile_name}
                    onChange={(e) => setFormData({ ...formData, profile_name: e.target.value })}
                    disabled={isRestricted}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                    required
                  >
                    {profiles.slice(0, 4).map((p) => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Job Title</label>
                <input
                  id="job-title-input"
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  placeholder="Enter job title"
                  required
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                  <select
                    value={formData.job_type}
                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  >
                    {JOB_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Budget ($)</label>
                  <input
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Proposed ($)</label>
                  <input
                    type="number"
                    value={formData.proposed_amount}
                    onChange={(e) => setFormData({ ...formData, proposed_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Connects Used</label>
                  <input
                    type="number"
                    value={formData.connects_used}
                    onChange={(e) => setFormData({ ...formData, connects_used: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Payment Status</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  >
                    {PAYMENT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* At-Submission Metrics */}
              <div className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">At time of submission</p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Invite Sent</label>
                    <input
                      type="number"
                      value={formData.invite_sent}
                      onChange={(e) => setFormData({ ...formData, invite_sent: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Interviewing</label>
                    <input
                      type="number"
                      value={formData.interviewing_at_submission}
                      onChange={(e) => setFormData({ ...formData, interviewing_at_submission: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                      min="0"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Last Viewed</label>
                    <input
                      type="text"
                      value={formData.last_viewed_text}
                      onChange={(e) => setFormData({ ...formData, last_viewed_text: e.target.value })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                      placeholder="e.g. 6 Min Ago"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Checkboxes */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.boosted}
                      onChange={(e) => setFormData({ ...formData, boosted: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      formData.boosted 
                        ? 'bg-primary border-primary' 
                        : 'border-border'
                    }`}>
                      {formData.boosted && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-foreground">Boosted</span>
                </label>
              </div>

              {/* Expandable Full Form */}
              <div className="border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setShowFullForm(!showFullForm)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showFullForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showFullForm ? 'Hide client details' : 'Show client details (country, rating, etc.)'}
                </button>

                {showFullForm && (
                  <div className="mt-4 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Client Country</label>
                        <input
                          type="text"
                          value={formData.client_country}
                          onChange={(e) => setFormData({ ...formData, client_country: e.target.value })}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                          placeholder="e.g. United States"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Client Rating</label>
                        <input
                          type="number"
                          value={formData.client_rating || ''}
                          onChange={(e) => setFormData({ ...formData, client_rating: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                          min="0"
                          max="5"
                          step="0.1"
                          placeholder="0-5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Client Reviews</label>
                        <input
                          type="number"
                          value={formData.client_reviews || ''}
                          onChange={(e) => setFormData({ ...formData, client_reviews: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                          min="0"
                          placeholder="Number of reviews"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Client Total Spent ($)</label>
                        <input
                          type="number"
                          value={formData.client_total_spent || ''}
                          onChange={(e) => setFormData({ ...formData, client_total_spent: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                          min="0"
                          placeholder="Total spent on platform"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus resize-none"
                        rows={3}
                        placeholder="Add any notes..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                {!editingProposal && (
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e as unknown as React.FormEvent, true)}
                    className="px-4 py-2 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors"
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Add Another'}
                  </button>
                )}
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  disabled={submitting}
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingProposal ? 'Update' : 'Create'} Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};