import React from 'react';
import { JobPostData } from '@/hooks/useJobPostCache';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, RefreshCw, ExternalLink, FileText } from 'lucide-react';

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
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No job link provided for this proposal</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Fetching job post...</p>
      </div>
    );
  }

  if (!jobPost && !error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-4">
        <FileText className="w-12 h-12 text-muted-foreground/30" />
        <div>
          <p className="text-sm text-foreground font-medium mb-1">Job post not yet fetched</p>
          <p className="text-xs text-muted-foreground mb-4">Click below to scrape the job details from Upwork</p>
        </div>
        <Button onClick={() => onScrape()} size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Fetch Job Post
        </Button>
      </div>
    );
  }

  if (error && !jobPost) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-4">
        <p className="text-sm text-destructive">{error}</p>
        <div className="flex gap-2">
          <Button onClick={() => onScrape(true)} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
          <Button asChild size="sm" variant="outline">
            <a href={jobLink} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
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
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground leading-tight">
            {jobPost?.title || 'Untitled Job'}
          </h3>
          <div className="flex gap-1.5 shrink-0">
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

        {/* Budget & Type */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Budget & Pricing</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Budget</span>
              <p className="font-medium">{jobPost?.budget_text || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Type</span>
              <p className="font-medium capitalize">{jobPost?.job_type || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Requirements */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Requirements</h4>
          {jobPost?.experience_level && (
            <div className="text-sm">
              <span className="text-muted-foreground text-xs">Experience</span>
              <p className="font-medium">{jobPost.experience_level}</p>
            </div>
          )}
          {jobPost?.skills && jobPost.skills.length > 0 && (
            <div>
              <span className="text-muted-foreground text-xs block mb-1">Skills</span>
              <div className="flex flex-wrap gap-1.5">
                {jobPost.skills.map((skill, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Client Info */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client Info (from post)</h4>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <div>
              <span className="text-muted-foreground text-xs">Location</span>
              <p className="font-medium">{jobPost?.client_location || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Total Spent</span>
              <p className="font-medium">{jobPost?.client_total_spent || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Hires</span>
              <p className="font-medium">{jobPost?.client_hire_count || 'N/A'}</p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Rating</span>
              <p className="font-medium">
                {jobPost?.client_rating || 'N/A'}
                {jobPost?.client_reviews ? ` (${jobPost.client_reviews} reviews)` : ''}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground text-xs">Payment</span>
              <p className="font-medium">
                {jobPost?.client_payment_verified === true ? '✓ Verified' : jobPost?.client_payment_verified === false ? '✗ Unverified' : 'N/A'}
              </p>
            </div>
            {jobPost?.posted_date && (
              <div>
                <span className="text-muted-foreground text-xs">Posted</span>
                <p className="font-medium">{jobPost.posted_date}</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {jobPost?.description && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Full Description</h4>
            <div className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed bg-muted/30 rounded-lg p-3 max-h-[300px] overflow-y-auto">
              {jobPost.description}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
