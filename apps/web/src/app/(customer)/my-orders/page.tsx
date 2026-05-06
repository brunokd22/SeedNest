'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Package,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyOrders, type MyOrder } from '@/lib/hooks/useOrders';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Dispatched', value: 'DISPATCHED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Collected', value: 'COLLECTED' },
] as const;

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  DISPATCHED: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-700',
  COLLECTED: 'bg-green-100 text-green-700',
};

export default function MyOrdersPage() {
  const [activeStatus, setActiveStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useMyOrders(
    page,
    PAGE_SIZE,
    activeStatus || undefined,
  );

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  const handleTabChange = (value: string) => {
    setActiveStatus(value);
    setPage(1);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold">My Orders</h1>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeStatus === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive/60" />
          <p className="text-muted-foreground">Failed to load orders.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Package className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="font-semibold">You haven&apos;t placed any orders yet</h3>
          <p className="text-sm text-muted-foreground">
            Discover nurseries and start shopping!
          </p>
          <Button asChild>
            <Link href="/explore">Explore Nurseries</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.data.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── OrderCard ─────────────────────────────────────────────────────────────────
function OrderCard({ order }: { order: MyOrder }) {
  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const itemNames = order.items.map((i) => i.seedlingName);
  const previewItems =
    itemNames.slice(0, 2).join(', ') +
    (itemNames.length > 2 ? ` and ${itemNames.length - 2} more` : '');

  return (
    <div className="rounded-lg border p-4 space-y-3 hover:shadow-sm transition-shadow">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sm">#{orderNumber}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {format(new Date(order.createdAt), 'dd MMM yyyy')}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          <Badge
            className={cn(
              'text-xs hover:opacity-100',
              order.fulfillmentType === 'DELIVERY'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-700',
            )}
          >
            {order.fulfillmentType === 'DELIVERY' ? 'Delivery' : 'Pickup'}
          </Badge>
          <Badge
            className={cn(
              'text-xs hover:opacity-100',
              STATUS_BADGE[order.fulfillmentStatus] ?? 'bg-gray-100 text-gray-700',
            )}
          >
            {order.fulfillmentStatus.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      {/* Nursery + items preview */}
      <div className="text-sm">
        <p className="font-medium">{order.nursery.name}</p>
        <p className="text-muted-foreground text-xs mt-0.5 truncate">{previewItems}</p>
      </div>

      {/* Total + actions */}
      <div className="flex items-center justify-between pt-1 border-t">
        <p className="font-bold text-primary">UGX {order.totalAmount.toLocaleString()}</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/my-orders/${order.id}`}>View Details</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/my-issues/new?orderId=${order.id}`}>
              <AlertCircle className="h-3.5 w-3.5 mr-1" />
              Raise Issue
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrderCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <div className="space-y-1">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-48" />
      </div>
      <div className="flex justify-between pt-1 border-t">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}
