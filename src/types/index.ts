export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  BD_MEMBER = 'bd_member',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  linked_profile_id?: string;
}

export interface BDProfile {
  id: string;
  name: string;
}

export enum PaymentStatus {
  VERIFIED = 'Verified',
  UNVERIFIED = 'Unverified',
  UNKNOWN = 'Unknown',
}

export enum JobType {
  HOURLY = 'Hourly',
  FIXED = 'Fixed',
}

export enum JobStatus {
  OPEN = 'Open',
  IN_PROGRESS = 'In Progress',
  WON = 'Won',
  LOST = 'Lost',
  ARCHIVED = 'Archived',
}

export enum ProposalBucket {
  LESS_5 = '<5',
  BTWN_5_10 = '5-10',
  BTWN_10_15 = '10-15',
  BTWN_20_50 = '20-50',
  MORE_50 = '50+',
}

export interface Job {
  id: string;
  bd_profile_id: string;
  job_title: string;
  job_link: string;
  payment_status: PaymentStatus;
  job_type: JobType;
  budget: number;
  proposal_competition_bucket: ProposalBucket;
  connects_used: number;
  boosted: boolean;
  video_sent: boolean;
  video_viewed: boolean;
  date_submitted: string;
  client_viewed: boolean;
  interviewed: boolean;
  job_status: JobStatus;
  deal_value: number;
  refund_amount: number;
  who_got_hired: string;
  notes: string;
  last_viewed_text: string;
  invite_sent: number;
  interviewing_at_submission: number;
}

export interface AppSettings {
  connect_cost: number;
  target_roas: number;
  currency: string;
  fiscal_year_start_month: number;
}

export interface KPIMetrics {
  periodLabel: string;
  connects: number;
  boostedConnects: number;
  returnedConnects: number;
  sent: number;
  views: number;
  interviews: number;
  closes: number;
  viewRate: number;
  interviewRate: number;
  closeRate: number;
  newClientRate: number;
  spend: number;
  revenue: number;
  refunds: number;
  roas: number;
  aov: number;
  aovNeeded: number;
  costPerProposal: number;
  costPerView: number;
  costPerInterview: number;
  costPerClose: number;
}

export enum PeriodType {
  WEEK = 'WEEK',
  MONTH = 'MONTH'
}

export interface InboundMetric {
  id: string;
  bd_profile_id: string;
  period_type: PeriodType;
  fiscal_year: number;
  month_name: string;
  week_label?: string;
  connects_used_boost: number;
  connects_available_now: number;
  impressions: number;
  boosted_clicks: number;
  profile_views: number;
  invites: number;
  conversations: number;
  closes: number;
  total_sales: number;
  manual_spend: number;
  notes?: string;
}

export enum CatalogStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  OPTIMIZING = 'OPTIMIZING',
  ARCHIVED = 'ARCHIVED',
}

export interface Catalog {
  id: string;
  bd_profile_id: string;
  title: string;
  status: CatalogStatus;
  base_price: number;
  delivery_days: number;
  date_created: string;
  notes?: string;
}

export enum CatalogActionType {
  OPTIMIZE_TITLE = 'Optimize Title',
  UPDATE_THUMBNAIL = 'Update Thumbnail',
  REVISE_PRICING = 'Revise Pricing',
  ADD_EXTRAS = 'Add Extras',
  UPDATE_DESCRIPTION = 'Update Description',
}

export interface CatalogAction {
  id: string;
  catalog_id: string;
  month_name: string;
  week_label: string;
  action_type: CatalogActionType;
  is_done: boolean;
}

export type NavigationTab = 'overview' | 'dashboard' | 'proposals' | 'analytics' | 'inbound' | 'catalogs' | 'settings';
