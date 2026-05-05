'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, MapPin, TreePine, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNursery, useUpdateNursery } from '@/lib/hooks/useNurseries';
import { useUpload } from '@/lib/hooks/useUpload';

// ── Detail form schema ────────────────────────────────────────────────────────
const detailSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  address: z.string().min(1, 'Address is required'),
  operatingHours: z.string().optional(),
  lowStockThreshold: z.coerce.number().int().min(1).default(5),
  careReminderDays: z.coerce.number().int().min(1).default(14),
});
type DetailValues = z.infer<typeof detailSchema>;

// ── GPS form schema ───────────────────────────────────────────────────────────
const gpsSchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
});
type GpsValues = z.infer<typeof gpsSchema>;

export default function NurseryDetailPage() {
  const params = useParams<{ nurseryId: string }>();
  const pathname = usePathname();
  const nurseryId = params.nurseryId;

  const { data: nursery, isLoading } = useNursery(nurseryId);
  const updateNursery = useUpdateNursery();
  const { uploadFile, isUploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Detail form ─────────────────────────────────────────────────────────────
  const {
    register: registerDetail,
    handleSubmit: handleDetailSubmit,
    reset: resetDetail,
    formState: { errors: detailErrors },
  } = useForm<DetailValues>({ resolver: zodResolver(detailSchema) });

  // ── GPS form ────────────────────────────────────────────────────────────────
  const {
    register: registerGps,
    handleSubmit: handleGpsSubmit,
    reset: resetGps,
    setValue: setGpsValue,
    watch: watchGps,
  } = useForm<GpsValues>({ resolver: zodResolver(gpsSchema) });

  const lat = watchGps('latitude');
  const lng = watchGps('longitude');

  // Pre-populate forms when data loads
  useEffect(() => {
    if (!nursery) return;
    resetDetail({
      name: nursery.name,
      description: nursery.description ?? '',
      address: nursery.address,
      operatingHours: nursery.operatingHours ?? '',
      lowStockThreshold: nursery.lowStockThreshold,
      careReminderDays: nursery.careReminderDays,
    });
    if (nursery.latitude != null && nursery.longitude != null) {
      resetGps({ latitude: nursery.latitude, longitude: nursery.longitude });
    }
  }, [nursery, resetDetail, resetGps]);

  const onSaveDetails = (values: DetailValues) => {
    updateNursery.mutate(
      { id: nurseryId, ...values },
      { onSuccess: () => toast.success('Changes saved!') },
    );
  };

  const onSaveCoordinates = (values: GpsValues) => {
    updateNursery.mutate(
      { id: nurseryId, latitude: values.latitude, longitude: values.longitude },
      { onSuccess: () => toast.success('Coordinates saved!') },
    );
  };

  const useMyLocation = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsValue('latitude', pos.coords.latitude);
        setGpsValue('longitude', pos.coords.longitude);
      },
      () => toast.error('Could not get location. Please enter manually.'),
    );
  };

  const handleCoverPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { publicUrl } = await uploadFile(file, 'nurseries');
      updateNursery.mutate(
        { id: nurseryId, coverImageUrl: publicUrl },
        { onSuccess: () => toast.success('Cover photo updated!') },
      );
    } catch {
      toast.error('Upload failed. Please try again.');
    }
    // Reset so same file can be re-selected
    e.target.value = '';
  };

  const tabBase = `/dashboard/nurseries/${nurseryId}`;

  if (isLoading) return <NurseryDetailSkeleton />;
  if (!nursery) return <p className="text-muted-foreground">Nursery not found.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{nursery.name}</h1>
        <p className="text-sm text-muted-foreground">{nursery.address}</p>
      </div>

      {/* Tab navigation */}
      <Tabs value={pathname}>
        <TabsList>
          <TabsTrigger value={tabBase} asChild>
            <Link href={tabBase}>Details</Link>
          </TabsTrigger>
          <TabsTrigger value={`${tabBase}/categories`} asChild>
            <Link href={`${tabBase}/categories`}>Categories</Link>
          </TabsTrigger>
          <TabsTrigger value={`${tabBase}/seedlings`} asChild>
            <Link href={`${tabBase}/seedlings`}>Seedlings</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* ── Details form ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Nursery Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDetailSubmit(onSaveDetails)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input {...registerDetail('name')} />
                {detailErrors.name && (
                  <p className="text-xs text-destructive">{detailErrors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input {...registerDetail('address')} />
                {detailErrors.address && (
                  <p className="text-xs text-destructive">{detailErrors.address.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea {...registerDetail('description')} rows={3} />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Operating Hours</Label>
                <Input
                  {...registerDetail('operatingHours')}
                  placeholder="Mon-Sat: 7am-6pm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Low Stock Threshold</Label>
                <Input
                  type="number"
                  min={1}
                  {...registerDetail('lowStockThreshold')}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Care Reminder Days</Label>
                <Input
                  type="number"
                  min={1}
                  {...registerDetail('careReminderDays')}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateNursery.isPending}>
                {updateNursery.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── GPS Coordinates ───────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>GPS Location</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGpsSubmit(onSaveCoordinates)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  {...registerGps('latitude')}
                  placeholder="-1.286389"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="0.000001"
                  {...registerGps('longitude')}
                  placeholder="36.817223"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={useMyLocation}
            >
              <MapPin className="mr-2 h-4 w-4" />
              Use My Location
            </Button>

            {lat && lng && (
              <iframe
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`}
                width="100%"
                height="250"
                className="rounded-lg border"
                title="Map preview"
              />
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={updateNursery.isPending}>
                {updateNursery.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Coordinates
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* ── Cover Photo ───────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Cover Photo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative h-48 w-full overflow-hidden rounded-lg border bg-muted">
            {nursery.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={nursery.coverImageUrl}
                alt="Cover"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <TreePine className="h-16 w-16 text-muted-foreground/40" />
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCoverPhotoChange}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Cover Photo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NurseryDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <Skeleton className="h-10 w-80" />
      <Card>
        <CardHeader><Skeleton className="h-6 w-40" /></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    </div>
  );
}
