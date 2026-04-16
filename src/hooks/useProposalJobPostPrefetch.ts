import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Proposal } from '@/hooks/useProposals';
import { logger } from '@/lib/logger';

const queuedJobLinks = new Set<string>();
const PREFETCH_BATCH_SIZE = 6;

export const useProposalJobPostPrefetch = (proposals: Proposal[]) => {
  useEffect(() => {
    const links = Array.from(
      new Set(
        proposals
          .map((proposal) => proposal.job_link?.trim())
          .filter((jobLink): jobLink is string => Boolean(jobLink))
      )
    );

    if (!links.length) return;

    let cancelled = false;

    const prefetchMissingJobPosts = async () => {
      const uncheckedLinks = links.filter((link) => !queuedJobLinks.has(link));
      if (!uncheckedLinks.length) return;

      const { data, error } = await supabase
        .from('job_post_cache')
        .select('job_link')
        .in('job_link', uncheckedLinks);

      if (cancelled) return;

      if (error) {
        logger.error('Failed to check job post cache before prefetch:', error);
        return;
      }

      const cachedLinks = new Set((data || []).map((row) => row.job_link));
      const missingLinks = uncheckedLinks
        .filter((link) => !cachedLinks.has(link))
        .slice(0, PREFETCH_BATCH_SIZE);

      missingLinks.forEach((link) => queuedJobLinks.add(link));

      missingLinks.forEach((jobLink) => {
        supabase.functions
          .invoke('scrape-job-post', { body: { job_link: jobLink } })
          .then(({ error: invokeError }) => {
            if (invokeError) {
              queuedJobLinks.delete(jobLink);
              logger.error('Silent job post prefetch failed:', invokeError);
            }
          })
          .catch((invokeError) => {
            queuedJobLinks.delete(jobLink);
            logger.error('Silent job post prefetch error:', invokeError);
          });
      });
    };

    prefetchMissingJobPosts();

    return () => {
      cancelled = true;
    };
  }, [proposals]);
};