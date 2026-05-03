export enum FulfillmentType {
  DELIVERY = 'DELIVERY',
  PICKUP   = 'PICKUP',
}

export enum FulfillmentStatus {
  PENDING          = 'PENDING',
  PROCESSING       = 'PROCESSING',
  DISPATCHED       = 'DISPATCHED',
  DELIVERED        = 'DELIVERED',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  COLLECTED        = 'COLLECTED',
}

export enum SaleMethod {
  ONLINE = 'ONLINE',
  WALKIN = 'WALKIN',
}

export type OrderItem = {
  id: string;
  orderId: string;
  seedlingId: string;
  seedlingName: string;
  seedlingSize: string;
  unitPrice: number;
  quantity: number;
};

export type Order = {
  id: string;
  nurseryId: string;
  customerId: string | null;
  guestName: string | null;
  fulfillmentType: FulfillmentType;
  fulfillmentStatus: FulfillmentStatus;
  deliveryAddress: string | null;
  deliveryLat: number | null;
  deliveryLng: number | null;
  saleMethod: SaleMethod;
  stripePaymentIntentId: string | null;
  totalAmount: number;
  receiptEmailSent: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OrderWithItems = Order & {
  items: OrderItem[];
};
