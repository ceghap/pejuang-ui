import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
    Trash2,
    Package,
    FileDown,
    RotateCcw,
    ExternalLink, ChevronRight
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
import { PaymentSuccessDialog } from '@/components/finance/PaymentSuccessDialog';
import { CommissionSuccessDialog } from '@/components/finance/CommissionSuccessDialog';

export default function OrderDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { user: currentUser } = useAuthStore();
    const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';

    const [selectedMonths, setSelectedMonths] = useState([]);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
    const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
    const [paymentToRevert, setPaymentToRevert] = useState(null);
    const [successData, setSuccessData] = useState(null);

    const [selectedComm, setSelectedComm] = useState(null);
    const [isPayCommDialogOpen, setIsPayCommDialogOpen] = useState(false);
    const [commSuccessData, setCommSuccessData] = useState(null);

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order-details', id],
        queryFn: () => fetchClient(`/finance/orders/${id}`),
        enabled: !!id
    });

    const isCash = order?.tier === 'N/A';

    const payMutation = useMutation({
        mutationFn: async (payload) => {
            return fetchClient('/finance/payments/bulk', {
                method: 'POST',
                body: JSON.stringify(payload),
            });
        },
        onSuccess: (data, variables) => {
            // Prepare data for Success Dialog BEFORE invalidating
            const paidMonths = selectedMonths.map(mStr => {
                const monthSchedule = schedule.find(s => s.monthStr === mStr);
                // Only count non-deposit rows for the installment index
                const idx = schedule.filter(s => !s.isDeposit).findIndex(s => s.monthStr === mStr) + 1;

                // Calculate theoretical balance after this specific payment
                // This is a bit complex since we pay multiple months at once
                // We'll just show the final balance after the whole bulk operation
                return {
                    label: `ANSURAN-${idx}`,
                    amount: order.monthlyInstallmentRate || 0,
                    date: new Date().toLocaleDateString('en-GB'),
                    balance: (order.remainingBalance || 0) - (selectedMonths.indexOf(mStr) + 1) * (order.monthlyInstallmentRate || 0)
                };
            });

            const depositAmount = ((order.priceAtPurchase || 0) - (order.totalBalance || 0));

            // Preferred order: Pejuang313, then any other membership, then '-'
            const mId = order.user?.memberships?.find(m => m.programType === 'Pejuang313')?.fullMemberId
                || order.user?.memberships?.[0]?.fullMemberId
                || '-';

            setSuccessData({
                phoneNumber: order.user?.phoneNumber || '',
                memberId: mId,
                customerName: order.user?.name || 'Unknown',
                items: order.orderItems?.map(oi => oi.product?.name) || [order.product?.name],
                totalPrice: order.priceAtPurchase || 0,
                package: order.tier,
                depositInfo: `DEPO 10% (RM ${(depositAmount || 0).toLocaleString()}) - ${new Date(order.createdAt).toLocaleDateString('en-GB')}`,
                installmentRate: order.monthlyInstallmentRate || 0,
                totalMonths: Math.round((order.totalBalance || 0) / (order.monthlyInstallmentRate || 1)),
                installmentsPaid: paidMonths
            });

            queryClient.invalidateQueries(['order-details', id]);
            setSelectedMonths([]);
            setIsPayDialogOpen(false);
            toast.success('Payment(s) recorded successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to record payment');
        }
    });

    const revertMutation = useMutation({
        mutationFn: async (paymentId) => {
            return fetchClient(`/finance/payments/${paymentId}`, {
                method: 'DELETE'
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['order-details', id]);
            setIsRevertDialogOpen(false);
            setPaymentToRevert(null);
            toast.success('Payment reverted successfully');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to revert payment');
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

    const payCommMutation = useMutation({
        mutationFn: (id) => fetchClient(`/finance/commissions/${id}/pay`, { method: 'POST' }),
        onSuccess: () => {
            if (selectedComm) {
                setCommSuccessData({
                    uplineName: selectedComm.upline?.name || 'Introducer',
                    uplinePhone: selectedComm.upline?.phoneNumber || '',
                    customerName: order?.user?.name || 'Unknown Member',
                    orderRef: order?.id?.substring(0, 8).toUpperCase() || '',
                    amount: selectedComm.expectedAmount,
                    payoutDate: new Date().toLocaleDateString('en-GB')
                });
            }
            queryClient.invalidateQueries(['order-details', id]);
            setIsPayCommDialogOpen(false);
            setSelectedComm(null);
            toast.success('Commission payout recorded');
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to record payout');
        }
    });

    // Calculate Schedule from DB data
    const schedule = useMemo(() => {
        if (!order || !order.billingSchedules) return [];

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        const installments = order.billingSchedules
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .map(bill => {
                const date = new Date(bill.dueDate);
                const year = date.getUTCFullYear();
                const month = date.getUTCMonth();

                // Is this a deposit row? (Due date matches creation date)
                const isDepositRow = new Date(bill.dueDate).getTime() === new Date(order.createdAt).getTime();

                // Find corresponding payment for this month
                const payment = order.payments?.find(p => {
                    const pDate = new Date(p.paymentDate);
                    // For installments, match month/year. For deposit, match exact date if possible.
                    if (isDepositRow) {
                        return Math.abs(p.amount - bill.amount) < 0.01 &&
                            new Date(p.paymentDate).getTime() <= new Date(order.createdAt).getTime() + 86400000;
                    }
                    return pDate.getUTCFullYear() === year && pDate.getUTCMonth() === month;
                });

                return {
                    id: bill.id,
                    label: isDepositRow ? "Initial Deposit (10%)" : `${monthNames[month]} ${year}`,
                    monthStr: isDepositRow ? 'deposit' : `${year}-${String(month + 1).padStart(2, '0')}`,
                    amount: bill.amount,
                    isPaid: bill.isPaid,
                    paidAt: bill.paidAt,
                    isOverdue: bill.isOverdue,
                    paymentId: payment?.id,
                    isDeposit: isDepositRow
                };
            });

        // For legacy orders that don't have a deposit row in BillingSchedule yet
        const hasDepositInSchedule = installments.some(s => s.isDeposit);
        if (!hasDepositInSchedule && !isCash) {
            const depositAmount = (order.priceAtPurchase || 0) - (order.totalBalance || 0);
            if (depositAmount > 0) {
                const depositPayment = order.payments?.find(p =>
                    Math.abs(p.amount - depositAmount) < 0.01 &&
                    new Date(p.paymentDate).getTime() <= new Date(order.createdAt).getTime() + 86400000
                );

                const legacyDeposit = {
                    id: 'legacy-deposit',
                    label: "Initial Deposit (10%)",
                    monthStr: 'deposit',
                    amount: depositAmount,
                    isPaid: !!depositPayment,
                    paidAt: depositPayment?.paymentDate,
                    isOverdue: false,
                    paymentId: depositPayment?.id,
                    isDeposit: true
                };
                return [legacyDeposit, ...installments];
            }
        }

        return installments;
    }, [order, isCash]);

    const latestPaidMonthStr = useMemo(() => {
        const paidMonths = schedule.filter(s => s.isPaid);
        if (paidMonths.length === 0) return null;
        // schedule is already sorted by date, so the last paid is the latest one
        return paidMonths[paidMonths.length - 1].monthStr;
    }, [schedule]);

    const toggleMonth = (monthStr) => {
        setSelectedMonths(prev =>
            prev.includes(monthStr)
                ? prev.filter(m => m !== monthStr)
                : [...prev, monthStr]
        );
    };

    const handlePaySelected = () => {
        setIsPayDialogOpen(true);
    };

    const confirmPayment = () => {
        const payload = {
            orderId: order.id,
            paymentDates: selectedMonths.map(monthStr => new Date(monthStr + "-02T00:00:00Z").toISOString())
        };

        payMutation.mutate(payload);
    };

    const handleDownloadReceipt = async (paymentId) => {
        try {
            const token = useAuthStore.getState().token;
            const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/finance/payments/${paymentId}/receipt`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Failed to download receipt');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `receipt-${paymentId?.substring(0, 8)}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            toast.error(error.message);
        }
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

    const statusInfo = (() => {
        const status = order.status;
        if (status === 'Active' || status === 1) return { label: 'Active', className: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' };
        if (status === 'Completed' || status === 2) return { label: 'Completed', className: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' };
        if (status === 'Pending' || status === 0) return { label: 'Pending', className: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' };
        if (status === 'Upgraded' || status === 3) return { label: 'Upgraded', className: 'bg-purple-500/10 text-purple-500 border border-purple-500/20' };
        if (status === 'Cancelled' || status === 4) return { label: 'Cancelled', className: 'bg-rose-500/10 text-rose-500 border border-rose-500/20' };
        return { label: status, className: 'bg-muted text-muted-foreground border border-border' };
    })();

    const isCompleted = order.status === 'Completed' || order.status === 2;

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-20">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-full h-8 w-8 p-0">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Order Details</h1>
                <div className="ml-auto flex items-center gap-2">
                    {isCash && order.payments?.length > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50"
                            onClick={() => handleDownloadReceipt(order.payments[0].id)}
                        >
                            <FileDown className="w-4 h-4 mr-2" /> Receipt
                        </Button>
                    )}
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
                        statusInfo.className
                    )}>
                        {statusInfo.label}
                    </span>
                </div>
            </div>

            {order.hasOverduePayments && !isCompleted && (
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 flex items-center gap-4 text-rose-600 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="bg-rose-500 text-white p-2 rounded-lg shadow-lg shadow-rose-500/20">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Payment Overdue</p>
                        <p className="text-xs opacity-80">One or more installments are past their due date. Please settle your outstanding balance.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Summary Card */}
                <Card className="md:col-span-2 overflow-hidden border-border/50 shadow-sm bg-card/50">
                    <CardHeader className="bg-muted/30 pb-4">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1 mr-4">
                                <CardTitle className="text-xl">
                                    {order.orderItems?.length > 0 ? (
                                        <div className="space-y-1">
                                            {order.orderItems.map((oi, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <Package className="w-4 h-4 text-blue-500" />
                                                    <span>{oi.product?.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        order.product?.name || 'Unknown'
                                    )}
                                </CardTitle>
                                <CardDescription>Order ID: {order?.id?.substring(0, 8).toUpperCase()}</CardDescription>
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
                            <p className={cn("text-lg font-bold", (order.remainingBalance || 0) > 0 ? "text-rose-500" : "text-emerald-500")}>
                                RM {(order.remainingBalance || 0).toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Total Paid</p>
                            <p className="text-lg font-bold text-emerald-500">
                                RM {((order.priceAtPurchase || order.product?.price || 0) - (order.remainingBalance || 0)).toLocaleString()}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Purchase Type</p>
                            <p className="text-lg font-bold uppercase">{isCash ? 'Cash' : order.tier}</p>
                        </div>
                        {!isCash && (
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">Monthly Rate</p>
                                <p className="text-lg font-bold">RM {(order.monthlyInstallmentRate || 0).toLocaleString()}</p>
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
                                {new Date(order.createdAt).toLocaleDateString('en-GB')}
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
                                This order was completed via cash payment on {new Date(order.createdAt).toLocaleDateString('en-GB')}.
                                No further installments are required.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
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
                                    Pay {selectedMonths.length} Months (RM {(selectedMonths.length * (order?.monthlyInstallmentRate || 0)).toLocaleString()})
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
                                    {schedule.map((item, idx) => {
                                        const isSelected = selectedMonths.includes(item.monthStr);
                                        const canSelect = !item.isPaid && isAdmin;

                                        return (
                                            <TableRow
                                                key={item.monthStr}
                                                className={cn(
                                                    item.isPaid ? "bg-emerald-500/[0.02]" : "transition-colors",
                                                    canSelect ? "cursor-pointer hover:bg-muted/50" : ""
                                                )}
                                                onClick={() => canSelect && toggleMonth(item.monthStr)}
                                            >
                                                <TableCell className="text-center">
                                                    {item.isPaid ? (
                                                        <div className="w-4 h-4 mx-auto bg-emerald-500 rounded flex items-center justify-center">
                                                            <CheckCircle2 className="w-3 h-3 text-white" />
                                                        </div>
                                                    ) : (
                                                        <input
                                                            type="checkbox"
                                                            className={cn(
                                                                "h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500",
                                                                canSelect ? "cursor-pointer" : "opacity-30 cursor-not-allowed"
                                                            )}
                                                            checked={isSelected}
                                                            disabled={!canSelect}
                                                            readOnly
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell className={cn("font-medium", item.isPaid ? "text-muted-foreground" : "text-foreground")}>
                                                    {item.label}
                                                </TableCell>
                                                <TableCell className="text-sm font-mono text-muted-foreground">RM {(item.amount || 0).toLocaleString()}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.isPaid ? (
                                                        <div className="flex items-center justify-end gap-3">
                                                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                                Paid
                                                            </span>
                                                            {item.paymentId && (
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDownloadReceipt(item.paymentId);
                                                                        }}
                                                                        title="Download Receipt"
                                                                    >
                                                                        <FileDown className="w-5 h-5" />
                                                                    </Button>
                                                                    {isAdmin && item.monthStr === latestPaidMonthStr && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-8 w-8 p-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setPaymentToRevert(item.paymentId);
                                                                                setIsRevertDialogOpen(true);
                                                                            }}
                                                                            title="Undo Latest Payment"
                                                                        >
                                                                            <RotateCcw className="w-4 h-4" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : item.isOverdue ? (
                                                        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                                                            Overdue
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                                                            Pending
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </Card>

                        {isAdmin && order.commissions?.length > 0 && (
                            <Card className="overflow-hidden border-border/50 shadow-sm mt-8">
                                <CardHeader className="bg-muted/30 border-b border-border/50 py-4 flex flex-row items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-blue-500" /> Introducer Payouts
                                        </CardTitle>
                                        <CardDescription>Commission schedule for introducer</CardDescription>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/10 hover:bg-muted/10">
                                                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Introducer</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Date</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Amount</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Status</TableHead>
                                                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {[...order.commissions].sort((a, b) => new Date(a.paidAt) - new Date(b.paidAt)).map((comm) => (<TableRow key={comm.id} className="hover:bg-muted/10 transition-colors">
                                                <TableCell className="text-xs font-medium">
                                                    {comm.upline?.name || 'Introducer'}
                                                </TableCell>
                                                <TableCell className="text-[10px] uppercase font-bold text-muted-foreground">
                                                    {new Date(comm.paidAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                </TableCell>
                                                <TableCell className="text-sm font-mono font-bold text-blue-600">
                                                    RM {(comm.expectedAmount || 0).toLocaleString()}
                                                </TableCell>
                                                <TableCell>
                                                    {comm.status === 'Paid' || comm.status === 1 ? (
                                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                                            Paid
                                                        </span>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                                Pending
                                                            </span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {!(comm.status === 'Paid' || comm.status === 1) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-7 text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                                                            onClick={() => {
                                                                setSelectedComm(comm);
                                                                setIsPayCommDialogOpen(true);
                                                            }}
                                                        >
                                                            Pay <ChevronRight className="w-3 h-3 ml-1" />
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <History className="w-5 h-5 text-blue-500" /> Transaction Logs
                        </h2>
                        <Card className="border-border/40 shadow-sm p-0">
                            <div className="divide-y divide-border">
                                {order.payments?.length > 0 ? (
                                    [...order.payments].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)).map((p) => {
                                        const pDate = new Date(p.paymentDate);
                                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                                        const isInstallment = Math.abs(p.amount - (order?.monthlyInstallmentRate || 0)) < 0.01;

                                        return (
                                            <div key={p.id} className="p-4 flex justify-between items-center hover:bg-muted/20 transition-colors group">
                                                <div className="space-y-0.5">
                                                    <p className="text-xs font-bold text-foreground">
                                                        {isInstallment
                                                            ? `${monthNames[pDate.getUTCMonth()]} ${pDate.getUTCFullYear()}`
                                                            : "Initial Deposit"}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-mono">
                                                        {new Date(p.createdAt).toLocaleDateString('en-GB')}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-bold text-emerald-600">RM {(p.amount || 0).toLocaleString()}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                                                        {isInstallment ? "Installment" : "Deposit"}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
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
                isOpen={isPayDialogOpen}
                onClose={() => setIsPayDialogOpen(false)}
                title="Confirm Offline Payment?"
                description={`You are about to mark ${selectedMonths.length} month(s) as paid (Total: RM ${(selectedMonths.length * (order?.monthlyInstallmentRate || 0)).toLocaleString()}). This will update the user's balance and generate commission forecasts.`}
                onConfirm={confirmPayment}
                variant="default"
                confirmText="Confirm Payment"
                isLoading={payMutation.isPending}
            />

            <ConfirmDialog
                isOpen={isRevertDialogOpen}
                onClose={() => setIsRevertDialogOpen(false)}
                title="Undo Payment?"
                description="Are you sure you want to revert this payment? This will add the amount back to the remaining balance and delete associated commission forecasts."
                onConfirm={() => revertMutation.mutate(paymentToRevert)}
                variant="destructive"
                confirmText="Yes, Undo Payment"
                isLoading={revertMutation.isPending}
            />

            <ConfirmDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                title="Delete Order?"
                description="Are you sure you want to delete this order? This action cannot be undone."
                onConfirm={() => deleteMutation.mutate()}
                variant="destructive"
                confirmText="Yes, Delete Order"
                isLoading={deleteMutation.isPending}
            />

            <ConfirmDialog
                isOpen={isPayCommDialogOpen}
                onClose={() => setIsPayCommDialogOpen(false)}
                title="Confirm Commission Payout?"
                description={`You are marking RM ${selectedComm?.expectedAmount?.toLocaleString()} as paid to ${selectedComm?.upline?.name}.`}
                onConfirm={() => payCommMutation.mutate(selectedComm.id)}
                isLoading={payCommMutation.isPending}
                confirmText="Confirm Payout"
            />

            <PaymentSuccessDialog
                isOpen={!!successData}
                onClose={() => setSuccessData(null)}
                data={successData}
            />

            <CommissionSuccessDialog
                isOpen={!!commSuccessData}
                onClose={() => setCommSuccessData(null)}
                data={commSuccessData}
            />
        </div>
    );
}
