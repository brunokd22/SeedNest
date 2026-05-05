import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Clock } from 'lucide-react-native';
import type { ExploreNursery } from '@/lib/hooks/useExplore';

interface NurseryCardProps {
  nursery: ExploreNursery;
  onPress: () => void;
}

export function NurseryCard({ nursery, onPress }: NurseryCardProps) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
      {/* Cover image */}
      <View style={styles.imageContainer}>
        {nursery.coverImageUrl ? (
          <Image
            source={{ uri: nursery.coverImageUrl }}
            style={styles.image}
            contentFit="cover"
          />
        ) : (
          <View style={styles.imageFallback} />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Name + distance */}
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {nursery.name}
          </Text>
          {nursery.distanceKm != null && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>
                {nursery.distanceKm.toFixed(1)} km
              </Text>
            </View>
          )}
        </View>

        {/* Address */}
        <View style={styles.row}>
          <MapPin size={12} color="#9CA3AF" />
          <Text style={styles.mutedText} numberOfLines={1}>
            {nursery.address}
          </Text>
        </View>

        {/* Operating hours */}
        {nursery.operatingHours && (
          <View style={styles.row}>
            <Clock size={10} color="#9CA3AF" />
            <Text style={styles.smallText}>{nursery.operatingHours}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  imageContainer: {
    height: 140,
    width: '100%',
  },
  image: {
    height: 140,
    width: '100%',
  },
  imageFallback: {
    height: 140,
    width: '100%',
    backgroundColor: '#2D6A4F',
  },
  content: {
    padding: 12,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  distanceBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  distanceText: {
    color: '#2D6A4F',
    fontSize: 11,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mutedText: {
    fontSize: 12,
    color: '#6B7280',
    flex: 1,
  },
  smallText: {
    fontSize: 11,
    color: '#6B7280',
  },
});
