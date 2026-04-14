import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  ChevronRight, 
  Loader2, 
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { fetchClient } from '@/api/fetchClient';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function Orders() {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders-list', debouncedSearch, statusFilter],
    queryFn: () => {
      let url = '/finance/orders?';
      if (debouncedSearch) url += `search=${encodeURIComponent(debouncedSearch)}&`;
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      return fetchClient(url);
    }
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Active</span>;
      case 'Completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20">Completed</span>;
      case 'Pending':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20">Pending</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-muted text-muted-foreground border border-border">{status}</span>;
    }
  };

  return (
    <div className="h-full text-foreground p-4 md:p-8 pt-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight">
              {isAdmin ? 'Manage' : 'Your'} <span className="font-semibold">Orders</span>
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAdmin ? 'View and track all membership installment orders across the system.' : 'Track your active installments and payment history.'}
            </p>
          </div>
          <Link to="/shop">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <ShoppingBag className="w-4 h-4 mr-2" /> New Purchase
            </Button>
          </Link>
        </div>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
            <div className="flex flex-1 items-center gap-2 w-full sm:max-w-sm">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isAdmin ? "Search by Member or Product..." : "Search products..."}
                  className="pl-9 bg-muted/20 border-border"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground mr-1" />
              <select 
                className="bg-muted/20 border border-border rounded-md text-xs h-9 px-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="w-[100px]">Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    {isAdmin && <TableHead>Member</TableHead>}
                    <TableHead>Product</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="h-32 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mt-2">Loading orders...</p>
                      </TableCell>
                    </TableRow>
                  ) : orders?.length > 0 ? (
                    orders.map((o) => (
                      <TableRow key={o.id} className="group hover:bg-muted/20 transition-colors">
                        <TableCell className="font-mono text-[10px] font-bold uppercase text-muted-foreground">
                          {o.id.substring(0,8)}
                        </TableCell>
                        <TableCell className="text-xs">
                          {new Date(o.createdAt).toLocaleDateString()}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{o.user?.name || 'Unknown'}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{o.user?.icNumber || '-'}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-sm font-semibold truncate max-w-[150px]">
                              {o.orderItems?.[0]?.product?.name || o.product?.name || 'Unknown'}
                              {o.orderItems?.length > 1 && ` +${o.orderItems.length - 1} more`}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className={cn("text-sm font-bold", o.remainingBalance > 0 ? "text-rose-500" : "text-emerald-600")}>
                              RM {o.remainingBalance.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-muted-foreground">of RM {(o.priceAtPurchase || o.product?.price || 0).toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(o.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/orders/${o.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                              Details <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isAdmin ? 7 : 6} className="h-40 text-center">
                        <div className="flex flex-col items-center justify-center opacity-40">
                          <ShoppingBag className="w-10 h-10 mb-2" />
                          <p className="text-sm font-medium">No orders found</p>
                          <p className="text-xs">Try adjusting your search or filters.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-amber-500/5 border-amber-500/10">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-600 flex items-center gap-2">
                            <AlertCircle className="w-3 h-3" /> Note for Admins
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                            Orders with a **Pending** status usually indicate a missing initial deposit or a manual entry awaiting verification. **Active** orders are currently in the installment phase.
                        </p>
                    </CardContent>
                </Card>
            </div>
        )}

      </div>
    </div>
  );
}
