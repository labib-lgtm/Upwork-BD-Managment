import React from 'react';
import { Proposal } from '@/hooks/useProposals';
import { JobPostData } from '@/hooks/useJobPostCache';
import { ComparisonIndicator } from './ComparisonIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Video } from 'lucide-react';
import { format } from 'date-fns';

interface ProposalPanelProps {
  proposal: Proposal;
  jobPost: JobPostData | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'won': return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'lost': return 'bg-red-500/10 text-red-500 border-red-500/20';
    case 'in_conversation':
    case 'meeting_booked':
    case 'interviewed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'negotiating': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'archived': return 'bg-muted text-muted-foreground border-muted';
    default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  }
};

const compareBudget = (proposedAmount: number, budgetText: string | null): boolean | null => {
  if (!budgetText) return null;
  // Try to extract numbers from budget text
  const nums = budgetText.match(/[\d,]+/g);
  if (!nums || nums.length === 0) return null;
  const values = nums.map(n => parseInt(n.replace(/,/g, '')));
  const maxBudget = Math.max(...values);
  const minBudget = Math.min(...values);
  if (proposedAmount >= minBudget * 0.5 && proposedAmount <= maxBudget * 1.5) return true;
  return false;
};

const compareLocation = (proposalCountry: string | null, jobLocation: string | null): boolean | null => {
  if (!proposalCountry || !jobLocation) return null;
  return proposalCountry.toLowerCase().trim() === jobLocation.toLowerCase().trim() ||
    jobLocation.toLowerCase().includes(proposalCountry.toLowerCase());
};

export const ProposalPanel: React.FC<ProposalPanelProps> = ({ proposal, jobPost }) => {
  const budgetMatch = compareBudget(proposal.proposed_amount || 0, jobPost?.budget_text || null);
  const locationMatch = compareLocation(proposal.client_country, jobPost?.client_location || null);

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-5">
        {/* Header */}
        <div>
          <h3 className="text-base font-semibold text-foreground leading-tight mb-2">
            {proposal.job_title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">{proposal.profile_name}</Badge>
            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(proposal.status)}`}>
              {proposal.status.replace(/_/g, ' ')}
            </span>
            {proposal.date_submitted && (
              <span className="text-xs text-muted-foreground">
                {format(new Date(proposal.date_submitted), 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>

        {/* Our Bid */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Our Bid</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Proposed</span>
              <p className="font-medium flex items-center gap-1">
                ${(proposal.proposed_amount || 0).toLocaleString()}
                <ComparisonIndicator match={budgetMatch} label={budgetMatch === false ? 'Bid may be outside budget range' : 'Within budget range'} />
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Type</span>
              <p className="font-medium capitalize">{proposal.job_type}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Budget (entered)</span>
              <p className="font-medium">${(proposal.budget || 0).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Deal Value</span>
              <p className="font-medium">${(proposal.deal_value || 0).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* What We Offered */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">What We Offered</h4>
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Connects</span>
              <p className="font-medium">{proposal.connects_used || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Boosted</span>
              <p className="font-medium">{proposal.boosted_connects || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Returned</span>
              <p className="font-medium">{proposal.returned_connects || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Video className={`w-4 h-4 ${proposal.video_sent ? 'text-primary' : 'text-muted-foreground/40'}`} />
              <span className="text-xs">{proposal.video_sent ? 'Video sent' : 'No video'}</span>
            </div>
            {proposal.boosted && (
              <Badge variant="outline" className="text-xs">Boosted</Badge>
            )}
            {proposal.is_new_client && (
              <Badge className="text-xs bg-accent/20 text-accent-foreground border-0">New Client</Badge>
            )}
          </div>
        </div>

        {/* Client Info (our records) */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Info (our records)</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Country</span>
              <p className="font-medium flex items-center gap-1">
                {proposal.client_country || 'N/A'}
                <ComparisonIndicator match={locationMatch} />
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Total Spent</span>
              <p className="font-medium">
                {proposal.client_total_spent != null ? `$${Number(proposal.client_total_spent).toLocaleString()}` : 'N/A'}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Hire Count</span>
              <p className="font-medium">{proposal.client_hire_count ?? 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Rating</span>
              <p className="font-medium">
                {proposal.client_rating ?? 'N/A'}
                {proposal.client_reviews != null ? ` (${proposal.client_reviews} reviews)` : ''}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Payment</span>
              <p className="font-medium">{proposal.payment_status}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Competition</span>
              <p className="font-medium">{proposal.competition_bucket || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Status & Outcome */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status & Outcome</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Invite Sent</span>
              <p className="font-medium">{proposal.invite_sent || 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Interviewing</span>
              <p className="font-medium">{proposal.interviewing_at_submission || 0}</p>
            </div>
            {proposal.last_viewed_text && (
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">Last Viewed</span>
                <p className="font-medium">{proposal.last_viewed_text}</p>
              </div>
            )}
            {proposal.loss_reason && (
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">Loss Reason</span>
                <p className="font-medium text-destructive">{proposal.loss_reason}</p>
              </div>
            )}
            {proposal.win_factor && (
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs">Win Factor</span>
                <p className="font-medium text-green-500">{proposal.win_factor}</p>
              </div>
            )}
          </div>
        </div>

        {/* Notes / Cover Letter */}
        {proposal.notes && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cover Letter / Notes</h4>
            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-3 max-h-[250px] overflow-y-auto">
              {proposal.notes}
            </div>
          </div>
        )}

        {/* Refund */}
        {(proposal.refund_amount ?? 0) > 0 && (
          <div className="text-sm">
            <span className="text-muted-foreground text-xs">Refund Amount</span>
            <p className="font-medium text-amber-500">${(proposal.refund_amount || 0).toLocaleString()}</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
