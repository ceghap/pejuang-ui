import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchClient } from '@/api/fetchClient';
import { useAuthStore } from '@/store/authStore';
import { Link } from 'react-router-dom';
import OrderTable from '@/components/finance/OrderTable';

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
            <OrderTable orders={orders} isLoading={isLoading} isAdmin={isAdmin} />
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
