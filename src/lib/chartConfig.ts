// Shared chart configuration utilities for consistent styling across all analytics components

export const getChartTooltipStyle = () => ({
  backgroundColor: 'hsl(var(--chart-tooltip-bg))',
  border: '1px solid hsl(var(--chart-tooltip-border))',
  borderRadius: '10px',
  color: 'hsl(var(--chart-tooltip-text))',
  boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)',
  padding: '10px 14px',
  fontSize: '13px',
});

export const getAxisStyle = () => ({
  stroke: 'hsl(var(--muted-foreground))',
  fontSize: 12,
});

export const getGridStyle = () => ({
  strokeDasharray: '3 3',
  stroke: 'hsl(var(--border))',
});

// Consistent chart color palette
export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  success: 'hsl(142, 71%, 45%)',
  info: 'hsl(199, 89%, 48%)',
  warning: 'hsl(38, 92%, 50%)',
  destructive: 'hsl(0, 84%, 60%)',
  purple: 'hsl(280, 65%, 60%)',
  teal: 'hsl(160, 60%, 45%)',
  pink: 'hsl(330, 70%, 55%)',
  muted: 'hsl(var(--muted-foreground))',
};