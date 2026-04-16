import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { normalizeJobLink } from '@/lib/normalizeJobLink';
import { logger } from '@/lib/logger';

export interface JobPostData {
  id?: string;
  job_link: string;
  title: string | null;
  description: string | null;
  budget_text: string | null;
  job_type: string | null;
  skills: string[] | null;
  experience_level: string | null;
  client_location: string | null;
  client_total_spent: string | null;
  client_hire_count: string | null;
  client_rating: string | null;
  client_reviews: string | null;
  client_payment_verified: boolean | null;
  posted_date: string | null;
  scraped_at?: string;
}

// Module-level dedupe so multiple components opening the same link
// don't each invoke the edge function.
const inFlightInvokes = new Map<string, Promise<void>>();

export const useJobPostCache = (jobLink: string | null) => {
  const [jobPost, setJobPost] = useState<JobPostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoFetchedRef = useRef<Set<string>>(new Set());

  const normalized = normalizeJobLink(jobLink);

  const loadCachedJobPost = useCallback(async (link: string) => {
    // Look up by normalized link first, then fall back to raw link to be safe.
    const candidates = Array.from(new Set([link, jobLink].filter(Boolean) as string[]));
    const { data } = await supabase
      .from('job_post_cache')
      .select('*')
      .in('job_link', candidates)
      .limit(1)
      .maybeSingle();

    if (data) {
      const cached = data as unknown as JobPostData;
      setJobPost(cached);
      setError(null);
      return cached;
    }
    return null;
  }, [jobLink]);

  const invokeScrape = useCallback(async (link: string) => {
    if (inFlightInvokes.has(link)) return inFlightInvokes.get(link)!;

    const promise = (async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke('scrape-job-post', {
          body: { job_link: link },
        });
        if (fnError) throw fnError;
        if (data?.error) throw new Error(data.error);
      } catch (err) {
        logger.error('Auto job post fetch failed:', err);
        throw err;
      } finally {
        // Allow retries after completion
        setTimeout(() => inFlightInvokes.delete(link), 500);
      }
    })();

    inFlightInvokes.set(link, promise);
    return promise;
  }, []);

  // Reset state when link changes
  useEffect(() => {
    setJobPost(null);
    setError(null);
    setLoading(false);
  }, [normalized]);

  // Load from cache; if missing, auto-invoke scrape and poll briefly.
  useEffect(() => {
    if (!normalized) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    const maxAttempts = 8;

    const run = async () => {
      setLoading(true);
      const cached = await loadCachedJobPost(normalized);
      if (cancelled) return;

      if (cached) {
        setLoading(false);
        return;
      }

      // Trigger scrape once per link in this hook instance
      if (!autoFetchedRef.current.has(normalized)) {
        autoFetchedRef.current.add(normalized);
        invokeScrape(normalized).catch((err: any) => {
          if (cancelled) return;
          // Don't surface the error yet — polling may still recover if another
          // invocation populated the cache. We'll set error after polling fails.
          logger.error('Initial auto-scrape error:', err);
        });
      }

      // Poll cache while scrape runs
      const poll = async () => {
        if (cancelled) return;
        attempts += 1;
        const found = await loadCachedJobPost(normalized);
        if (cancelled) return;
        if (found) {
          setLoading(false);
          return;
        }
        if (attempts >= maxAttempts) {
          setLoading(false);
          setError('Could not load job post details');
          return;
        }
        timeoutId = setTimeout(poll, 1500);
      };
      timeoutId = setTimeout(poll, 1200);
    };

    run();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [normalized, loadCachedJobPost, invokeScrape]);

  const scrapeJobPost = async (forceRefresh = false) => {
    if (!normalized) return;
    if (!forceRefresh && jobPost) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scrape-job-post', {
        body: { job_link: normalized },
      });

      if (fnError) throw fnError;

      if (data?.error) {
        setError(data.error);
        toast.error(data.error);
      } else if (data?.data) {
        setJobPost(data.data as JobPostData);
        if (data.source === 'scraped') {
          toast.success('Job post fetched successfully');
        }
      } else {
        // Fallback: re-read cache
        await loadCachedJobPost(normalized);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to fetch job post';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { jobPost, loading, error, scrapeJobPost };
};
