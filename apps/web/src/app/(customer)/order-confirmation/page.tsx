'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useOrderByPaymentIntent } from '@/lib/hooks/useCheckout';
import { useCartStore } from '@/store/cart-store';

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const clearCart = useCartStore((s) => s.clearCart);

  const { data: order, isLoading, error } = useOrderByPaymentIntent(paymentIntentId);

  // Clear cart once order is confirmed
  useEffect(() => {
    if (order) clearCart();
  }, [order, clearCart]);

  if (!paymentIntentId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">No order found.</p>
        <Button asChild variant="outline">
          <Link href="/explore">Back to Explore</Link>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-muted-foreground">Confirming your order…</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Could not load order details. Please check your email for confirmation.</p>
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/my-orders">My Orders</Link>
          </Button>
          <Button asChild>
            <Link href="/explore">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  const orderNumber = order.id.slice(0, 8).toUpperCase();
  const isDelivery = order.fulfillmentType === 'DELIVERY';

  return (
    <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-6">
      {/* Animated success check */}
      <div className="flex justify-center">
        <CheckCircle
          className="h-20 w-20 text-green-500"
          style={{ animation: 'successPop 0.4s ease-out both' }}
        />
      </div>
      <style>{`
        @keyframes successPop {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }
      `}</style>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Order Confirmed!</h1>
        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 text-sm px-3 py-1">
          Order #{orderNumber}
        </Badge>
        <p className="text-muted-foreground text-sm">{order.nursery.name}</p>
      </div>

      {/* Items */}
      <div className="rounded-lg border text-left space-y-0 overflow-hidden">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between items-center px-4 py-3 border-b last:border-b-0 text-sm">
            <div>
              <p className="font-medium">{item.seedlingName}</p>
              <p className="text-xs text-muted-foreground">{item.seedlingSize === 'SMALL_POT' ? 'Small Pot' : 'Big Pot'} × {item.quantity}</p>
            </div>
            <span className="font-medium">UGX {(item.unitPrice * item.quantity).toLocaleString()}</span>
          </div>
        ))}
        <div className="flex justify-between px-4 py-3 bg-muted/30 font-bold text-sm">
          <span>Total</span>
          <span>UGX {order.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Fulfillment */}
      <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-left">
        {isDelivery ? (
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-green-700 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-green-800">Delivery</p>
              <p className="text-green-700">{order.deliveryAddress ?? 'Address on file'}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-green-700" />
            <p className="font-medium text-green-800">Ready for Pickup at {order.nursery.name}</p>
          </div>
        )}
      </div>

      <Separator />

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild variant="outline">
          <Link href={`/my-orders/${order.id}`}>View Order Details</Link>
        </Button>
        <Button asChild>
          <Link href="/explore">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}
