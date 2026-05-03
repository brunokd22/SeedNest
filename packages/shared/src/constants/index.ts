export const LOW_STOCK_DEFAULT_THRESHOLD = 5;
export const CARE_REMINDER_DEFAULT_DAYS  = 14;
export const MAX_SEEDLING_PHOTOS         = 5;

export const ORDER_STATUSES = [
  'PENDING',
  'PROCESSING',
  'DISPATCHED',
  'DELIVERED',
  'READY_FOR_PICKUP',
  'COLLECTED',
] as const;

export const ISSUE_TYPES = [
  'REPLACEMENT_REQUEST',
  'QUERY',
  'COMPLAINT',
  'GENERAL_REQUEST',
] as const;
