import {
  AppSettings,
  BDProfile,
  Job,
  JobStatus,
  JobType,
  PaymentStatus,
  ProposalBucket,
  User,
  UserRole,
  InboundMetric,
  PeriodType,
  Catalog,
  CatalogStatus,
  CatalogAction,
  CatalogActionType,
} from '../types';

export const DEFAULT_SETTINGS: AppSettings = {
  connect_cost: 0.15,
  target_roas: 10,
  currency: 'USD',
  fiscal_year_start_month: 7,
};

export const MOCK_PROFILES: BDProfile[] = [
  { id: 'p1', name: 'Main Account' },
  { id: 'p2', name: 'BD1 - Labib' },
  { id: 'p3', name: 'BD2' },
  { id: 'p4', name: 'BD3' },
  { id: 'p5', name: 'Inbound' },
  { id: 'p6', name: 'Catalogs' },
];

export const MOCK_USERS: User[] = [
  { id: 'u1', name: 'Admin User', email: 'admin@agency.com', role: UserRole.ADMIN },
  { id: 'u2', name: 'Labib Javed', email: 'labib@agency.com', role: UserRole.BD_MEMBER, linked_profile_id: 'p2' },
];

const generateMockJobs = (): Job[] => {
  const jobs: Job[] = [];
  const now = new Date();

  for (let i = 0; i < 50; i++) {
    const isWin = Math.random() > 0.8;
    const isInterview = isWin || Math.random() > 0.6;
    const isViewed = isInterview || Math.random() > 0.4;
    const daysAgo = Math.floor(Math.random() * 365);
    const jobDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const profileIndex = Math.floor(Math.random() * 4);
    const dealValue = isWin ? Math.floor(Math.random() * 5000) + 500 : 0;

    jobs.push({
      id: `job-${i + 1}`,
      bd_profile_id: MOCK_PROFILES[profileIndex].id,
      job_title: [
        'Full Stack Developer Needed',
        'React Native App Development',
        'WordPress Website Redesign',
        'Node.js Backend API',
        'UI/UX Design for SaaS',
        'Python Data Analysis',
        'Shopify Store Setup',
        'Mobile App Bug Fixes',
      ][Math.floor(Math.random() * 8)],
      job_link: `https://upwork.com/jobs/~${Math.random().toString(36).substring(7)}`,
      payment_status: [PaymentStatus.VERIFIED, PaymentStatus.UNVERIFIED, PaymentStatus.UNKNOWN][
        Math.floor(Math.random() * 3)
      ],
      job_type: Math.random() > 0.5 ? JobType.HOURLY : JobType.FIXED,
      budget: Math.floor(Math.random() * 10000) + 500,
      proposal_competition_bucket: [
        ProposalBucket.LESS_5,
        ProposalBucket.BTWN_5_10,
        ProposalBucket.BTWN_10_15,
        ProposalBucket.BTWN_20_50,
        ProposalBucket.MORE_50,
      ][Math.floor(Math.random() * 5)],
      connects_used: Math.floor(Math.random() * 12) + 4,
      boosted: Math.random() > 0.7,
      video_sent: Math.random() > 0.8,
      video_viewed: Math.random() > 0.9,
      date_submitted: jobDate.toISOString().split('T')[0],
      client_viewed: isViewed,
      interviewed: isInterview,
      job_status: isWin
        ? JobStatus.WON
        : Math.random() > 0.5
        ? JobStatus.LOST
        : JobStatus.OPEN,
      deal_value: dealValue,
      refund_amount: isWin && Math.random() > 0.9 ? Math.floor(dealValue * 0.1) : 0,
      who_got_hired: isWin ? '' : Math.random() > 0.5 ? 'Competitor Agency' : '',
      notes: '',
      last_viewed_text: isViewed ? `${Math.floor(Math.random() * 7) + 1} days ago` : '',
    });
  }

  return jobs;
};

export const INITIAL_JOBS: Job[] = generateMockJobs();

export const INITIAL_INBOUND: InboundMetric[] = [
  {
    id: 'ib1',
    bd_profile_id: 'p5',
    period_type: PeriodType.MONTH,
    fiscal_year: 2024,
    month_name: 'July',
    connects_used_boost: 50,
    connects_available_now: 200,
    impressions: 5000,
    boosted_clicks: 120,
    profile_views: 85,
    invites: 12,
    conversations: 8,
    closes: 2,
    total_sales: 4500,
    manual_spend: 7.5,
  },
];

export const INITIAL_CATALOGS: Catalog[] = [
  {
    id: 'c1',
    bd_profile_id: 'p6',
    title: 'Professional Website Development',
    status: CatalogStatus.PUBLISHED,
    base_price: 500,
    delivery_days: 7,
    date_created: '2024-01-15',
    notes: 'Best seller',
  },
  {
    id: 'c2',
    bd_profile_id: 'p6',
    title: 'Mobile App MVP',
    status: CatalogStatus.OPTIMIZING,
    base_price: 2000,
    delivery_days: 21,
    date_created: '2024-02-20',
  },
];

export const INITIAL_CATALOG_ACTIONS: CatalogAction[] = [
  {
    id: 'ca1',
    catalog_id: 'c1',
    month_name: 'Jul',
    week_label: 'Week 1',
    action_type: CatalogActionType.OPTIMIZE_TITLE,
    is_done: true,
  },
  {
    id: 'ca2',
    catalog_id: 'c2',
    month_name: 'Jul',
    week_label: 'Week 2',
    action_type: CatalogActionType.UPDATE_THUMBNAIL,
    is_done: false,
  },
];

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
