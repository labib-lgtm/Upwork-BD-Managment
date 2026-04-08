import React, { useState } from 'react';
import { CatalogItem } from '@/hooks/useCatalogs';
import { useCatalogOrders, CatalogOrder, CatalogOrderInsert } from '@/hooks/useCatalogOrders';
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
  catalogs: CatalogItem[];
}

const FULFILLMENT = ['pending', 'in_progress', 'delivered', 'cancelled'];
const fulfillmentStyles: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  delivered: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

export const OrderTracking: React.FC<Props> = ({ catalogs }) => {
  const { user } = useAuth();
  const { orders, addOrder, updateOrder, deleteOrder } = useCatalogOrders();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    catalog_id: catalogs[0]?.id || '',
    order_date: format(new Date(), 'yyyy-MM-dd'),
    buyer_name: '',
    amount: 0,
    fulfillment_status: 'pending',
    notes: '',
  });

  const resetForm = () => {
    setForm({ catalog_id: catalogs[0]?.id || '', order_date: format(new Date(), 'yyyy-MM-dd'), buyer_name: '', amount: 0, fulfillment_status: 'pending', notes: '' });
    setEditingId(null);
  };

  const handleEdit = (o: CatalogOrder) => {
    setForm({
      catalog_id: o.catalog_id,
      order_date: o.order_date,
      buyer_name: o.buyer_name || '',
      amount: Number(o.amount),
      fulfillment_status: o.fulfillment_status,
      notes: o.notes || '',
    });
    setEditingId(o.id);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    const payload: CatalogOrderInsert = {
      catalog_id: form.catalog_id,
      user_id: user.id,
      order_date: form.order_date,
      buyer_name: form.buyer_name || null,
      amount: form.amount,
      fulfillment_status: form.fulfillment_status,
      notes: form.notes || null,
    };
    if (editingId) {
      const { user_id, ...updates } = payload;
      await updateOrder(editingId, updates);
    } else {
      await addOrder(payload);
    }
    setDialogOpen(false);
    resetForm();
  };

  const catalogTitle = (id: string) => catalogs.find(c => c.id === id)?.title || 'Unknown';

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Order Tracking</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1" disabled={catalogs.length === 0}><Plus className="w-4 h-4" /> Add Order</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editingId ? 'Edit' : 'Add'} Order</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-4">
              <div>
                <Label className="text-xs">Catalog Item</Label>
                <Select value={form.catalog_id} onValueChange={v => setForm(f => ({ ...f, catalog_id: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{catalogs.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Order Date</Label>
                  <Input type="date" value={form.order_date} onChange={e => setForm(f => ({ ...f, order_date: e.target.value }))} />
                </div>
                <div>
                  <Label className="text-xs">Amount ($)</Label>
                  <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: +e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Buyer Name</Label>
                <Input value={form.buyer_name} onChange={e => setForm(f => ({ ...f, buyer_name: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Fulfillment Status</Label>
                <Select value={form.fulfillment_status} onValueChange={v => setForm(f => ({ ...f, fulfillment_status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{FULFILLMENT.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <Button className="w-full mt-4" onClick={handleSubmit}>{editingId ? 'Update' : 'Add'} Order</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Catalog</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-20"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No orders yet.</TableCell></TableRow>
            ) : orders.map(o => (
              <TableRow key={o.id}>
                <TableCell className="text-sm font-medium">{catalogTitle(o.catalog_id)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{o.order_date}</TableCell>
                <TableCell className="text-sm">{o.buyer_name || '—'}</TableCell>
                <TableCell className="text-right text-sm">${Number(o.amount).toLocaleString()}</TableCell>
                <TableCell><Badge className={`capitalize text-xs ${fulfillmentStyles[o.fulfillment_status] || ''}`}>{o.fulfillment_status.replace('_', ' ')}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(o)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteOrder(o.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
