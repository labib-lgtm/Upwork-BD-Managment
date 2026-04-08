import React, { useState } from 'react';
import { useInboundABTests, ABTest, ABTestInsert } from '@/hooks/useInboundABTests';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  profiles: { id: string; name: string }[];
}

const TEST_TYPES = ['headline', 'photo', 'description', 'portfolio'];

export const ABTestTracker: React.FC<Props> = ({ profiles }) => {
  const { user } = useAuth();
  const { tests, addTest, updateTest, deleteTest } = useInboundABTests();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    bd_profile_id: profiles[0]?.id || '',
    variation_name: '',
    test_type: 'headline',
    is_active: true,
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({ bd_profile_id: profiles[0]?.id || '', variation_name: '', test_type: 'headline', is_active: true, start_date: format(new Date(), 'yyyy-MM-dd'), end_date: '', notes: '' });
    setEditingId(null);
  };

  const handleEdit = (t: ABTest) => {
    setForm({
      bd_profile_id: t.bd_profile_id,
      variation_name: t.variation_name,
      test_type: t.test_type,
      is_active: t.is_active,
      start_date: t.start_date,
      end_date: t.end_date || '',
      notes: t.notes || '',
    });
    setEditingId(t.id);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const payload: ABTestInsert = {
      user_id: user.id,
      bd_profile_id: form.bd_profile_id,
      variation_name: form.variation_name,
      test_type: form.test_type,
      is_active: form.is_active,
      start_date: form.start_date,
      end_date: form.end_date || null,
      notes: form.notes || null,
    };
    if (editingId) {
      const { user_id, ...updates } = payload;
      await updateTest(editingId, updates);
    } else {
      await addTest(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const profileName = (id: string) => profiles.find(p => p.id === id)?.name || 'Unknown';

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">A/B Tests</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> New Test</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'New'} A/B Test</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-4">
              <div>
                <Label className="text-xs">Profile</Label>
                <Select value={form.bd_profile_id} onValueChange={v => setForm(f => ({ ...f, bd_profile_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Variation Name</Label>
                <Input value={form.variation_name} onChange={e => setForm(f => ({ ...f, variation_name: e.target.value }))} placeholder="e.g. Headline v2 - Action-focused" />
              </div>
              <div>
                <Label className="text-xs">Test Type</Label>
                <Select value={form.test_type} onValueChange={v => setForm(f => ({ ...f, test_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TEST_TYPES.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">End Date</Label>
                  <Input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
              </div>
            </div>
            <Button className="w-full mt-4" onClick={handleSubmit}>{editingId ? 'Update' : 'Create'} Test</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profile</TableHead>
              <TableHead>Variation</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tests.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No A/B tests yet. Create your first test to start tracking profile variations.</TableCell></TableRow>
            ) : tests.map(t => (
              <TableRow key={t.id}>
                <TableCell className="text-sm font-medium">{profileName(t.bd_profile_id)}</TableCell>
                <TableCell className="text-sm">{t.variation_name}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize text-xs">{t.test_type}</Badge></TableCell>
                <TableCell><Badge className={t.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-muted text-muted-foreground'}>{t.is_active ? 'Active' : 'Ended'}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.start_date}{t.end_date ? ` → ${t.end_date}` : ' → ongoing'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTest(t.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
