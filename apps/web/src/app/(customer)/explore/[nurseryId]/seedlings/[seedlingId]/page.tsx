'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Minus, Plus, ShoppingCart, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { usePublicSeedling, usePublicNursery } from '@/lib/hooks/useExplore';
import { useCartStore } from '@/store/cart-store';
import { AvailabilityStatus, SeedlingSize } from '@seednest/shared';
import { cn } from '@/lib/utils';

export default function SeedlingDetailPage() {
  const { nurseryId, seedlingId } =
    useParams<{ nurseryId: string; seedlingId: string }>();

  const { data: seedling, isLoading } = usePublicSeedling(nurseryId, seedlingId);
  const { data: nursery } = usePublicNursery(nurseryId);
  const [activePhoto, setActivePhoto] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  const items = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);

  if (isLoading) return <SeedlingDetailSkeleton />;
  if (!seedling) return <p className="p-8 text-muted-foreground">Seedling not found.</p>;

  const mainPhoto = activePhoto ?? seedling.photos[0] ?? null;
  const inCart = items.find((i) => i.seedlingId === seedling.id);
  const isOutOfStock = seedling.availabilityStatus === AvailabilityStatus.OUT_OF_STOCK;
  const maxQty = Math.max(1, seedling.quantity);

  const handleAddToCart = () => {
    if (inCart) {
      updateQuantity(seedling.id, qty);
      toast.success('Cart updated!');
    } else {
      addItem({
        seedlingId: seedling.id,
        name: seedling.name,
        price: seedling.price,
        quantity: qty,
        nurseryId,
        photo: seedling.photos[0] ?? null,
        size: seedling.size,
      });
      toast.success(`${seedling.name} added to cart!`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── Photo gallery ──────────────────────────────────────────────── */}
        <div className="space-y-3">
          {/* Main photo */}
          <div className="relative h-[400px] w-full rounded-lg overflow-hidden bg-gray-50">
            {mainPhoto ? (
              <Image
                src={mainPhoto}
                alt={seedling.name}
                fill
                unoptimized
                className="object-contain"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-700 to-emerald-500">
                <Leaf className="h-20 w-20 text-white" />
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {seedling.photos.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {seedling.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(photo)}
                  className={cn(
                    'relative h-16 w-16 shrink-0 overflow-hidden rounded cursor-pointer border-2 transition-colors',
                    (activePhoto ?? seedling.photos[0]) === photo
                      ? 'border-primary'
                      : 'border-transparent hover:border-muted-foreground/40',
                  )}
                >
                  <Image
                    src={photo}
                    alt={`Photo ${i + 1}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product info ───────────────────────────────────────────────── */}
        <div className="space-y-5">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/explore">Explore</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/explore/${nurseryId}`}>
                    {nursery?.name ?? 'Nursery'}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{seedling.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Name */}
          <h1 className="text-3xl font-bold">{seedling.name}</h1>

          {/* Chips row */}
          <div className="flex flex-wrap gap-2">
            {seedling.category && (
              <Badge variant="secondary">{seedling.category.name}</Badge>
            )}
            <Badge variant="outline">
              {seedling.size === SeedlingSize.SMALL_POT ? 'Small Pot' : 'Big Pot'}
            </Badge>
            {seedling.availabilityStatus === AvailabilityStatus.AVAILABLE && (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                Available
              </Badge>
            )}
            {seedling.availabilityStatus === AvailabilityStatus.OUT_OF_STOCK && (
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                Out of Stock
              </Badge>
            )}
            {seedling.availabilityStatus === AvailabilityStatus.COMING_SOON && (
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                Coming Soon
              </Badge>
            )}
          </div>

          {/* Price */}
          <p className="text-4xl font-bold text-primary">
            UGX {seedling.price.toLocaleString()}
          </p>

          {/* Description */}
          {seedling.description && (
            <p className="text-muted-foreground">{seedling.description}</p>
          )}

          <Separator />

          {/* Quantity selector */}
          {!isOutOfStock && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Quantity</p>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-xl w-8 text-center font-medium">{qty}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    disabled={qty >= maxQty}
                    title={qty >= maxQty ? 'Max stock reached' : undefined}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {qty >= maxQty && (
                  <span className="text-xs text-muted-foreground">Max stock reached</span>
                )}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <Button
            size="lg"
            className="w-full sm:w-auto"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            {isOutOfStock
              ? 'Out of Stock'
              : inCart
              ? `Update Cart (${inCart.quantity} in cart)`
              : 'Add to Cart'}
          </Button>

          {/* Back link */}
          <Link
            href={`/explore/${nurseryId}`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-0.5" />
            Back to nursery
          </Link>
        </div>
      </div>
    </div>
  );
}

function SeedlingDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-3">
          <Skeleton className="h-[400px] w-full rounded-lg" />
          <div className="flex gap-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-16 rounded" />)}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-9 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-12 w-40" />
        </div>
      </div>
    </div>
  );
}
