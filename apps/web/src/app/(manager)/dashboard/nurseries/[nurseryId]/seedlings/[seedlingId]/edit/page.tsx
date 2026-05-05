'use client';

import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SeedlingForm } from '@/components/seedling/SeedlingForm';
import { useSeedling } from '@/lib/hooks/useSeedlings';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditSeedlingPage() {
  const { nurseryId, seedlingId } = useParams<{ nurseryId: string; seedlingId: string }>();
  const router = useRouter();
  const { data, isLoading } = useSeedling(nurseryId, seedlingId);

  if (isLoading)
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Seedling</h1>
      <SeedlingForm
        nurseryId={nurseryId}
        seedlingId={seedlingId}
        initialData={data?.data}
        onSuccess={() => {
          toast.success('Seedling updated!');
          router.push(`/dashboard/nurseries/${nurseryId}/seedlings`);
        }}
      />
    </div>
  );
}
