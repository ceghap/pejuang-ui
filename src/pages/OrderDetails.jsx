import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ChevronLeft, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2,
  DollarSign,
  TrendingUp,
  History,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

  const [selectedMonths, setSelectedMonths] = useState([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order-details', id],
    queryFn: () => fetchClient(`/finance/orders/${id}`),
    enabled: !!id
  });

  const payMutation = useMutation({
    mutationFn: async (payloads) => {
      // Process multiple payments if it's an array
      if (Array.isArray(payloads)) {
        for (const p of payloads) {
          await fetchClient('/finance/payments', {
            method: 'POST',
            body: JSON.stringify(p),
          });
        }
      } else {
        return fetchClient('/finance/payments', {
          method: 'POST',
          body: JSON.stringify(payloads),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['order-details', id]);
      setSelectedMonths([]);
      toast.success('Payment(s) recorded successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record payment');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => fetchClient(`/finance/orders/${id}`, {
      method: 'DELETE'
    }),
    onSuccess: () => {
      toast.success('Order deleted successfully');
      queryClient.invalidateQueries(['user-orders']);
      navigate('/profile');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete order');
    }
  });

  // Calculate Schedule
  const schedule = useMemo(() => {
    if (!order || order.tier === 'N/A') return [];

    const items = [];
    const monthlyRate = order.monthlyInstallmentRate;
    
    // Start strictly from the recorded installment start date
    let startDate = order.installmentStartDate ? new Date(order.installmentStartDate) : new Date(order.createdAt);
    
    // Calculate total months in tenure (e.g. 4500 / 150 = 30 months)
    const totalTenureMonths = Math.round(order.totalBalance / monthlyRate);

    let checkDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    
    // Generate exactly the number of months required for the tenure
    for (let i = 0; i < totalTenureMonths; i++) {
        const year = checkDate.getFullYear();
        const month = checkDate.getMonth();
        
        // Find a payment that matches this year and month
        const payment = order.payments?.find(p => {
            const pDate = new Date(p.paymentDate);
            // Compare UTC components to match backend's 1st-of-month UTC dates
            return pDate.getUTCFullYear() === year && 
                   pDate.getUTCMonth() === month && 
                   Math.abs(p.amount - monthlyRate) < 0.01;
        });
        
        items.push({
            month: new Date(checkDate),
            monthStr: `${year}-${String(month + 1).padStart(2, '0')}`,
            amount: monthlyRate,
            isPaid: !!payment,
            paymentDetail: payment
        });

        // Move to next month
        checkDate.setMonth(checkDate.getMonth() + 1);
    }

    return items;
  }, [order]);

  const toggleMonth = (monthStr) => {
    setSelectedMonths(prev => 
      prev.includes(monthStr) 
        ? prev.filter(m => m !== monthStr) 
        : [...prev, monthStr]
    );
  };

  const handlePaySelected = () => {
    const payloads = selectedMonths.map(monthStr => ({
      orderId: order.id,
      amount: order.monthlyInstallmentRate,
      paymentDate: new Date(monthStr + "-02").toISOString() // Use 2nd of month as discussed
    }));

    payMutation.mutate(payloads);
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="h-12 w-12 mx-auto text-destructive/50" />
        <h2 className="text-xl font-semibold">Order Not Found</h2>
        <Button onClick={() => navigate(-1)} variant="outline">Go Back</Button>
      </div>
    );
  }

  const isCash = order.tier === 'N/A';

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full h-8 w-8 p-0">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
        <div className="ml-auto flex items-center gap-2">
            {isAdmin && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setIsDeleteDialogOpen(true)}
                >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                </Button>
            )}
            <span className={cn(
                "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                order.status === 'Active' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                order.status === 'Completed' ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                "bg-muted text-muted-foreground border border-border"
            )}>
                {order.status}
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Summary Card */}
        <Card className="md:col-span-2 overflow-hidden border-border/50 shadow-sm bg-card/50">
            <CardHeader className="bg-muted/30 pb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl">{order.product?.name}</CardTitle>
                        <CardDescription>Order ID: {order.id.substring(0,8).toUpperCase()}</CardDescription>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Total Price</p>
                        <p className="text-2xl font-black">RM {(order.priceAtPurchase || order.product?.price || 0).toLocaleString()}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Remaining Balance</p>
                    <p className={cn("text-lg font-bold", order.remainingBalance > 0 ? "text-rose-500" : "text-emerald-500")}>
                        RM {order.remainingBalance.toLocaleString()}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Total Paid</p>
                    <p className="text-lg font-bold text-emerald-500">
                        RM {( (order.priceAtPurchase || order.product?.price || 0) - order.remainingBalance).toLocaleString()}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Purchase Type</p>
                    <p className="text-lg font-bold uppercase">{isCash ? 'Cash' : order.tier}</p>
                </div>
                {!isCash && (
                    <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Monthly Rate</p>
                        <p className="text-lg font-bold">RM {order.monthlyInstallmentRate.toLocaleString()}</p>
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Member Info */}
        <Card className="border-border/50 shadow-sm bg-card/50">
            <CardHeader>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" /> Member Information
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Name</p>
                    <p className="text-sm font-medium">{order.user?.name || 'N/A'}</p>
                </div>
                <div>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Phone</p>
                    <p className="text-sm font-medium font-mono">{order.user?.phoneNumber || 'N/A'}</p>
                </div>
                <div className="pt-2">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold mb-1">Purchase Date</p>
                    <div className="flex items-center gap-2 text-xs">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      {isCash ? (
        <Card className="bg-emerald-500/5 border-emerald-500/20">
            <CardContent className="p-12 text-center space-y-4">
                <CheckCircle2 className="w-16 h-12 mx-auto text-emerald-500" />
                <div className="space-y-2">
                    <h3 className="text-2xl font-bold">Full Cash Purchase</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        This order was completed via cash payment on {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })}. 
                        No further installments are required.
                    </p>
                </div>
            </CardContent>
        </Card>
      ) : (
        /* Schedule & History */
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Payment Schedule */}
            <div className="lg:col-span-3 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-emerald-500" /> Payment Schedule
                    </h2>
                    
                    {selectedMonths.length > 0 && (
                        <Button 
                            size="sm" 
                            className="bg-emerald-600 hover:bg-emerald-700 animate-in zoom-in-95 duration-200"
                            onClick={handlePaySelected}
                            disabled={payMutation.isPending}
                        >
                            {payMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <CreditCard className="w-4 h-4 mr-2" />
                            )}
                            Pay {selectedMonths.length} Months (RM {(selectedMonths.length * order.monthlyInstallmentRate).toLocaleString()})
                        </Button>
                    )}
                </div>

                <Card className="border-border/40 shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-12 text-center">
                                    <Clock className="w-4 h-4 mx-auto text-muted-foreground" />
                                </TableHead>
                                <TableHead>Month</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {schedule.map((item, idx) => (
                                <TableRow key={item.monthStr} className={cn(item.isPaid ? "bg-emerald-500/[0.02]" : "hover:bg-muted/30 transition-colors")}>
                                    <TableCell className="text-center">
                                        {item.isPaid ? (
                                            <div className="w-4 h-4 mx-auto bg-emerald-500 rounded flex items-center justify-center">
                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                            </div>
                                        ) : (
                                            <input 
                                                type="checkbox" 
                                                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                                checked={selectedMonths.includes(item.monthStr)}
                                                onChange={() => toggleMonth(item.monthStr)}
                                                disabled={payMutation.isPending || order.status !== 'Active'}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell className={cn("font-medium", item.isPaid ? "text-muted-foreground" : "text-foreground")}>
                                        {item.month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                    </TableCell>
                                    <TableCell className="text-sm font-mono">RM {item.amount.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        {item.isPaid ? (
                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                Paid
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                                                Pending
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* Payment Records (Raw) */}
            <div className="lg:col-span-2 space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <History className="w-5 h-5 text-blue-500" /> Transaction Logs
                </h2>
                <Card className="border-border/40 shadow-sm p-0">
                    <div className="divide-y divide-border">
                        {order.payments?.length > 0 ? (
                            [...order.payments].sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate)).map((p) => (
                                <div key={p.id} className="p-4 flex justify-between items-center hover:bg-muted/20 transition-colors">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-foreground">
                                            {p.amount === order.monthlyInstallmentRate 
                                                ? new Date(p.paymentDate).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                                                : "Initial Deposit"}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground font-mono">
                                            {new Date(p.createdAt).toLocaleDateString()} {new Date(p.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-emerald-600">RM {p.amount.toLocaleString()}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                            {p.amount === order.monthlyInstallmentRate ? "Installment" : "Deposit"}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-10 text-center space-y-2">
                                <DollarSign className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                                <p className="text-xs text-muted-foreground italic">No payment transactions recorded.</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Delete Order?"
        description="Are you sure you want to delete this order? This will also remove all associated payment history and commission forecasts. This action cannot be undone."
        onConfirm={() => deleteMutation.mutate()}
        variant="destructive"
        confirmText="Yes, Delete Order"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
