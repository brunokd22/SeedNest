import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  AlertTriangle,
  HelpCircle,
  MessageSquare,
  RefreshCw,
} from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const PRIMARY = '#2D6A4F';

type Order = {
  id: string;
  createdAt: string;
  totalAmount: number;
  nursery: { id: string; name: string };
};

type IssueType = 'REPLACEMENT_REQUEST' | 'QUERY' | 'COMPLAINT' | 'GENERAL_REQUEST';

const ISSUE_TYPES: { value: IssueType; label: string; Icon: React.ElementType }[] = [
  { value: 'REPLACEMENT_REQUEST', label: 'Replacement', Icon: RefreshCw },
  { value: 'QUERY', label: 'Query', Icon: HelpCircle },
  { value: 'COMPLAINT', label: 'Complaint', Icon: AlertTriangle },
  { value: 'GENERAL_REQUEST', label: 'General', Icon: MessageSquare },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NewIssueScreen() {
  const router = useRouter();
  const qc = useQueryClient();

  const [selectedNurseryId, setSelectedNurseryId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['mobile-my-orders-new-issue'],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: { data: Order[] } }>(
        '/api/my-orders?pageSize=20',
      );
      return data.data.data;
    },
  });

  const nurseries = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of orders) {
      if (!map.has(o.nursery.id)) map.set(o.nursery.id, o.nursery.name);
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [orders]);

  const nurseryOrders = useMemo(
    () => orders.filter((o) => o.nursery.id === selectedNurseryId),
    [orders, selectedNurseryId],
  );

  const isValid =
    !!selectedNurseryId &&
    !!issueType &&
    title.trim().length >= 5 &&
    description.trim().length >= 20;

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ success: boolean; data: { id: string } }>(
        '/api/my-issues',
        {
          nurseryId: selectedNurseryId,
          orderId: selectedOrderId ?? undefined,
          type: issueType,
          title: title.trim(),
          description: description.trim(),
        },
      );
      return data.data;
    },
    onSuccess: (issue) => {
      qc.invalidateQueries({ queryKey: ['mobile-issues'] });
      Alert.alert('Submitted!', "Issue submitted! We'll notify the nursery.", [
        {
          text: 'OK',
          onPress: () => router.replace(`/(tabs)/issues/${issue.id}` as never),
        },
      ]);
    },
    onError: () => {
      Alert.alert('Error', 'Failed to submit issue. Please try again.');
    },
  });

  const handleNurserySelect = (id: string) => {
    if (selectedNurseryId === id) return;
    setSelectedNurseryId(id);
    setSelectedOrderId(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.pageTitle}>Raise an Issue</Text>

          {/* 1. Select Nursery */}
          <View style={styles.section}>
            <Text style={styles.label}>Select Nursery *</Text>
            {loadingOrders ? (
              <ActivityIndicator color={PRIMARY} />
            ) : nurseries.length === 0 ? (
              <Text style={styles.hint}>You have no orders to link an issue to.</Text>
            ) : (
              nurseries.map((n) => (
                <TouchableOpacity
                  key={n.id}
                  style={[
                    styles.nurseryRow,
                    selectedNurseryId === n.id && styles.nurseryRowActive,
                  ]}
                  onPress={() => handleNurserySelect(n.id)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.nurseryRowText,
                      selectedNurseryId === n.id && styles.nurseryRowTextActive,
                    ]}
                  >
                    {n.name}
                  </Text>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* 2. Link Order (optional) */}
          {selectedNurseryId && nurseryOrders.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>Link an Order (optional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.orderRow}>
                  {nurseryOrders.map((o) => (
                    <TouchableOpacity
                      key={o.id}
                      style={[
                        styles.orderCard,
                        selectedOrderId === o.id && styles.orderCardActive,
                      ]}
                      onPress={() =>
                        setSelectedOrderId(selectedOrderId === o.id ? null : o.id)
                      }
                      activeOpacity={0.75}
                    >
                      <Text style={styles.orderCardId}>
                        #{o.id.slice(-6).toUpperCase()}
                      </Text>
                      <Text style={styles.orderCardDate}>{formatDate(o.createdAt)}</Text>
                      <Text style={styles.orderCardAmount}>
                        UGX {o.totalAmount.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          )}

          {/* 3. Issue Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Issue Type *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeRow}>
                {ISSUE_TYPES.map(({ value, label, Icon }) => {
                  const selected = issueType === value;
                  return (
                    <TouchableOpacity
                      key={value}
                      style={[styles.typeCard, selected && styles.typeCardActive]}
                      onPress={() => setIssueType(value)}
                      activeOpacity={0.75}
                    >
                      <Icon
                        size={22}
                        color={selected ? PRIMARY : '#6B7280'}
                      />
                      <Text
                        style={[styles.typeCardLabel, selected && styles.typeCardLabelActive]}
                      >
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* 4. Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              placeholder="Brief summary..."
              placeholderTextColor="#9CA3AF"
              value={title}
              onChangeText={setTitle}
              maxLength={200}
            />
            <Text style={styles.charCount}>{title.length} / 200</Text>
          </View>

          {/* 5. Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Describe your issue in detail..."
              placeholderTextColor="#9CA3AF"
              value={description}
              onChangeText={setDescription}
              multiline
              maxLength={2000}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{description.length} / 2000</Text>
          </View>

          {/* Validation hints */}
          {title.length > 0 && title.trim().length < 5 && (
            <Text style={styles.validationHint}>Title must be at least 5 characters.</Text>
          )}
          {description.length > 0 && description.trim().length < 20 && (
            <Text style={styles.validationHint}>Description must be at least 20 characters.</Text>
          )}

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !isValid && styles.submitBtnDisabled]}
            onPress={() => submitMutation.mutate()}
            disabled={!isValid || submitMutation.isPending}
            activeOpacity={0.85}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Issue</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  scroll: { padding: 16, gap: 4, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 12 },
  section: { gap: 6, marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '700', color: '#374151', textTransform: 'uppercase', letterSpacing: 0.4 },
  hint: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  nurseryRow: {
    padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  nurseryRowActive: { borderColor: PRIMARY, backgroundColor: '#F0FDF4' },
  nurseryRowText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  nurseryRowTextActive: { color: PRIMARY, fontWeight: '700' },
  orderRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  orderCard: {
    width: 130, padding: 12, borderRadius: 10, borderWidth: 1.5,
    borderColor: '#E5E7EB', backgroundColor: '#fff', gap: 4,
  },
  orderCardActive: { borderColor: PRIMARY, backgroundColor: '#F0FDF4' },
  orderCardId: { fontSize: 13, fontWeight: '700', color: '#111827' },
  orderCardDate: { fontSize: 11, color: '#9CA3AF' },
  orderCardAmount: { fontSize: 12, fontWeight: '600', color: '#2D6A4F' },
  typeRow: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  typeCard: {
    width: 90, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff', gap: 6,
  },
  typeCardActive: { borderColor: PRIMARY, backgroundColor: '#F0FDF4' },
  typeCardLabel: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  typeCardLabelActive: { color: PRIMARY },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 10, padding: 12, fontSize: 15, color: '#111827',
  },
  inputMultiline: { minHeight: 100, paddingTop: 12 },
  charCount: { fontSize: 11, color: '#9CA3AF', textAlign: 'right' },
  validationHint: { fontSize: 12, color: '#DC2626', marginTop: -8, marginBottom: 4 },
  submitBtn: {
    backgroundColor: PRIMARY, borderRadius: 12, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: '#A7C4B6' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
