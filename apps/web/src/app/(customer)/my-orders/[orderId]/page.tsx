'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format, differenceInDays } from 'date-fns';
import { AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useMyOrder } from '@/lib/hooks/useOrders';
import { cn } from '@/lib/utils';

const DELIVERY_STEPS = ['PENDING', 'PROCESSING', 'DISPATCHED', 'DELIVERED'];
const PICKUP_STEPS = ['PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'COLLECTED'];

const STEP_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COLLECTED: 'Collected',
};

const DELIVERY_FEE = 5000;

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { data: order, isLoading, error } = useMyOrder(orderId);

  if (isLoading) return <OrderDetailSkeleton />;

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <p className="text-muted-foreground">Order not found.</p>
        <Button variant="outline" asChild>
          <Link href="/my-orders">Back to My Orders</Link>
        </Button>
      </div>
    );
  }

  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const isDelivery = order.fulfillmentType === 'DELIVERY';
  const steps = isDelivery ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentStepIdx = steps.indexOf(order.fulfillmentStatus);
  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
  const withinThirtyDays = differenceInDays(new Date(), new Date(order.createdAt)) <= 30;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/my-orders">My Orders</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Order #{orderNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Status timeline */}
      <div className="rounded-lg border p-5">
        <h2 className="text-sm font-semibold mb-6 text-muted-foreground uppercase tracking-wide">
          Order Progress
        </h2>
        <div className="flex items-center">
          {steps.map((step, idx) => {
            const isDone = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            const isLast = idx === steps.length - 1;

            return (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                {/* Circle */}
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all',
                      isDone
                        ? 'bg-primary border-primary'
                        : isCurrent
                        ? 'border-primary bg-background ring-4 ring-primary/20'
                        : 'border-muted-foreground/30 bg-background',
                    )}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4 text-primary-foreground" />
                    ) : (
                      <span
                        className={cn(
                          'h-2 w-2 rounded-full',
                          isCurrent ? 'bg-primary' : 'bg-muted-foreground/30',
                        )}
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[10px] text-center leading-tight max-w-[60px]',
                      isDone || isCurrent
                        ? 'font-semibold text-primary'
                        : 'text-muted-foreground',
                      isCurrent && 'font-bold',
                    )}
                  >
                    {STEP_LABELS[step]}
                  </span>
                </div>

                {/* Connector line */}
                {!isLast && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 mx-1 -mt-5',
                      idx < currentStepIdx ? 'bg-primary' : 'bg-muted-foreground/20',
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Order details card */}
      <div className="rounded-lg border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Order Details</h2>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 font-mono">
            #{orderNumber}
          </Badge>
        </div>
        <div className="text-sm space-y-1 text-muted-foreground">
          <p>
            <span className="text-foreground font-medium">Date: </span>
            {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
          </p>
          <p>
            <span className="text-foreground font-medium">Nursery: </span>
            <Link
              href={`/explore/${order.nurseryId}`}
              className="text-primary hover:underline"
            >
              {order.nursery.name}
            </Link>
          </p>
          <p>
            <span className="text-foreground font-medium">Address: </span>
            {order.nursery.address}
          </p>
        </div>
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
                    <div className="relative h-10 w-10 rounded overflow-hidden bg-muted shrink-0">
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
                  <td className="px-3 py-3 text-center">{item.quantity}</td>
                  <td className="px-3 py-3 text-right">UGX {item.unitPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    UGX {(item.unitPrice * item.quantity).toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Total section */}
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
      <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm">
        {isDelivery ? (
          <p>🚚 Delivering to: <span className="font-medium">{order.deliveryAddress ?? 'Address on file'}</span></p>
        ) : (
          <p>🏪 Pickup at: <span className="font-medium">{order.nursery.address}</span></p>
        )}
      </div>

      {/* Raise an Issue */}
      {withinThirtyDays && (
        <div className="pt-2">
          <Button variant="outline" asChild>
            <Link href={`/my-issues/new?orderId=${order.id}&nurseryId=${order.nurseryId}`}>
              <AlertCircle className="mr-2 h-4 w-4" />
              Raise an Issue
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-4 w-48" />
      <div className="rounded-lg border p-5 space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <Skeleton className="h-8 w-8 rounded-full" />
              {i < 3 && <Skeleton className="h-0.5 flex-1 mx-1" />}
            </div>
          ))}
        </div>
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}
