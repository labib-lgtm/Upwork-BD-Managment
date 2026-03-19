import { Proposal } from '@/hooks/useProposals';

export type ClientTier = 'tier1' | 'tier2' | 'tier3' | 'red_flag';

export interface ClientTierInfo {
  tier: ClientTier;
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
  riskScore: number;
}

export const getClientTier = (proposal: Proposal): ClientTierInfo => {
  const spent = proposal.client_total_spent || 0;
  const hires = proposal.client_hire_count || 0;
  const verified = proposal.payment_status === 'Verified';
  const rating = proposal.client_rating || 0;

  // Risk score calculation (0-100, lower is better)
  let riskScore = 50;
  if (!verified) riskScore += 30;
  if (spent === 0) riskScore += 15;
  if (hires === 0) riskScore += 15;
  if (rating > 0 && rating < 4) riskScore += 10;
  if (rating >= 4.5) riskScore -= 15;
  if (spent > 50000) riskScore -= 20;
  if (hires > 10) riskScore -= 15;
  riskScore = Math.max(0, Math.min(100, riskScore));

  if (!verified || (spent === 0 && hires === 0)) {
    return { tier: 'red_flag', label: 'Red Flag', color: 'hsl(0, 84%, 60%)', bgClass: 'bg-red-500/20', textClass: 'text-red-400', riskScore };
  }
  if (verified && hires >= 10 && spent >= 50000) {
    return { tier: 'tier1', label: 'Tier 1', color: 'hsl(142, 71%, 45%)', bgClass: 'bg-green-500/20', textClass: 'text-green-400', riskScore };
  }
  if (verified && hires >= 3 && spent >= 10000) {
    return { tier: 'tier2', label: 'Tier 2', color: 'hsl(199, 89%, 48%)', bgClass: 'bg-blue-500/20', textClass: 'text-blue-400', riskScore };
  }
  return { tier: 'tier3', label: 'Tier 3', color: 'hsl(38, 92%, 50%)', bgClass: 'bg-amber-500/20', textClass: 'text-amber-400', riskScore };
};

export const getTierStats = (proposals: Proposal[]) => {
  const tiers: Record<ClientTier, Proposal[]> = { tier1: [], tier2: [], tier3: [], red_flag: [] };
  proposals.forEach(p => {
    const { tier } = getClientTier(p);
    tiers[tier].push(p);
  });

  return Object.entries(tiers).map(([tier, props]) => {
    const won = props.filter(p => p.status === 'won').length;
    const total = props.length;
    const dealValue = props.filter(p => p.status === 'won').reduce((s, p) => s + (p.deal_value || 0), 0);
    const avgDeal = won > 0 ? dealValue / won : 0;
    return {
      tier: tier as ClientTier,
      count: total,
      wonCount: won,
      winRate: total > 0 ? (won / total) * 100 : 0,
      totalDealValue: dealValue,
      avgDealValue: avgDeal,
    };
  });
};
