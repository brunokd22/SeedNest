import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Minus, Plus, X } from 'lucide-react-native';
import { api } from '@/lib/api';

const PRIMARY = '#2D6A4F';

type Nursery = { id: string; name: string; address: string };
type Customer = { id: string; name: string; email: string };
type Seedling = { id: string; name: string; size: string; price: number; quantity: number };
type CartItem = Seedling & { cartQty: number };

export default function WalkinSaleScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1
  const [selectedNursery, setSelectedNursery] = useState<Nursery | null>(null);

  // Step 2
  const [customerType, setCustomerType] = useState<'guest' | 'registered'>('guest');
  const [guestName, setGuestName] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearching, setCustomerSearching] = useState(false);
  const customerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 3
  const [seedlingSearch, setSeedlingSearch] = useState('');
  const [seedlingResults, setSeedlingResults] = useState<Seedling[]>([]);
  const [seedlingSearching, setSeedlingSearching] = useState(false);
  const [showSeedlingDropdown, setShowSeedlingDropdown] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [notes, setNotes] = useState('');
  const seedlingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Step 4
  const [submitting, setSubmitting] = useState(false);

  // Nurseries query
  const { data: nurseries, isLoading: nurseriesLoading } = useQuery({
    queryKey: ['manager-nurseries-mobile'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Nursery[] }>('/api/nurseries');
      return data.data;
    },
  });

  // Customer search debounce
  useEffect(() => {
    if (customerType !== 'registered' || customerSearch.length < 3) {
      setCustomerResults([]);
      return;
    }
    if (customerTimer.current) clearTimeout(customerTimer.current);
    customerTimer.current = setTimeout(async () => {
      setCustomerSearching(true);
      try {
        const { data } = await api.get<{ success: boolean; data: Customer[] }>(
          `/api/users/search?email=${encodeURIComponent(customerSearch)}`,
        );
        setCustomerResults(data.data);
      } catch { /* ignore */ }
      setCustomerSearching(false);
    }, 300);
  }, [customerSearch, customerType]);

  // Seedling search debounce
  useEffect(() => {
    if (!selectedNursery || seedlingSearch.length < 2) {
      setSeedlingResults([]);
      return;
    }
    if (seedlingTimer.current) clearTimeout(seedlingTimer.current);
    seedlingTimer.current = setTimeout(async () => {
      setSeedlingSearching(true);
      try {
        const { data } = await api.get<{ success: boolean; data: { data: Seedling[] } }>(
          `/api/nurseries/${selectedNursery.id}/seedlings?search=${encodeURIComponent(seedlingSearch)}&pageSize=10`,
        );
        setSeedlingResults(data.data.data ?? []);
        setShowSeedlingDropdown(true);
      } catch { /* ignore */ }
      setSeedlingSearching(false);
    }, 300);
  }, [seedlingSearch, selectedNursery]);

  const addToCart = (s: Seedling) => {
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === s.id);
      if (existing) return prev.map((i) => i.id === s.id ? { ...i, cartQty: Math.min(i.cartQty + 1, i.quantity) } : i);
      return [...prev, { ...s, cartQty: 1 }];
    });
    setSeedlingSearch('');
    setShowSeedlingDropdown(false);
  };

  const runningTotal = cartItems.reduce((s, i) => s + i.price * i.cartQty, 0);

  const handleSubmit = async () => {
    if (!selectedNursery || cartItems.length === 0) return;
    setSubmitting(true);
    try {
      await api.post('/api/orders/walkin', {
        nurseryId: selectedNursery.id,
        items: cartItems.map((i) => ({ seedlingId: i.id, quantity: i.cartQty })),
        guestName: customerType === 'guest' ? (guestName || undefined) : undefined,
        customerId: customerType === 'registered' ? selectedCustomer?.id : undefined,
        notes: notes || undefined,
      });
      Alert.alert('Success', 'Sale recorded successfully! 🎉', [
        { text: 'OK', onPress: () => router.replace('/manager/orders' as never) },
      ]);
    } catch (e) {
      Alert.alert('Error', (e as Error).message ?? 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = ['Nursery', 'Customer', 'Items', 'Review'];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        {[1, 2, 3, 4].map((s) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, step === s && styles.stepDotActive, step > s && styles.stepDotDone]}>
              <Text style={[styles.stepDotText, (step === s || step > s) && { color: '#fff' }]}>{s}</Text>
            </View>
            <Text style={[styles.stepLabel, step === s && styles.stepLabelActive]}>{stepLabels[s - 1]}</Text>
          </View>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Step 1: Select Nursery ────────────────────────────────────── */}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>Select Nursery</Text>
            {nurseriesLoading ? (
              <ActivityIndicator color={PRIMARY} />
            ) : (
              <View style={styles.nurseryList}>
                {(nurseries ?? []).map((n) => {
                  const active = selectedNursery?.id === n.id;
                  return (
                    <TouchableOpacity
                      key={n.id}
                      style={[styles.nurseryCard, active && styles.nurseryCardActive]}
                      onPress={() => setSelectedNursery(n)}
                    >
                      <Text style={[styles.nurseryCardName, active && { color: PRIMARY }]}>{n.name}</Text>
                      <Text style={styles.nurseryCardAddress}>{n.address}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
            <TouchableOpacity
              style={[styles.nextBtn, !selectedNursery && styles.nextBtnDisabled]}
              disabled={!selectedNursery}
              onPress={() => setStep(2)}
            >
              <Text style={styles.nextBtnText}>Next →</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ── Step 2: Customer ─────────────────────────────────────────── */}
        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Customer (Optional)</Text>
            <View style={styles.radioGroup}>
              {(['guest', 'registered'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[styles.radioCard, customerType === type && styles.radioCardActive]}
                  onPress={() => setCustomerType(type)}
                >
                  <Text style={[styles.radioText, customerType === type && { color: PRIMARY }]}>
                    {type === 'guest' ? '👤 Guest' : '🔍 Registered Customer'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {customerType === 'guest' && (
              <TextInput
                style={styles.input}
                placeholder="Guest name (optional)"
                value={guestName}
                onChangeText={setGuestName}
              />
            )}

            {customerType === 'registered' && (
              <View>
                {selectedCustomer ? (
                  <View style={styles.selectedChip}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.chipName}>{selectedCustomer.name}</Text>
                      <Text style={styles.chipEmail}>{selectedCustomer.email}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedCustomer(null)}>
                      <X size={18} color="#9CA3AF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <TextInput
                      style={styles.input}
                      placeholder="Search by email (min 3 chars)…"
                      value={customerSearch}
                      onChangeText={setCustomerSearch}
                      autoCapitalize="none"
                    />
                    {customerSearching && <ActivityIndicator color={PRIMARY} style={{ marginTop: 8 }} />}
                    {customerResults.map((c) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.resultRow}
                        onPress={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerResults([]); }}
                      >
                        <Text style={styles.resultName}>{c.name}</Text>
                        <Text style={styles.resultEmail}>{c.email}</Text>
                      </TouchableOpacity>
                    ))}
                  </>
                )}
              </View>
            )}

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(1)}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(3)}>
                <Text style={styles.nextBtnText}>Next →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Step 3: Add Seedlings ─────────────────────────────────────── */}
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Add Seedlings</Text>
            <View style={{ position: 'relative' }}>
              <TextInput
                style={styles.input}
                placeholder="Search seedlings…"
                value={seedlingSearch}
                onChangeText={(t) => { setSeedlingSearch(t); setShowSeedlingDropdown(true); }}
              />
              {seedlingSearching && <ActivityIndicator color={PRIMARY} style={{ position: 'absolute', right: 12, top: 12 }} />}
              {showSeedlingDropdown && seedlingResults.length > 0 && (
                <View style={styles.dropdown}>
                  {seedlingResults.map((s) => (
                    <TouchableOpacity key={s.id} style={styles.dropdownRow} onPress={() => addToCart(s)}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dropdownName}>{s.name}</Text>
                        <Text style={styles.dropdownMeta}>{s.size === 'SMALL_POT' ? 'Small Pot' : 'Big Pot'} · UGX {s.price.toLocaleString()} · Qty: {s.quantity}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Cart items */}
            {cartItems.map((item) => (
              <View key={item.id} style={styles.cartRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cartName}>{item.name}</Text>
                  <Text style={styles.cartPrice}>UGX {item.price.toLocaleString()}</Text>
                </View>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepBtn} disabled={item.cartQty <= 1} onPress={() => setCartItems((p) => p.map((i) => i.id === item.id ? { ...i, cartQty: i.cartQty - 1 } : i))}>
                    <Minus size={14} color={item.cartQty <= 1 ? '#D1D5DB' : '#374151'} />
                  </TouchableOpacity>
                  <Text style={styles.stepQty}>{item.cartQty}</Text>
                  <TouchableOpacity style={styles.stepBtn} disabled={item.cartQty >= item.quantity} onPress={() => setCartItems((p) => p.map((i) => i.id === item.id ? { ...i, cartQty: Math.min(i.cartQty + 1, i.quantity) } : i))}>
                    <Plus size={14} color="#374151" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.cartSubtotal}>UGX {(item.price * item.cartQty).toLocaleString()}</Text>
                <TouchableOpacity onPress={() => setCartItems((p) => p.filter((i) => i.id !== item.id))}>
                  <X size={18} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            ))}

            {cartItems.length > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>UGX {runningTotal.toLocaleString()}</Text>
              </View>
            )}

            <TextInput
              style={[styles.input, { minHeight: 64, textAlignVertical: 'top' }]}
              placeholder="Notes (optional)"
              multiline
              value={notes}
              onChangeText={setNotes}
            />

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(2)}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.nextBtn, cartItems.length === 0 && styles.nextBtnDisabled]}
                disabled={cartItems.length === 0}
                onPress={() => setStep(4)}
              >
                <Text style={styles.nextBtnText}>Review →</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── Step 4: Review + Confirm ─────────────────────────────────── */}
        {step === 4 && (
          <>
            <Text style={styles.stepTitle}>Review & Confirm</Text>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Nursery</Text>
              <Text style={styles.reviewValue}>{selectedNursery?.name}</Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Customer</Text>
              <Text style={styles.reviewValue}>
                {customerType === 'registered' && selectedCustomer
                  ? selectedCustomer.name
                  : guestName
                  ? `Walk-in Guest: ${guestName}`
                  : 'Anonymous Walk-in'}
              </Text>
            </View>

            <View style={styles.reviewCard}>
              <Text style={styles.reviewLabel}>Items</Text>
              {cartItems.map((i) => (
                <View key={i.id} style={styles.reviewItemRow}>
                  <Text style={styles.reviewItemName}>{i.name} × {i.cartQty}</Text>
                  <Text style={styles.reviewItemAmount}>UGX {(i.price * i.cartQty).toLocaleString()}</Text>
                </View>
              ))}
              <View style={[styles.reviewItemRow, { marginTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 8 }]}>
                <Text style={{ fontWeight: '700', color: '#111827' }}>Total</Text>
                <Text style={{ fontWeight: '700', color: PRIMARY }}>UGX {runningTotal.toLocaleString()}</Text>
              </View>
            </View>

            <View style={styles.navRow}>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep(3)}>
                <Text style={styles.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.nextBtnDisabled]}
                disabled={submitting}
                onPress={handleSubmit}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitBtnText}>Submit Sale</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  stepIndicator: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 20, gap: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  stepItem: { alignItems: 'center', gap: 4 },
  stepDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  stepDotActive: { backgroundColor: PRIMARY, borderColor: PRIMARY },
  stepDotDone: { backgroundColor: '#86EFAC', borderColor: '#86EFAC' },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#9CA3AF' },
  stepLabel: { fontSize: 11, color: '#9CA3AF', fontWeight: '500' },
  stepLabelActive: { color: PRIMARY, fontWeight: '700' },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  stepTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  nurseryList: { gap: 8 },
  nurseryCard: { padding: 14, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  nurseryCardActive: { borderColor: PRIMARY, backgroundColor: '#F0FDF4' },
  nurseryCardName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  nurseryCardAddress: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 14, color: '#374151', backgroundColor: '#fff' },
  radioGroup: { flexDirection: 'row', gap: 10 },
  radioCard: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#fff' },
  radioCardActive: { borderColor: PRIMARY, backgroundColor: '#F0FDF4' },
  radioText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  selectedChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderRadius: 10, padding: 12, gap: 10 },
  chipName: { fontSize: 14, fontWeight: '600', color: PRIMARY },
  chipEmail: { fontSize: 12, color: '#6B7280' },
  resultRow: { padding: 12, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB', marginTop: 4 },
  resultName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  resultEmail: { fontSize: 12, color: '#9CA3AF' },
  dropdown: { position: 'absolute', top: 52, left: 0, right: 0, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', zIndex: 99, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  dropdownRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dropdownName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  dropdownMeta: { fontSize: 12, color: '#9CA3AF' },
  cartRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cartName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  cartPrice: { fontSize: 12, color: '#9CA3AF' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  stepQty: { fontSize: 14, fontWeight: '600', color: '#111827', minWidth: 20, textAlign: 'center' },
  cartSubtotal: { fontSize: 13, fontWeight: '600', color: PRIMARY },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#111827' },
  totalValue: { fontSize: 15, fontWeight: '700', color: PRIMARY },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  backBtn: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 14, alignItems: 'center' },
  backBtnText: { color: '#6B7280', fontWeight: '600', fontSize: 15 },
  nextBtn: { flex: 2, backgroundColor: PRIMARY, borderRadius: 10, padding: 14, alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: '#D1D5DB' },
  nextBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  submitBtn: { flex: 2, backgroundColor: PRIMARY, borderRadius: 10, padding: 14, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', padding: 14, gap: 6 },
  reviewLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase' },
  reviewValue: { fontSize: 15, fontWeight: '600', color: '#111827' },
  reviewItemRow: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewItemName: { fontSize: 14, color: '#374151' },
  reviewItemAmount: { fontSize: 14, color: '#374151', fontWeight: '500' },
});
