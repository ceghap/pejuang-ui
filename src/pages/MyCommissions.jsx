import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  DollarSign, 
  Loader2, 
  ExternalLink,
  ChevronRight,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function MyCommissions() {
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['my-commissions', statusFilter],
    queryFn: () => {
        let url = '/finance/my-commissions';
        if (statusFilter !== 'all') url += `?status=${statusFilter}`;
        return fetchClient(url);
    }
  });

  const stats = useMemo(() => {
    if (!commissions || !Array.isArray(commissions)) return { totalPaid: 0, totalPending: 0 };
    return {
      totalPaid: commissions.filter(c => c.status === 'Paid' || c.status === 1).reduce((sum, c) => sum + (c.expectedAmount || 0), 0),
      totalPending: commissions.filter(c => c.status === 'Pending' || c.status === 0).reduce((sum, c) => sum + (c.expectedAmount || 0), 0)
    };
  }, [commissions]);

  return (
    <div className="h-full text-foreground p-4 md:p-8 pt-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight">Your <span className="font-semibold">Commissions</span></h1>
            <p className="text-muted-foreground text-sm mt-1">Track your earnings from introducer rewards and historical payouts.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-emerald-500/[0.03] border-emerald-500/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3" /> Total Paid
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-black text-emerald-700">RM {stats.totalPaid.toLocaleString()}</p>
                </CardContent>
            </Card>

            <Card className="bg-amber-500/[0.03] border-amber-500/10">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-600 flex items-center gap-2">
                        <Clock className="w-3 h-3" /> Expected (Pending)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-black text-amber-700">RM {stats.totalPending.toLocaleString()}</p>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-4">
            <div className="flex items-center gap-2">
                {['all', 'Pending', 'Paid'].map((s) => (
                    <Button 
                        key={s}
                        variant={statusFilter === s ? 'secondary' : 'ghost'}
                        size="sm"
                        className={cn(
                            "text-[10px] font-bold uppercase h-8 px-4",
                            statusFilter === s ? "bg-blue-500/10 text-blue-600 border border-blue-500/20" : "text-muted-foreground"
                        )}
                        onClick={() => setStatusFilter(s)}
                    >
                        {s === 'all' ? 'All Records' : `${s} Only`}
                    </Button>
                ))}
            </div>

            <Card className="overflow-hidden border-border/50">
                <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" /> Payout History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
                        </div>
                    ) : commissions?.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/10 hover:bg-muted/10">
                                    <TableHead className="text-[10px] font-bold uppercase">Ref Order</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase">Customer</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase">Payment Date</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-right">Amount</TableHead>
                                    <TableHead className="text-[10px] font-bold uppercase text-right">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...commissions].sort((a, b) => new Date(b.paidAt) - new Date(a.paidAt)).map((c) => (
                                    <TableRow key={c.id} className="hover:bg-muted/20 transition-colors">
                                        <TableCell>
                                            <Link to={`/orders/${c.orderId}`} className="text-xs font-mono font-bold text-blue-600 flex items-center gap-1">
                                                {c.orderId?.substring(0,8).toUpperCase()} <ExternalLink className="w-2.5 h-2.5" />
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-xs font-medium">{c.order?.user?.name || 'Customer'}</span>
                                                <span className="text-[9px] text-muted-foreground uppercase">{c.order?.tier} Plan</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-[11px]">
                                            {new Date(c.paidAt).toLocaleDateString('en-GB')}
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-sm">
                                            RM {c.expectedAmount.toLocaleString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {c.status === 'Paid' || c.status === 1 ? (
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                                    Paid
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                                    Pending
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-12 text-center space-y-2 opacity-50">
                            <Briefcase className="w-10 h-10 mx-auto text-muted-foreground" />
                            <p className="text-sm italic">No commission records found.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center gap-2 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                <AlertCircle className="w-4 h-4 text-blue-500 shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Commissions marked as **Pending** represent upcoming payouts based on member installment payments. These will be marked as **Paid** once processed by the finance team.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
}
