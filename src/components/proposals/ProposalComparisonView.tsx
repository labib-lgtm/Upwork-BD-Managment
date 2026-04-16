import React from 'react';
import { Proposal } from '@/hooks/useProposals';
import { useJobPostCache } from '@/hooks/useJobPostCache';
import { JobPostPanel } from './JobPostPanel';
import { ProposalPanel } from './ProposalPanel';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Pencil, X } from 'lucide-react';

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


  if (!proposal) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-none sm:w-[90vw] md:w-[85vw] lg:w-[80vw] xl:w-[75vw] p-0 flex flex-col"
      >
        {/* Header */}
        <SheetHeader className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold">
              Proposal vs Job Post
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  onClose();
                  onEdit(proposal);
                }}
              >
                <Pencil className="w-4 h-4 mr-1.5" />
                Edit Proposal
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* Two-panel comparison */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden min-h-0">
          {/* Left: Job Post */}
          <div className="flex flex-col overflow-hidden">
            <div className="px-5 py-2.5 border-b border-border bg-muted/30 shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                📄 Job Post (scraped)
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
            <div className="px-5 py-2.5 border-b border-border bg-muted/30 shrink-0">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                📝 Our Proposal
              </span>
            </div>
            <div className="flex-1 overflow-hidden">
              <ProposalPanel proposal={proposal} jobPost={jobPost} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
