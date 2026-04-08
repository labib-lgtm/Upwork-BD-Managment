import React, { useState, useMemo } from 'react';
import { useCatalogs, CatalogItem, CatalogInsert } from '@/hooks/useCatalogs';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessibleProfiles } from '@/hooks/useBDProfiles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, ShoppingCart, Users2, ClipboardCheck, DollarSign, TrendingUp } from 'lucide-react';
import { CatalogList } from '@/components/catalog/CatalogList';
import { CatalogActionsPanel } from '@/components/catalog/CatalogActions';
import { OrderTracking } from '@/components/catalog/OrderTracking';
import { CompetitorBenchmark } from '@/components/catalog/CompetitorBenchmark';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCatalogOrders } from '@/hooks/useCatalogOrders';

export const CatalogManagement: React.FC = () => {
  const { catalogs, loading, addCatalog, updateCatalog, deleteCatalog } = useCatalogs();
  const { orders } = useCatalogOrders();
  const { accessibleProfiles } = useAccessibleProfiles();
  const [selectedProfile, setSelectedProfile] = useState<string>('all');
  const [selectedCatalog, setSelectedCatalog] = useState<string | null>(null);

  const filteredCatalogs = useMemo(() => {
    if (selectedProfile === 'all') return catalogs;
    return catalogs.filter(c => c.bd_profile_id === selectedProfile);
  }, [catalogs, selectedProfile]);

  const kpis = useMemo(() => {
    const totalListings = filteredCatalogs.length;
    const published = filteredCatalogs.filter(c => c.status === 'published').length;
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.amount), 0);
    const avgPrice = totalListings > 0 ? filteredCatalogs.reduce((sum, c) => sum + Number(c.base_price), 0) / totalListings : 0;
    return { totalListings, published, totalOrders, totalRevenue, avgPrice };
  }, [filteredCatalogs, orders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const kpiCards = [
    { label: 'Total Listings', value: kpis.totalListings, icon: Package, color: 'text-blue-400' },
    { label: 'Published', value: kpis.published, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Total Orders', value: kpis.totalOrders, icon: ShoppingCart, color: 'text-purple-400' },
    { label: 'Revenue', value: `$${kpis.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-primary' },
    { label: 'Avg. Price', value: `$${kpis.avgPrice.toFixed(0)}`, icon: DollarSign, color: 'text-orange-400' },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Catalog Management</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage service listings, track orders, and benchmark competitors</p>
          </div>
          <Select value={selectedProfile} onValueChange={setSelectedProfile}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All Profiles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Profiles</SelectItem>
              {accessibleProfiles.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {kpiCards.map(kpi => (
            <Card key={kpi.label} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{kpi.label}</p>
                    <p className="text-xl font-bold text-foreground mt-1">{kpi.value}</p>
                  </div>
                  <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList className="bg-secondary">
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="actions">Optimization</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
          </TabsList>

          <TabsContent value="listings">
            <CatalogList
              catalogs={filteredCatalogs}
              profiles={accessibleProfiles}
              onAdd={addCatalog}
              onUpdate={updateCatalog}
              onDelete={deleteCatalog}
            />
          </TabsContent>

          <TabsContent value="actions">
            <CatalogActionsPanel catalogs={filteredCatalogs} />
          </TabsContent>

          <TabsContent value="orders">
            <OrderTracking catalogs={filteredCatalogs} />
          </TabsContent>

          <TabsContent value="competitors">
            <CompetitorBenchmark catalogs={filteredCatalogs} />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
};
