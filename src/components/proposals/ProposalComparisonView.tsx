import React, { useState } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { useJobPostCache } from '@/hooks/useJobPostCache';
import { JobPostPanel } from './JobPostPanel';
import { ProposalPanel } from './ProposalPanel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Pencil, FileText, ClipboardList } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProposalComparisonViewProps {
  proposal: Proposal | null;
  open: boolean;
  onClose: () => void;
  onEdit: (proposal: Proposal) => void;
}

export const ProposalComparisonView: React.FC<ProposalComparisonViewProps> = ({
  proposal,
  open,
  onClose,
  onEdit,
}) => {
  const { jobPost, loading, error, scrapeJobPost } = useJobPostCache(
    proposal?.job_link || null
  );
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'job' | 'proposal'>('job');

  if (!proposal) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 flex flex-col gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-5 py-3.5 pr-14 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold">
                Proposal vs Job Post
              </DialogTitle>
              <DialogDescription className="sr-only">
                Compare the scraped job post details with your submitted proposal.
              </DialogDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs shrink-0"
              onClick={() => {
                onClose();
                onEdit(proposal);
              }}
            >
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Button>
          </div>
        </DialogHeader>

        {/* Mobile tab switcher */}
        {isMobile && (
          <div className="flex border-b border-border shrink-0">
            <button
              onClick={() => setActiveTab('job')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'job'
                  ? 'text-foreground border-b-2 border-primary bg-muted/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Job Post
            </button>
            <button
              onClick={() => setActiveTab('proposal')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'proposal'
                  ? 'text-foreground border-b-2 border-primary bg-muted/30'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              Our Proposal
            </button>
          </div>
        )}

        {/* Two-panel comparison */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isMobile ? (
            <div className="h-full">
              {activeTab === 'job' ? (
                <JobPostPanel
                  jobPost={jobPost}
                  loading={loading}
                  error={error}
                  jobLink={proposal.job_link}
                  onScrape={scrapeJobPost}
                />
              ) : (
                <ProposalPanel proposal={proposal} jobPost={jobPost} />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 h-full divide-x divide-border">
              {/* Left: Job Post */}
              <div className="flex flex-col overflow-hidden">
                <div className="px-5 py-2 border-b border-border bg-muted/40 shrink-0 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Job Post
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <JobPostPanel
                    jobPost={jobPost}
                    loading={loading}
                    error={error}
                    jobLink={proposal.job_link}
                    onScrape={scrapeJobPost}
                  />
                </div>
              </div>

              {/* Right: Our Proposal */}
              <div className="flex flex-col overflow-hidden">
                <div className="px-5 py-2 border-b border-border bg-muted/40 shrink-0 flex items-center gap-2">
                  <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Our Proposal
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <ProposalPanel proposal={proposal} jobPost={jobPost} />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
