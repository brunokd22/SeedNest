'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, MapPin } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCartStore } from '@/store/cart-store';
import { useCreatePaymentIntent, type OrderSummaryItem } from '@/lib/hooks/useCheckout';
import { usePublicNursery } from '@/lib/hooks/useExplore';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '');

const DELIVERY_FEE = 5000;

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nurseryId = searchParams.get('nurseryId') ?? '';

  const items = useCartStore((s) => s.items);
  const fulfillmentType = useCartStore((s) => s.fulfillmentType);

  // Filter to selected nursery
  const selectedItems = nurseryId
    ? items.filter((i) => i.nurseryId === nurseryId)
    : items;

  const { data: nursery } = usePublicNursery(nurseryId);

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0) router.replace('/cart');
  }, [items.length, router]);

  // Delivery state
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLat, setDeliveryLat] = useState<number | undefined>();
  const [deliveryLng, setDeliveryLng] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [isGeoLoading, setIsGeoLoading] = useState(false);

  // Payment intent state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummaryItem[]>([]);
  const createPI = useCreatePaymentIntent();
  const piCreated = useRef(false);

  useEffect(() => {
    if (piCreated.current || !nurseryId || !selectedItems.length) return;
    piCreated.current = true;

    createPI.mutate(
      {
        nurseryId,
        items: selectedItems.map((i) => ({ seedlingId: i.seedlingId, quantity: i.quantity })),
        fulfillmentType,
        deliveryAddress: deliveryAddress || undefined,
        deliveryLat,
        deliveryLng,
      },
      {
        onSuccess: (data) => {
          setClientSecret(data.clientSecret);
          setOrderSummary(data.orderSummary);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }, [nurseryId]); // eslint-disable-line react-hooks/exhaustive-deps

  const useMyLocation = () => {
    setIsGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setDeliveryLat(lat);
        setDeliveryLng(lng);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
          );
          const data = await res.json();
          setDeliveryAddress(data.display_name ?? `${lat}, ${lng}`);
        } catch {
          setDeliveryAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
        setIsGeoLoading(false);
      },
      () => {
        toast.error('Could not get location. Please enter manually.');
        setIsGeoLoading(false);
      },
    );
  };

  const subtotal = selectedItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = fulfillmentType === 'DELIVERY' ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0) return null; // wait for redirect

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left: form */}
        <div className="lg:col-span-3 space-y-6">
          {/* Delivery address */}
          {fulfillmentType === 'DELIVERY' && (
            <div className="rounded-lg border p-5 space-y-3">
              <h2 className="font-semibold">Delivery Address</h2>
              <div className="space-y-1.5">
                <Label>Full Address</Label>
                <Textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Enter your delivery address"
                  rows={3}
                  required
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={useMyLocation}
                disabled={isGeoLoading}
              >
                {isGeoLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="mr-2 h-4 w-4" />
                )}
                Use My Location
              </Button>
            </div>
          )}

          {/* Order notes */}
          <div className="rounded-lg border p-5 space-y-3">
            <h2 className="font-semibold">Order Notes <span className="text-muted-foreground font-normal text-sm">(optional)</span></h2>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions?"
              rows={2}
            />
          </div>

          {/* Stripe payment */}
          <div className="rounded-lg border p-5 space-y-4">
            <h2 className="font-semibold">🔒 Secure Payment</h2>
            {!clientSecret ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Preparing payment…</span>
              </div>
            ) : (
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm total={total} nurseryId={nurseryId} />
              </Elements>
            )}
          </div>
        </div>

        {/* Right: order summary */}
        <div className="lg:col-span-2">
          <div className="sticky top-24 rounded-lg border p-5 space-y-4">
            <h2 className="font-semibold">Order Summary</h2>
            {nursery && (
              <p className="text-xs text-muted-foreground">{nursery.name}</p>
            )}

            <div className="space-y-2 text-sm">
              {selectedItems.map((item) => (
                <div key={item.seedlingId} className="flex justify-between">
                  <span className="text-muted-foreground truncate max-w-[60%]">
                    {item.name} × {item.quantity}
                  </span>
                  <span>UGX {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between text-muted-foreground">
                <span>Delivery</span>
                <span>{deliveryFee > 0 ? `UGX ${deliveryFee.toLocaleString()}` : 'Free'}</span>
              </div>
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>UGX {total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CheckoutForm — must be inside <Elements> ──────────────────────────────────
function CheckoutForm({ total, nurseryId }: { total: number; nurseryId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const clearCart = useCartStore((s) => s.clearCart);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const returnUrl =
      `${process.env.NEXT_PUBLIC_URL ?? window.location.origin}/order-confirmation` +
      `?nurseryId=${nurseryId}`;

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });

    // Only reaches here if there's an error (Stripe redirects on success)
    if (stripeError) {
      setError(stripeError.message ?? 'Payment failed. Please try again.');
    }
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        className="w-full"
        disabled={!stripe || !elements || isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : null}
        Pay UGX {total.toLocaleString()}
      </Button>
    </form>
  );
}
