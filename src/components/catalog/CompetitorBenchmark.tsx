import React, { useState } from 'react';
import { CatalogItem } from '@/hooks/useCatalogs';
import { useCatalogCompetitors, CatalogCompetitor, CatalogCompetitorInsert } from '@/hooks/useCatalogCompetitors';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  catalogs: CatalogItem[];
}

export const CompetitorBenchmark: React.FC<Props> = ({ catalogs }) => {
  const { user } = useAuth();
  const { competitors, addCompetitor, updateCompetitor, deleteCompetitor } = useCatalogCompetitors();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    catalog_id: catalogs[0]?.id || '',
    competitor_title: '',
    competitor_price: 0,
    competitor_delivery_days: 7,
    competitor_rating: '',
    seller_name: '',
    notes: '',
  });

  const resetForm = () => {
    setForm({ catalog_id: catalogs[0]?.id || '', competitor_title: '', competitor_price: 0, competitor_delivery_days: 7, competitor_rating: '', seller_name: '', notes: '' });
    setEditingId(null);
  };

  const handleEdit = (c: CatalogCompetitor) => {
    setForm({
      catalog_id: c.catalog_id,
      competitor_title: c.competitor_title,
      competitor_price: Number(c.competitor_price),
      competitor_delivery_days: c.competitor_delivery_days,
      competitor_rating: c.competitor_rating?.toString() || '',
      seller_name: c.seller_name || '',
      notes: c.notes || '',
    });
    setEditingId(c.id);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const payload: CatalogCompetitorInsert = {
      catalog_id: form.catalog_id,
      user_id: user.id,
      competitor_title: form.competitor_title,
      competitor_price: form.competitor_price,
      competitor_delivery_days: form.competitor_delivery_days,
      competitor_rating: form.competitor_rating ? +form.competitor_rating : null,
      seller_name: form.seller_name || null,
      date_logged: format(new Date(), 'yyyy-MM-dd'),
      notes: form.notes || null,
    };
    if (editingId) {
      const { user_id, ...updates } = payload;
      await updateCompetitor(editingId, updates);
    } else {
      await addCompetitor(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const catalogTitle = (id: string) => catalogs.find(c => c.id === id)?.title || 'Unknown';
  const yourPrice = (id: string) => catalogs.find(c => c.id === id)?.base_price || 0;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Competitor Benchmarking</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" disabled={catalogs.length === 0}><Plus className="w-4 h-4" /> Add Competitor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Add'} Competitor</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-4">
              <div>
                <Label className="text-xs">Your Catalog Item</Label>
                <Select value={form.catalog_id} onValueChange={v => setForm(f => ({ ...f, catalog_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{catalogs.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Competitor Title</Label>
                <Input value={form.competitor_title} onChange={e => setForm(f => ({ ...f, competitor_title: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Seller Name</Label>
                <Input value={form.seller_name} onChange={e => setForm(f => ({ ...f, seller_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Price ($)</Label>
                  <Input type="number" value={form.competitor_price} onChange={e => setForm(f => ({ ...f, competitor_price: +e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Delivery (days)</Label>
                  <Input type="number" value={form.competitor_delivery_days} onChange={e => setForm(f => ({ ...f, competitor_delivery_days: +e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Rating</Label>
                  <Input type="number" step="0.1" value={form.competitor_rating} onChange={e => setForm(f => ({ ...f, competitor_rating: e.target.value }))} placeholder="e.g. 4.8" />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full mt-4" onClick={handleSubmit}>{editingId ? 'Update' : 'Add'} Competitor</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Your Listing</TableHead>
              <TableHead>Competitor</TableHead>
              <TableHead>Seller</TableHead>
              <TableHead className="text-right">Their Price</TableHead>
              <TableHead className="text-right">Your Price</TableHead>
              <TableHead className="text-right">Delivery</TableHead>
              <TableHead className="text-right">Rating</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {competitors.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No competitors logged yet.</TableCell></TableRow>
            ) : competitors.map(c => {
              const yours = Number(yourPrice(c.catalog_id));
              const theirs = Number(c.competitor_price);
              const priceDiff = yours > 0 ? ((theirs - yours) / yours * 100) : 0;
              return (
                <TableRow key={c.id}>
                  <TableCell className="text-sm font-medium">{catalogTitle(c.catalog_id)}</TableCell>
                  <TableCell className="text-sm">{c.competitor_title}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.seller_name || '—'}</TableCell>
                  <TableCell className="text-right text-sm">${theirs.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm">${yours.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm">{c.competitor_delivery_days}d</TableCell>
                  <TableCell className="text-right text-sm">{c.competitor_rating ? `${Number(c.competitor_rating).toFixed(1)}★` : '—'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteCompetitor(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
