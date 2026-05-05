'use client';

import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CloudUpload, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { SeedlingSize, AvailabilityStatus } from '@seednest/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategoriesByNursery } from '@/lib/hooks/useCategories';
import { useCreateSeedling, useUpdateSeedling, type Seedling } from '@/lib/hooks/useSeedlings';
import { useUpload } from '@/lib/hooks/useUpload';
import { api } from '@/lib/api';

// ── Form schema ───────────────────────────────────────────────────────────────
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(5000).optional(),
  categoryId: z.string().optional(),
  size: z.nativeEnum(SeedlingSize),
  price: z.coerce.number().positive('Price must be positive'),
  quantity: z.coerce.number().int().nonnegative('Quantity cannot be negative'),
  availabilityStatus: z.nativeEnum(AvailabilityStatus),
});
type FormValues = z.infer<typeof formSchema>;

// ── Photo state ───────────────────────────────────────────────────────────────
type PhotoItem = { url: string; key?: string; uploading: boolean };

// ── Props ─────────────────────────────────────────────────────────────────────
interface SeedlingFormProps {
  nurseryId: string;
  seedlingId?: string;
  initialData?: Partial<Seedling>;
  onSuccess?: () => void;
}

export function SeedlingForm({
  nurseryId,
  seedlingId,
  initialData,
  onSuccess,
}: SeedlingFormProps) {
  const isEdit = !!seedlingId;
  const createSeedling = useCreateSeedling(nurseryId);
  const updateSeedling = useUpdateSeedling(nurseryId);
  const { uploadFile } = useUpload();
  const { data: categories } = useCategoriesByNursery(nurseryId);

  const [photos, setPhotos] = useState<PhotoItem[]>(
    (initialData?.photos ?? []).map((url) => ({ url, uploading: false })),
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      categoryId: initialData?.categoryId ?? '',
      size: initialData?.size ?? SeedlingSize.SMALL_POT,
      price: initialData?.price ?? 0,
      quantity: initialData?.quantity ?? 0,
      availabilityStatus:
        initialData?.availabilityStatus ?? AvailabilityStatus.AVAILABLE,
    },
  });

  const isUploading = photos.some((p) => p.uploading);
  const mutation = isEdit ? updateSeedling : createSeedling;
  const isPending = mutation.isPending;

  const onSubmit = (values: FormValues) => {
    const photoUrls = photos.filter((p) => !p.uploading).map((p) => p.url);
    const categoryId =
      values.categoryId && values.categoryId !== '' ? values.categoryId : undefined;

    if (isEdit) {
      updateSeedling.mutate(
        { id: seedlingId, ...values, categoryId, photos: photoUrls },
        { onSuccess },
      );
    } else {
      createSeedling.mutate(
        { ...values, categoryId, photos: photoUrls },
        { onSuccess },
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input {...register('name')} placeholder="e.g. Acacia seedling" />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea {...register('description')} rows={4} placeholder="Optional description" />
      </div>

      {/* Category + Size */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value ?? ''}>
                <SelectTrigger>
                  <SelectValue placeholder="No category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No category</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Size</Label>
          <Controller
            control={control}
            name="size"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SeedlingSize.SMALL_POT}>Small Pot</SelectItem>
                  <SelectItem value={SeedlingSize.BIG_POT}>Big Pot</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.size && <p className="text-xs text-destructive">{errors.size.message}</p>}
        </div>
      </div>

      {/* Price + Quantity */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Price (UGX)</Label>
          <Input type="number" step="100" min="0" {...register('price')} />
          {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label>Quantity</Label>
          <Input type="number" min="0" {...register('quantity')} />
          {errors.quantity && (
            <p className="text-xs text-destructive">{errors.quantity.message}</p>
          )}
        </div>
      </div>

      {/* Availability */}
      <div className="space-y-1.5">
        <Label>Availability</Label>
        <Controller
          control={control}
          name="availabilityStatus"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AvailabilityStatus.AVAILABLE}>Available</SelectItem>
                <SelectItem value={AvailabilityStatus.OUT_OF_STOCK}>Out of Stock</SelectItem>
                <SelectItem value={AvailabilityStatus.COMING_SOON}>Coming Soon</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {/* Photos */}
      <div className="space-y-1.5">
        <Label>Photos</Label>
        <PhotoUploadZone
          photos={photos}
          setPhotos={setPhotos}
          uploadFile={uploadFile}
        />
      </div>

      <Button type="submit" disabled={isPending || isUploading} className="w-full">
        {(isPending || isUploading) && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {isEdit ? 'Save Changes' : 'Create Seedling'}
      </Button>
    </form>
  );
}

// ── PhotoUploadZone ───────────────────────────────────────────────────────────
interface PhotoUploadZoneProps {
  photos: PhotoItem[];
  setPhotos: React.Dispatch<React.SetStateAction<PhotoItem[]>>;
  uploadFile: (
    file: File,
    folder: 'seedlings' | 'nurseries',
  ) => Promise<{ publicUrl: string; key: string }>;
}

function PhotoUploadZone({ photos, setPhotos, uploadFile }: PhotoUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (rawFiles: FileList | File[]) => {
    const files = Array.from(rawFiles).filter((f) => f.type.startsWith('image/'));

    // Validate count
    if (photos.length + files.length > 5) {
      toast.error('Maximum 5 photos allowed.');
      return;
    }

    // Validate size
    const validFiles: File[] = [];
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File too large. Max 5 MB per image.');
      } else {
        validFiles.push(file);
      }
    }

    if (!validFiles.length) return;

    // Add all as uploading immediately
    const entries = validFiles.map((file) => ({
      file,
      objectURL: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [
      ...prev,
      ...entries.map(({ objectURL }) => ({ url: objectURL, uploading: true })),
    ]);

    // Upload in parallel
    await Promise.all(
      entries.map(async ({ file, objectURL }) => {
        try {
          const { publicUrl, key } = await uploadFile(file, 'seedlings');
          setPhotos((prev) =>
            prev.map((p) =>
              p.url === objectURL ? { url: publicUrl, key, uploading: false } : p,
            ),
          );
          URL.revokeObjectURL(objectURL);
        } catch {
          setPhotos((prev) => prev.filter((p) => p.url !== objectURL));
          URL.revokeObjectURL(objectURL);
          toast.error('Photo upload failed.');
        }
      }),
    );
  };

  const handleDelete = async (photo: PhotoItem) => {
    setPhotos((prev) => prev.filter((p) => p.url !== photo.url));
    if (photo.key) {
      try {
        await api.delete('/api/upload', { data: { key: photo.key } });
      } catch {
        // silently ignore — photo is already removed from form state
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 px-6 py-8 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <CloudUpload className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Drag &amp; drop photos here, or click to select</p>
        <p className="text-xs text-muted-foreground mt-1">Up to 5 images · JPG, PNG, WEBP</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {/* Preview grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, i) => (
            <div key={i} className="relative aspect-square rounded-md overflow-hidden border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.url}
                alt={`Photo ${i + 1}`}
                className="h-full w-full object-cover"
              />
              {photo.uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
              {!photo.uploading && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(photo);
                  }}
                  className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/90"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
