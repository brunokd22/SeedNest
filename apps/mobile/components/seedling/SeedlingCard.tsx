import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { ShoppingCart } from 'lucide-react-native';
import { AvailabilityStatus, SeedlingSize } from '@seednest/shared';
import type { MobileSeedling } from '@/lib/hooks/useExplore';

const { width: screenWidth } = Dimensions.get('window');
const CARD_WIDTH = (screenWidth - 48) / 2;

interface SeedlingCardProps {
  seedling: MobileSeedling & { averageRating?: number };
  onPress: () => void;
  onAddToCart: () => void;
}

export function SeedlingCard({ seedling, onPress, onAddToCart }: SeedlingCardProps) {
  const isOutOfStock = seedling.availabilityStatus === AvailabilityStatus.OUT_OF_STOCK;

  return (
    <View style={[styles.card, { width: CARD_WIDTH }]}>
      {/* Photo */}
      <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
        <View style={styles.photoContainer}>
          {seedling.photos[0] ? (
            <Image
              source={{ uri: seedling.photos[0] }}
              style={styles.photo}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.photo, styles.photoFallback]} />
          )}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <Text style={styles.outOfStockLabel}>Out of Stock</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.content}>
        {/* Size chip */}
        <View style={styles.sizeChip}>
          <Text style={styles.sizeChipText}>
            {seedling.size === SeedlingSize.SMALL_POT ? 'Small Pot' : 'Big Pot'}
          </Text>
        </View>

        {/* Name */}
        <TouchableOpacity onPress={onPress}>
          <Text style={styles.name} numberOfLines={2}>
            {seedling.name}
          </Text>
        </TouchableOpacity>

        {/* Price */}
        <Text style={styles.price}>UGX {seedling.price.toLocaleString()}</Text>

        {/* Add to Cart */}
        <TouchableOpacity
          style={[styles.cartButton, isOutOfStock && styles.cartButtonDisabled]}
          onPress={onAddToCart}
          disabled={isOutOfStock}
          activeOpacity={0.8}
        >
          {!isOutOfStock && <ShoppingCart size={14} color="#fff" />}
          <Text style={[styles.cartButtonText, isOutOfStock && styles.cartButtonTextDisabled]}>
            {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  photoContainer: {
    position: 'relative',
    aspectRatio: 1,
    width: '100%',
  },
  photo: {
    aspectRatio: 1,
    width: '100%',
  },
  photoFallback: {
    backgroundColor: '#2D6A4F',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outOfStockLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    padding: 8,
    gap: 4,
  },
  sizeChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sizeChipText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  price: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#2D6A4F',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#2D6A4F',
    marginTop: 4,
  },
  cartButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cartButtonTextDisabled: {
    color: '#6B7280',
  },
});
