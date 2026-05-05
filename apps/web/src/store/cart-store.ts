import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CartItem = {
  seedlingId: string;
  name: string;
  price: number;
  quantity: number;
  nurseryId: string;
  photo: string | null;
  size?: string;
};

type CartStore = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (seedlingId: string) => void;
  updateQuantity: (seedlingId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalAmount: () => number;
};

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.seedlingId === item.seedlingId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.seedlingId === item.seedlingId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i,
              ),
            };
          }
          return { items: [...state.items, item] };
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
    { name: 'seednest-cart' },
  ),
);
