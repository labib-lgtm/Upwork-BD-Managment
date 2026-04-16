import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Proposal } from '@/hooks/useProposals';
import { logger } from '@/lib/logger';

const queuedJobLinks = new Set<string>();
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
      const missingLinks = uncheckedLinks.filter((link) => !cachedLinks.has(link));

      missingLinks.forEach((link) => queuedJobLinks.add(link));

      // Throttle sequentially to avoid edge function cold-start storms (BOOT_ERROR/503)
      for (const jobLink of missingLinks) {
        if (cancelled) return;
        try {
          const { error: invokeError } = await supabase.functions.invoke('scrape-job-post', {
            body: { job_link: jobLink },
          });
          if (invokeError) {
            queuedJobLinks.delete(jobLink);
            logger.error('Silent job post prefetch failed:', invokeError);
          }
        } catch (invokeError) {
          queuedJobLinks.delete(jobLink);
          logger.error('Silent job post prefetch error:', invokeError);
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    };

    prefetchMissingJobPosts();

    return () => {
      cancelled = true;
    };
  }, [proposals]);
};