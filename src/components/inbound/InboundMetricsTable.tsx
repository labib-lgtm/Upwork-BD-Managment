import React, { useState } from 'react';
import { InboundMetric, InboundMetricInsert } from '@/hooks/useInboundMetrics';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Props {
  metrics: InboundMetric[];
  profiles: { id: string; name: string }[];
  onAdd: (m: InboundMetricInsert) => Promise<any>;
  onUpdate: (id: string, updates: Partial<InboundMetricInsert>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const InboundMetricsTable: React.FC<Props> = ({ metrics, profiles, onAdd, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    bd_profile_id: '',
    period_type: 'WEEK',
    fiscal_year: new Date().getFullYear(),
    month_name: MONTHS[new Date().getMonth()],
    week_label: '',
    impressions: 0,
    boosted_clicks: 0,
    profile_views: 0,
    invites: 0,
    conversations: 0,
    closes: 0,
    total_sales: 0,
    manual_spend: 0,
    connects_used_boost: 0,
    connects_available_now: 0,
    notes: '',
  });

  const resetForm = () => {
    setForm({
      bd_profile_id: profiles[0]?.id || '',
      period_type: 'WEEK',
      fiscal_year: new Date().getFullYear(),
      month_name: MONTHS[new Date().getMonth()],
      week_label: '',
      impressions: 0, boosted_clicks: 0, profile_views: 0, invites: 0,
      conversations: 0, closes: 0, total_sales: 0, manual_spend: 0,
      connects_used_boost: 0, connects_available_now: 0, notes: '',
    });
    setEditingId(null);
  };

  const handleEdit = (m: InboundMetric) => {
    setForm({
      bd_profile_id: m.bd_profile_id,
      period_type: m.period_type,
      fiscal_year: m.fiscal_year,
      month_name: m.month_name,
      week_label: m.week_label || '',
      impressions: m.impressions,
      boosted_clicks: m.boosted_clicks,
      profile_views: m.profile_views,
      invites: m.invites,
      conversations: m.conversations,
      closes: m.closes,
      total_sales: Number(m.total_sales),
      manual_spend: Number(m.manual_spend),
      connects_used_boost: m.connects_used_boost,
      connects_available_now: m.connects_available_now,
      notes: m.notes || '',
    });
    setEditingId(m.id);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const payload = { ...form, user_id: user.id } as InboundMetricInsert;
    if (editingId) {
      const { user_id, ...updates } = payload;
      await onUpdate(editingId, updates);
    } else {
      await onAdd(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const profileName = (id: string) => profiles.find(p => p.id === id)?.name || 'Unknown';

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Inbound Metrics</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Add Metric</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit' : 'Add'} Inbound Metric</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div>
                <Label className="text-xs">Profile</Label>
                <Select value={form.bd_profile_id} onValueChange={v => setForm(f => ({ ...f, bd_profile_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Period Type</Label>
                <Select value={form.period_type} onValueChange={v => setForm(f => ({ ...f, period_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEK">Weekly</SelectItem>
                    <SelectItem value="MONTH">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Fiscal Year</Label>
                <Input type="number" value={form.fiscal_year} onChange={e => setForm(f => ({ ...f, fiscal_year: +e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Month</Label>
                <Select value={form.month_name} onValueChange={v => setForm(f => ({ ...f, month_name: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Week Label</Label>
                <Input value={form.week_label} onChange={e => setForm(f => ({ ...f, week_label: e.target.value }))} placeholder="e.g. W1" />
              </div>
              <div>
                <Label className="text-xs">Impressions</Label>
                <Input type="number" value={form.impressions} onChange={e => setForm(f => ({ ...f, impressions: +e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Boosted Clicks</Label>
                <Input type="number" value={form.boosted_clicks} onChange={e => setForm(f => ({ ...f, boosted_clicks: +e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Profile Views</Label>
                <Input type="number" value={form.profile_views} onChange={e => setForm(f => ({ ...f, profile_views: +e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Invites</Label>
                <Input type="number" value={form.invites} onChange={e => setForm(f => ({ ...f, invites: +e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Conversations</Label>
                <Input type="number" value={form.conversations} onChange={e => setForm(f => ({ ...f, conversations: +e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Closes</Label>
                <Input type="number" value={form.closes} onChange={e => setForm(f => ({ ...f, closes: +e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Total Sales ($)</Label>
                <Input type="number" value={form.total_sales} onChange={e => setForm(f => ({ ...f, total_sales: +e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Boost Spend ($)</Label>
                <Input type="number" value={form.manual_spend} onChange={e => setForm(f => ({ ...f, manual_spend: +e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Connects (Boost)</Label>
                <Input type="number" value={form.connects_used_boost} onChange={e => setForm(f => ({ ...f, connects_used_boost: +e.target.value }))} />
              </div>
            </div>
            <Button className="w-full mt-4" onClick={handleSubmit}>{editingId ? 'Update' : 'Add'} Metric</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profile</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Impressions</TableHead>
                <TableHead className="text-right">Views</TableHead>
                <TableHead className="text-right">Invites</TableHead>
                <TableHead className="text-right">Convos</TableHead>
                <TableHead className="text-right">Closes</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {metrics.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No metrics yet. Add your first inbound metric.</TableCell></TableRow>
              ) : metrics.map(m => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-sm">{profileName(m.bd_profile_id)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{m.month_name} {m.week_label ? `(${m.week_label})` : ''} {m.fiscal_year}</TableCell>
                  <TableCell className="text-right text-sm">{m.impressions.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm">{m.profile_views.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm">{m.invites}</TableCell>
                  <TableCell className="text-right text-sm">{m.conversations}</TableCell>
                  <TableCell className="text-right text-sm">{m.closes}</TableCell>
                  <TableCell className="text-right text-sm">${Number(m.total_sales).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm">${Number(m.manual_spend).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(m.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
