import { useEffect } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const PRIMARY = '#2D6A4F';

type OrderItem = {
  id: string;
  seedlingName: string;
  quantity: number;
  unitPrice: number;
};

type ConfirmationOrder = {
  id: string;
  totalAmount: number;
  fulfillmentType: string;
  deliveryAddress: string | null;
  nursery: { name: string };
  items: OrderItem[];
};

export default function OrderConfirmationScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 400 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const { data: order, isLoading } = useQuery({
    queryKey: ['confirm-order', orderId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: ConfirmationOrder }>(
        `/api/my-orders/${orderId}`,
      );
      return data.data;
    },
    enabled: !!orderId,
  });

  const orderNumber = (order?.id ?? orderId ?? '').slice(0, 8).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Animated success checkmark */}
        <Animated.View style={[styles.checkCircle, animatedStyle]}>
          <Text style={styles.checkMark}>✓</Text>
        </Animated.View>

        <Text style={styles.heading}>Order Confirmed!</Text>

        <View style={styles.orderBadge}>
          <Text style={styles.orderBadgeText}>Order #{orderNumber}</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator color={PRIMARY} style={{ marginTop: 24 }} />
        ) : order ? (
          <>
            <Text style={styles.nurseryName}>{order.nursery.name}</Text>

            {/* Items */}
            <View style={styles.itemsCard}>
              {order.items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {item.seedlingName} × {item.quantity}
                  </Text>
                  <Text style={styles.itemAmount}>
                    UGX {(item.unitPrice * item.quantity).toLocaleString()}
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  UGX {order.totalAmount.toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Fulfillment */}
            <View style={styles.fulfillmentCard}>
              <Text style={styles.fulfillmentText}>
                {order.fulfillmentType === 'DELIVERY'
                  ? `🚚 Delivering to: ${order.deliveryAddress ?? 'Address on file'}`
                  : `🏪 Pickup at ${order.nursery.name}`}
              </Text>
            </View>
          </>
        ) : null}

        {/* CTAs */}
        <View style={styles.ctaRow}>
          <TouchableOpacity
            style={styles.outlineBtn}
            onPress={() => router.push(`/(tabs)/orders/${orderId}` as never)}
          >
            <Text style={styles.outlineBtnText}>View Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fillBtn}
            onPress={() => router.replace('/(tabs)/explore' as never)}
          >
            <Text style={styles.fillBtnText}>Continue Shopping</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 40, gap: 16 },
  checkCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: PRIMARY,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  heading: { fontSize: 26, fontWeight: 'bold', color: '#111827' },
  orderBadge: {
    backgroundColor: '#DCFCE7', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999,
  },
  orderBadgeText: { color: '#166534', fontWeight: '700', fontSize: 14 },
  nurseryName: { fontSize: 14, color: '#6B7280' },
  itemsCard: {
    width: '100%', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  itemName: { flex: 1, fontSize: 13, color: '#374151', marginRight: 8 },
  itemAmount: { fontSize: 13, fontWeight: '500', color: '#374151' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F0FDF4',
  },
  totalLabel: { fontWeight: 'bold', color: '#111827', fontSize: 14 },
  totalValue: { fontWeight: 'bold', color: PRIMARY, fontSize: 14 },
  fulfillmentCard: {
    width: '100%', backgroundColor: '#F0FDF4', borderRadius: 10, padding: 14,
  },
  fulfillmentText: { fontSize: 14, color: '#166534', fontWeight: '500' },
  ctaRow: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  outlineBtn: {
    flex: 1, borderWidth: 1.5, borderColor: PRIMARY, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center',
  },
  outlineBtnText: { color: PRIMARY, fontWeight: '600', fontSize: 14 },
  fillBtn: { flex: 1, backgroundColor: PRIMARY, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  fillBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
