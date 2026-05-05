'use client';

import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { SeedlingForm } from '@/components/seedling/SeedlingForm';

export default function NewSeedlingPage() {
  const { nurseryId } = useParams<{ nurseryId: string }>();
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Add New Seedling</h1>
      <SeedlingForm
        nurseryId={nurseryId}
        onSuccess={() => {
          toast.success('Seedling created!');
          router.push(`/dashboard/nurseries/${nurseryId}/seedlings`);
        }}
      />
    </div>
  );
}
