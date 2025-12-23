import React, { useState, useMemo } from 'react';
import { Target, ChevronLeft, ChevronRight, Loader2, Save } from 'lucide-react';
import { useGoals, Goal, GoalFormData } from '@/hooks/useGoals';
import { useBDProfiles } from '@/hooks/useBDProfiles';

interface GoalSettingsSectionProps {
  currency: string;
}

export const GoalSettingsSection: React.FC<GoalSettingsSectionProps> = ({ currency }) => {
  const { goals, loading, upsertGoal } = useGoals();
  const { profiles } = useBDProfiles();
  
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState<number | null>(null);
  
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Get goals for selected year and profile
  const yearGoals = useMemo(() => {
    return goals.filter(g => 
      g.fiscal_year === fiscalYear && 
      (selectedProfileId ? g.bd_profile_id === selectedProfileId : !g.bd_profile_id)
    );
  }, [goals, fiscalYear, selectedProfileId]);

  // Create a map for quick lookup
  const goalsByMonth = useMemo(() => {
    const map: Record<number, Goal> = {};
    yearGoals.forEach(g => {
      map[g.month] = g;
    });
    return map;
  }, [yearGoals]);

  // Local state for form values
  const [formValues, setFormValues] = useState<Record<number, { revenue: string; proposals: string; closes: string }>>({});

  // Initialize form values when goals load
  React.useEffect(() => {
    const newValues: Record<number, { revenue: string; proposals: string; closes: string }> = {};
    for (let month = 1; month <= 12; month++) {
      const goal = goalsByMonth[month];
      newValues[month] = {
        revenue: goal ? String(goal.revenue_target) : '0',
        proposals: goal ? String(goal.proposal_target) : '0',
        closes: goal ? String(goal.closes_target) : '0',
      };
    }
    setFormValues(newValues);
  }, [goalsByMonth]);

  const handleValueChange = (month: number, field: 'revenue' | 'proposals' | 'closes', value: string) => {
    setFormValues(prev => ({
      ...prev,
      [month]: {
        ...prev[month],
        [field]: value,
      },
    }));
  };

  const handleSaveMonth = async (month: number) => {
    const values = formValues[month];
    if (!values) return;

    setSaving(month);
    
    const formData: GoalFormData = {
      bd_profile_id: selectedProfileId,
      fiscal_year: fiscalYear,
      month,
      revenue_target: parseFloat(values.revenue) || 0,
      proposal_target: parseInt(values.proposals) || 0,
      closes_target: parseInt(values.closes) || 0,
    };

    await upsertGoal(formData);
    setSaving(null);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // Calculate totals
  const totals = useMemo(() => {
    let revenue = 0;
    let proposals = 0;
    let closes = 0;
    
    Object.values(formValues).forEach(v => {
      revenue += parseFloat(v?.revenue || '0') || 0;
      proposals += parseInt(v?.proposals || '0') || 0;
      closes += parseInt(v?.closes || '0') || 0;
    });

    return { revenue, proposals, closes };
  }, [formValues]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Monthly Goals
        </h3>
        
        <div className="flex items-center gap-4">
          {/* Profile selector */}
          {profiles.length > 0 && (
            <select
              value={selectedProfileId || ''}
              onChange={(e) => setSelectedProfileId(e.target.value || null)}
              className="px-3 py-1.5 text-sm bg-input border border-border rounded-lg input-focus"
            >
              <option value="">All Profiles</option>
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}
          
          {/* Year selector */}
          <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setFiscalYear(y => y - 1)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-medium tabular-nums">
              FY {fiscalYear - 1}/{fiscalYear}
            </span>
            <button
              onClick={() => setFiscalYear(y => y + 1)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Goals Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 font-medium text-muted-foreground">Month</th>
              <th className="text-right py-3 px-2 font-medium text-muted-foreground">Revenue Target</th>
              <th className="text-right py-3 px-2 font-medium text-muted-foreground">Proposals</th>
              <th className="text-right py-3 px-2 font-medium text-muted-foreground">Closes</th>
              <th className="py-3 px-2 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {months.map((monthName, idx) => {
              const month = idx + 1;
              const values = formValues[month] || { revenue: '0', proposals: '0', closes: '0' };
              const hasGoal = !!goalsByMonth[month];
              
              return (
                <tr key={month} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${hasGoal ? 'bg-primary/5' : ''}`}>
                  <td className="py-3 px-2 font-medium text-foreground">{monthName}</td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      value={values.revenue}
                      onChange={(e) => handleValueChange(month, 'revenue', e.target.value)}
                      className="w-full text-right px-3 py-2 bg-input border border-border rounded-lg input-focus tabular-nums"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      value={values.proposals}
                      onChange={(e) => handleValueChange(month, 'proposals', e.target.value)}
                      className="w-full text-right px-3 py-2 bg-input border border-border rounded-lg input-focus tabular-nums"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      value={values.closes}
                      onChange={(e) => handleValueChange(month, 'closes', e.target.value)}
                      className="w-full text-right px-3 py-2 bg-input border border-border rounded-lg input-focus tabular-nums"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => handleSaveMonth(month)}
                      disabled={saving === month}
                      className="p-2 hover:bg-primary/20 rounded-lg transition-colors text-primary disabled:opacity-50"
                      title="Save"
                    >
                      {saving === month ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                </tr>
              );
            })}
            {/* Totals row */}
            <tr className="bg-primary/10 font-bold">
              <td className="py-3 px-2 text-foreground">TOTAL</td>
              <td className="py-3 px-2 text-right text-foreground tabular-nums">
                {formatCurrency(String(totals.revenue))}
              </td>
              <td className="py-3 px-2 text-right text-foreground tabular-nums">
                {totals.proposals}
              </td>
              <td className="py-3 px-2 text-right text-foreground tabular-nums">
                {totals.closes}
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Set monthly targets for revenue, proposals sent, and closes won. Click the save icon to save each month's goals.
      </p>
    </div>
  );
};
