import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react-native';
import { api } from '@/lib/api';

const PRIMARY = '#2D6A4F';
const DELIVERY_FEE = 5000;

const ALL_STATUSES = [
  'PENDING', 'PROCESSING', 'DISPATCHED', 'DELIVERED', 'READY_FOR_PICKUP', 'COLLECTED',
];

type ManagerOrderDetail = {
  id: string;
  createdAt: string;
  totalAmount: number;
  fulfillmentType: string;
  fulfillmentStatus: string;
  deliveryAddress: string | null;
  saleMethod: string;
  guestName: string | null;
  stripePaymentIntentId: string | null;
  nursery: { name: string; address: string };
  customer: { name: string; email: string } | null;
  items: { id: string; seedlingName: string; seedlingSize: string; unitPrice: number; quantity: number }[];
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ManagerOrderDetailScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const qc = useQueryClient();
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [localStatus, setLocalStatus] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['manager-order-mobile', orderId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: ManagerOrderDetail }>(
        `/api/orders/${orderId}`,
      );
      return data.data;
    },
    enabled: !!orderId,
  });

  const currentStatus = localStatus ?? order?.fulfillmentStatus ?? '';

  const handleSelectStatus = async (status: string) => {
    setShowStatusModal(false);
    try {
      await api.patch(`/api/orders/${orderId}/status`, { fulfillmentStatus: status });
      setLocalStatus(status);
      qc.invalidateQueries({ queryKey: ['manager-orders-mobile'] });
      Alert.alert('Success', 'Status updated');
    } catch {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  if (isLoading || !order) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  const isDelivery = order.fulfillmentType === 'DELIVERY';
  const subtotal = order.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const deliveryFee = isDelivery ? DELIVERY_FEE : 0;
  const orderNumber = order.id.slice(0, 8).toUpperCase();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Order # + date */}
        <View style={styles.section}>
          <Text style={styles.orderNum}>Order #{orderNumber}</Text>
          <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>
        </View>

        {/* Status updater */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <TouchableOpacity
            style={styles.statusBtn}
            onPress={() => setShowStatusModal(true)}
          >
            <Text style={styles.statusBtnText}>{currentStatus.replace(/_/g, ' ')}</Text>
            <ChevronDown size={18} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Customer info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer</Text>
          <View style={styles.card}>
            {order.customer ? (
              <>
                <Text style={styles.cardText}>{order.customer.name}</Text>
                <Text style={styles.cardSubText}>{order.customer.email}</Text>
              </>
            ) : (
              <Text style={styles.cardText}>
                {order.guestName ? `Walk-in: ${order.guestName}` : 'Anonymous Walk-in'}
              </Text>
            )}
            <View style={[styles.methodBadge, order.saleMethod === 'ONLINE' ? styles.methodOnline : styles.methodWalkin]}>
              <Text style={[styles.methodText, order.saleMethod === 'ONLINE' ? { color: '#1D4ED8' } : { color: '#374151' }]}>
                {order.saleMethod === 'ONLINE' ? 'Online' : 'Walk-in'}
              </Text>
            </View>
          </View>
        </View>

        {/* Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Items</Text>
          <View style={styles.card}>
            {order.items.map((item, idx) => (
              <View key={item.id} style={[styles.itemRow, idx < order.items.length - 1 && styles.itemBorder]}>
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
              <Text style={styles.totalMuted}>Delivery fee</Text>
              <Text style={styles.totalMuted}>{deliveryFee > 0 ? `UGX ${deliveryFee.toLocaleString()}` : 'Free'}</Text>
            </View>
            <View style={[styles.totalRow, styles.totalDivider]}>
              <Text style={styles.totalBold}>Total</Text>
              <Text style={[styles.totalBold, { color: PRIMARY }]}>UGX {order.totalAmount.toLocaleString()}</Text>
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
                : `🏪 Pickup at ${order.nursery.name}`}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Custom ActionSheet Modal */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Update Status</Text>
            {ALL_STATUSES.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.modalOption, s === currentStatus && styles.modalOptionActive]}
                onPress={() => handleSelectStatus(s)}
              >
                <Text style={[styles.modalOptionText, s === currentStatus && styles.modalOptionTextActive]}>
                  {s.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowStatusModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  orderNum: { fontSize: 20, fontWeight: '800', color: '#111827', fontVariant: ['tabular-nums'] },
  dateText: { fontSize: 13, color: '#9CA3AF' },
  statusBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#E5E7EB',
  },
  statusBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', padding: 14, gap: 4 },
  cardText: { fontSize: 15, fontWeight: '600', color: '#111827' },
  cardSubText: { fontSize: 13, color: '#6B7280' },
  methodBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 4 },
  methodOnline: { backgroundColor: '#DBEAFE' },
  methodWalkin: { backgroundColor: '#F3F4F6' },
  methodText: { fontSize: 11, fontWeight: '600' },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  itemInfo: { flex: 1, marginRight: 8 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  itemAmount: { fontSize: 13, fontWeight: '600', color: '#374151' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  totalDivider: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 4 },
  totalMuted: { fontSize: 13, color: '#9CA3AF' },
  totalBold: { fontSize: 15, fontWeight: '800', color: '#111827' },
  fulfillmentText: { fontSize: 14, color: '#166534', fontWeight: '500' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  modalOption: { padding: 14, borderRadius: 10, marginBottom: 4 },
  modalOptionActive: { backgroundColor: '#F0FDF4' },
  modalOptionText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  modalOptionTextActive: { color: PRIMARY, fontWeight: '700' },
  modalCancel: { marginTop: 8, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center' },
  modalCancelText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
});
