import {
  ActivityIndicator,
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { differenceInDays } from 'date-fns';
import { ChevronLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const PRIMARY = '#2D6A4F';
const DELIVERY_FEE = 5000;

const DELIVERY_STEPS = ['PENDING', 'PROCESSING', 'DISPATCHED', 'DELIVERED'];
const PICKUP_STEPS = ['PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'COLLECTED'];
const STEP_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  READY_FOR_PICKUP: 'Ready',
  COLLECTED: 'Collected',
};

type OrderDetail = {
  id: string;
  createdAt: string;
  totalAmount: number;
  fulfillmentType: string;
  fulfillmentStatus: string;
  deliveryAddress: string | null;
  nursery: { name: string; address: string };
  items: {
    id: string;
    seedlingName: string;
    seedlingSize: string;
    unitPrice: number;
    quantity: number;
  }[];
};

export default function OrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();

  const { data: order, isLoading } = useQuery({
    queryKey: ['mobile-order', orderId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: OrderDetail }>(
        `/api/my-orders/${orderId}`,
      );
      return data.data;
    },
    enabled: !!orderId,
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.notFound}>Order not found.</Text>
      </SafeAreaView>
    );
  }

  const isDelivery = order.fulfillmentType === 'DELIVERY';
  const steps = isDelivery ? DELIVERY_STEPS : PICKUP_STEPS;
  const currentIdx = steps.indexOf(order.fulfillmentStatus);
  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
  const withinThirtyDays = differenceInDays(new Date(), new Date(order.createdAt)) <= 30;
  const orderNumber = order.id.slice(0, 8).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Order #{orderNumber}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.timeline}>
              {steps.map((step, idx) => {
                const done = idx < currentIdx;
                const current = idx === currentIdx;
                const isLast = idx === steps.length - 1;
                return (
                  <View key={step} style={styles.stepWrapper}>
                    <View style={styles.stepDotRow}>
                      <View
                        style={[
                          styles.stepDot,
                          done && styles.stepDotDone,
                          current && styles.stepDotCurrent,
                        ]}
                      >
                        {done && <Text style={styles.stepCheck}>✓</Text>}
                        {current && <View style={styles.stepInnerDot} />}
                      </View>
                      {!isLast && (
                        <View style={[styles.stepLine, idx < currentIdx && styles.stepLineDone]} />
                      )}
                    </View>
                    <Text style={[styles.stepLabel, (done || current) && styles.stepLabelActive]}>
                      {STEP_LABELS[step]}
                    </Text>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.card}>
            {order.items.map((item, idx) => (
              <View
                key={item.id}
                style={[styles.itemRow, idx < order.items.length - 1 && styles.itemBorder]}
              >
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.seedlingName}</Text>
                  <Text style={styles.itemMeta}>
                    {item.seedlingSize === 'SMALL_POT' ? 'Small Pot' : 'Big Pot'} × {item.quantity}
                  </Text>
                </View>
                <Text style={styles.itemAmount}>
                  UGX {(item.unitPrice * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Total */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Total</Text>
          <View style={styles.card}>
            <View style={styles.totalRow}>
              <Text style={styles.totalMuted}>Subtotal</Text>
              <Text style={styles.totalMuted}>UGX {subtotal.toLocaleString()}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalMuted}>Delivery</Text>
              <Text style={styles.totalMuted}>
                {deliveryFee > 0 ? `UGX ${deliveryFee.toLocaleString()}` : 'Free'}
              </Text>
            </View>
            <View style={[styles.totalRow, styles.totalDivider]}>
              <Text style={styles.totalBold}>Total</Text>
              <Text style={[styles.totalBold, { color: PRIMARY }]}>
                UGX {order.totalAmount.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>

        {/* Fulfillment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fulfillment</Text>
          <View style={[styles.card, { backgroundColor: '#F0FDF4' }]}>
            <Text style={styles.fulfillmentText}>
              {isDelivery
                ? `🚚 Delivering to: ${order.deliveryAddress ?? 'Address on file'}`
                : `🏪 Pickup at: ${order.nursery.address}`}
            </Text>
          </View>
        </View>

        {/* Raise Issue */}
        {withinThirtyDays && (
          <TouchableOpacity
            style={styles.issueBtn}
            onPress={() => router.push('/(tabs)/issues' as never)}
          >
            <Text style={styles.issueBtnText}>⚠️ Raise an Issue</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  notFound: { color: '#6B7280', fontSize: 15 },
  navBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#F3F4F6' },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  timeline: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 4 },
  stepWrapper: { alignItems: 'center', minWidth: 72 },
  stepDotRow: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: '#D1D5DB', backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotDone: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  stepDotCurrent: { borderColor: PRIMARY, backgroundColor: '#fff' },
  stepInnerDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: PRIMARY },
  stepCheck: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  stepLine: { width: 44, height: 2, backgroundColor: '#E5E7EB' },
  stepLineDone: { backgroundColor: PRIMARY },
  stepLabel: { fontSize: 11, color: '#9CA3AF', marginTop: 6, textAlign: 'center' },
  stepLabelActive: { color: PRIMARY, fontWeight: '600' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemInfo: { flex: 1, marginRight: 8 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  itemAmount: { fontSize: 13, fontWeight: '600', color: '#374151' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  totalDivider: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 12 },
  totalMuted: { fontSize: 13, color: '#9CA3AF' },
  totalBold: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  fulfillmentText: { fontSize: 14, color: '#166534', fontWeight: '500', padding: 14 },
  issueBtn: { borderWidth: 1.5, borderColor: '#F59E0B', borderRadius: 10, padding: 14, alignItems: 'center' },
  issueBtnText: { color: '#92400E', fontWeight: '600', fontSize: 14 },
});
