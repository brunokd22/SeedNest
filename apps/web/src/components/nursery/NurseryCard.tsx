'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, TreePine } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { ExploreNursery } from '@/lib/hooks/useExplore';

interface NurseryCardProps {
  nursery: ExploreNursery;
}

export function NurseryCard({ nursery }: NurseryCardProps) {
  return (
    <Link href={`/explore/${nursery.id}`}>
      <Card className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer overflow-hidden h-full">
        {/* Cover image */}
        <div className="relative aspect-video w-full overflow-hidden">
          {nursery.coverImageUrl ? (
            <Image
              src={nursery.coverImageUrl}
              alt={nursery.name}
              fill
              unoptimized
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-700 to-emerald-500">
              <TreePine className="h-12 w-12 text-white" />
            </div>
          )}
        </div>

        <CardContent className="p-4 space-y-1.5">
          {/* Name + distance */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-lg truncate leading-tight">{nursery.name}</h3>
            {nursery.distanceKm != null && (
              <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                {nursery.distanceKm.toFixed(1)} km away
              </span>
            )}
          </div>

          {/* Address */}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="text-sm truncate">{nursery.address}</span>
          </div>

          {/* Operating hours */}
          {nursery.operatingHours && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="text-xs">{nursery.operatingHours}</span>
            </div>
          )}

          {/* Description */}
          {nursery.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
              {nursery.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
