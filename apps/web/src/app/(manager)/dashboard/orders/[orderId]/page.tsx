'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  useManagerOrder,
  useUpdateFulfillmentStatus,
} from '@/lib/hooks/useManagerOrders';
import { cn } from '@/lib/utils';

const DELIVERY_FEE = 5000;

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  DISPATCHED: 'bg-orange-100 text-orange-700',
  DELIVERED: 'bg-green-100 text-green-700',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-700',
  COLLECTED: 'bg-green-100 text-green-700',
};

const ALL_STATUSES = [
  'PENDING', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'READY_FOR_PICKUP', 'COLLECTED',
];

export default function ManagerOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading } = useManagerOrder(orderId);
  const updateStatus = useUpdateFulfillmentStatus();

  if (isLoading) return <OrderDetailSkeleton />;
  if (!order) return <p className="text-muted-foreground py-8">Order not found.</p>;

  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const isDelivery = order.fulfillmentType === 'DELIVERY';
  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/orders">Orders</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>#{orderNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header + status updater */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Order #{orderNumber}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <Select
            value={order.fulfillmentStatus}
            onValueChange={(v) =>
              updateStatus.mutate(
                { orderId: order.id, fulfillmentStatus: v },
                { onSuccess: () => toast.success('Status updated') },
              )
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue>
                <Badge className={cn('text-xs hover:opacity-100', STATUS_BADGE[order.fulfillmentStatus] ?? '')}>
                  {order.fulfillmentStatus.replace(/_/g, ' ')}
                </Badge>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  <Badge className={cn('text-xs hover:opacity-100 pointer-events-none', STATUS_BADGE[s] ?? '')}>
                    {s.replace(/_/g, ' ')}
                  </Badge>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Customer info */}
      <div className="rounded-lg border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Customer</h2>
          <Badge className={cn('text-xs', order.saleMethod === 'ONLINE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700')}>
            {order.saleMethod === 'ONLINE' ? 'Online' : 'Walk-in'}
          </Badge>
        </div>
        {order.customer ? (
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Name: </span>{order.customer.name}</p>
            <p><span className="font-medium">Email: </span>{order.customer.email}</p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {order.guestName ? `Guest: ${order.guestName}` : 'Anonymous Walk-in'}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Placed: {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
        </p>
      </div>

      {/* Items table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium text-muted-foreground" colSpan={2}>Item</th>
              <th className="text-center px-3 py-2.5 font-medium text-muted-foreground">Qty</th>
              <th className="text-right px-3 py-2.5 font-medium text-muted-foreground">Unit Price</th>
              <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {order.items.map((item) => {
              const photo = item.seedling?.photos?.[0] ?? null;
              return (
                <tr key={item.id}>
                  <td className="px-4 py-3 w-12">
                    <div className="relative h-10 w-10 rounded overflow-hidden bg-muted">
                      {photo ? (
                        <Image src={photo} alt={item.seedlingName} fill unoptimized className="object-cover" />
                      ) : (
                        <div className="h-full w-full bg-green-100" />
                      )}
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <p className="font-medium">{item.seedlingName}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.seedlingSize === 'SMALL_POT' ? 'Small Pot' : 'Big Pot'}
                    </p>
                  </td>
                  <td className="text-center px-3 py-3">{item.quantity}</td>
                  <td className="text-right px-3 py-3">UGX {item.unitPrice.toLocaleString()}</td>
                  <td className="text-right px-4 py-3 font-medium">
                    UGX {(item.unitPrice * item.quantity).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Total */}
      <div className="rounded-lg border p-5 space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>UGX {subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>Delivery fee</span>
          <span>{deliveryFee > 0 ? `UGX ${deliveryFee.toLocaleString()}` : 'Free'}</span>
        </div>
        <Separator />
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span className="text-primary">UGX {order.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Fulfillment info */}
      <div className="rounded-lg bg-muted/40 border px-4 py-3 text-sm">
        <p className="font-medium mb-1">Fulfillment</p>
        {isDelivery ? (
          <p>🚚 Delivering to: <span className="font-medium">{order.deliveryAddress ?? 'Address on file'}</span></p>
        ) : (
          <p>🏪 Pickup at: <span className="font-medium">{order.nursery.address}</span></p>
        )}
      </div>

      {/* Stripe info */}
      {order.saleMethod === 'ONLINE' && order.stripePaymentIntentId && (
        <div className="rounded-lg border px-4 py-3 text-sm space-y-1">
          <p className="font-medium text-muted-foreground">Payment Info</p>
          <p>
            <span className="text-muted-foreground">Payment ID: </span>
            <span className="font-mono">
              {order.stripePaymentIntentId.slice(0, 20)}…
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Card details are not stored by SeedNest. Customers can view their receipt via email.
          </p>
        </div>
      )}
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Skeleton className="h-4 w-48" />
      <div className="flex justify-between"><Skeleton className="h-8 w-40" /><Skeleton className="h-10 w-44" /></div>
      <Skeleton className="h-28 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}
