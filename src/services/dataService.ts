import {
  DEFAULT_SETTINGS,
  INITIAL_JOBS,
  MOCK_PROFILES,
  INITIAL_INBOUND,
  INITIAL_CATALOGS,
  INITIAL_CATALOG_ACTIONS,
  MOCK_USERS,
} from '../data/constants';
import {
  AppSettings,
  BDProfile,
  Job,
  JobStatus,
  KPIMetrics,
  InboundMetric,
  Catalog,
  CatalogAction,
  User,
} from '../types';

let jobsStore: Job[] = [...INITIAL_JOBS];
let settingsStore: AppSettings = { ...DEFAULT_SETTINGS };
let inboundStore: InboundMetric[] = [...INITIAL_INBOUND];
let catalogsStore: Catalog[] = [...INITIAL_CATALOGS];
let catalogActionsStore: CatalogAction[] = [...INITIAL_CATALOG_ACTIONS];

export const getJobs = (): Job[] => [...jobsStore];
export const getSettings = (): AppSettings => ({ ...settingsStore });
export const getProfiles = (): BDProfile[] => [...MOCK_PROFILES];
export const getUsers = (): User[] => [...MOCK_USERS];
export const getInboundMetrics = (): InboundMetric[] => [...inboundStore];
export const getCatalogs = (): Catalog[] => [...catalogsStore];
export const getCatalogActions = (): CatalogAction[] => [...catalogActionsStore];

export const updateSettings = (newSettings: AppSettings): void => {
  settingsStore = { ...newSettings };
};

export const addJob = (job: Omit<Job, 'id'>): Job => {
  const newJob: Job = { ...job, id: `job-${Date.now()}` };
  jobsStore = [newJob, ...jobsStore];
  return newJob;
};

export const updateJob = (updatedJob: Job): void => {
  jobsStore = jobsStore.map((j) => (j.id === updatedJob.id ? updatedJob : j));
};

export const deleteJob = (jobId: string): void => {
  jobsStore = jobsStore.filter((j) => j.id !== jobId);
};

export const calculateKPIMetrics = (
  allJobs: Job[],
  selectedProfileIds: string[],
  fiscalYearStart: number,
  targetYear: number,
  settings: AppSettings
): KPIMetrics[] => {
  const scopeJobs = allJobs.filter((j) =>
    selectedProfileIds.includes(j.bd_profile_id)
  );
  const months: KPIMetrics[] = [];
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const fiscalMonthOrder: number[] = [];

  for (let i = 0; i < 12; i++) {
    fiscalMonthOrder.push((fiscalYearStart - 1 + i) % 12);
  }

  fiscalMonthOrder.forEach((monthIndex) => {
    const isSecondHalf = monthIndex < fiscalYearStart - 1;
    const year = isSecondHalf ? targetYear : targetYear - 1;

    const jobsInMonth = scopeJobs.filter((j) => {
      const d = new Date(j.date_submitted);
      return d.getMonth() === monthIndex && d.getFullYear() === year;
    });

    const sent = jobsInMonth.length;
    const connects = jobsInMonth.reduce((sum, j) => sum + j.connects_used, 0);
    const views = jobsInMonth.filter((j) => j.client_viewed).length;
    const interviews = jobsInMonth.filter((j) => j.interviewed).length;
    const closes = jobsInMonth.filter((j) => j.job_status === JobStatus.WON).length;

    const revenue = jobsInMonth
      .filter((j) => j.job_status === JobStatus.WON)
      .reduce((sum, j) => sum + j.deal_value, 0);
    const refunds = jobsInMonth.reduce((sum, j) => sum + j.refund_amount, 0);
    const spend = connects * settings.connect_cost;
    const netRevenue = revenue - refunds;

    months.push({
      periodLabel: monthNames[monthIndex],
      connects,
      sent,
      views,
      interviews,
      closes,
      viewRate: sent > 0 ? (views / sent) * 100 : 0,
      interviewRate: views > 0 ? (interviews / views) * 100 : 0,
      closeRate: interviews > 0 ? (closes / interviews) * 100 : 0,
      spend,
      revenue: netRevenue,
      refunds,
      roas: spend > 0 ? netRevenue / spend : 0,
      aov: closes > 0 ? netRevenue / closes : 0,
      aovNeeded: settings.target_roas > 0 && closes > 0 
        ? (spend * settings.target_roas) / closes 
        : 0,
      costPerProposal: sent > 0 ? spend / sent : 0,
      costPerView: views > 0 ? spend / views : 0,
      costPerInterview: interviews > 0 ? spend / interviews : 0,
      costPerClose: closes > 0 ? spend / closes : 0,
    });
  });

  return months;
};

export const calculateTotals = (metrics: KPIMetrics[]): KPIMetrics => {
  const total: KPIMetrics = {
    periodLabel: 'TOTAL',
    connects: 0,
    sent: 0,
    views: 0,
    interviews: 0,
    closes: 0,
    viewRate: 0,
    interviewRate: 0,
    closeRate: 0,
    spend: 0,
    revenue: 0,
    refunds: 0,
    roas: 0,
    aov: 0,
    aovNeeded: 0,
    costPerProposal: 0,
    costPerView: 0,
    costPerInterview: 0,
    costPerClose: 0,
  };

  metrics.forEach((m) => {
    total.connects += m.connects;
    total.sent += m.sent;
    total.views += m.views;
    total.interviews += m.interviews;
    total.closes += m.closes;
    total.spend += m.spend;
    total.revenue += m.revenue;
    total.refunds += m.refunds;
  });

  total.viewRate = total.sent > 0 ? (total.views / total.sent) * 100 : 0;
  total.interviewRate = total.views > 0 ? (total.interviews / total.views) * 100 : 0;
  total.closeRate = total.interviews > 0 ? (total.closes / total.interviews) * 100 : 0;
  total.roas = total.spend > 0 ? total.revenue / total.spend : 0;
  total.aov = total.closes > 0 ? total.revenue / total.closes : 0;
  total.costPerProposal = total.sent > 0 ? total.spend / total.sent : 0;
  total.costPerView = total.views > 0 ? total.spend / total.views : 0;
  total.costPerInterview = total.interviews > 0 ? total.spend / total.interviews : 0;
  total.costPerClose = total.closes > 0 ? total.spend / total.closes : 0;

  return total;
};
