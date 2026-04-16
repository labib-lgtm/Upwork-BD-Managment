import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export const useJobPostCache = (jobLink: string | null) => {
  const [jobPost, setJobPost] = useState<JobPostData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try cache first on mount
  useEffect(() => {
    if (!jobLink) {
      setJobPost(null);
      return;
    }

    const checkCache = async () => {
      const { data } = await supabase
        .from('job_post_cache')
        .select('*')
        .eq('job_link', jobLink)
        .maybeSingle();

      if (data) {
        setJobPost(data as unknown as JobPostData);
      }
    };

    checkCache();
  }, [jobLink]);

  const scrapeJobPost = async (forceRefresh = false) => {
    if (!jobLink) return;

    if (!forceRefresh && jobPost) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('scrape-job-post', {
        body: { job_link: jobLink },
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
