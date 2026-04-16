import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { User, Shield, IdCard, Calendar, Loader2, ShoppingBag, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { fetchClient } from '@/api/fetchClient';
import OrderTable from '@/components/finance/OrderTable';

export default function Profile() {
  const { user: authUser } = useAuthStore();
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: user, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user-profile', authUser?.id],
    queryFn: () => fetchClient(`/users/${authUser?.id}`),
    enabled: !!authUser?.id
  });

  const { data: orders, isLoading: isLoadingOrders } = useQuery({
    queryKey: ['user-orders', authUser?.id, debouncedSearch, statusFilter],
    queryFn: () => {
      let url = `/finance/orders?userId=${authUser?.id}&`;
      if (debouncedSearch) url += `search=${encodeURIComponent(debouncedSearch)}&`;
      if (statusFilter !== 'all') url += `status=${statusFilter}&`;
      return fetchClient(url);
    },
    enabled: !!authUser?.id
  });

  if (isLoadingUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full text-foreground p-4 md:p-8 pt-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-12 pb-20">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight">Your <span className="font-semibold">Profile</span></h1>
        </div>

        {/* Profile Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="bg-card border-border lg:col-span-2 shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl font-medium flex items-center gap-2">
                <User className="text-blue-500 w-5 h-5" /> Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1 opacity-70">Full Name</p>
                  <p className="text-lg font-medium">{user?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1 opacity-70">IC Number</p>
                  <p className="text-lg font-medium font-mono tracking-tighter">{user?.icNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1 opacity-70">Phone Number</p>
                  <p className="text-lg font-medium font-mono tracking-tighter">{user?.phoneNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1 opacity-70">Role Status</p>
                  <div className="pt-1">
                    <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-bold text-blue-500 ring-1 ring-inset ring-blue-500/30 uppercase tracking-tighter">
                      {user?.role || 'Member'}
                    </span>
                  </div>
                </div>
              </div>

              {user?.upline && (
                <div className="pt-6 border-t border-border/50">
                  <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-3 opacity-70">Introducer (Upline)</p>
                  <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border border-border/50 w-fit min-w-[240px] hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center ring-4 ring-blue-500/5">
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{user.upline.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black opacity-50">Direct Upline</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-8">
            <Card className="bg-card border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <Shield className="text-emerald-500 w-4 h-4" /> Access Level
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(user?.role === 'Admin' || user?.role === 'SuperAdmin') ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                    <p className="text-xs text-emerald-700 font-bold uppercase tracking-tight mb-1">Administrator Mode</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">System-wide management and oversight access granted.</p>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <p className="text-xs text-blue-700 font-bold uppercase tracking-tight mb-1">Member Account</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">Personal dashboard and purchase history tracking.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border overflow-hidden shadow-sm">
              <CardHeader className="bg-muted/30 border-b border-border py-4">
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <IdCard className="text-rose-500 w-4 h-4" /> Your Memberships
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {user?.memberships?.length > 0 ? (
                  <div className="divide-y divide-border">
                    {user.memberships.map((m) => (
                      <div key={m.id} className="p-5 hover:bg-muted/20 transition-colors group">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/10">{m.programType}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-bold">
                            <Calendar className="w-3 h-3" /> {new Date(m.assignedAt).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-3xl font-black tracking-tighter text-foreground font-mono group-hover:text-rose-500 transition-colors">
                            {m.fullMemberId}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-40">Sequential ID</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-10 text-center">
                    <IdCard className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground italic font-medium">No active memberships.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Separated Order History Section - Just like Orders Page */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-light tracking-tight">Your <span className="font-semibold">Order History</span></h2>
              <p className="text-muted-foreground text-xs mt-1">Track and manage your installment payments and digital receipts.</p>
            </div>
          </div>

          <Card className="bg-card border-border shadow-sm overflow-hidden">
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
              <div className="flex flex-1 items-center gap-2 w-full sm:max-w-sm">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Product Name..."
                    className="pl-9 bg-muted/20 border-border h-9 text-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground mr-1" />
                <select 
                  className="bg-muted/20 border border-border rounded-md text-[11px] font-bold uppercase h-9 px-3 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <OrderTable orders={orders} isLoading={isLoadingOrders} isAdmin={false} />
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
