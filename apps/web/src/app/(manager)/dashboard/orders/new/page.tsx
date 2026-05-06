'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Minus, Plus, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
import { useNurseries } from '@/lib/hooks/useNurseries';
import { useCreateWalkinOrder } from '@/lib/hooks/useManagerOrders';
import { api } from '@/lib/api';

type CustomerResult = { id: string; name: string; email: string };
type SeedlingResult = {
  id: string;
  name: string;
  size: string;
  price: number;
  quantity: number;
};
type CartItem = SeedlingResult & { cartQty: number };

export default function NewWalkinSalePage() {
  const router = useRouter();
  const { data: nurseries } = useNurseries();
  const createOrder = useCreateWalkinOrder();

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [nurseryId, setNurseryId] = useState('');

  // Step 2
  const [customerType, setCustomerType] = useState<'guest' | 'registered'>('guest');
  const [guestName, setGuestName] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerResult | null>(null);
  const [customerSearching, setCustomerSearching] = useState(false);
  const customerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 3
  const [seedlingSearch, setSeedlingSearch] = useState('');
  const [seedlingResults, setSeedlingResults] = useState<SeedlingResult[]>([]);
  const [seedlingSearching, setSeedlingSearching] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const seedlingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showSeedlingDropdown, setShowSeedlingDropdown] = useState(false);

  // Customer search debounce
  useEffect(() => {
    if (customerType !== 'registered') return;
    if (customerSearch.length < 3) { setCustomerResults([]); return; }

    if (customerTimer.current) clearTimeout(customerTimer.current);
    customerTimer.current = setTimeout(async () => {
      setCustomerSearching(true);
      try {
        const { data } = await api.get<{ success: boolean; data: CustomerResult[] }>(
          `/api/users/search?email=${encodeURIComponent(customerSearch)}`,
        );
        setCustomerResults(data.data);
      } catch { /* ignore */ }
      setCustomerSearching(false);
    }, 300);
  }, [customerSearch, customerType]);

  // Seedling search debounce
  useEffect(() => {
    if (!nurseryId || seedlingSearch.length < 2) { setSeedlingResults([]); return; }

    if (seedlingTimer.current) clearTimeout(seedlingTimer.current);
    seedlingTimer.current = setTimeout(async () => {
      setSeedlingSearching(true);
      try {
        const { data } = await api.get<{ success: boolean; data: { data: SeedlingResult[] } }>(
          `/api/nurseries/${nurseryId}/seedlings?search=${encodeURIComponent(seedlingSearch)}&pageSize=10`,
        );
        setSeedlingResults(data.data.data ?? []);
        setShowSeedlingDropdown(true);
      } catch { /* ignore */ }
      setSeedlingSearching(false);
    }, 300);
  }, [seedlingSearch, nurseryId]);

  const addToCart = (seedling: SeedlingResult) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === seedling.id);
      if (existing) return prev.map((i) => i.id === seedling.id ? { ...i, cartQty: Math.min(i.cartQty + 1, i.quantity) } : i);
      return [...prev, { ...seedling, cartQty: 1 }];
    });
    setSeedlingSearch('');
    setShowSeedlingDropdown(false);
  };

  const runningTotal = cartItems.reduce((s, i) => s + i.price * i.cartQty, 0);

  const handleSubmit = () => {
    if (!cartItems.length) { toast.error('Add at least one seedling'); return; }
    createOrder.mutate(
      {
        nurseryId,
        items: cartItems.map((i) => ({ seedlingId: i.id, quantity: i.cartQty })),
        guestName: customerType === 'guest' ? (guestName || undefined) : undefined,
        customerId: customerType === 'registered' ? (selectedCustomer?.id) : undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: (order) => {
          toast.success('Sale recorded successfully!');
          router.push(`/dashboard/orders/${order!.id}`);
        },
      },
    );
  };

  const stepLabel = ['Select Nursery', 'Customer', 'Items & Review'];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard/orders">Orders</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>New Walk-in Sale</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <h1 className="text-2xl font-semibold">Record Walk-in Sale</h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${step === s ? 'bg-primary text-primary-foreground' : step > s ? 'bg-primary/30 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {s}
            </div>
            <span className={step === s ? 'font-semibold text-foreground' : 'text-muted-foreground'}>
              {stepLabel[s - 1]}
            </span>
            {s < 3 && <span className="text-muted-foreground">→</span>}
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-6 space-y-5">
        {/* ── Step 1: Select Nursery ─────────────────────────────────────── */}
        {step === 1 && (
          <>
            <h2 className="font-semibold">Step 1: Select Nursery</h2>
            <div className="space-y-1.5">
              <Label>Nursery</Label>
              <Select value={nurseryId} onValueChange={setNurseryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a nursery…" />
                </SelectTrigger>
                <SelectContent>
                  {nurseries?.map((n) => (
                    <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)} disabled={!nurseryId}>Next →</Button>
            </div>
          </>
        )}

        {/* ── Step 2: Customer ────────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <h2 className="font-semibold">Step 2: Customer (optional)</h2>

            <div className="flex gap-4">
              {(['guest', 'registered'] as const).map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={customerType === type}
                    onChange={() => setCustomerType(type)}
                    className="accent-primary"
                  />
                  <span className="text-sm capitalize">{type === 'guest' ? 'Guest' : 'Registered Customer'}</span>
                </label>
              ))}
            </div>

            {customerType === 'guest' && (
              <div className="space-y-1.5">
                <Label>Guest Name (optional)</Label>
                <Input value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="e.g. John Doe" />
              </div>
            )}

            {customerType === 'registered' && (
              <div className="space-y-2">
                {selectedCustomer ? (
                  <div className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{selectedCustomer.name}</p>
                      <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                    </div>
                    <button onClick={() => setSelectedCustomer(null)}>
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-8"
                      placeholder="Search by email (min 3 chars)…"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                    {customerSearching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    {customerResults.length > 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg">
                        {customerResults.map((c) => (
                          <button
                            key={c.id}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-muted"
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerResults([]); }}
                          >
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)}>Next →</Button>
            </div>
          </>
        )}

        {/* ── Step 3: Items & Review ────────────────────────────────────── */}
        {step === 3 && (
          <>
            <h2 className="font-semibold">Step 3: Add Items</h2>

            {/* Seedling search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search seedlings…"
                value={seedlingSearch}
                onChange={(e) => { setSeedlingSearch(e.target.value); setShowSeedlingDropdown(true); }}
              />
              {seedlingSearching && <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
              {showSeedlingDropdown && seedlingResults.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-background shadow-lg max-h-48 overflow-y-auto">
                  {seedlingResults.map((s) => (
                    <button
                      key={s.id}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-b-0"
                      onClick={() => addToCart(s)}
                    >
                      <div className="flex justify-between">
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground text-xs">Qty: {s.quantity}</span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{s.size === 'SMALL_POT' ? 'Small Pot' : 'Big Pot'}</span>
                        <span>UGX {s.price.toLocaleString()}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart items */}
            {cartItems.length > 0 && (
              <div className="space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">UGX {item.price.toLocaleString()} each</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="icon" className="h-6 w-6" disabled={item.cartQty <= 1} onClick={() => setCartItems((p) => p.map((i) => i.id === item.id ? { ...i, cartQty: i.cartQty - 1 } : i))}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.cartQty}</span>
                      <Button variant="outline" size="icon" className="h-6 w-6" disabled={item.cartQty >= item.quantity} onClick={() => setCartItems((p) => p.map((i) => i.id === item.id ? { ...i, cartQty: Math.min(i.cartQty + 1, i.quantity) } : i))}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-medium w-24 text-right">
                      UGX {(item.price * item.cartQty).toLocaleString()}
                    </span>
                    <button onClick={() => setCartItems((p) => p.filter((i) => i.id !== item.id))}>
                      <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-lg px-1">
                  <span>Total</span>
                  <span className="text-primary">UGX {runningTotal.toLocaleString()}</span>
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Any special notes about this sale…" />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
              <Button
                onClick={handleSubmit}
                disabled={createOrder.isPending || cartItems.length === 0}
                className="bg-primary"
              >
                {createOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Sale
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
