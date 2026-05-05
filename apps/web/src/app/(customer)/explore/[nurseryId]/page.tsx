'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { MapPin, Clock, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SeedlingCard } from '@/components/seedling/SeedlingCard';
import {
  usePublicNursery,
  usePublicSeedlings,
  type PublicSeedling,
} from '@/lib/hooks/useExplore';
import { useCategoriesByNursery } from '@/lib/hooks/useCategories';
import { AvailabilityStatus, SeedlingSize } from '@seednest/shared';
import { cn } from '@/lib/utils';

const MAX_PRICE = 100_000;
const PAGE_SIZE = 18;

export default function NurseryExplorePage() {
  const { nurseryId } = useParams<{ nurseryId: string }>();

  const { data: nursery, isLoading: nurseryLoading } = usePublicNursery(nurseryId);
  const { data: categories } = useCategoriesByNursery(nurseryId);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [categoryId, setCategoryId] = useState('');
  const [size, setSize] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState(MAX_PRICE);
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const filters = {
    categoryId: categoryId || undefined,
    size: size || undefined,
    availabilityStatus: availableOnly ? AvailabilityStatus.AVAILABLE : undefined,
    search: debouncedSearch || undefined,
    maxPrice: maxPrice < MAX_PRICE ? maxPrice : undefined,
    pageSize: PAGE_SIZE,
  };

  const { data: seedlingsResult, isLoading: seedlingsLoading } = usePublicSeedlings(
    nurseryId,
    filters,
  );

  return (
    <div>
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <div className="relative h-[250px] w-full overflow-hidden">
        {nursery?.coverImageUrl ? (
          <Image
            src={nursery.coverImageUrl}
            alt={nursery.name ?? ''}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-green-700 to-emerald-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        {nursery && (
          <div className="absolute bottom-6 left-6">
            <h1 className="text-white text-3xl font-bold">{nursery.name}</h1>
            <div className="flex items-center gap-1 text-white/80 mt-1">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">{nursery.address}</span>
            </div>
          </div>
        )}
        {nurseryLoading && (
          <div className="absolute bottom-6 left-6 space-y-2">
            <Skeleton className="h-8 w-48 bg-white/20" />
            <Skeleton className="h-4 w-32 bg-white/20" />
          </div>
        )}
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ── Left: seedlings ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filter bar */}
            <div className="space-y-3">
              {/* Category tabs */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[{ id: '', name: 'All' }, ...(categories ?? [])].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      'shrink-0 rounded-full px-3 py-1 text-sm font-medium transition-colors',
                      categoryId === cat.id
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80',
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Size + search row */}
              <div className="flex flex-wrap items-center gap-3">
                <ToggleGroup
                  type="single"
                  value={size}
                  onValueChange={(v) => setSize(v)}
                  className="border rounded-md"
                >
                  <ToggleGroupItem value="" className="text-xs px-3">All</ToggleGroupItem>
                  <ToggleGroupItem value={SeedlingSize.SMALL_POT} className="text-xs px-3">Small</ToggleGroupItem>
                  <ToggleGroupItem value={SeedlingSize.BIG_POT} className="text-xs px-3">Big</ToggleGroupItem>
                </ToggleGroup>

                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search seedlings..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              {/* Price slider + available switch */}
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    {maxPrice < MAX_PRICE
                      ? `Up to UGX ${maxPrice.toLocaleString()}`
                      : 'Any price'}
                  </Label>
                  <Slider
                    min={0}
                    max={MAX_PRICE}
                    step={1000}
                    value={[maxPrice]}
                    onValueChange={([v]) => setMaxPrice(v)}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id="available-only"
                    checked={availableOnly}
                    onCheckedChange={setAvailableOnly}
                  />
                  <Label htmlFor="available-only" className="text-sm cursor-pointer">
                    Available only
                  </Label>
                </div>
              </div>
            </div>

            {/* Seedlings grid */}
            {seedlingsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SeedlingCardSkeleton key={i} />
                ))}
              </div>
            ) : !seedlingsResult?.data.length ? (
              <p className="py-12 text-center text-muted-foreground">
                No seedlings match your filters.
              </p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {seedlingsResult.data.map((s) => (
                  <SeedlingCard key={s.id} seedling={s} nurseryId={nurseryId} />
                ))}
              </div>
            )}
          </div>

          {/* ── Right: nursery info ─────────────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <NurseryInfoCard nursery={nursery} isLoading={nurseryLoading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── NurseryInfoCard ────────────────────────────────────────────────────────────
function NurseryInfoCard({
  nursery,
  isLoading,
}: {
  nursery: ReturnType<typeof usePublicNursery>['data'];
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-5 space-y-3">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!nursery) return null;

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h2 className="font-semibold text-lg">{nursery.name}</h2>

        {nursery.description && (
          <p className="text-sm text-muted-foreground">{nursery.description}</p>
        )}

        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{nursery.address}</span>
        </div>

        {nursery.operatingHours && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{nursery.operatingHours}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── SeedlingCardSkeleton ───────────────────────────────────────────────────────
function SeedlingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-16 rounded-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-full" />
      </div>
    </Card>
  );
}
