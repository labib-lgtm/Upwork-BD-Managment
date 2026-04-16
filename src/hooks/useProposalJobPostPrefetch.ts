import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Proposal } from '@/hooks/useProposals';
import { logger } from '@/lib/logger';
import { normalizeJobLink } from '@/lib/normalizeJobLink';

type PrefetchState = 'queued' | 'in-flight' | 'done' | 'failed';
const prefetchState = new Map<string, PrefetchState>();

export const useProposalJobPostPrefetch = (proposals: Proposal[]) => {
  useEffect(() => {
    const links = Array.from(
      new Set(
        proposals
          .map((p) => normalizeJobLink(p.job_link))
          .filter((l): l is string => Boolean(l))
      )
    );

    if (!links.length) return;

    let cancelled = false;

    const run = async () => {
      const unchecked = links.filter((l) => {
        const state = prefetchState.get(l);
        return state !== 'done' && state !== 'in-flight' && state !== 'queued';
      });
      if (!unchecked.length) return;

      unchecked.forEach((l) => prefetchState.set(l, 'queued'));

      const { data, error } = await supabase
        .from('job_post_cache')
        .select('job_link')
        .in('job_link', unchecked);

      if (cancelled) return;

      if (error) {
        logger.error('Failed to check job post cache before prefetch:', error);
        unchecked.forEach((l) => prefetchState.delete(l));
        return;
      }

      const cached = new Set((data || []).map((row) => row.job_link));
      cached.forEach((l) => prefetchState.set(l, 'done'));

      const missing = unchecked.filter((l) => !cached.has(l));

      // Sequential throttle to avoid edge function cold-start storms
      for (const link of missing) {
        if (cancelled) return;
        prefetchState.set(link, 'in-flight');
        try {
          const { error: invokeError } = await supabase.functions.invoke('scrape-job-post', {
            body: { job_link: link },
          });
          if (invokeError) {
            prefetchState.set(link, 'failed');
            logger.error('Silent job post prefetch failed:', invokeError);
          } else {
            prefetchState.set(link, 'done');
          }
        } catch (invokeError) {
          prefetchState.set(link, 'failed');
          logger.error('Silent job post prefetch error:', invokeError);
        }
        await new Promise((r) => setTimeout(r, 400));
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [proposals]);
};
