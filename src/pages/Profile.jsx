import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { User, Shield, IdCard, Calendar, Loader2, ShoppingBag, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { fetchClient } from '@/api/fetchClient';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user: authUser } = useAuthStore();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user-profile', authUser?.id],
    queryFn: () => fetchClient(`/users/${authUser?.id}`),
    enabled: !!authUser?.id
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="h-full text-foreground p-4 md:p-8 pt-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 pb-10">
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-light tracking-tight">Your <span className="font-semibold">Profile</span></h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="bg-card border-border lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-medium flex items-center gap-2">
                <User className="text-blue-500 w-5 h-5" /> Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Full Name</p>
                  <p className="text-lg font-medium">{user?.name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">IC Number</p>
                  <p className="text-lg font-medium font-mono">{user?.icNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Phone Number</p>
                  <p className="text-lg font-medium font-mono">{user?.phoneNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-1">Role Status</p>
                  <div className="pt-1">
                    <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-500 ring-1 ring-inset ring-blue-500/30">
                      {user?.role || 'Member'}
                    </span>
                  </div>
                </div>
              </div>

              {user?.upline && (
                <div className="pt-4 border-t border-border">
                  <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold mb-2">Introducer (Upline)</p>
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border w-fit min-w-[200px]">
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{user.upline.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-tight">Direct Upline</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-xl font-medium flex items-center gap-2">
                  <Shield className="text-emerald-500 w-5 h-5" /> Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(user?.role === 'Admin' || user?.role === 'SuperAdmin') ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <p className="text-sm text-emerald-700 font-medium mb-1">Administrator Mode</p>
                    <p className="text-xs text-muted-foreground">You have high-level administrative access to manage users, hierarchy, and system configurations.</p>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium mb-1">Member Account</p>
                    <p className="text-xs text-muted-foreground">Standard access to personal dashboard and order history.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card border-border overflow-hidden">
              <CardHeader className="bg-muted/30 border-b border-border py-4">
                <CardTitle className="text-lg font-medium flex items-center gap-2">
                  <IdCard className="text-rose-500 w-5 h-5" /> Memberships
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {user?.memberships?.length > 0 ? (
                  <div className="divide-y divide-border">
                    {user.memberships.map((m) => (
                      <div key={m.id} className="p-4 hover:bg-muted/10 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">{m.programType}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(m.assignedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-2xl font-black tracking-tighter text-foreground font-mono">
                            {m.fullMemberId}
                          </span>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Active Member ID</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <IdCard className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground italic">No active memberships found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Order History */}
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border py-4">
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <ShoppingBag className="text-emerald-500 w-5 h-5" /> Your Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <OrderList userId={authUser?.id} />
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function OrderList({ userId }) {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['user-orders', userId],
    queryFn: () => fetchClient(`/finance/orders?userId=${userId}`),
    enabled: !!userId
  });

  if (isLoading) {
    return <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground italic text-sm">
        No orders found. Visit the shop to start your journey.
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {orders.map((o) => (
        <Link 
          key={o.id} 
          to={`/orders/${o.id}`}
          className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors group"
        >
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground group-hover:text-emerald-600 transition-colors">
              {o.product?.name}
            </p>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="font-mono uppercase">{o.id.substring(0,8)}</span>
              <span>•</span>
              <span>{new Date(o.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-foreground">RM {o.remainingBalance.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase">Balance</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-all group-hover:translate-x-0.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}
