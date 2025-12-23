import React, { useState } from 'react';
import { AppSettings } from '@/types';
import { updateSettings } from '@/services/dataService';
import { Save, DollarSign, Target, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsProps {
  settings: AppSettings;
  onSettingsChange: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    onSettingsChange();
    toast.success('Settings saved successfully!');
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Settings</h2>
            <p className="text-sm text-muted-foreground">
              Configure global metrics and preferences
            </p>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity glow-primary-sm"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </header>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* Global Metrics */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Global Metrics Configuration
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Cost Per Connect ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={localSettings.connect_cost}
                  onChange={(e) => setLocalSettings({ ...localSettings, connect_cost: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg input-focus text-lg"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Average cost per connect on Upwork (typically $0.15 - $0.18)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Target ROAS
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={localSettings.target_roas}
                  onChange={(e) => setLocalSettings({ ...localSettings, target_roas: Number(e.target.value) })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg input-focus text-lg"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Return on Ad Spend target (e.g., 10 means $10 revenue per $1 spent)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Currency
                </label>
                <select
                  value={localSettings.currency}
                  onChange={(e) => setLocalSettings({ ...localSettings, currency: e.target.value })}
                  className="w-full px-4 py-3 bg-input border border-border rounded-lg input-focus text-lg"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Fiscal Year */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Fiscal Year Configuration
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Fiscal Year Start Month
              </label>
              <select
                value={localSettings.fiscal_year_start_month}
                onChange={(e) => setLocalSettings({ ...localSettings, fiscal_year_start_month: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg input-focus text-lg"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>{month}</option>
                ))}
              </select>
              <p className="mt-2 text-xs text-muted-foreground">
                The first month of your fiscal year (commonly July or January)
              </p>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-6">
            <h4 className="font-bold text-foreground mb-2">💡 How metrics are calculated</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li><strong>Spend:</strong> Connects Used × Cost Per Connect</li>
              <li><strong>ROAS:</strong> Net Revenue ÷ Spend</li>
              <li><strong>View Rate:</strong> Client Views ÷ Proposals Sent</li>
              <li><strong>Close Rate:</strong> Wins ÷ Interviews</li>
              <li><strong>AOV Needed:</strong> (Spend × Target ROAS) ÷ Closes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
