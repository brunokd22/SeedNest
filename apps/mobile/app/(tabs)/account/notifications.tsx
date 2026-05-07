import { useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  Bell,
  MessageCircle,
  PackageOpen,
  ShoppingBag,
} from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllRead,
  type MobileNotification,
} from '@/lib/hooks/useNotifications';

const TYPE_CONFIG: Record<
  string,
  { Icon: React.ElementType; iconColor: string; bgColor: string }
> = {
  NEW_ISSUE: { Icon: AlertCircle, iconColor: '#F97316', bgColor: '#FFF7ED' },
  NEW_COMMENT: { Icon: MessageCircle, iconColor: '#3B82F6', bgColor: '#EFF6FF' },
  LOW_STOCK: { Icon: PackageOpen, iconColor: '#EF4444', bgColor: '#FEF2F2' },
  ORDER_UPDATE: { Icon: ShoppingBag, iconColor: '#22C55E', bgColor: '#F0FDF4' },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useNotifications(50);
  const markAsRead = useMarkAsRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.data ?? [];

  const handleMarkAll = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => Alert.alert('Done', 'All notifications marked as read.'),
      onError: () => Alert.alert('Error', 'Failed to mark all as read.'),
    });
  };

  const handleTap = (n: MobileNotification) => {
    markAsRead.mutate(n.id);
    switch (n.type) {
      case 'NEW_ISSUE':
      case 'NEW_COMMENT':
        if (n.relatedId) router.push(`/(tabs)/issues/${n.relatedId}` as never);
        break;
      case 'ORDER_UPDATE':
        if (n.relatedId) router.push(`/(tabs)/orders/${n.relatedId}` as never);
        break;
      case 'LOW_STOCK':
        Alert.alert('Low Stock', 'Check your nursery seedlings stock levels.');
        break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleMarkAll}
              disabled={markAllRead.isPending}
              style={{ paddingRight: 4 }}
            >
              {markAllRead.isPending ? (
                <ActivityIndicator size="small" color="#2D6A4F" />
              ) : (
                <Text style={styles.markAllBtn}>Mark All Read</Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      {isLoading ? (
        <ActivityIndicator size="large" color="#2D6A4F" style={styles.loader} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#2D6A4F"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Bell size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>You're all caught up!</Text>
              <Text style={styles.emptySubText}>No notifications right now.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotificationRow
              notification={item}
              onTap={() => handleTap(item)}
              onMarkRead={() => markAsRead.mutate(item.id)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function NotificationRow({
  notification,
  onTap,
  onMarkRead,
}: {
  notification: MobileNotification;
  onTap: () => void;
  onMarkRead: () => void;
}) {
  const swipeRef = useRef<Swipeable>(null);
  const typeConf = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.NEW_ISSUE;
  const { Icon, iconColor, bgColor } = typeConf;

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.swipeAction}
      onPress={() => {
        swipeRef.current?.close();
        onMarkRead();
      }}
    >
      <Text style={styles.swipeActionText}>Mark{'\n'}Read</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={!notification.isRead ? renderRightActions : undefined}>
      <TouchableOpacity
        style={[
          styles.row,
          !notification.isRead && styles.rowUnread,
        ]}
        onPress={onTap}
        activeOpacity={0.75}
      >
        {/* Type icon */}
        <View style={[styles.iconCircle, { backgroundColor: bgColor }]}>
          <Icon size={18} color={iconColor} />
        </View>

        {/* Content */}
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.rowMessage} numberOfLines={2}>
            {notification.message}
          </Text>
        </View>

        {/* Time */}
        <Text style={styles.rowTime}>
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </Text>
      </TouchableOpacity>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  loader: { flex: 1 },
  markAllBtn: { fontSize: 13, color: '#2D6A4F', fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#374151' },
  emptySubText: { fontSize: 13, color: '#9CA3AF' },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  rowUnread: { borderLeftWidth: 3, borderLeftColor: '#3B82F6' },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  rowContent: { flex: 1, gap: 3 },
  rowTitle: { fontSize: 13, fontWeight: '700', color: '#111827' },
  rowMessage: { fontSize: 12, color: '#6B7280', lineHeight: 16 },
  rowTime: { fontSize: 11, color: '#9CA3AF', flexShrink: 0, marginTop: 2 },
  swipeAction: {
    backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center',
    width: 72, paddingHorizontal: 8,
  },
  swipeActionText: { color: '#fff', fontSize: 12, fontWeight: '700', textAlign: 'center' },
});
