'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AvailabilityStatus, SeedlingSize } from '@seednest/shared';
import { useCartStore } from '@/store/cart-store';
import type { PublicSeedling } from '@/lib/hooks/useExplore';
import { cn } from '@/lib/utils';

interface SeedlingCardProps {
  seedling: PublicSeedling & { averageRating?: number; totalReviews?: number };
  nurseryId: string;
}

export function SeedlingCard({ seedling, nurseryId }: SeedlingCardProps) {
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      seedlingId: seedling.id,
      name: seedling.name,
      price: seedling.price,
      quantity: 1,
      nurseryId,
      photo: seedling.photos[0] ?? null,
      size: seedling.size,
    });
    toast.success(`${seedling.name} added to cart!`);
  };

  const isOutOfStock = seedling.availabilityStatus === AvailabilityStatus.OUT_OF_STOCK;

  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden h-full flex flex-col">
      {/* Photo + availability badge */}
      <Link href={`/explore/${nurseryId}/seedlings/${seedling.id}`} className="block relative">
        <div className="relative aspect-square w-full overflow-hidden rounded-t-lg bg-muted">
          {seedling.photos[0] ? (
            <Image
              src={seedling.photos[0]}
              alt={seedling.name}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-700 to-emerald-500">
              <Leaf className="h-10 w-10 text-white" />
            </div>
          )}

          {seedling.availabilityStatus !== AvailabilityStatus.AVAILABLE && (
            <div className="absolute top-2 right-2">
              {seedling.availabilityStatus === AvailabilityStatus.OUT_OF_STOCK ? (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100 text-xs">
                  Out of Stock
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 text-xs">
                  Coming Soon
                </Badge>
              )}
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-3 flex flex-col flex-1">
        {/* Size chip */}
        <Badge variant="outline" className="self-start text-xs mb-1">
          {seedling.size === SeedlingSize.SMALL_POT ? 'Small Pot' : 'Big Pot'}
        </Badge>

        {/* Name */}
        <Link href={`/explore/${nurseryId}/seedlings/${seedling.id}`}>
          <p className="font-semibold text-sm line-clamp-2 mt-1 hover:text-primary">
            {seedling.name}
          </p>
        </Link>

        {/* Rating (optional) */}
        {seedling.averageRating != null && (
          <div className="flex items-center gap-1 mt-1">
            <StarRow rating={seedling.averageRating} />
            <span className="text-xs text-muted-foreground">
              ({seedling.totalReviews ?? 0})
            </span>
          </div>
        )}

        {/* Price */}
        <p className="text-lg font-bold text-primary mt-auto pt-2">
          UGX {seedling.price.toLocaleString()}
        </p>

        {/* Add to Cart */}
        <Button
          size="sm"
          className={cn('w-full mt-2', isOutOfStock && 'opacity-60')}
          disabled={isOutOfStock}
          onClick={handleAddToCart}
        >
          {isOutOfStock ? (
            'Out of Stock'
          ) : (
            <>
              <ShoppingCart className="mr-1.5 h-4 w-4" />
              Add to Cart
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={cn(
            'h-3.5 w-3.5',
            star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-200',
          )}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}
