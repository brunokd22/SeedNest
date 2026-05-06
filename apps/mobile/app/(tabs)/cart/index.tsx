import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useCartStore } from '@/store/cart-store';

const PRIMARY = '#2D6A4F';

export default function CartScreen() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const fulfillmentType = useCartStore((s) => s.fulfillmentType);
  const setFulfillmentType = useCartStore((s) => s.setFulfillmentType);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalAmount = useCartStore((s) => s.totalAmount());

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.emptyContainer}>
        <ShoppingCart size={64} color="#D1D5DB" />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => router.push('/(tabs)/explore' as never)}
        >
          <Text style={styles.browseBtnText}>Browse Seedlings</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Cart</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.seedlingId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => (
              <TouchableOpacity
                style={styles.deleteAction}
                onPress={() => removeItem(item.seedlingId)}
              >
                <Trash2 size={20} color="#fff" />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            )}
          >
            <View style={styles.itemRow}>
              <View style={styles.thumbnailContainer}>
                {item.photo ? (
                  <Image
                    source={{ uri: item.photo }}
                    style={styles.thumbnail}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.thumbnail, { backgroundColor: '#D8F3DC' }]} />
                )}
              </View>

              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                {item.size && (
                  <Text style={styles.itemMeta}>
                    {item.size === 'SMALL_POT' ? 'Small Pot' : 'Big Pot'}
                  </Text>
                )}
                <Text style={styles.itemPrice}>UGX {item.price.toLocaleString()}</Text>
              </View>

              <View style={styles.stepper}>
                <TouchableOpacity
                  style={[styles.stepBtn, item.quantity <= 1 && styles.stepBtnDisabled]}
                  disabled={item.quantity <= 1}
                  onPress={() => updateQuantity(item.seedlingId, item.quantity - 1)}
                >
                  <Minus size={14} color={item.quantity <= 1 ? '#D1D5DB' : '#374151'} />
                </TouchableOpacity>
                <Text style={styles.stepQty}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => updateQuantity(item.seedlingId, item.quantity + 1)}
                >
                  <Plus size={14} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>
          </Swipeable>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          <View style={styles.fulfillmentSection}>
            <Text style={styles.fulfillmentTitle}>Fulfillment</Text>
            <View style={styles.fulfillmentCards}>
              {(['DELIVERY', 'PICKUP'] as const).map((type) => {
                const active = fulfillmentType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    style={[styles.fulfillmentCard, active && styles.fulfillmentCardActive]}
                    onPress={() => setFulfillmentType(type)}
                  >
                    <Text style={styles.fulfillmentIcon}>
                      {type === 'DELIVERY' ? '🚚' : '🏪'}
                    </Text>
                    <Text style={[styles.fulfillmentLabel, active && styles.fulfillmentLabelActive]}>
                      {type === 'DELIVERY' ? 'Delivery' : 'Pickup'}
                    </Text>
                    {type === 'DELIVERY' && (
                      <Text style={styles.fulfillmentFee}>+UGX 5,000</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
      />

      {/* Sticky bottom bar */}
      <View style={styles.bottomBar}>
        <Text style={styles.totalText}>
          Total:{' '}
          <Text style={styles.totalAmount}>UGX {totalAmount.toLocaleString()}</Text>
        </Text>
        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => router.push('/checkout' as never)}
        >
          <Text style={styles.checkoutBtnText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, backgroundColor: '#fff',
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#374151' },
  browseBtn: {
    backgroundColor: PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8,
  },
  browseBtnText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  header: {
    fontSize: 22, fontWeight: 'bold', color: '#111827',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8,
  },
  listContent: { paddingHorizontal: 16, paddingBottom: 120 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', paddingVertical: 12,
  },
  thumbnailContainer: { width: 50, height: 50, borderRadius: 8, overflow: 'hidden' },
  thumbnail: { width: 50, height: 50 },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  itemMeta: { fontSize: 12, color: '#9CA3AF' },
  itemPrice: { fontSize: 12, color: PRIMARY, fontWeight: '500' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 1,
    borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center',
  },
  stepBtnDisabled: { borderColor: '#F3F4F6' },
  stepQty: {
    fontSize: 14, fontWeight: '600', color: '#111827', minWidth: 20, textAlign: 'center',
  },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  deleteAction: {
    backgroundColor: '#EF4444', width: 80,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  deleteText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  fulfillmentSection: { paddingTop: 24, gap: 12 },
  fulfillmentTitle: { fontSize: 15, fontWeight: '600', color: '#374151' },
  fulfillmentCards: { flexDirection: 'row', gap: 12 },
  fulfillmentCard: {
    flex: 1, alignItems: 'center', paddingVertical: 16,
    borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', gap: 4,
  },
  fulfillmentCardActive: { borderColor: PRIMARY, backgroundColor: '#F0FDF4' },
  fulfillmentIcon: { fontSize: 22 },
  fulfillmentLabel: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  fulfillmentLabelActive: { color: PRIMARY },
  fulfillmentFee: { fontSize: 11, color: '#9CA3AF' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB',
    padding: 16, paddingBottom: 32, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  totalText: { flex: 1, fontSize: 14, color: '#374151' },
  totalAmount: { fontWeight: 'bold', color: PRIMARY, fontSize: 16 },
  checkoutBtn: {
    backgroundColor: PRIMARY, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 10,
  },
  checkoutBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
