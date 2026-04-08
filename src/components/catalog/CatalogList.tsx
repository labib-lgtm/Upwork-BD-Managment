import React, { useState } from 'react';
import { CatalogItem, CatalogInsert } from '@/hooks/useCatalogs';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface Props {
  catalogs: CatalogItem[];
  profiles: { id: string; name: string }[];
  onAdd: (c: CatalogInsert) => Promise<any>;
  onUpdate: (id: string, updates: Partial<CatalogInsert>) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
}

const STATUSES = ['draft', 'published', 'optimizing', 'archived'];
const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  published: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  optimizing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  archived: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const CatalogList: React.FC<Props> = ({ catalogs, profiles, onAdd, onUpdate, onDelete }) => {
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    bd_profile_id: profiles[0]?.id || '',
    title: '',
    status: 'draft',
    base_price: 0,
    delivery_days: 7,
    description: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({ bd_profile_id: profiles[0]?.id || '', title: '', status: 'draft', base_price: 0, delivery_days: 7, description: '', notes: '' });
    setEditingId(null);
  };

  const handleEdit = (c: CatalogItem) => {
    setForm({
      bd_profile_id: c.bd_profile_id,
      title: c.title,
      status: c.status,
      base_price: Number(c.base_price),
      delivery_days: c.delivery_days,
      description: c.description || '',
      notes: c.notes || '',
    });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const payload: CatalogInsert = {
      user_id: user.id,
      bd_profile_id: form.bd_profile_id,
      title: form.title,
      status: form.status,
      base_price: form.base_price,
      delivery_days: form.delivery_days,
      description: form.description || null,
      date_created: new Date().toISOString().split('T')[0],
      notes: form.notes || null,
    };
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
        <CardTitle className="text-base">Catalog Listings</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Add Listing</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Add'} Catalog Listing</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-4">
              <div>
                <Label className="text-xs">Profile</Label>
                <Select value={form.bd_profile_id} onValueChange={v => setForm(f => ({ ...f, bd_profile_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Title</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Service title..." />
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Base Price ($)</Label>
                  <Input type="number" value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: +e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Delivery Days</Label>
                  <Input type="number" value={form.delivery_days} onChange={e => setForm(f => ({ ...f, delivery_days: +e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full mt-4" onClick={handleSubmit}>{editingId ? 'Update' : 'Add'} Listing</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Profile</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Delivery</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {catalogs.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No catalog listings yet. Add your first listing.</TableCell></TableRow>
            ) : catalogs.map(c => (
              <TableRow key={c.id}>
                <TableCell className="text-sm font-medium">{profileName(c.bd_profile_id)}</TableCell>
                <TableCell className="text-sm">{c.title}</TableCell>
                <TableCell><Badge className={`capitalize text-xs ${statusStyles[c.status] || ''}`}>{c.status}</Badge></TableCell>
                <TableCell className="text-right text-sm">${Number(c.base_price).toLocaleString()}</TableCell>
                <TableCell className="text-right text-sm">{c.delivery_days}d</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
