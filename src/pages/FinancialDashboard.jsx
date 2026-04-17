import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  TrendingUp, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  DollarSign, 
  Calendar,
  Loader2,
  BarChart3
} from 'lucide-react';
import { 
    Bar, 
    BarChart, 
    CartesianGrid, 
    XAxis, 
    YAxis,
    ResponsiveContainer,
    Tooltip,
    Legend,
    Cell,
    Line,
    LineChart
} from "recharts"
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { fetchClient } from '@/api/fetchClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const chartConfig = {
  revenue: {
    label: "Total Revenue",
    color: "hsl(var(--primary))",
  },
  commission: {
    label: "Comm. Payable",
    color: "hsl(var(--destructive))",
  },
}

export default function FinancialDashboard() {
  const queryClient = useQueryClient();
  const [days, setDays] = useState(14);

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['financial-audits', days],
    queryFn: () => fetchClient(`/finance/audit?days=${days}`),
  });

  const triggerMutation = useMutation({
    mutationFn: (date) => fetchClient(`/finance/audit/trigger${date ? `?date=${date}` : ''}`, {
      method: 'POST'
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['financial-audits']);
      toast.success('Daily reconciliation recalculated.');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to trigger audit');
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Prep data for charts (recharts needs chronological order)
  const chartData = auditData?.slice().reverse().map(item => ({
    date: new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    revenue: item.totalRevenue,
    commission: item.totalCommissionPayable,
    isBalanced: item.isBalanced
  })) || [];

  // Calculate quick stats
  const totalRevenue = auditData?.reduce((acc, curr) => acc + curr.totalRevenue, 0) || 0;
  const totalComm = auditData?.reduce((acc, curr) => acc + curr.totalCommissionPayable, 0) || 0;
  const avgHealth = auditData?.length > 0 
    ? (auditData.filter(a => a.isBalanced).length / auditData.length) * 100 
    : 100;
  
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financial Hub</h1>
          <p className="text-muted-foreground mt-1">Professional auditing and payment-to-commission analytics.</p>
        </div>
        <div className="flex items-center gap-2">
           <Button 
            variant="outline" 
            size="sm" 
            onClick={() => triggerMutation.mutate()} 
            disabled={triggerMutation.isPending}
          >
            {triggerMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sync Yesterday
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Period Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {totalRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold italic">Total for the selected window</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-rose-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Comm. Payable</CardTitle>
            <Activity className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {totalComm.toLocaleString()}</div>
            <div className="flex items-center gap-1 mt-1">
                <span className="text-[10px] font-black text-rose-500">{(totalRevenue > 0 ? (totalComm/totalRevenue)*100 : 0).toFixed(1)}%</span>
                <span className="text-[10px] text-muted-foreground font-bold">Effective Rate</span>
            </div>
          </CardContent>
        </Card>

        <Card className={cn("shadow-sm border-l-4", avgHealth === 100 ? "border-l-emerald-500" : "border-l-amber-500")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">System Health</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgHealth.toFixed(0)}%</div>
            <p className="text-[10px] text-muted-foreground mt-1 font-bold italic">Reconciliation consistency score</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Commission Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-500" /> Financial Performance
            </CardTitle>
            <div className="flex gap-2">
                 <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Commission</span>
              </div>
            </div>
          </div>
          <CardDescription>Daily comparison of incoming revenue vs generated commission.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                tickMargin={10} 
                axisLine={false}
                fontSize={10}
                fontWeight="bold"
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                fontSize={10} 
                fontWeight="bold"
                tickFormatter={(value) => `RM${value}`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="revenue" 
                fill="var(--color-revenue)" 
                radius={[4, 4, 0, 0]} 
                barSize={30}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.isBalanced ? "#3b82f6" : "#f43f5e"} 
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
              <Bar 
                dataKey="commission" 
                fill="#e11d48" 
                radius={[4, 4, 0, 0]} 
                barSize={15}
                fillOpacity={0.6}
              />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Audit Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" /> Audit Logs
          </CardTitle>
          <CardDescription>Source-of-truth reconciliation data from the daily background worker.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-[10px] font-black uppercase">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Gross Revenue</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Comm. Share</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Volume</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Audit Status</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditData?.map((audit) => (
                <TableRow key={audit.date}>
                  <TableCell className="font-mono text-xs font-bold">
                    {new Date(audit.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </TableCell>
                  <TableCell className="font-bold text-blue-600">RM {audit.totalRevenue.toLocaleString()}</TableCell>
                  <TableCell className="text-rose-600 font-medium">RM {audit.totalCommissionPayable.toLocaleString()}</TableCell>
                  <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold">{audit.totalPaymentsCount} Payments</span>
                        <span className="text-[9px] text-muted-foreground">{audit.newOrdersCount} New Orders</span>
                      </div>
                  </TableCell>
                  <TableCell>
                    {audit.isBalanced ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-black text-[10px] uppercase">
                        <CheckCircle2 className="w-3 h-3" /> Healthy
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-600 font-black text-[10px] uppercase">
                        <AlertCircle className="w-3 h-3" /> Warning
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-[10px] text-muted-foreground font-mono">
                    {new Date(audit.auditedAt).toLocaleTimeString('en-GB')}
                  </TableCell>
                </TableRow>
              ))}
              {!auditData?.length && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16 text-muted-foreground italic text-xs">
                    <div className="flex flex-col items-center gap-2">
                        <BarChart3 className="w-8 h-8 opacity-20" />
                        No data available in this window.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
