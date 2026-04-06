import React from 'react';
import { useFollowUps, FollowUp } from '@/hooks/useFollowUps';
import { useProposals } from '@/hooks/useProposals';
import { Bell, Check, SkipForward, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const FollowUpWidget: React.FC = () => {
  const { dueTodayOrOverdue, loading, updateFollowUp } = useFollowUps();
  const { proposals } = useProposals();

  const getProposalTitle = (proposalId: string) => {
    const p = proposals.find(pr => pr.id === proposalId);
    return p ? p.job_title : 'Unknown Proposal';
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'check_viewed': return 'Check if viewed';
      case 'follow_up': return 'Follow up';
      case 'final_follow_up': return 'Final follow-up';
      default: return type;
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'check_viewed': return 'bg-accent/20 text-accent-foreground';
      case 'follow_up': return 'bg-primary/20 text-primary';
      case 'final_follow_up': return 'bg-destructive/20 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="metric-card">
        <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
      </div>
    );
  }

  return (
    <div className="section-card">
      <div className="section-card-header">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Follow-Ups Due</h3>
          {dueTodayOrOverdue.length > 0 && (
            <span className="px-2 py-0.5 bg-destructive text-destructive-foreground rounded-full text-xs font-bold">
              {dueTodayOrOverdue.length}
            </span>
          )}
        </div>
      </div>
      <div className="section-card-body">
        {dueTodayOrOverdue.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No follow-ups due — you're all caught up! 🎉</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {dueTodayOrOverdue.slice(0, 10).map((fu) => (
              <div key={fu.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border/50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{getProposalTitle(fu.proposal_id)}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${getTypeBadgeClass(fu.follow_up_type)}`}>
                      {getTypeLabel(fu.follow_up_type)}
                    </span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {fu.follow_up_date < new Date().toISOString().split('T')[0] ? 'Overdue' : 'Today'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => updateFollowUp(fu.id, { status: 'done' })}
                    className="p-1.5 hover:bg-primary/20 rounded-lg transition-colors text-primary"
                    title="Mark as done"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateFollowUp(fu.id, { status: 'skipped' })}
                    className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground"
                    title="Skip"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
