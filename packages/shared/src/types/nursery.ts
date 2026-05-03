export enum SeedlingSize {
  SMALL_POT = 'SMALL_POT',
  BIG_POT   = 'BIG_POT',
}

export enum AvailabilityStatus {
  AVAILABLE    = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  COMING_SOON  = 'COMING_SOON',
}

export type Nursery = {
  id: string;
  managerId: string;
  name: string;
  description: string | null;
  address: string;
  latitude: number | null;
  longitude: number | null;
  coverImageUrl: string | null;
  operatingHours: string | null;
  lowStockThreshold: number;
  careReminderDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type NurseryWithDistance = Nursery & {
  distanceKm: number;
};
