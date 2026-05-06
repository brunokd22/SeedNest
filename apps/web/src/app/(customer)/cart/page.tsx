'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Minus, Plus, ShoppingCart, Store, Trash2, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/store/cart-store';
import { usePublicNursery } from '@/lib/hooks/useExplore';
import { cn } from '@/lib/utils';

const DELIVERY_FEE = 5000;

// ── helpers ──────────────────────────────────────────────────────────────────
function NurseryName({ nurseryId }: { nurseryId: string }) {
  const { data } = usePublicNursery(nurseryId);
  return <>{data?.name ?? '…'}</>;
}

export default function CartPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const fulfillmentType = useCartStore((s) => s.fulfillmentType);
  const setFulfillmentType = useCartStore((s) => s.setFulfillmentType);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  // Group items by nurseryId
  const groups = items.reduce<Record<string, typeof items>>((acc, item) => {
    acc[item.nurseryId] = [...(acc[item.nurseryId] ?? []), item];
    return acc;
  }, {});
  const nurseryIds = Object.keys(groups);
  const isMultiNursery = nurseryIds.length > 1;

  // If empty
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <ShoppingCart className="h-16 w-16 text-muted-foreground/30" />
        <h2 className="text-xl font-semibold">Your cart is empty</h2>
        <p className="text-muted-foreground text-sm">Browse nurseries and add seedlings to get started.</p>
        <Button asChild>
          <Link href="/explore">Explore Nurseries</Link>
        </Button>
      </div>
    );
  }

  const subtotal = (groupItems: typeof items) =>
    groupItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const deliveryFee = fulfillmentType === 'DELIVERY' ? DELIVERY_FEE : 0;

  const handleCheckout = (nurseryId: string) => {
    router.push(`/checkout?nurseryId=${nurseryId}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {/* Multi-nursery warning */}
      {isMultiNursery && (
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          ⚠️ You have items from multiple nurseries. Checkout is limited to one nursery at a time.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-8">
          {nurseryIds.map((nurseryId) => {
            const groupItems = groups[nurseryId];
            const groupSubtotal = subtotal(groupItems);

            return (
              <div key={nurseryId} className="rounded-lg border">
                {/* Nursery header */}
                <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                  <h3 className="font-semibold text-sm">
                    <NurseryName nurseryId={nurseryId} />
                  </h3>
                  {isMultiNursery && (
                    <Button size="sm" onClick={() => handleCheckout(nurseryId)}>
                      Checkout <NurseryName nurseryId={nurseryId} />
                    </Button>
                  )}
                </div>

                {/* Items */}
                <div className="divide-y">
                  {groupItems.map((item) => (
                    <div key={item.seedlingId} className="flex items-center gap-4 px-4 py-3">
                      {/* Photo */}
                      <div className="relative h-14 w-14 shrink-0 rounded overflow-hidden bg-muted">
                        {item.photo ? (
                          <Image src={item.photo} alt={item.name} fill unoptimized className="object-cover" />
                        ) : (
                          <div className="h-full w-full bg-green-100" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        {item.size && (
                          <Badge variant="outline" className="text-xs mt-0.5">
                            {item.size === 'SMALL_POT' ? 'Small Pot' : 'Big Pot'}
                          </Badge>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          UGX {item.price.toLocaleString()} each
                        </p>
                      </div>

                      {/* Qty stepper */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(item.seedlingId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.seedlingId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Subtotal + remove */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">
                          UGX {(item.price * item.quantity).toLocaleString()}
                        </p>
                        <button
                          onClick={() => removeItem(item.seedlingId)}
                          className="mt-1 text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Group subtotal (multi-nursery) */}
                {isMultiNursery && (
                  <div className="flex justify-end px-4 py-3 border-t text-sm text-muted-foreground">
                    Group subtotal:{' '}
                    <span className="ml-1 font-semibold text-foreground">
                      UGX {groupSubtotal.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Fulfillment type selector */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Fulfillment Type</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['DELIVERY', 'PICKUP'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setFulfillmentType(type)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors',
                    fulfillmentType === type
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/40',
                  )}
                >
                  {type === 'DELIVERY' ? (
                    <Truck className={cn('h-6 w-6', fulfillmentType === type ? 'text-primary' : 'text-muted-foreground')} />
                  ) : (
                    <Store className={cn('h-6 w-6', fulfillmentType === type ? 'text-primary' : 'text-muted-foreground')} />
                  )}
                  <span className={cn('text-sm font-medium', fulfillmentType === type ? 'text-primary' : 'text-muted-foreground')}>
                    {type === 'DELIVERY' ? '🚚 Delivery' : '🏪 Pickup'}
                  </span>
                  {type === 'DELIVERY' && (
                    <span className="text-xs text-muted-foreground">+UGX 5,000</span>
                  )}
                  {type === 'PICKUP' && (
                    <span className="text-xs text-green-600">Free</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div>
          <div className="sticky top-24 rounded-lg border p-5 space-y-4">
            <h3 className="font-semibold">Order Summary</h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>UGX {subtotal(items).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>{deliveryFee > 0 ? `UGX ${deliveryFee.toLocaleString()}` : 'Free'}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>UGX {(subtotal(items) + deliveryFee).toLocaleString()}</span>
              </div>
            </div>

            {!isMultiNursery && nurseryIds[0] && (
              <Button className="w-full" onClick={() => handleCheckout(nurseryIds[0])}>
                Proceed to Checkout
              </Button>
            )}

            {isMultiNursery && (
              <p className="text-xs text-muted-foreground text-center">
                Select a nursery group above to checkout.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
