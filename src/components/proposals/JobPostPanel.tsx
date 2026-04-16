import React from 'react';
import { JobPostData } from '@/hooks/useJobPostCache';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, RefreshCw, ExternalLink, FileText, DollarSign, Briefcase, MapPin, Star, ShieldCheck, Calendar, Code2 } from 'lucide-react';

interface JobPostPanelProps {
  jobPost: JobPostData | null;
  loading: boolean;
  error: string | null;
  jobLink: string | null;
  onScrape: (force?: boolean) => void;
}

export const JobPostPanel: React.FC<JobPostPanelProps> = ({
  jobPost,
  loading,
  error,
  jobLink,
  onScrape,
}) => {
  if (!jobLink) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <FileText className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-medium text-muted-foreground">No job link provided</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Add a job link to the proposal to enable comparison</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Fetching job post…</p>
      </div>
    );
  }

  if (!jobPost && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
        <div className="w-14 h-14 rounded-full bg-muted/50 flex items-center justify-center">
          <FileText className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Job post not cached yet</p>
          <p className="text-xs text-muted-foreground">Click below to fetch it now</p>
        </div>
        <Button onClick={() => onScrape()} size="sm">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          Fetch Now
        </Button>
      </div>
    );
  }

  if (error && !jobPost) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
        <p className="text-sm text-destructive font-medium">{error}</p>
        <div className="flex gap-2">
          <Button onClick={() => onScrape(true)} size="sm" variant="outline">
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Retry
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={jobLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Open on Upwork
            </a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-5">
        {/* Title */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-foreground leading-snug">
            {jobPost?.title || 'Untitled Job'}
          </h3>
          <div className="flex gap-1 shrink-0">
            <Button onClick={() => onScrape(true)} size="sm" variant="ghost" className="h-7 w-7 p-0" title="Refresh">
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
            <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0" title="Open on Upwork">
              <a href={jobLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </Button>
          </div>
        </div>

        {/* Budget & Type — aligned with Proposal "Our Bid" */}
        <Section title="Budget & Pricing" icon={DollarSign}>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Budget" value={jobPost?.budget_text || 'Not specified'} />
            <Field label="Type" value={jobPost?.job_type || 'N/A'} capitalize />
          </div>
        </Section>

        {/* Requirements — aligned with Proposal "What We Offered" */}
        <Section title="Requirements" icon={Briefcase}>
          {jobPost?.experience_level && (
            <Field label="Experience" value={jobPost.experience_level} />
          )}
          {jobPost?.skills && jobPost.skills.length > 0 && (
            <div>
              <span className="text-muted-foreground text-xs block mb-1.5">Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {jobPost.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Section>

        {/* Client Info — aligned with Proposal "Client Info" */}
        <Section title="Client Info (from post)" icon={Star}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Field label="Location" value={jobPost?.client_location || 'N/A'} />
            <Field label="Total Spent" value={jobPost?.client_total_spent || 'N/A'} />
            <Field label="Hires" value={jobPost?.client_hire_count || 'N/A'} />
            <Field
              label="Rating"
              value={`${jobPost?.client_rating || 'N/A'}${jobPost?.client_reviews ? ` (${jobPost.client_reviews} reviews)` : ''}`}
            />
            <Field
              label="Payment"
              value={
                jobPost?.client_payment_verified === true
                  ? '✓ Verified'
                  : jobPost?.client_payment_verified === false
                  ? '✗ Unverified'
                  : 'N/A'
              }
            />
            {jobPost?.posted_date && (
              <Field label="Posted" value={jobPost.posted_date} />
            )}
          </div>
        </Section>

        {/* Description */}
        {jobPost?.description && (
          <Section title="Full Description" icon={Code2}>
            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-3 max-h-[300px] overflow-y-auto">
              {jobPost.description}
            </div>
          </Section>
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
  value: string | number;
  capitalize?: boolean;
  children?: React.ReactNode;
}> = ({ label, value, capitalize, children }) => (
  <div>
    <span className="text-muted-foreground text-xs">{label}</span>
    <p className={`font-medium text-sm flex items-center gap-1 ${capitalize ? 'capitalize' : ''}`}>
      {value}
      {children}
    </p>
  </div>
);
