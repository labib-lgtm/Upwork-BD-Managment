import React, { useState } from 'react';
import { Job, BDProfile, JobStatus, JobType, PaymentStatus, ProposalBucket, User, UserRole } from '@/types';
import { addJob, updateJob, deleteJob } from '@/services/dataService';
import { Plus, ExternalLink, Pencil, Trash2, X, Check, Video, Eye, MessageSquare, Trophy } from 'lucide-react';

interface ProposalsProps {
  jobs: Job[];
  profiles: BDProfile[];
  onJobsChange: () => void;
  user: User;
}

interface JobFormData {
  bd_profile_id: string;
  job_title: string;
  job_link: string;
  payment_status: PaymentStatus;
  job_type: JobType;
  budget: number;
  proposal_competition_bucket: ProposalBucket;
  connects_used: number;
  boosted: boolean;
  video_sent: boolean;
  video_viewed: boolean;
  date_submitted: string;
  client_viewed: boolean;
  interviewed: boolean;
  job_status: JobStatus;
  deal_value: number;
  refund_amount: number;
  who_got_hired: string;
  notes: string;
}

const defaultFormData: JobFormData = {
  bd_profile_id: '',
  job_title: '',
  job_link: '',
  payment_status: PaymentStatus.UNKNOWN,
  job_type: JobType.FIXED,
  budget: 0,
  proposal_competition_bucket: ProposalBucket.BTWN_5_10,
  connects_used: 6,
  boosted: false,
  video_sent: false,
  video_viewed: false,
  date_submitted: new Date().toISOString().split('T')[0],
  client_viewed: false,
  interviewed: false,
  job_status: JobStatus.OPEN,
  deal_value: 0,
  refund_amount: 0,
  who_got_hired: '',
  notes: '',
};

export const Proposals: React.FC<ProposalsProps> = ({ jobs, profiles, onJobsChange, user }) => {
  const isRestricted = user.role === UserRole.BD_MEMBER && !!user.linked_profile_id;
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [formData, setFormData] = useState<JobFormData>({
    ...defaultFormData,
    bd_profile_id: isRestricted && user.linked_profile_id ? user.linked_profile_id : profiles[0]?.id || '',
  });
  const [filterStatus, setFilterStatus] = useState<JobStatus | 'all'>('all');
  const [filterProfile, setFilterProfile] = useState<string>('all');

  const filteredJobs = jobs
    .filter((j) => filterStatus === 'all' || j.job_status === filterStatus)
    .filter((j) => {
      if (isRestricted && user.linked_profile_id) {
        return j.bd_profile_id === user.linked_profile_id;
      }
      return filterProfile === 'all' || j.bd_profile_id === filterProfile;
    })
    .sort((a, b) => new Date(b.date_submitted).getTime() - new Date(a.date_submitted).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingJob) {
      updateJob({ ...editingJob, ...formData, last_viewed_text: editingJob.last_viewed_text });
    } else {
      addJob({ ...formData, last_viewed_text: '' });
    }
    onJobsChange();
    setShowModal(false);
    setEditingJob(null);
    setFormData({
      ...defaultFormData,
      bd_profile_id: isRestricted && user.linked_profile_id ? user.linked_profile_id : profiles[0]?.id || '',
    });
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setFormData({
      bd_profile_id: job.bd_profile_id,
      job_title: job.job_title,
      job_link: job.job_link,
      payment_status: job.payment_status,
      job_type: job.job_type,
      budget: job.budget,
      proposal_competition_bucket: job.proposal_competition_bucket,
      connects_used: job.connects_used,
      boosted: job.boosted,
      video_sent: job.video_sent,
      video_viewed: job.video_viewed,
      date_submitted: job.date_submitted,
      client_viewed: job.client_viewed,
      interviewed: job.interviewed,
      job_status: job.job_status,
      deal_value: job.deal_value,
      refund_amount: job.refund_amount,
      who_got_hired: job.who_got_hired,
      notes: job.notes,
    });
    setShowModal(true);
  };

  const handleDelete = (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this proposal?')) {
      deleteJob(jobId);
      onJobsChange();
    }
  };

  const getStatusBadgeClass = (status: JobStatus) => {
    switch (status) {
      case JobStatus.WON:
        return 'status-badge-success';
      case JobStatus.LOST:
        return 'status-badge-error';
      case JobStatus.IN_PROGRESS:
        return 'status-badge-info';
      case JobStatus.ARCHIVED:
        return 'status-badge-neutral';
      default:
        return 'status-badge-warning';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Proposals</h2>
            <p className="text-sm text-muted-foreground">
              {filteredJobs.length} proposals
            </p>
          </div>
          <button
            onClick={() => {
              setEditingJob(null);
              setFormData({
                ...defaultFormData,
                bd_profile_id: isRestricted && user.linked_profile_id ? user.linked_profile_id : profiles[0]?.id || '',
              });
              setShowModal(true);
            }}
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
            onChange={(e) => setFilterStatus(e.target.value as JobStatus | 'all')}
            className="px-3 py-2 bg-secondary border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none"
          >
            <option value="all">All Status</option>
            {Object.values(JobStatus).map((status) => (
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
                <option key={profile.id} value={profile.id}>{profile.name}</option>
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
                  <th className="w-16 text-center">Connects</th>
                  <th className="w-32 text-center">Engagement</th>
                  <th className="w-24 text-right">Deal Value</th>
                  <th className="w-24 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="text-muted-foreground tabular-nums">
                      {new Date(job.date_submitted).toLocaleDateString()}
                    </td>
                    <td>
                      <span className="px-2 py-1 bg-secondary rounded text-xs font-medium">
                        {profiles.find((p) => p.id === job.bd_profile_id)?.name || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <a
                        href={job.job_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-foreground hover:text-primary transition-colors"
                      >
                        <span className="truncate max-w-[250px]">{job.job_title}</span>
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      </a>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusBadgeClass(job.job_status)}`}>
                        {job.job_status}
                      </span>
                    </td>
                    <td className="text-muted-foreground">{job.job_type}</td>
                    <td className="text-right tabular-nums">${job.budget.toLocaleString()}</td>
                    <td className="text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${job.boosted ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                        {job.connects_used}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <span className={`p-1.5 rounded ${job.client_viewed ? 'bg-blue-500/20 text-blue-400' : 'bg-secondary text-muted-foreground/30'}`} title="Viewed">
                          <Eye className="w-3.5 h-3.5" />
                        </span>
                        <span className={`p-1.5 rounded ${job.interviewed ? 'bg-green-500/20 text-green-400' : 'bg-secondary text-muted-foreground/30'}`} title="Interviewed">
                          <MessageSquare className="w-3.5 h-3.5" />
                        </span>
                        <span className={`p-1.5 rounded ${job.video_sent ? 'bg-purple-500/20 text-purple-400' : 'bg-secondary text-muted-foreground/30'}`} title="Video Sent">
                          <Video className="w-3.5 h-3.5" />
                        </span>
                        <span className={`p-1.5 rounded ${job.job_status === JobStatus.WON ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground/30'}`} title="Won">
                          <Trophy className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </td>
                    <td className="text-right tabular-nums font-medium">
                      {job.deal_value > 0 ? `$${job.deal_value.toLocaleString()}` : '-'}
                    </td>
                    <td>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEdit(job)}
                          className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-2 hover:bg-destructive/20 rounded-lg transition-colors text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
              <h3 className="text-xl font-bold text-foreground">
                {editingJob ? 'Edit Proposal' : 'New Proposal'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Profile</label>
                  <select
                    value={formData.bd_profile_id}
                    onChange={(e) => setFormData({ ...formData, bd_profile_id: e.target.value })}
                    disabled={isRestricted}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                    required
                  >
                    {profiles.slice(0, 4).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Date Submitted</label>
                  <input
                    type="date"
                    value={formData.date_submitted}
                    onChange={(e) => setFormData({ ...formData, date_submitted: e.target.value })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Job Title</label>
                <input
                  type="text"
                  value={formData.job_title}
                  onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  placeholder="Enter job title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Job Link</label>
                <input
                  type="url"
                  value={formData.job_link}
                  onChange={(e) => setFormData({ ...formData, job_link: e.target.value })}
                  className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  placeholder="https://upwork.com/jobs/..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                  <select
                    value={formData.job_status}
                    onChange={(e) => setFormData({ ...formData, job_status: e.target.value as JobStatus })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  >
                    {Object.values(JobStatus).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Type</label>
                  <select
                    value={formData.job_type}
                    onChange={(e) => setFormData({ ...formData, job_type: e.target.value as JobType })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  >
                    {Object.values(JobType).map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Payment Status</label>
                  <select
                    value={formData.payment_status}
                    onChange={(e) => setFormData({ ...formData, payment_status: e.target.value as PaymentStatus })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  >
                    {Object.values(PaymentStatus).map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
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
                  <label className="block text-sm font-medium text-foreground mb-2">Competition</label>
                  <select
                    value={formData.proposal_competition_bucket}
                    onChange={(e) => setFormData({ ...formData, proposal_competition_bucket: e.target.value as ProposalBucket })}
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg input-focus"
                  >
                    {Object.values(ProposalBucket).map((bucket) => (
                      <option key={bucket} value={bucket}>{bucket}</option>
                    ))}
                  </select>
                </div>
              </div>

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

              {/* Checkboxes */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: 'boosted', label: 'Boosted' },
                  { key: 'video_sent', label: 'Video Sent' },
                  { key: 'video_viewed', label: 'Video Viewed' },
                  { key: 'client_viewed', label: 'Client Viewed' },
                  { key: 'interviewed', label: 'Interviewed' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={formData[item.key as keyof JobFormData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        formData[item.key as keyof JobFormData] 
                          ? 'bg-primary border-primary' 
                          : 'border-border'
                      }`}>
                        {formData[item.key as keyof JobFormData] && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-foreground">{item.label}</span>
                  </label>
                ))}
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

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  {editingJob ? 'Update' : 'Create'} Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
