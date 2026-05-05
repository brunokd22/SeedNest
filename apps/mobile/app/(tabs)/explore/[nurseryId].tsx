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
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Clock, Leaf, MapPin } from 'lucide-react-native';
import { SeedlingCard } from '@/components/seedling/SeedlingCard';
import { EmptyState } from '@/components/common/EmptyState';
import { usePublicNursery, usePublicSeedlings } from '@/lib/hooks/useExplore';
import { useCategoriesByNursery } from '@/lib/hooks/useCategories';
import { useCartStore } from '@/store/cart-store';

export default function NurseryDetailScreen() {
  const { nurseryId } = useLocalSearchParams<{ nurseryId: string }>();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const { data: nursery, isLoading: nurseryLoading } = usePublicNursery(nurseryId);
  const { data: categories } = useCategoriesByNursery(nurseryId);
  const {
    data: seedlingsResult,
    isLoading: seedlingsLoading,
    refetch,
    isRefetching,
  } = usePublicSeedlings(nurseryId, {
    categoryId: selectedCategoryId || undefined,
    pageSize: 50,
  });

  const seedlings = seedlingsResult?.data ?? [];

  if (nurseryLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#2D6A4F" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={seedlings}
        numColumns={2}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#2D6A4F"
          />
        }
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.columnWrapper}
        ListHeaderComponent={
          <>
            {/* Hero image */}
            <View style={styles.heroContainer}>
              {nursery?.coverImageUrl ? (
                <Image
                  source={{ uri: nursery.coverImageUrl }}
                  style={styles.heroImage}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.heroImage, styles.heroFallback]} />
              )}
              {/* Back button */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <ChevronLeft size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            {/* Nursery info */}
            <View style={styles.infoSection}>
              <Text style={styles.nurseryName}>{nursery?.name}</Text>
              {nursery?.address && (
                <View style={styles.row}>
                  <MapPin size={14} color="#9CA3AF" />
                  <Text style={styles.mutedText}>{nursery.address}</Text>
                </View>
              )}
              {nursery?.operatingHours && (
                <View style={styles.row}>
                  <Clock size={14} color="#9CA3AF" />
                  <Text style={styles.mutedText}>{nursery.operatingHours}</Text>
                </View>
              )}
              {nursery?.description && (
                <Text style={styles.description}>{nursery.description}</Text>
              )}
            </View>

            {/* Category chips */}
            {categories && categories.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsContainer}
              >
                {[{ id: '', name: 'All' }, ...categories].map((cat) => {
                  const active = selectedCategoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSelectedCategoryId(cat.id)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* Section heading */}
            <Text style={styles.sectionHeading}>Seedlings</Text>

            {seedlingsLoading && (
              <ActivityIndicator color="#2D6A4F" style={{ marginVertical: 24 }} />
            )}
          </>
        }
        ListEmptyComponent={
          seedlingsLoading ? null : (
            <EmptyState
              icon={Leaf}
              title="No seedlings found"
              description="No seedlings are available in this category."
            />
          )
        }
        renderItem={({ item }) => (
          <SeedlingCard
            seedling={item}
            onPress={() =>
              router.push({
                pathname: '/(tabs)/explore/seedling/[seedlingId]' as never,
                params: { seedlingId: item.id, nurseryId },
              })
            }
            onAddToCart={() => {
              addItem({
                seedlingId: item.id,
                name: item.name,
                price: item.price,
                nurseryId,
                nurseryName: nursery?.name ?? '',
                photo: item.photos[0] ?? null,
                size: item.size,
              });
            }}
          />
        )}
      />
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
  heroContainer: {
    position: 'relative',
  },
  heroImage: {
    height: 200,
    width: '100%',
  },
  heroFallback: {
    backgroundColor: '#2D6A4F',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
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
  infoSection: {
    padding: 16,
    gap: 6,
  },
  nurseryName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mutedText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 20,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  chipActive: {
    backgroundColor: '#1B4332',
    borderColor: '#1B4332',
  },
  chipText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 24,
  },
  columnWrapper: {
    gap: 8,
    marginBottom: 8,
  },
});
