import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BDProfile, User, UserRole } from '@/types';
import { useProposals, Proposal, ProposalFormData } from '@/hooks/useProposals';
import { Plus, Pencil, Trash2, X, Check, ChevronDown, ChevronUp, Loader2, Search, Download, ExternalLink, Video, ArrowUpDown, ArrowUp, ArrowDown, CalendarIcon } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter } from 'date-fns';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

interface ProposalsProps {
  profiles: BDProfile[];
  user: User;
  dateFilter?: '1d' | '7d' | '14d' | null;
  onClearDateFilter?: () => void;
}

const STATUS_OPTIONS = ['pending', 'viewed', 'interviewed', 'won', 'lost', 'archived'] as const;
const JOB_TYPE_OPTIONS = ['fixed', 'hourly'] as const;
const PAYMENT_STATUS_OPTIONS = ['Verified', 'Unverified', 'Unknown'] as const;
const COMPETITION_BUCKET_OPTIONS = ['<5', '5-10', '10-15', '20-50', '50+'] as const;
const ROWS_PER_PAGE = 25;

interface LocalFormData {
  profile_name: string;
  job_title: string;
  job_link: string;
  job_type: string;
  status: string;
  payment_status: string;
  budget: number;
  proposed_amount: number;
  connects_used: number;
  boosted: boolean;
  video_sent: boolean;
  invite_sent: number;
  interviewing_at_submission: number;
  last_viewed_text: string;
  client_country: string;
  client_rating: number | null;
  client_reviews: number | null;
  client_total_spent: number | null;
  competition_bucket: string;
  date_submitted: string;
  deal_value: number;
  refund_amount: number;
  is_new_client: boolean;
  client_hire_count: number | null;
  boosted_connects: number;
  returned_connects: number;
  notes: string;
  loss_reason: string;
  win_factor: string;
}

const getDefaultFormData = (profileName: string): LocalFormData => ({
  profile_name: profileName,
  job_title: '',
  job_link: '',
  job_type: 'fixed',
  status: 'pending',
  payment_status: 'Verified',
  budget: 0,
  proposed_amount: 0,
  connects_used: 6,
  boosted: false,
  video_sent: false,
  invite_sent: 0,
  interviewing_at_submission: 0,
  last_viewed_text: '',
  client_country: '',
  client_rating: null,
  client_reviews: null,
  client_total_spent: null,
  competition_bucket: '',
  date_submitted: format(new Date(), 'yyyy-MM-dd'),
  deal_value: 0,
  refund_amount: 0,
  is_new_client: false,
  client_hire_count: null,
  boosted_connects: 0,
  returned_connects: 0,
  notes: '',
  loss_reason: '',
  win_factor: '',
});

type SortField = 'date' | 'budget' | 'proposed_amount' | 'connects_used' | 'status' | 'profile_name' | 'job_title';
type SortDirection = 'asc' | 'desc';

export const Proposals: React.FC<ProposalsProps> = ({ profiles, user, dateFilter, onClearDateFilter }) => {
  const { proposals, loading, addProposal, updateProposal, deleteProposal } = useProposals();
  const isRestricted = user.role === UserRole.BD_MEMBER && !!user.linked_profile_id;
  const [showModal, setShowModal] = useState(false);
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [showFullForm, setShowFullForm] = useState(false);
  const [lastUsedProfile, setLastUsedProfile] = useState<string>(profiles[0]?.name || '');
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [datePreset, setDatePreset] = useState<string>('all');

  const [formData, setFormData] = useState<LocalFormData>(() =>
    getDefaultFormData(lastUsedProfile)
  );
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterProfile, setFilterProfile] = useState<string>('all');

  // Apply external date filter from Dashboard drill-down
  useEffect(() => {
    if (dateFilter) {
      const now = new Date();
      const msMap = { '1d': 1, '7d': 7, '14d': 14 };
      const days = msMap[dateFilter];
      const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      setDateFrom(format(from, 'yyyy-MM-dd'));
      setDateTo(format(now, 'yyyy-MM-dd'));
      setDatePreset('custom');
    }
  }, [dateFilter]);

  useEffect(() => {
    if (!editingProposal) {
      setFormData(prev => ({
        ...prev,
        connects_used: prev.boosted ? 8 : 6
      }));
    }
  }, [formData.boosted, editingProposal]);

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

  const applyDatePreset = (preset: string) => {
    setDatePreset(preset);
    const now = new Date();
    switch (preset) {
      case 'this_month':
        setDateFrom(format(startOfMonth(now), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'last_month': {
        const lm = subMonths(now, 1);
        setDateFrom(format(startOfMonth(lm), 'yyyy-MM-dd'));
        setDateTo(format(endOfMonth(lm), 'yyyy-MM-dd'));
        break;
      }
      case 'this_quarter':
        setDateFrom(format(startOfQuarter(now), 'yyyy-MM-dd'));
        setDateTo(format(endOfQuarter(now), 'yyyy-MM-dd'));
        break;
      case 'all':
      default:
        setDateFrom('');
        setDateTo('');
        break;
    }
  };

  const filteredAndSortedProposals = useMemo(() => {
    let result = proposals
      .filter((p) => filterStatus === 'all' || p.status === filterStatus)
      .filter((p) => {
        if (isRestricted && user.linked_profile_id) {
          const linkedProfile = profiles.find(pr => pr.id === user.linked_profile_id);
          return linkedProfile ? p.profile_name === linkedProfile.name : true;
        }
        return filterProfile === 'all' || p.profile_name === filterProfile;
      });

    // Date range filter
    if (dateFrom || dateTo) {
      result = result.filter(p => {
        const pDate = p.date_submitted || p.created_at.split('T')[0];
        if (dateFrom && pDate < dateFrom) return false;
        if (dateTo && pDate > dateTo) return false;
        return true;
      });
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.job_title.toLowerCase().includes(q) ||
        p.profile_name.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        (p.client_country && p.client_country.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'date':
          cmp = new Date(a.date_submitted || a.created_at).getTime() - new Date(b.date_submitted || b.created_at).getTime();
          break;
        case 'budget':
          cmp = (a.budget || 0) - (b.budget || 0);
          break;
        case 'proposed_amount':
          cmp = (a.proposed_amount || 0) - (b.proposed_amount || 0);
          break;
        case 'connects_used':
          cmp = (a.connects_used || 0) - (b.connects_used || 0);
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'profile_name':
          cmp = a.profile_name.localeCompare(b.profile_name);
          break;
        case 'job_title':
          cmp = a.job_title.localeCompare(b.job_title);
          break;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [proposals, filterStatus, filterProfile, isRestricted, user.linked_profile_id, profiles, searchQuery, sortField, sortDirection, dateFrom, dateTo]);

  // Stats
  const stats = useMemo(() => {
    const fp = filteredAndSortedProposals;
    const total = fp.length;
    const totalConnects = fp.reduce((s, p) => s + (p.connects_used || 0), 0);
    const totalReturned = fp.reduce((s, p) => s + (p.returned_connects || 0), 0);
    const netConnects = totalConnects - totalReturned;
    const wonCount = fp.filter(p => p.status === 'won').length;
    const viewedCount = fp.filter(p => ['viewed', 'interviewed', 'won', 'lost'].includes(p.status)).length;
    const totalDealValue = fp.filter(p => p.status === 'won').reduce((s, p) => s + (p.deal_value || 0), 0);
    const avgBudget = total > 0 ? fp.reduce((s, p) => s + (p.budget || 0), 0) / total : 0;
    return {
      total,
      totalConnects,
      netConnects,
      totalReturned,
      winRate: total > 0 ? ((wonCount / total) * 100).toFixed(1) : '0',
      viewRate: total > 0 ? ((viewedCount / total) * 100).toFixed(1) : '0',
      totalDealValue,
      avgBudget,
    };
  }, [filteredAndSortedProposals]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedProposals.length / ROWS_PER_PAGE));
  const paginatedProposals = filteredAndSortedProposals.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterProfile, searchQuery, dateFrom, dateTo]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

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
      job_link: formData.job_link || null,
      job_type: formData.job_type,
      status: formData.status,
      payment_status: formData.payment_status,
      budget: formData.budget,
      proposed_amount: formData.proposed_amount,
      connects_used: formData.connects_used,
      boosted: formData.boosted,
      video_sent: formData.video_sent,
      invite_sent: formData.invite_sent,
      interviewing_at_submission: formData.interviewing_at_submission,
      last_viewed_text: formData.last_viewed_text || null,
      client_country: formData.client_country || null,
      client_rating: formData.client_rating,
      client_reviews: formData.client_reviews,
      client_total_spent: formData.client_total_spent,
      competition_bucket: formData.competition_bucket || null,
      date_submitted: formData.date_submitted || null,
      deal_value: formData.deal_value,
      refund_amount: formData.refund_amount,
      is_new_client: formData.is_new_client,
      client_hire_count: formData.client_hire_count,
      boosted_connects: formData.boosted_connects,
      returned_connects: formData.returned_connects,
      notes: formData.notes || null,
      loss_reason: formData.loss_reason || null,
      win_factor: formData.win_factor || null,
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
      job_link: proposal.job_link || '',
      job_type: proposal.job_type,
      status: proposal.status,
      payment_status: proposal.payment_status,
      budget: proposal.budget,
      proposed_amount: proposal.proposed_amount,
      connects_used: proposal.connects_used,
      boosted: proposal.boosted,
      video_sent: proposal.video_sent ?? false,
      invite_sent: proposal.invite_sent,
      interviewing_at_submission: proposal.interviewing_at_submission,
      last_viewed_text: proposal.last_viewed_text || '',
      client_country: proposal.client_country || '',
      client_rating: proposal.client_rating,
      client_reviews: proposal.client_reviews,
      client_total_spent: proposal.client_total_spent,
      competition_bucket: proposal.competition_bucket || '',
      date_submitted: proposal.date_submitted || '',
      deal_value: proposal.deal_value ?? 0,
      refund_amount: proposal.refund_amount ?? 0,
      is_new_client: proposal.is_new_client ?? false,
      client_hire_count: proposal.client_hire_count ?? null,
      boosted_connects: proposal.boosted_connects ?? 0,
      returned_connects: proposal.returned_connects ?? 0,
      notes: proposal.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (proposalId: string) => {
    if (window.confirm('Are you sure you want to delete this proposal?')) {
      await deleteProposal(proposalId);
    }
  };

  const exportCSV = () => {
    const headers = [
      'Date Submitted', 'Time', 'Profile', 'Job Title', 'Job Link', 'Status', 'Payment Status',
      'Type', 'Budget', 'Proposed', 'Connects', 'Boosted Connects', 'Returned Connects',
      'Boosted', 'Video Sent', 'Competition', 'New Client', 'Client Hire Count',
      'Invite Sent', 'Interviewing', 'Last Viewed', 'Client Country', 'Client Rating',
      'Client Reviews', 'Client Total Spent', 'Deal Value', 'Refund Amount', 'Notes'
    ];
    const rows = filteredAndSortedProposals.map(p => [
      p.date_submitted || format(new Date(p.created_at), 'yyyy-MM-dd'),
      format(new Date(p.created_at), 'hh:mm a'),
      p.profile_name, p.job_title, p.job_link || '', p.status, p.payment_status,
      p.job_type, p.budget, p.proposed_amount, p.connects_used,
      p.boosted_connects || 0, p.returned_connects || 0,
      p.boosted ? 'Yes' : 'No',
      p.video_sent ? 'Yes' : 'No', p.competition_bucket || '',
      p.is_new_client ? 'Yes' : 'No', p.client_hire_count ?? '',
      p.invite_sent,
      p.interviewing_at_submission, p.last_viewed_text || '', p.client_country || '',
      p.client_rating || '', p.client_reviews || '', p.client_total_spent || '',
      p.deal_value || 0, p.refund_amount || 0, (p.notes || '').replace(/"/g, '""')
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposals-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'won': return 'status-badge-success';
      case 'lost': return 'status-badge-error';
      case 'interviewed': return 'status-badge-info';
      case 'archived': return 'status-badge-neutral';
      default: return 'status-badge-warning';
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
              {filteredAndSortedProposals.length} proposals • <span className="text-muted-foreground/70">Ctrl+N to add</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={openNewProposalModal}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity glow-primary-sm"
            >
              <Plus className="w-4 h-4" />
              Add Proposal
            </button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="mt-4 flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search proposals..."
              className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
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
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.name}>{profile.name}</option>
              ))}
            </select>
          )}
        </div>
      </header>

      {/* Date Filter Banner from Dashboard */}
      {dateFilter && (
        <div className="px-6 py-2 border-b border-primary/30 bg-primary/5 flex items-center justify-between text-sm">
          <span className="text-primary font-medium">
            Showing proposals from last {dateFilter === '1d' ? '24 hours' : dateFilter === '7d' ? '7 days' : '14 days'}
          </span>
          <button
            onClick={() => {
              onClearDateFilter?.();
              applyDatePreset('all');
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" /> Clear filter
          </button>
        </div>
      )}

      {/* Timeline Filter */}
      <div className="px-6 py-3 border-b border-border bg-card/30 flex gap-3 flex-wrap items-center text-sm">
        <CalendarIcon className="w-4 h-4 text-muted-foreground" />
        <select
          value={datePreset}
          onChange={(e) => { applyDatePreset(e.target.value); onClearDateFilter?.(); }}
          className="px-2 py-1.5 bg-secondary border border-border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="all">All Time</option>
          <option value="this_month">This Month</option>
          <option value="last_month">Last Month</option>
          <option value="this_quarter">This Quarter</option>
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => { setDateFrom(e.target.value); setDatePreset('custom'); onClearDateFilter?.(); }}
          className="px-2 py-1.5 bg-secondary border border-border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
        />
        <span className="text-muted-foreground">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => { setDateTo(e.target.value); setDatePreset('custom'); onClearDateFilter?.(); }}
          className="px-2 py-1.5 bg-secondary border border-border rounded-md text-sm focus:ring-2 focus:ring-primary outline-none"
        />
        {(dateFrom || dateTo) && (
          <button
            onClick={() => { applyDatePreset('all'); onClearDateFilter?.(); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear
          </button>
        )}
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-3 border-b border-border bg-card/30 flex gap-6 flex-wrap text-sm">
        <div><span className="text-muted-foreground">Total:</span> <span className="font-semibold text-foreground">{stats.total}</span></div>
        <div><span className="text-muted-foreground">Net Connects:</span> <span className="font-semibold text-foreground">{stats.netConnects}</span>{stats.totalReturned > 0 && <span className="text-xs text-muted-foreground ml-1">({stats.totalConnects} - {stats.totalReturned} returned)</span>}</div>
        <div><span className="text-muted-foreground">Win Rate:</span> <span className="font-semibold text-foreground">{stats.winRate}%</span></div>
        <div><span className="text-muted-foreground">View Rate:</span> <span className="font-semibold text-foreground">{stats.viewRate}%</span></div>
        <div><span className="text-muted-foreground">Deal Value:</span> <span className="font-semibold text-foreground">${stats.totalDealValue.toLocaleString()}</span></div>
        <div><span className="text-muted-foreground">Avg Budget:</span> <span className="font-semibold text-foreground">${Math.round(stats.avgBudget).toLocaleString()}</span></div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table min-w-[1600px]">
              <thead>
                <tr>
                  <th className="cursor-pointer select-none" onClick={() => handleSort('date')}>
                    <div className="flex items-center gap-1">Date <SortIcon field="date" /></div>
                  </th>
                  <th className="w-20 text-center">Time</th>
                  <th className="cursor-pointer select-none" onClick={() => handleSort('profile_name')}>
                    <div className="flex items-center gap-1">Profile <SortIcon field="profile_name" /></div>
                  </th>
                  <th className="cursor-pointer select-none" onClick={() => handleSort('job_title')}>
                    <div className="flex items-center gap-1">Job Title <SortIcon field="job_title" /></div>
                  </th>
                  <th className="w-8 text-center">Link</th>
                  <th className="w-24 cursor-pointer select-none" onClick={() => handleSort('status')}>
                    <div className="flex items-center gap-1">Status <SortIcon field="status" /></div>
                  </th>
                  <th className="w-20">Type</th>
                  <th className="w-24 text-right cursor-pointer select-none" onClick={() => handleSort('budget')}>
                    <div className="flex items-center justify-end gap-1">Budget <SortIcon field="budget" /></div>
                  </th>
                  <th className="w-24 text-right cursor-pointer select-none" onClick={() => handleSort('proposed_amount')}>
                    <div className="flex items-center justify-end gap-1">Proposed <SortIcon field="proposed_amount" /></div>
                  </th>
                  <th className="w-16 text-center cursor-pointer select-none" onClick={() => handleSort('connects_used')}>
                    <div className="flex items-center justify-center gap-1">Conn <SortIcon field="connects_used" /></div>
                  </th>
                  <th className="w-14 text-center">Boost</th>
                  <th className="w-14 text-center">Ret</th>
                  <th className="w-16 text-center">Comp</th>
                  <th className="w-12 text-center">Vid</th>
                  <th className="w-12 text-center">New</th>
                  <th className="w-24 text-center">Last Viewed</th>
                  <th className="w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProposals.map((proposal) => (
                  <tr key={proposal.id}>
                    <td className="text-muted-foreground tabular-nums">
                      {proposal.date_submitted
                        ? format(new Date(proposal.date_submitted), 'MMM d, yyyy')
                        : format(new Date(proposal.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="text-center text-xs text-muted-foreground tabular-nums">
                      {format(new Date(proposal.created_at), 'hh:mm a')}
                    </td>
                    <td>
                      <span className="px-2 py-1 bg-secondary rounded text-xs font-medium">
                        {proposal.profile_name}
                      </span>
                    </td>
                    <td>
                      <span className="truncate max-w-[200px] block">{proposal.job_title}</span>
                    </td>
                    <td className="text-center">
                      {proposal.job_link ? (
                        <a href={proposal.job_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                          <ExternalLink className="w-4 h-4 inline" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground/40">-</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(proposal.status)}`}>
                        {proposal.status}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{proposal.job_type}</td>
                    <td className="text-right tabular-nums">${(proposal.budget || 0).toLocaleString()}</td>
                    <td className="text-right tabular-nums">${(proposal.proposed_amount || 0).toLocaleString()}</td>
                    <td className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${proposal.boosted ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                        {proposal.connects_used}
                      </span>
                    </td>
                    <td className="text-center text-xs tabular-nums text-muted-foreground">
                      {proposal.boosted_connects || '-'}
                    </td>
                    <td className="text-center text-xs tabular-nums text-muted-foreground">
                      {proposal.returned_connects || '-'}
                    </td>
                    <td className="text-center text-xs text-muted-foreground">
                      {proposal.competition_bucket || '-'}
                    </td>
                    <td className="text-center">
                      {proposal.video_sent ? (
                        <Video className="w-4 h-4 text-primary inline" />
                      ) : (
                        <span className="text-muted-foreground/40">-</span>
                      )}
                    </td>
                    <td className="text-center">
                      {proposal.is_new_client ? (
                        <span className="px-1.5 py-0.5 bg-accent/20 text-accent-foreground rounded text-[10px] font-medium">NEW</span>
                      ) : (
                        <span className="text-muted-foreground/40">-</span>
                      )}
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
                {paginatedProposals.length === 0 && (
                  <tr>
                    <td colSpan={17} className="text-center py-8 text-muted-foreground">
                      No proposals found. Click "Add Proposal" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 7) {
                    page = i + 1;
                  } else if (currentPage <= 4) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    page = totalPages - 6 + i;
                  } else {
                    page = currentPage - 3 + i;
                  }
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        isActive={currentPage === page}
                        onClick={() => setCurrentPage(page)}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
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
              {/* Quick Entry Fields */}
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
                    {profiles.map((p) => (
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Job Link</label>
                <input
                  type="url"
                  value={formData.job_link}
                  onChange={(e) => setFormData({ ...formData, job_link: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  placeholder="https://www.upwork.com/jobs/..."
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

              <div className="grid grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium text-foreground mb-2">Boosted Connects</label>
                  <input
                    type="number"
                    value={formData.boosted_connects}
                    onChange={(e) => setFormData({ ...formData, boosted_connects: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Returned Connects</label>
                  <input
                    type="number"
                    value={formData.returned_connects}
                    onChange={(e) => setFormData({ ...formData, returned_connects: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Payment Status</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  >
                    {PAYMENT_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Competition</label>
                  <select
                    value={formData.competition_bucket}
                    onChange={(e) => setFormData({ ...formData, competition_bucket: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  >
                    <option value="">Select...</option>
                    {COMPETITION_BUCKET_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Date Submitted</label>
                <input
                  type="date"
                  value={formData.date_submitted}
                  onChange={(e) => setFormData({ ...formData, date_submitted: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                />
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
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.boosted}
                      onChange={(e) => setFormData({ ...formData, boosted: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      formData.boosted ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {formData.boosted && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </div>
                  <span className="text-sm text-foreground">Boosted</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.video_sent}
                      onChange={(e) => setFormData({ ...formData, video_sent: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      formData.video_sent ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {formData.video_sent && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </div>
                  <span className="text-sm text-foreground">Video Sent</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={formData.is_new_client}
                      onChange={(e) => setFormData({ ...formData, is_new_client: e.target.checked })}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      formData.is_new_client ? 'bg-primary border-primary' : 'border-border'
                    }`}>
                      {formData.is_new_client && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </div>
                  <span className="text-sm text-foreground">New Client</span>
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
                  {showFullForm ? 'Hide outcome & client details' : 'Show outcome & client details (deal value, refund, etc.)'}
                </button>

                {showFullForm && (
                  <div className="mt-4 space-y-4 animate-fade-in">
                    {/* Outcome fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Deal Value ($)</label>
                        <input
                          type="number"
                          value={formData.deal_value}
                          onChange={(e) => setFormData({ ...formData, deal_value: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Refund Amount ($)</label>
                        <input
                          type="number"
                          value={formData.refund_amount}
                          onChange={(e) => setFormData({ ...formData, refund_amount: Number(e.target.value) })}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Client Hire Count</label>
                        <input
                          type="number"
                          value={formData.client_hire_count ?? ''}
                          onChange={(e) => setFormData({ ...formData, client_hire_count: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                          min="0" placeholder="Previous hires"
                        />
                      </div>
                    </div>

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
                          min="0" max="5" step="0.1" placeholder="0-5"
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
                          min="0" placeholder="Number of reviews"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Client Total Spent ($)</label>
                        <input
                          type="number"
                          value={formData.client_total_spent || ''}
                          onChange={(e) => setFormData({ ...formData, client_total_spent: e.target.value ? Number(e.target.value) : null })}
                          className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                          min="0" placeholder="Total spent on platform"
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
