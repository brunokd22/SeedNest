import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronRight, Package } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#F3F4F6', text: '#374151' },
  PROCESSING: { bg: '#DBEAFE', text: '#1D4ED8' },
  DISPATCHED: { bg: '#FEF3C7', text: '#92400E' },
  DELIVERED: { bg: '#DCFCE7', text: '#166534' },
  READY_FOR_PICKUP: { bg: '#EDE9FE', text: '#6D28D9' },
  COLLECTED: { bg: '#DCFCE7', text: '#166534' },
};

type OrderSummary = {
  id: string;
  createdAt: string;
  totalAmount: number;
  fulfillmentStatus: string;
  nursery: { name: string };
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function OrdersScreen() {
  const router = useRouter();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mobile-my-orders'],
    queryFn: async () => {
      const { data } = await api.get<{
        success: boolean;
        data: { data: OrderSummary[]; total: number };
      }>('/api/my-orders?pageSize=50');
      return data.data.data;
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>My Orders</Text>

      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#2D6A4F"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Package size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No orders yet</Text>
            <Text style={styles.emptySubText}>Your orders will appear here.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusStyle = STATUS_COLORS[item.fulfillmentStatus] ?? STATUS_COLORS.PENDING;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(tabs)/orders/${item.id}` as never)}
              activeOpacity={0.8}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardLeft}>
                  <Text style={styles.nurseryName} numberOfLines={1}>
                    {item.nursery.name}
                  </Text>
                  <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  <Text style={styles.amountText}>
                    UGX {item.totalAmount.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.cardRight}>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {item.fulfillmentStatus.replace(/_/g, ' ')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color="#9CA3AF" />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  header: { fontSize: 22, fontWeight: 'bold', color: '#111827', padding: 16, paddingBottom: 12, backgroundColor: '#fff' },
  listContent: { padding: 12, paddingBottom: 32 },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubText: { fontSize: 13, color: '#9CA3AF' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flex: 1, gap: 3, marginRight: 12 },
  nurseryName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  dateText: { fontSize: 12, color: '#9CA3AF' },
  amountText: { fontSize: 14, fontWeight: 'bold', color: '#2D6A4F' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '600' },
});
