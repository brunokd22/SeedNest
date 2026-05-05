import { useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Minus, Plus, ShoppingCart } from 'lucide-react-native';
import { AvailabilityStatus, SeedlingSize } from '@seednest/shared';
import { usePublicSeedling, usePublicNursery } from '@/lib/hooks/useExplore';
import { useCartStore } from '@/store/cart-store';

const { width: screenWidth } = Dimensions.get('window');

export default function SeedlingDetailScreen() {
  const { seedlingId, nurseryId } =
    useLocalSearchParams<{ seedlingId: string; nurseryId: string }>();
  const router = useRouter();

  const { data: seedling, isLoading } = usePublicSeedling(nurseryId, seedlingId);
  const { data: nursery } = usePublicNursery(nurseryId);

  const [activeIndex, setActiveIndex] = useState(0);
  const [qty, setQty] = useState(1);

  const addItem = useCartStore((s) => s.addItem);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </SafeAreaView>
    );
  }

  if (!seedling) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <Text style={styles.errorText}>Seedling not found.</Text>
      </SafeAreaView>
    );
  }

  const photos = seedling.photos.length > 0 ? seedling.photos : [null];
  const maxQty = Math.max(1, seedling.quantity);
  const isOutOfStock = seedling.availabilityStatus === AvailabilityStatus.OUT_OF_STOCK;

  const handleAddToCart = () => {
    addItem({
      seedlingId: seedling.id,
      name: seedling.name,
      price: seedling.price,
      quantity: qty,
      nurseryId,
      nurseryName: nursery?.name ?? '',
      photo: seedling.photos[0] ?? null,
      size: seedling.size,
    });
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <View style={styles.backWrapper}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ChevronLeft size={22} color="#111827" />
          </TouchableOpacity>
        </View>

        {/* Photo carousel */}
        <FlatList
          data={photos}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={photos.length > 1}
          onMomentumScrollEnd={(e) =>
            setActiveIndex(
              Math.round(e.nativeEvent.contentOffset.x / screenWidth),
            )
          }
          keyExtractor={(_, i) => String(i)}
          renderItem={({ item }) =>
            item ? (
              <Image
                source={{ uri: item }}
                style={{ width: screenWidth, height: 300 }}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.photoFallback, { width: screenWidth }]} />
            )
          }
        />

        {/* Dot indicators */}
        {photos.length > 1 && (
          <View style={styles.dotsRow}>
            {photos.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.dotActive]}
              />
            ))}
          </View>
        )}

        {/* Details */}
        <View style={styles.details}>
          {/* Name */}
          <Text style={styles.name}>{seedling.name}</Text>

          {/* Chips row */}
          <View style={styles.chipsRow}>
            {seedling.category && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{seedling.category.name}</Text>
              </View>
            )}
            <View style={styles.chip}>
              <Text style={styles.chipText}>
                {seedling.size === SeedlingSize.SMALL_POT ? 'Small Pot' : 'Big Pot'}
              </Text>
            </View>
            {seedling.availabilityStatus === AvailabilityStatus.AVAILABLE && (
              <View style={[styles.chip, styles.chipGreen]}>
                <Text style={[styles.chipText, styles.chipTextGreen]}>Available</Text>
              </View>
            )}
            {isOutOfStock && (
              <View style={[styles.chip, styles.chipRed]}>
                <Text style={[styles.chipText, styles.chipTextRed]}>Out of Stock</Text>
              </View>
            )}
            {seedling.availabilityStatus === AvailabilityStatus.COMING_SOON && (
              <View style={[styles.chip, styles.chipYellow]}>
                <Text style={[styles.chipText, styles.chipTextYellow]}>Coming Soon</Text>
              </View>
            )}
          </View>

          {/* Price */}
          <Text style={styles.price}>UGX {seedling.price.toLocaleString()}</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          {seedling.description && (
            <Text style={styles.description}>{seedling.description}</Text>
          )}

          {/* Quantity stepper */}
          {!isOutOfStock && (
            <View style={styles.stepperSection}>
              <Text style={styles.stepperLabel}>Quantity</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={[styles.stepperBtn, qty <= 1 && styles.stepperBtnDisabled]}
                  onPress={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={qty <= 1}
                >
                  <Minus size={16} color={qty <= 1 ? '#D1D5DB' : '#111827'} />
                </TouchableOpacity>
                <Text style={styles.stepperQty}>{qty}</Text>
                <TouchableOpacity
                  style={[styles.stepperBtn, qty >= maxQty && styles.stepperBtnDisabled]}
                  onPress={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={qty >= maxQty}
                >
                  <Plus size={16} color={qty >= maxQty ? '#D1D5DB' : '#111827'} />
                </TouchableOpacity>
              </View>
              {qty >= maxQty && (
                <Text style={styles.maxStockNote}>Max stock reached</Text>
              )}
            </View>
          )}

          {/* Extra bottom padding for sticky bar */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Sticky bottom bar */}
      <View style={styles.stickyBar}>
        <View style={styles.stickyBarInner}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>
              UGX {(seedling.price * qty).toLocaleString()}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.cartButton, isOutOfStock && styles.cartButtonDisabled]}
            onPress={handleAddToCart}
            disabled={isOutOfStock}
            activeOpacity={0.8}
          >
            <ShoppingCart size={18} color="#fff" />
            <Text style={styles.cartButtonText}>
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  errorText: { fontSize: 15, color: '#6B7280' },
  scroll: { flex: 1 },
  backWrapper: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  photoFallback: {
    height: 300,
    backgroundColor: '#2D6A4F',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
  },
  dotActive: {
    backgroundColor: '#2D6A4F',
    width: 18,
  },
  details: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  chipText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  chipGreen: { backgroundColor: '#DCFCE7' },
  chipTextGreen: { color: '#166534' },
  chipRed: { backgroundColor: '#FEE2E2' },
  chipTextRed: { color: '#991B1B' },
  chipYellow: { backgroundColor: '#FEF9C3' },
  chipTextYellow: { color: '#854D0E' },
  price: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
  },
  stepperSection: {
    gap: 8,
  },
  stepperLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnDisabled: {
    borderColor: '#F3F4F6',
  },
  stepperQty: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    minWidth: 32,
    textAlign: 'center',
  },
  maxStockNote: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    paddingBottom: 24,
  },
  stickyBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  totalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2D6A4F',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  cartButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
