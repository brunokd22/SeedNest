import { useEffect, useState } from 'react';
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
import MapView, { Callout, Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { List, Map } from 'lucide-react-native';
import { NurseryCard } from '@/components/nursery/NurseryCard';
import { useNurseriesExplore } from '@/lib/hooks/useExplore';

type LocationStatus = 'idle' | 'loading' | 'granted' | 'denied';

export default function ExploreScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

  const {
    data: nurseries,
    isLoading,
    refetch,
    isRefetching,
  } = useNurseriesExplore(location?.lat, location?.lng);

  // Request location on mount
  useEffect(() => {
    (async () => {
      setLocationStatus('loading');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setLocationStatus('granted');
      } else {
        setLocationStatus('denied');
      }
    })();
  }, []);

  const navigateToNursery = (nurseryId: string) =>
    router.push(`/(tabs)/explore/${nurseryId}` as never);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Toggle bar */}
      <View style={styles.toggleBar}>
        <Text style={styles.headerTitle}>Explore Nurseries</Text>
        <View style={styles.toggleGroup}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
            onPress={() => setViewMode('map')}
          >
            <Map size={16} color={viewMode === 'map' ? '#fff' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
          >
            <List size={16} color={viewMode === 'list' ? '#fff' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      </View>

      {isLoading && locationStatus === 'loading' ? (
        <ActivityIndicator size="large" color="#2D6A4F" style={styles.loader} />
      ) : viewMode === 'map' ? (
        <View style={styles.flex}>
          {/* Map */}
          <MapView
            style={styles.flex}
            initialRegion={{
              latitude: location?.lat ?? 0.3476,
              longitude: location?.lng ?? 32.5825,
              latitudeDelta: 1.0,
              longitudeDelta: 1.0,
            }}
            showsUserLocation={locationStatus === 'granted'}
          >
            {nurseries?.map(
              (nursery) =>
                nursery.latitude != null &&
                nursery.longitude != null && (
                  <Marker
                    key={nursery.id}
                    coordinate={{
                      latitude: nursery.latitude,
                      longitude: nursery.longitude,
                    }}
                    pinColor="#2D6A4F"
                    onPress={() => navigateToNursery(nursery.id)}
                  >
                    <Callout tooltip>
                      <View style={styles.callout}>
                        <Text style={styles.calloutTitle}>{nursery.name}</Text>
                        {nursery.distanceKm != null && (
                          <Text style={styles.calloutDist}>
                            {nursery.distanceKm.toFixed(1)} km away
                          </Text>
                        )}
                      </View>
                    </Callout>
                  </Marker>
                ),
            )}
          </MapView>

          {/* Bottom horizontal nursery list */}
          {nurseries && nurseries.length > 0 && (
            <View style={styles.bottomSheet}>
              <FlatList
                data={nurseries}
                horizontal
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bottomSheetContent}
                renderItem={({ item }) => (
                  <View style={styles.bottomCardWrapper}>
                    <NurseryCard
                      nursery={item}
                      onPress={() => navigateToNursery(item.id)}
                    />
                  </View>
                )}
              />
            </View>
          )}
        </View>
      ) : (
        // List view
        <FlatList
          data={nurseries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#2D6A4F"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No nurseries found</Text>
            </View>
          }
          renderItem={({ item }) => (
            <NurseryCard nursery={item} onPress={() => navigateToNursery(item.id)} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  flex: {
    flex: 1,
  },
  toggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  toggleGroup: {
    flexDirection: 'row',
    gap: 4,
  },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toggleBtnActive: {
    backgroundColor: '#2D6A4F',
    borderColor: '#2D6A4F',
  },
  loader: {
    flex: 1,
  },
  bottomSheet: {
    height: 220,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  bottomSheetContent: {
    padding: 12,
    gap: 12,
  },
  bottomCardWrapper: {
    width: 240,
  },
  listContent: {
    padding: 16,
  },
  callout: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  calloutDist: {
    fontSize: 11,
    color: '#2D6A4F',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 64,
  },
  emptyText: {
    fontSize: 15,
    color: '#6B7280',
  },
});
