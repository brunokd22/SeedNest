'use client';

import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { NurseryCard } from '@/components/nursery/NurseryCard';
import { useNurseriesExplore } from '@/lib/hooks/useExplore';

type LocationStatus = 'idle' | 'loading' | 'granted' | 'denied';

export default function ExplorePage() {
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

  const { data: nurseries, isLoading } = useNurseriesExplore(lat, lng);

  const requestLocation = () => {
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Find Tree Seedlings Near You</h1>
        <p className="text-muted-foreground text-lg">
          Discover nurseries selling tree seedlings near your location in Uganda
        </p>

        {/* Location button */}
        <LocationButton status={locationStatus} onRequest={requestLocation} />
      </div>

      {/* Nurseries grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <NurseryCardSkeleton key={i} />
          ))}
        </div>
      ) : !nurseries || nurseries.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center text-muted-foreground">
          <MapPin className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-lg font-medium">No nurseries found</p>
          <p className="text-sm mt-1">Check back soon — new nurseries are joining!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {nurseries.map((nursery) => (
            <NurseryCard key={nursery.id} nursery={nursery} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── LocationButton ─────────────────────────────────────────────────────────────
function LocationButton({
  status,
  onRequest,
}: {
  status: LocationStatus;
  onRequest: () => void;
}) {
  if (status === 'idle') {
    return (
      <Button onClick={onRequest} className="gap-2">
        <MapPin className="h-4 w-4" />
        Show Nurseries Near Me
      </Button>
    );
  }

  if (status === 'loading') {
    return (
      <Button disabled className="gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Getting your location...
      </Button>
    );
  }

  if (status === 'granted') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-sm font-medium text-green-800">
        <MapPin className="h-3.5 w-3.5" />
        Showing nurseries near you
      </span>
    );
  }

  // denied
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm text-muted-foreground">
      <MapPin className="h-3.5 w-3.5" />
      Location not available — showing all nurseries
    </span>
  );
}

// ── NurseryCardSkeleton ────────────────────────────────────────────────────────
function NurseryCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="aspect-video w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </Card>
  );
}
