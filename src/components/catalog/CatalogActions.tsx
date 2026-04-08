import React, { useState } from 'react';
import { CatalogItem } from '@/hooks/useCatalogs';
import { useCatalogActions, CatalogActionItem } from '@/hooks/useCatalogActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
  catalogs: CatalogItem[];
}

const ACTION_TYPES = ['optimize_title', 'update_thumbnail', 'revise_pricing', 'add_extras', 'update_description'];
const ACTION_LABELS: Record<string, string> = {
  optimize_title: 'Optimize Title',
  update_thumbnail: 'Update Thumbnail',
  revise_pricing: 'Revise Pricing',
  add_extras: 'Add Extras',
  update_description: 'Update Description',
};

export const CatalogActionsPanel: React.FC<Props> = ({ catalogs }) => {
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>(catalogs[0]?.id || '');
  const { actions, loading, addAction, toggleAction, deleteAction } = useCatalogActions(selectedCatalogId || undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ action_type: 'optimize_title', month_name: '', week_label: '' });

  const doneCount = actions.filter(a => a.is_done).length;
  const progress = actions.length > 0 ? (doneCount / actions.length) * 100 : 0;

  const handleAdd = async () => {
    if (!selectedCatalogId) return;
    await addAction({
      catalog_id: selectedCatalogId,
      action_type: form.action_type,
      month_name: form.month_name,
      week_label: form.week_label,
      is_done: false,
    });
    setDialogOpen(false);
    setForm({ action_type: 'optimize_title', month_name: '', week_label: '' });
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <CardTitle className="text-base">Optimization Actions</CardTitle>
          <Select value={selectedCatalogId} onValueChange={setSelectedCatalogId}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Select catalog" /></SelectTrigger>
            <SelectContent>{catalogs.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" disabled={!selectedCatalogId}><Plus className="w-4 h-4" /> Add Action</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Add Optimization Action</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-4">
              <div>
                <Label className="text-xs">Action Type</Label>
                <Select value={form.action_type} onValueChange={v => setForm(f => ({ ...f, action_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ACTION_TYPES.map(t => <SelectItem key={t} value={t}>{ACTION_LABELS[t]}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Month</Label>
                  <Input value={form.month_name} onChange={e => setForm(f => ({ ...f, month_name: e.target.value }))} placeholder="e.g. April" />
                </div>
                <div>
                  <Label className="text-xs">Week</Label>
                  <Input value={form.week_label} onChange={e => setForm(f => ({ ...f, week_label: e.target.value }))} placeholder="e.g. W1" />
                </div>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={handleAdd}>Add Action</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {!selectedCatalogId ? (
          <p className="text-muted-foreground text-center py-6">Select a catalog to manage its optimization actions.</p>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{doneCount}/{actions.length} completed</span>
                <span className="text-sm font-medium text-foreground">{progress.toFixed(0)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            {actions.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">No optimization actions yet.</p>
            ) : (
              <div className="space-y-2">
                {actions.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={a.is_done} onCheckedChange={(checked) => toggleAction(a.id, !!checked)} />
                      <div>
                        <p className={`text-sm font-medium ${a.is_done ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {ACTION_LABELS[a.action_type] || a.action_type}
                        </p>
                        <p className="text-xs text-muted-foreground">{a.month_name} {a.week_label}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteAction(a.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
