import React from 'react';
import { Proposal } from '@/hooks/useProposals';
import { JobPostData } from '@/hooks/useJobPostCache';
import { ComparisonIndicator } from './ComparisonIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Send, User, BarChart3, Video, FileText } from 'lucide-react';
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
          <h3 className="text-base font-semibold text-foreground leading-snug mb-2">
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

        {/* Our Bid — aligned with Job Post "Budget & Pricing" */}
        <Section title="Our Bid" icon={DollarSign}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Proposed">
              <p className="font-medium text-sm flex items-center gap-1">
                ${(proposal.proposed_amount || 0).toLocaleString()}
                <ComparisonIndicator match={budgetMatch} label={budgetMatch === false ? 'Bid may be outside budget range' : 'Within budget range'} />
              </p>
            </Field>
            <Field label="Type">
              <p className="font-medium text-sm capitalize">{proposal.job_type}</p>
            </Field>
            <Field label="Budget (entered)">
              <p className="font-medium text-sm">${(proposal.budget || 0).toLocaleString()}</p>
            </Field>
            <Field label="Deal Value">
              <p className="font-medium text-sm">${(proposal.deal_value || 0).toLocaleString()}</p>
            </Field>
          </div>
        </Section>

        {/* What We Offered — aligned with Job Post "Requirements" */}
        <Section title="What We Offered" icon={Send}>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <Field label="Connects">
              <p className="font-medium text-sm">{proposal.connects_used || 0}</p>
            </Field>
            <Field label="Boosted">
              <p className="font-medium text-sm">{proposal.boosted_connects || 0}</p>
            </Field>
            <Field label="Returned">
              <p className="font-medium text-sm">{proposal.returned_connects || 0}</p>
            </Field>
          </div>
          <div className="flex items-center gap-4 text-sm mt-1">
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
        </Section>

        {/* Client Info — aligned with Job Post "Client Info" */}
        <Section title="Client Info (our records)" icon={User}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Field label="Country">
              <p className="font-medium text-sm flex items-center gap-1">
                {proposal.client_country || 'N/A'}
                <ComparisonIndicator match={locationMatch} />
              </p>
            </Field>
            <Field label="Total Spent">
              <p className="font-medium text-sm">
                {proposal.client_total_spent != null ? `$${Number(proposal.client_total_spent).toLocaleString()}` : 'N/A'}
              </p>
            </Field>
            <Field label="Hire Count">
              <p className="font-medium text-sm">{proposal.client_hire_count ?? 'N/A'}</p>
            </Field>
            <Field label="Rating">
              <p className="font-medium text-sm">
                {proposal.client_rating ?? 'N/A'}
                {proposal.client_reviews != null ? ` (${proposal.client_reviews} reviews)` : ''}
              </p>
            </Field>
            <Field label="Payment">
              <p className="font-medium text-sm">{proposal.payment_status}</p>
            </Field>
            <Field label="Competition">
              <p className="font-medium text-sm">{proposal.competition_bucket || 'N/A'}</p>
            </Field>
          </div>
        </Section>

        {/* Status & Outcome */}
        <Section title="Status & Outcome" icon={BarChart3}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Field label="Invite Sent">
              <p className="font-medium text-sm">{proposal.invite_sent || 0}</p>
            </Field>
            <Field label="Interviewing">
              <p className="font-medium text-sm">{proposal.interviewing_at_submission || 0}</p>
            </Field>
            {proposal.last_viewed_text && (
              <div className="col-span-2">
                <Field label="Last Viewed">
                  <p className="font-medium text-sm">{proposal.last_viewed_text}</p>
                </Field>
              </div>
            )}
            {proposal.loss_reason && (
              <div className="col-span-2">
                <Field label="Loss Reason">
                  <p className="font-medium text-sm text-destructive">{proposal.loss_reason}</p>
                </Field>
              </div>
            )}
            {proposal.win_factor && (
              <div className="col-span-2">
                <Field label="Win Factor">
                  <p className="font-medium text-sm text-green-500">{proposal.win_factor}</p>
                </Field>
              </div>
            )}
          </div>
        </Section>

        {/* Cover Letter */}
        {proposal.notes && (
          <Section title="Cover Letter / Notes" icon={FileText}>
            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-3 max-h-[250px] overflow-y-auto">
              {proposal.notes}
            </div>
          </Section>
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

/* ---- Shared sub-components ---- */

const Section: React.FC<{
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ title, icon: Icon, children }) => (
  <div className="space-y-2.5">
    <div className="flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground" />
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{title}</h4>
    </div>
    {children}
  </div>
);

const Field: React.FC<{
  label: string;
  children: React.ReactNode;
}> = ({ label, children }) => (
  <div>
    <span className="text-muted-foreground text-xs">{label}</span>
    {children}
  </div>
);
