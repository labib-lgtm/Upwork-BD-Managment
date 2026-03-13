import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface Proposal {
  id: string;
  user_id: string;
  profile_name: string;
  job_title: string;
  job_link: string | null;
  job_type: string;
  status: string;
  payment_status: string;
  budget: number;
  proposed_amount: number;
  connects_used: number;
  boosted: boolean;
  video_sent: boolean;
  invite_sent: number;
  interviewing_at_submission: number;
  last_viewed_text: string | null;
  client_country: string | null;
  client_rating: number | null;
  client_reviews: number | null;
  client_total_spent: number | null;
  competition_bucket: string | null;
  date_submitted: string | null;
  deal_value: number;
  refund_amount: number;
  is_new_client: boolean;
  client_hire_count: number | null;
  boosted_connects: number;
  returned_connects: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface ProposalFormData {
  profile_name: string;
  job_title: string;
  job_link: string | null;
  job_type: string;
  status: string;
  payment_status: string;
  budget: number;
  proposed_amount: number;
  connects_used: number;
  boosted: boolean;
  video_sent: boolean;
  invite_sent: number;
  interviewing_at_submission: number;
  last_viewed_text: string | null;
  client_country: string | null;
  client_rating: number | null;
  client_reviews: number | null;
  client_total_spent: number | null;
  competition_bucket: string | null;
  date_submitted: string | null;
  deal_value: number;
  refund_amount: number;
  notes: string | null;
}

export const useProposals = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProposals = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5000);

    if (error) {
      toast.error('Failed to fetch proposals');
      logger.error('Error fetching proposals:', error);
    } else {
      setProposals(data || []);
    }
    setLoading(false);
  };

  const addProposal = async (formData: ProposalFormData): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase.from('proposals').insert({
      user_id: user.id,
      created_by: user.id,
      ...formData,
    });

    if (error) {
      toast.error('Failed to add proposal');
      logger.error('Error adding proposal:', error);
      return false;
    }

    toast.success('Proposal added successfully');
    return true;
  };

  const updateProposal = async (id: string, formData: Partial<ProposalFormData>): Promise<boolean> => {
    if (!user) return false;

    const { error } = await supabase
      .from('proposals')
      .update({
        ...formData,
        updated_by: user.id,
      })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update proposal');
      logger.error('Error updating proposal:', error);
      return false;
    }

    toast.success('Proposal updated successfully');
    return true;
  };

  const deleteProposal = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('proposals')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete proposal');
      logger.error('Error deleting proposal:', error);
      return false;
    }

    toast.success('Proposal deleted');
    return true;
  };

  useEffect(() => {
    if (user) {
      fetchProposals();
    }
  }, [user]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    logger.log('Setting up real-time subscription for proposals');
    
    const channel = supabase
      .channel('proposals-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'proposals'
        },
        (payload) => {
          logger.log('Proposals realtime update:', payload);
          
          if (payload.eventType === 'INSERT') {
            setProposals(prev => [payload.new as Proposal, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setProposals(prev => 
              prev.map(p => p.id === (payload.new as Proposal).id ? payload.new as Proposal : p)
            );
          } else if (payload.eventType === 'DELETE') {
            setProposals(prev => 
              prev.filter(p => p.id !== (payload.old as Proposal).id)
            );
          }
        }
      )
      .subscribe((status) => {
        logger.log('Proposals subscription status:', status);
      });

    return () => {
      logger.log('Cleaning up proposals realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    proposals,
    loading,
    fetchProposals,
    addProposal,
    updateProposal,
    deleteProposal,
  };
};
