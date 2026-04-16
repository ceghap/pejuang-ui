import { Link } from 'react-router-dom';
import { ChevronRight, Package, ShoppingBag, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function OrderTable({ orders, isLoading, isAdmin }) {
  const getStatusBadge = (order) => {
    const status = order.status;
    const isOverdue = order.hasOverduePayments && (status === 'Active' || status === 1);

    const getStatusLabel = () => {
      if (status === 'Active' || status === 1) return { label: 'Active', className: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' };
      if (status === 'Completed' || status === 2) return { label: 'Completed', className: 'bg-blue-500/10 text-blue-500 border border-blue-500/20' };
      if (status === 'Pending' || status === 0) return { label: 'Pending', className: 'bg-amber-500/10 text-amber-500 border border-amber-500/20' };
      if (status === 'Upgraded' || status === 3) return { label: 'Upgraded', className: 'bg-purple-500/10 text-purple-500 border border-purple-500/20' };
      if (status === 'Cancelled' || status === 4) return { label: 'Cancelled', className: 'bg-rose-500/10 text-rose-500 border border-rose-500/20' };
      return { label: status, className: 'bg-muted text-muted-foreground border border-border' };
    };

    const config = getStatusLabel();

    return (
      <div className="flex flex-col gap-1">
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-center", config.className)}>
          {config.label}
        </span>
        {isOverdue && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500 text-white animate-pulse text-center shadow-sm shadow-rose-500/20">
            Overdue
          </span>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
        <p className="text-xs text-muted-foreground mt-2">Loading orders...</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground italic space-y-4">
        <ShoppingBag className="w-10 h-10 mx-auto opacity-20" />
        <p className="text-sm">No orders found.</p>
        {!isAdmin && (
          <Link to="/shop">
            <Button variant="outline" size="sm" className="mt-2">Go to Shop</Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className={cn("w-[100px]", !isAdmin && "hidden sm:table-cell")}>Order ID</TableHead>
            <TableHead className="text-xs">Date</TableHead>
            {isAdmin && <TableHead>Member</TableHead>}
            <TableHead>Product</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Paid</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((o) => {
            const totalPrice = o.priceAtPurchase || o.product?.price || 0;
            const paidAmount = totalPrice - o.remainingBalance;

            return (
              <TableRow key={o.id} className="group hover:bg-muted/20 transition-colors">
                <TableCell className={cn("font-mono text-[10px] font-bold uppercase text-muted-foreground", !isAdmin && "hidden sm:table-cell")}>
                  {o.id.substring(0, 8)}
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
                    <Package className="w-3.5 h-3.5 text-blue-500 hidden sm:block" />
                    <span className="text-sm font-semibold truncate max-w-[120px] sm:max-w-[200px]">
                      {o.orderItems?.[0]?.product?.name || o.product?.name || 'Unknown'}
                      {o.orderItems?.length > 1 && ` +${o.orderItems.length - 1}`}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className={cn("text-sm font-bold", o.remainingBalance > 0 ? "text-rose-500" : "text-emerald-600")}>
                      RM {o.remainingBalance.toLocaleString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-bold text-emerald-600">
                    RM {paidAmount.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(o)}
                </TableCell>
                <TableCell className="text-right">
                  <Link to={`/orders/${o.id}`}>
                    <Button variant="ghost" size="sm" className="h-8 group-hover:bg-emerald-500 group-hover:text-white transition-all px-2 sm:px-3">
                      <span className="hidden sm:inline">Details</span> <ChevronRight className="w-4 h-4 ml-0 sm:ml-1" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
