'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type CreatePaymentIntentPayload = {
  nurseryId: string;
  items: { seedlingId: string; quantity: number }[];
  fulfillmentType: 'DELIVERY' | 'PICKUP';
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
};

export type OrderSummaryItem = {
  seedlingId: string;
  name: string;
  size: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
};

export type PaymentIntentData = {
  clientSecret: string;
  orderSummary: OrderSummaryItem[];
};

export type CheckoutOrder = {
  id: string;
  totalAmount: number;
  fulfillmentType: string;
  fulfillmentStatus: string;
  deliveryAddress: string | null;
  createdAt: string;
  nursery: { name: string };
  items: {
    id: string;
    seedlingName: string;
    seedlingSize: string;
    unitPrice: number;
    quantity: number;
  }[];
};

type ApiOk<T> = { success: boolean; data: T };

export function useCreatePaymentIntent() {
  return useMutation({
    mutationFn: async (payload: CreatePaymentIntentPayload) => {
      const { data } = await api.post<ApiOk<PaymentIntentData>>(
        '/api/checkout/create-payment-intent',
        payload,
      );
      return data.data;
    },
  });
}

export function useOrderByPaymentIntent(paymentIntentId: string | null) {
  return useQuery({
    queryKey: ['order-by-pi', paymentIntentId],
    queryFn: async () => {
      const { data } = await api.get<ApiOk<CheckoutOrder>>(
        `/api/orders/by-payment-intent/${paymentIntentId}`,
      );
      return data.data;
    },
    enabled: !!paymentIntentId,
    retry: 3,
    retryDelay: 1500,
  });
}
