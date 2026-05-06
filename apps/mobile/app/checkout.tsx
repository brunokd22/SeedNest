import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useStripe } from '@stripe/stripe-react-native';
import { useCartStore } from '@/store/cart-store';
import { useAuthStore } from '@/store/auth-store';
import { getToken } from '@/lib/auth';

const PRIMARY = '#2D6A4F';
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
const DELIVERY_FEE = 5000;

export default function CheckoutScreen() {
  const router = useRouter();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const items = useCartStore((s) => s.items);
  const fulfillmentType = useCartStore((s) => s.fulfillmentType);
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);

  // Derive nurseryId from cart (use first nurseryId)
  const nurseryId = items[0]?.nurseryId ?? '';

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = fulfillmentType === 'DELIVERY' ? DELIVERY_FEE : 0;
  const displayTotal = subtotal + deliveryFee;

  // Init PaymentSheet on mount
  useEffect(() => {
    if (!nurseryId || !items.length) return;
    initSheet();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initSheet = async () => {
    setIsInitializing(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/api/checkout/create-payment-intent`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token ?? ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nurseryId,
          items: items.map((i) => ({ seedlingId: i.seedlingId, quantity: i.quantity })),
          fulfillmentType,
          deliveryAddress: deliveryAddress || undefined,
        }),
      });
      const json = await res.json();

      if (!json.success) throw new Error(json.error ?? 'Could not create payment');

      const clientSecret: string = json.data.clientSecret;
      setTotalAmount(json.data.orderSummary?.reduce(
        (s: number, i: { subtotal: number }) => s + i.subtotal, 0,
      ) ?? subtotal);

      const { error: initError } = await initPaymentSheet({
        merchantDisplayName: 'SeedNest',
        paymentIntentClientSecret: clientSecret,
        defaultBillingDetails: { name: user?.name ?? '' },
      });

      if (initError) throw new Error(initError.message);
      setPaymentReady(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleUseMyLocation = async () => {
    setIsGeoLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Please enable location access in settings.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${loc.coords.latitude}&lon=${loc.coords.longitude}&format=json`,
      );
      const data = await res.json();
      setDeliveryAddress(data.display_name ?? `${loc.coords.latitude}, ${loc.coords.longitude}`);
    } catch {
      Alert.alert('Error', 'Could not get your location.');
    } finally {
      setIsGeoLoading(false);
    }
  };

  const handlePay = async () => {
    if (fulfillmentType === 'DELIVERY' && !deliveryAddress.trim()) {
      Alert.alert('Address required', 'Please enter your delivery address.');
      return;
    }
    setIsPaying(true);
    setError(null);
    const { error: payError } = await presentPaymentSheet();
    if (payError) {
      setError(payError.message);
      setIsPaying(false);
    } else {
      clearCart();
      router.replace({
        pathname: '/order-confirmation',
        params: { orderId: createdOrderId ?? '' },
      } as never);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Order summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          {items.map((item) => (
            <View key={item.seedlingId} style={styles.summaryRow}>
              <Text style={styles.summaryName} numberOfLines={1}>
                {item.name} × {item.quantity}
              </Text>
              <Text style={styles.summaryAmount}>
                UGX {(item.price * item.quantity).toLocaleString()}
              </Text>
            </View>
          ))}
          {deliveryFee > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryMuted}>Delivery fee</Text>
              <Text style={styles.summaryMuted}>UGX {deliveryFee.toLocaleString()}</Text>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>UGX {displayTotal.toLocaleString()}</Text>
          </View>
        </View>

        {/* Delivery address */}
        {fulfillmentType === 'DELIVERY' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Address</Text>
            <TextInput
              style={styles.addressInput}
              placeholder="Enter your full delivery address"
              multiline
              numberOfLines={3}
              value={deliveryAddress}
              onChangeText={setDeliveryAddress}
            />
            <TouchableOpacity
              style={styles.locationBtn}
              onPress={handleUseMyLocation}
              disabled={isGeoLoading}
            >
              {isGeoLoading ? (
                <ActivityIndicator size="small" color={PRIMARY} />
              ) : (
                <Text style={styles.locationBtnText}>📍 Use My Location</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Payment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 Payment</Text>
          {isInitializing ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={PRIMARY} />
              <Text style={styles.loadingText}>Preparing payment…</Text>
            </View>
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={initSheet}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.readyText}>✓ Payment ready</Text>
          )}
        </View>

        {/* Pay button */}
        <TouchableOpacity
          style={[styles.payBtn, (!paymentReady || isPaying) && styles.payBtnDisabled]}
          onPress={handlePay}
          disabled={!paymentReady || isPaying}
        >
          {isPaying ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.payBtnText}>Pay UGX {displayTotal.toLocaleString()}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryName: { flex: 1, fontSize: 13, color: '#374151', marginRight: 8 },
  summaryAmount: { fontSize: 13, color: '#374151', fontWeight: '500' },
  summaryMuted: { fontSize: 13, color: '#9CA3AF' },
  totalRow: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10, marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: 'bold', color: '#111827' },
  totalValue: { fontSize: 15, fontWeight: 'bold', color: PRIMARY },
  addressInput: {
    borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8,
    padding: 12, fontSize: 14, color: '#374151', minHeight: 80, textAlignVertical: 'top',
  },
  locationBtn: {
    borderWidth: 1, borderColor: PRIMARY, borderRadius: 8,
    padding: 10, alignItems: 'center',
  },
  locationBtnText: { color: PRIMARY, fontWeight: '600', fontSize: 14 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  loadingText: { color: '#6B7280', fontSize: 14 },
  errorBox: { backgroundColor: '#FEE2E2', borderRadius: 8, padding: 12, gap: 8 },
  errorText: { color: '#991B1B', fontSize: 13 },
  retryText: { color: PRIMARY, fontWeight: '600', fontSize: 13 },
  readyText: { color: '#166534', fontWeight: '500', fontSize: 14 },
  payBtn: {
    backgroundColor: PRIMARY, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8,
  },
  payBtnDisabled: { backgroundColor: '#D1D5DB' },
  payBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
