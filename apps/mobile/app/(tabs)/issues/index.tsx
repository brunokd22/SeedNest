import { useState } from 'react';
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
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, Plus } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const PRIMARY = '#2D6A4F';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: '#FEE2E2', text: '#991B1B' },
  IN_PROGRESS: { bg: '#DBEAFE', text: '#1D4ED8' },
  RESOLVED: { bg: '#DCFCE7', text: '#166534' },
  CLOSED: { bg: '#F3F4F6', text: '#374151' },
};

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  REPLACEMENT_REQUEST: { bg: '#FFEDD5', text: '#9A3412' },
  QUERY: { bg: '#DBEAFE', text: '#1D4ED8' },
  COMPLAINT: { bg: '#FEE2E2', text: '#991B1B' },
  GENERAL_REQUEST: { bg: '#F3F4F6', text: '#374151' },
};

const TYPE_LABELS: Record<string, string> = {
  REPLACEMENT_REQUEST: 'Replacement',
  QUERY: 'Query',
  COMPLAINT: 'Complaint',
  GENERAL_REQUEST: 'General',
};

const FILTERS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'] as const;
const FILTER_STATUS: Record<string, string> = {
  Open: 'OPEN',
  'In Progress': 'IN_PROGRESS',
  Resolved: 'RESOLVED',
  Closed: 'CLOSED',
};

type Issue = {
  id: string;
  title: string;
  type: string;
  status: string;
  updatedAt: string;
  nursery: { name: string };
  _count?: { comments: number };
};

export default function IssuesScreen() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<string>('All');

  const statusParam = activeFilter === 'All' ? undefined : FILTER_STATUS[activeFilter];

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['mobile-issues', statusParam],
    queryFn: async () => {
      const params = new URLSearchParams({ page: '1', pageSize: '30' });
      if (statusParam) params.set('status', statusParam);
      const { data } = await api.get<{ success: boolean; data: { data: Issue[] } }>(
        `/api/my-issues?${params}`,
      );
      return data.data.data;
    },
  });

  const issues = data ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.chip, activeFilter === f && styles.chipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.chipText, activeFilter === f && styles.chipTextActive]}>
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator size="large" color={PRIMARY} style={styles.loader} />
      ) : (
        <FlatList
          data={issues}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={PRIMARY} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MessageSquare size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>You haven&apos;t raised any issues yet.</Text>
              <Text style={styles.emptySubText}>Tap + to get started.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(tabs)/issues/${item.id}` as never)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
              <View style={styles.badgeRow}>
                <View style={[styles.badge, { backgroundColor: TYPE_COLORS[item.type]?.bg ?? '#F3F4F6' }]}>
                  <Text style={[styles.badgeText, { color: TYPE_COLORS[item.type]?.text ?? '#374151' }]}>
                    {TYPE_LABELS[item.type] ?? item.type}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: STATUS_COLORS[item.status]?.bg ?? '#F3F4F6' }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[item.status]?.text ?? '#374151' }]}>
                    {item.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <Text style={styles.nurseryName}>{item.nursery.name}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.footerText}>
                  💬 {item._count?.comments ?? 0}
                </Text>
                <Text style={styles.footerText}>
                  {formatDistanceToNow(new Date(item.updatedAt), { addSuffix: true })}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/issues/new' as never)}
        activeOpacity={0.85}
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  filtersContainer: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  chipActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  chipText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  loader: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 100 },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: '#374151', textAlign: 'center' },
  emptySubText: { fontSize: 13, color: '#9CA3AF' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, gap: 8, borderWidth: 1, borderColor: '#E5E7EB', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  nurseryName: { fontSize: 12, color: '#6B7280' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 12, color: '#9CA3AF' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6 },
});
