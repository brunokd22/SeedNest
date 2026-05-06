import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const PRIMARY = '#2D6A4F';

type ManagerOrderSummary = {
  id: string;
  createdAt: string;
  totalAmount: number;
  fulfillmentStatus: string;
  saleMethod: string;
  guestName: string | null;
  nursery: { name: string };
  customer: { name: string } | null;
  _count?: { items: number };
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#F3F4F6', text: '#374151' },
  PROCESSING: { bg: '#DBEAFE', text: '#1D4ED8' },
  DISPATCHED: { bg: '#FEF3C7', text: '#92400E' },
  DELIVERED: { bg: '#DCFCE7', text: '#166534' },
  READY_FOR_PICKUP: { bg: '#EDE9FE', text: '#6D28D9' },
  COLLECTED: { bg: '#DCFCE7', text: '#166534' },
};

type FilterChip = {
  label: string;
  saleMethod?: string;
  fulfillmentStatus?: string;
};

const FILTER_CHIPS: FilterChip[] = [
  { label: 'All' },
  { label: 'Online', saleMethod: 'ONLINE' },
  { label: 'Walk-in', saleMethod: 'WALKIN' },
  { label: 'Pending', fulfillmentStatus: 'PENDING' },
  { label: 'Processing', fulfillmentStatus: 'PROCESSING' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function ManagerOrdersScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = React.useState<FilterChip>(FILTER_CHIPS[0]);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['manager-orders-mobile', activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', pageSize: '20' });
      if (activeFilter.saleMethod) params.set('saleMethod', activeFilter.saleMethod);
      if (activeFilter.fulfillmentStatus) params.set('fulfillmentStatus', activeFilter.fulfillmentStatus);
      const { data } = await api.get<{
        success: boolean;
        data: { data: ManagerOrderSummary[]; total: number };
      }>(`/api/orders?${params}`);
      return data.data.data;
    },
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {FILTER_CHIPS.map((chip) => {
          const active = chip.label === activeFilter.label;
          return (
            <TouchableOpacity
              key={chip.label}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => setActiveFilter(chip)}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PRIMARY} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No orders found.</Text>
          }
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const orderNumber = item.id.slice(0, 8).toUpperCase();
            const customerLabel = item.customer?.name
              ? item.customer.name
              : item.guestName
              ? `Walk-in: ${item.guestName}`
              : 'Walk-in';
            const statusStyle = STATUS_COLORS[item.fulfillmentStatus] ?? STATUS_COLORS.PENDING;

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/manager/orders/${item.id}` as never)}
                activeOpacity={0.8}
              >
                <View style={styles.cardTop}>
                  <View>
                    <Text style={styles.orderNum}>{orderNumber}</Text>
                    <Text style={styles.customerName} numberOfLines={1}>{customerLabel}</Text>
                    <Text style={styles.nurseryName} numberOfLines={1}>{item.nursery.name}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                    <Text style={styles.amountText}>UGX {item.totalAmount.toLocaleString()}</Text>
                    <View style={styles.badges}>
                      <View style={[styles.badge, item.saleMethod === 'ONLINE' ? styles.badgeOnline : styles.badgeWalkin]}>
                        <Text style={[styles.badgeText, item.saleMethod === 'ONLINE' ? styles.badgeTextOnline : styles.badgeTextWalkin]}>
                          {item.saleMethod === 'ONLINE' ? 'Online' : 'Walk-in'}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                          {item.fulfillmentStatus.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

import React from 'react';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  chipsContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  listContent: { padding: 12, paddingBottom: 32 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, marginTop: 60 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  orderNum: { fontSize: 14, fontWeight: '700', color: '#111827', fontVariant: ['tabular-nums'] },
  customerName: { fontSize: 13, color: '#374151', marginTop: 2 },
  nurseryName: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  dateText: { fontSize: 12, color: '#9CA3AF' },
  amountText: { fontSize: 14, fontWeight: '700', color: PRIMARY },
  badges: { flexDirection: 'row', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' },
  badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999 },
  badgeOnline: { backgroundColor: '#DBEAFE' },
  badgeWalkin: { backgroundColor: '#F3F4F6' },
  badgeText: { fontSize: 10, fontWeight: '600' },
  badgeTextOnline: { color: '#1D4ED8' },
  badgeTextWalkin: { color: '#374151' },
});
