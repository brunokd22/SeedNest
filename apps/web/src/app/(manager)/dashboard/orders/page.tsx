'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Eye, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNurseries } from '@/lib/hooks/useNurseries';
import {
  useManagerOrders,
  useUpdateFulfillmentStatus,
  type ManagerOrder,
} from '@/lib/hooks/useManagerOrders';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Dispatched', value: 'DISPATCHED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Ready for Pickup', value: 'READY_FOR_PICKUP' },
  { label: 'Collected', value: 'COLLECTED' },
];

const SALE_METHOD_OPTIONS = [
  { label: 'All Methods', value: '' },
  { label: 'Online', value: 'ONLINE' },
  { label: 'Walk-in', value: 'WALKIN' },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  DISPATCHED: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-700',
  COLLECTED: 'bg-green-100 text-green-700',
};

export default function ManagerOrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nurseryId = searchParams.get('nurseryId') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';
  const fulfillmentStatus = searchParams.get('fulfillmentStatus') ?? '';
  const saleMethod = searchParams.get('saleMethod') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1') || 1;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.push(`${pathname}?${params}`);
  };

  const { data: nurseries } = useNurseries();
  const { data: result, isLoading } = useManagerOrders({
    nurseryId: nurseryId || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    fulfillmentStatus: fulfillmentStatus || undefined,
    saleMethod: saleMethod || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const total = result?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Button asChild>
          <Link href="/dashboard/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Record Walk-in Sale
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        {/* Nursery select */}
        <div className="space-y-1">
          <Label className="text-xs">Nursery</Label>
          <Select value={nurseryId} onValueChange={(v) => updateFilter('nurseryId', v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Nurseries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Nurseries</SelectItem>
              {nurseries?.map((n) => (
                <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date from */}
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            className="w-36"
            value={dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
          />
        </div>

        {/* Date to */}
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            className="w-36"
            value={dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
          />
        </div>

        {/* Status */}
        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={fulfillmentStatus} onValueChange={(v) => updateFilter('fulfillmentStatus', v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sale method */}
        <div className="space-y-1">
          <Label className="text-xs">Method</Label>
          <Select value={saleMethod} onValueChange={(v) => updateFilter('saleMethod', v)}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Methods" />
            </SelectTrigger>
            <SelectContent>
              {SALE_METHOD_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Export placeholders */}
        <div className="flex gap-2 ml-auto">
          <Button variant="outline" size="sm" disabled title="Coming in Phase 4">
            Export Excel
          </Button>
          <Button variant="outline" size="sm" disabled title="Coming in Phase 4">
            Export PDF
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Nursery</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 9 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !result?.data.length ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                  No orders found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((order) => (
                <OrderRow key={order.id} order={order} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {from}–{to} of {total} orders
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateFilter('page', String(page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateFilter('page', String(page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── OrderRow ──────────────────────────────────────────────────────────────────
function OrderRow({ order }: { order: ManagerOrder }) {
  const updateStatus = useUpdateFulfillmentStatus();
  const orderNumber = order.id.slice(0, 8).toUpperCase();

  const customerLabel = order.customer?.name
    ? order.customer.name
    : order.guestName
    ? `Walk-in: ${order.guestName}`
    : 'Walk-in';

  const itemCount = order._count?.items ?? order.items?.length ?? 0;

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{orderNumber}</TableCell>
      <TableCell className="text-sm">{format(new Date(order.createdAt), 'dd MMM yyyy')}</TableCell>
      <TableCell className="text-sm">{order.nursery.name}</TableCell>
      <TableCell className="text-sm max-w-[140px] truncate">{customerLabel}</TableCell>
      <TableCell className="text-center text-sm">{itemCount} items</TableCell>
      <TableCell className="text-sm">UGX {order.totalAmount.toLocaleString()}</TableCell>
      <TableCell>
        <Badge className={cn('text-xs hover:opacity-100', order.saleMethod === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700')}>
          {order.saleMethod === 'ONLINE' ? 'Online' : 'Walk-in'}
        </Badge>
      </TableCell>
      <TableCell>
        <Select
          value={order.fulfillmentStatus}
          onValueChange={(v) => updateStatus.mutate({ orderId: order.id, fulfillmentStatus: v })}
        >
          <SelectTrigger className="h-7 text-xs w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['PENDING', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'READY_FOR_PICKUP', 'COLLECTED'].map((s) => (
              <SelectItem key={s} value={s} className="text-xs">
                <Badge className={cn('text-xs hover:opacity-100 pointer-events-none', STATUS_BADGE[s] ?? 'bg-gray-100 text-gray-700')}>
                  {s.replace(/_/g, ' ')}
                </Badge>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="text-right">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/dashboard/orders/${order.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
