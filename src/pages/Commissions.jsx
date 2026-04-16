import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Layers, 
  Search, 
  Filter, 
  Loader2, 
  CheckCircle2, 
  Clock,
  User,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Briefcase
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
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { CommissionSuccessDialog } from '@/components/finance/CommissionSuccessDialog';

export default function Commissions() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [successData, setSuccessData] = useState(null);

  const { data: commissions, isLoading } = useQuery({
    queryKey: ['commissions-list', statusFilter],
    queryFn: () => fetchClient(`/finance/commissions?status=${statusFilter}`)
  });

  const payMutation = useMutation({
    mutationFn: (id) => fetchClient(`/finance/commissions/${id}/pay`, { method: 'POST' }),
    onSuccess: () => {
      // Set success data for dialog before clearing selection
      if (selectedCommission) {
        setSuccessData({
          uplineName: selectedCommission.upline?.name || 'Introducer',
          uplinePhone: selectedCommission.upline?.phoneNumber || '',
          customerName: selectedCommission.order?.user?.name || 'Unknown Member',
          orderRef: selectedCommission.orderId.substring(0, 8).toUpperCase(),
          amount: selectedCommission.expectedAmount,
          payoutDate: new Date().toLocaleDateString('en-GB')
        });
      }

      queryClient.invalidateQueries(['commissions-list']);
      setIsPayDialogOpen(false);
      setSelectedCommission(null);
      toast.success('Commission payout recorded');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record payout');
    }
  });

  const filteredGroups = useMemo(() => {
    if (!commissions || !Array.isArray(commissions)) return [];
    
    // Group by Upline
    const groups = commissions.reduce((acc, comm) => {
      const uplineId = comm.uplineId;
      if (!acc[uplineId]) {
        acc[uplineId] = {
          upline: comm.upline,
          items: [],
          totalAmount: 0
        };
      }
      acc[uplineId].items.push(comm);
      acc[uplineId].totalAmount += comm.expectedAmount;
      return acc;
    }, {});

    let groupList = Object.values(groups);

    if (search) {
      const s = search.toLowerCase();
      groupList = groupList.filter(g => 
        g.upline?.name?.toLowerCase().includes(s) || 
        g.upline?.icNumber?.includes(s)
      );
    }

    return groupList.sort((a, b) => b.totalAmount - a.totalAmount);
  }, [commissions, search]);

  const stats = useMemo(() => {
    if (!commissions || !Array.isArray(commissions)) return { total: 0, count: 0 };
    return {
      total: commissions.reduce((sum, c) => sum + c.expectedAmount, 0),
      count: commissions.length
    };
  }, [commissions]);

  return (
    <div className="h-full text-foreground p-4 md:p-8 pt-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-light tracking-tight">Introducer <span className="font-semibold">Commissions</span></h1>
            <p className="text-muted-foreground text-sm mt-1">Manage and track payouts for introducers based on customer installment payments.</p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <DollarSign className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Total {statusFilter}</p>
                    <p className="text-lg font-black text-emerald-700">RM {stats.total.toLocaleString()}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
           <Card className="lg:col-span-1 h-fit">
              <CardHeader className="pb-3">
                 <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-500" /> Filters
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Status</label>
                    <div className="flex flex-col gap-1">
                        {['Pending', 'Paid', 'Cancelled'].map((s) => (
                            <Button 
                                key={s}
                                variant={statusFilter === s ? 'secondary' : 'ghost'}
                                size="sm"
                                className={cn(
                                    "justify-start text-xs font-semibold",
                                    statusFilter === s ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20" : "text-muted-foreground"
                                )}
                                onClick={() => setStatusFilter(s)}
                            >
                                {s === 'Pending' && <Clock className="w-3.5 h-3.5 mr-2" />}
                                {s === 'Paid' && <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-emerald-500" />}
                                {s === 'Cancelled' && <Layers className="w-3.5 h-3.5 mr-2 text-rose-500" />}
                                {s} Payouts
                            </Button>
                        ))}
                    </div>
                 </div>

                 <div className="space-y-2 pt-2 border-t border-border/50">
                    <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Search Introducer</label>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input 
                            placeholder="Name or IC..."
                            className="pl-8 text-xs h-9 bg-muted/20"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                 </div>
              </CardContent>
           </Card>

           <div className="lg:col-span-3 space-y-6">
              {isLoading ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
              ) : filteredGroups.length > 0 ? (
                  filteredGroups.map((group) => (
                      <Card key={group.upline.id} className="overflow-hidden border-border/50 hover:border-blue-500/30 transition-all shadow-sm">
                          <CardHeader className="bg-muted/30 border-b border-border/50 py-4">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center ring-4 ring-blue-500/5">
                                          <User className="w-5 h-5 text-blue-500" />
                                      </div>
                                      <div>
                                          <CardTitle className="text-base font-bold">{group.upline.name}</CardTitle>
                                          <CardDescription className="text-[10px] font-mono uppercase">{group.upline.icNumber} • {group.upline.phoneNumber}</CardDescription>
                                      </div>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Accumulated</p>
                                      <p className="text-xl font-black text-blue-600">RM {group.totalAmount.toLocaleString()}</p>
                                  </div>
                              </div>
                          </CardHeader>
                          <CardContent className="p-0">
                              <Table>
                                  <TableHeader>
                                      <TableRow className="bg-muted/10 hover:bg-muted/10">
                                          <TableHead className="text-[10px] font-bold uppercase py-2 h-auto">Ref Order</TableHead>
                                          <TableHead className="text-[10px] font-bold uppercase py-2 h-auto">Customer</TableHead>
                                          <TableHead className="text-[10px] font-bold uppercase py-2 h-auto">Payment Date</TableHead>
                                          <TableHead className="text-[10px] font-bold uppercase py-2 h-auto text-right">Amount</TableHead>
                                          <TableHead className="text-[10px] font-bold uppercase py-2 h-auto text-right">Action</TableHead>
                                      </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                      {[...group.items].sort((a, b) => new Date(a.paidAt) - new Date(b.paidAt)).map((comm) => (
                                          <TableRow key={comm.id} className="hover:bg-muted/20 transition-colors">
                                              <TableCell className="py-2">
                                                  <Link to={`/orders/${comm.orderId}`} className="flex items-center text-xs font-mono font-bold text-blue-600 hover:underline">
                                                      {comm.orderId.substring(0,8).toUpperCase()} <ExternalLink className="w-2.5 h-2.5 ml-1" />
                                                  </Link>
                                              </TableCell>
                                              <TableCell className="py-2">
                                                  <div className="flex flex-col">
                                                      <span className="text-xs font-bold text-foreground">
                                                          {comm.order?.user?.name || 'Unknown Member'}
                                                      </span>
                                                      <span className="text-[10px] text-muted-foreground font-mono">
                                                          {comm.order?.user?.phoneNumber || '-'}
                                                      </span>
                                                  </div>
                                              </TableCell>
                                              <TableCell className="py-2 text-[11px]">
                                                  {new Date(comm.paidAt).toLocaleDateString('en-GB')}
                                              </TableCell>
                                              <TableCell className="py-2 text-right font-bold text-sm">
                                                  RM {comm.expectedAmount.toLocaleString()}
                                              </TableCell>
                                              <TableCell className="py-2 text-right">
                                                  {comm.status === 'Pending' ? (
                                                      <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-7 text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                                                        onClick={() => {
                                                            setSelectedCommission(comm);
                                                            setIsPayDialogOpen(true);
                                                        }}
                                                      >
                                                          Pay <ChevronRight className="w-3 h-3 ml-1" />
                                                      </Button>
                                                  ) : (
                                                      <span className="text-[10px] font-black uppercase text-muted-foreground/50 italic mr-4">Processed</span>
                                                  )}
                                              </TableCell>
                                          </TableRow>
                                      ))}
                                  </TableBody>
                              </Table>
                          </CardContent>
                      </Card>
                  ))
              ) : (
                  <div className="h-64 flex flex-col items-center justify-center bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
                      <Briefcase className="w-12 h-12 text-muted-foreground/20 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground italic">No commissions found matching filters.</p>
                  </div>
              )}
           </div>
        </div>

        <ConfirmDialog 
            isOpen={isPayDialogOpen}
            onClose={() => setIsPayDialogOpen(false)}
            title="Confirm Payout?"
            description={`You are marking RM ${selectedCommission?.expectedAmount?.toLocaleString()} as paid to ${selectedCommission?.upline?.name}. Make sure you have actually transferred the funds to them.`}
            onConfirm={() => payMutation.mutate(selectedCommission.id)}
            isLoading={payMutation.isPending}
            confirmText="Yes, Confirm Payout"
        />

        <CommissionSuccessDialog 
            isOpen={!!successData}
            onClose={() => setSuccessData(null)}
            data={successData}
        />

      </div>
    </div>
  );
}
