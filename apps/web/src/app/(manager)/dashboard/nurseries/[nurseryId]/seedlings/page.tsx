'use client';

import { useEffect, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, ChevronLeft, ChevronRight, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCategoriesByNursery } from '@/lib/hooks/useCategories';
import {
  useSeedlingsByNursery,
  useDeleteSeedling,
  type Seedling,
} from '@/lib/hooks/useSeedlings';
import { AvailabilityStatus, SeedlingSize } from '@seednest/shared';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

const STATUS_BADGE: Record<AvailabilityStatus, string> = {
  [AvailabilityStatus.AVAILABLE]: 'bg-green-100 text-green-800',
  [AvailabilityStatus.OUT_OF_STOCK]: 'bg-red-100 text-red-800',
  [AvailabilityStatus.COMING_SOON]: 'bg-yellow-100 text-yellow-800',
};

const STATUS_LABEL: Record<AvailabilityStatus, string> = {
  [AvailabilityStatus.AVAILABLE]: 'Available',
  [AvailabilityStatus.OUT_OF_STOCK]: 'Out of Stock',
  [AvailabilityStatus.COMING_SOON]: 'Coming Soon',
};

export default function SeedlingsPage() {
  const params = useParams<{ nurseryId: string }>();
  const nurseryId = params.nurseryId;
  const pathname = usePathname();
  const tabBase = `/dashboard/nurseries/${nurseryId}`;

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [size, setSize] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const hasFilters = !!debouncedSearch || !!categoryId || !!size || !!status;

  const filters = {
    search: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
    size: size || undefined,
    availabilityStatus: status || undefined,
    page,
    pageSize: PAGE_SIZE,
  };

  const { data: result, isLoading } = useSeedlingsByNursery(nurseryId, filters);
  const { data: categories } = useCategoriesByNursery(nurseryId);
  const deleteSeedling = useDeleteSeedling(nurseryId);

  const [deleteTarget, setDeleteTarget] = useState<Seedling | null>(null);

  const totalPages = result ? Math.ceil(result.total / PAGE_SIZE) : 1;

  const clearFilters = () => {
    setSearch('');
    setCategoryId('');
    setSize('');
    setStatus('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Tab nav */}
      <Tabs value={pathname}>
        <TabsList>
          <TabsTrigger value={tabBase} asChild>
            <Link href={tabBase}>Details</Link>
          </TabsTrigger>
          <TabsTrigger value={`${tabBase}/categories`} asChild>
            <Link href={`${tabBase}/categories`}>Categories</Link>
          </TabsTrigger>
          <TabsTrigger value={pathname} asChild>
            <Link href={pathname}>Seedlings</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Seedlings</h2>
        <Button asChild>
          <Link href={`${tabBase}/seedlings/new`}>
            <Plus className="mr-2 h-4 w-4" />
            Add Seedling
          </Link>
        </Button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search seedlings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-52"
        />

        <Select value={categoryId} onValueChange={(v) => { setCategoryId(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories?.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={size} onValueChange={(v) => { setSize(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All sizes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All sizes</SelectItem>
            <SelectItem value={SeedlingSize.SMALL_POT}>Small Pot</SelectItem>
            <SelectItem value={SeedlingSize.BIG_POT}>Big Pot</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value={AvailabilityStatus.AVAILABLE}>Available</SelectItem>
            <SelectItem value={AvailabilityStatus.OUT_OF_STOCK}>Out of Stock</SelectItem>
            <SelectItem value={AvailabilityStatus.COMING_SOON}>Coming Soon</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-muted-foreground underline hover:text-foreground"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Photo</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Price</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-12 rounded" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8 mx-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : !result?.data.length ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                  No seedlings found.{' '}
                  <Link
                    href={`${tabBase}/seedlings/new`}
                    className="text-primary underline"
                  >
                    Add your first seedling
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((seedling) => (
                <TableRow key={seedling.id}>
                  <TableCell>
                    {seedling.photos[0] ? (
                      <Image
                        src={seedling.photos[0]}
                        alt={seedling.name}
                        width={48}
                        height={48}
                        unoptimized
                        className="rounded object-cover w-12 h-12"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium max-w-[160px] truncate">
                    {seedling.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {seedling.category?.name ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {seedling.size === SeedlingSize.SMALL_POT ? 'Small Pot' : 'Big Pot'}
                  </TableCell>
                  <TableCell className="text-sm">
                    UGX {seedling.price.toLocaleString()}
                  </TableCell>
                  <TableCell className={cn(
                    'text-center text-sm font-medium',
                    seedling.quantity <= 5 && 'text-destructive',
                  )}>
                    {seedling.quantity}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        'text-xs hover:opacity-100',
                        STATUS_BADGE[seedling.availabilityStatus],
                      )}
                    >
                      {STATUS_LABEL[seedling.availabilityStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`${tabBase}/seedlings/${seedling.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(seedling)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {result && result.total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete seedling?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete{' '}
              <span className="font-medium">{deleteTarget?.name}</span>? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTarget) return;
                deleteSeedling.mutate(deleteTarget.id, {
                  onSuccess: () => setDeleteTarget(null),
                });
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
