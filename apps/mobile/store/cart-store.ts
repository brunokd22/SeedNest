import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CartItem {
  seedlingId: string;
  name: string;
  price: number;
  quantity: number;
  nurseryId: string;
  nurseryName: string;
  photo: string | null;
  size: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (seedlingId: string) => void;
  updateQuantity: (seedlingId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const qty = item.quantity ?? 1;
          const existing = state.items.find((i) => i.seedlingId === item.seedlingId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.seedlingId === item.seedlingId
                  ? { ...i, quantity: i.quantity + qty }
                  : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity: qty }] };
        }),

      removeItem: (seedlingId) =>
        set((state) => ({
          items: state.items.filter((i) => i.seedlingId !== seedlingId),
        })),

      updateQuantity: (seedlingId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.seedlingId === seedlingId ? { ...i, quantity } : i,
          ),
        })),

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalAmount: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'seednest-cart',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
