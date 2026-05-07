import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { RotateCcw, Send } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';

const PRIMARY = '#2D6A4F';

type Author = { id: string; name: string; role: string };
type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: Author;
  isPending?: boolean;
};
type Issue = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  nursery: { name: string };
  comments: Comment[];
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  OPEN: { bg: '#FEE2E2', text: '#991B1B' },
  IN_PROGRESS: { bg: '#DBEAFE', text: '#1D4ED8' },
  RESOLVED: { bg: '#DCFCE7', text: '#166534' },
  CLOSED: { bg: '#F3F4F6', text: '#374151' },
};

export default function IssueDetailScreen() {
  const { issueId } = useLocalSearchParams<{ issueId: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [replyText, setReplyText] = useState('');
  const [optimisticComments, setOptimisticComments] = useState<Comment[]>([]);

  const { data: issue, isLoading } = useQuery({
    queryKey: ['mobile-issue', issueId],
    queryFn: async () => {
      const { data } = await api.get<{ success: boolean; data: Issue }>(
        `/api/my-issues/${issueId}`,
      );
      return data.data;
    },
    enabled: !!issueId,
  });

  const reopenMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/api/my-issues/${issueId}/reopen`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mobile-issue', issueId] });
      qc.invalidateQueries({ queryKey: ['mobile-issues'] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to reopen issue.');
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (body: string) => {
      const { data } = await api.post<{ success: boolean; data: Comment }>(
        `/api/my-issues/${issueId}/comments`,
        { body },
      );
      return data.data;
    },
    onMutate: (body) => {
      const temp: Comment = {
        id: `temp-${Date.now()}`,
        body,
        createdAt: new Date().toISOString(),
        author: { id: user?.id ?? '', name: user?.name ?? 'You', role: 'CUSTOMER' },
        isPending: true,
      };
      setOptimisticComments((prev) => [temp, ...prev]);
      return { tempId: temp.id };
    },
    onSuccess: (_data, _vars, context) => {
      setOptimisticComments((prev) => prev.filter((c) => c.id !== context?.tempId));
      qc.invalidateQueries({ queryKey: ['mobile-issue', issueId] });
    },
    onError: (_err, _vars, context) => {
      setOptimisticComments((prev) => prev.filter((c) => c.id !== context?.tempId));
      Alert.alert('Error', 'Failed to send reply. Please try again.');
    },
  });

  const handleSend = useCallback(() => {
    const body = replyText.trim();
    if (!body || commentMutation.isPending) return;
    setReplyText('');
    commentMutation.mutate(body);
  }, [replyText, commentMutation]);

  if (isLoading || !issue) {
    return (
      <SafeAreaView style={styles.centered} edges={['top']}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </SafeAreaView>
    );
  }

  const isClosed = issue.status === 'CLOSED';
  const isResolved = issue.status === 'RESOLVED';
  const statusStyle = STATUS_COLORS[issue.status] ?? STATUS_COLORS.CLOSED;

  const allComments: Comment[] = [...optimisticComments, ...issue.comments];
  const displayComments = [...allComments].reverse();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen
        options={{
          title: issue.title.length > 30 ? issue.title.slice(0, 30) + '…' : issue.title,
          headerRight: isResolved
            ? () => (
                <TouchableOpacity
                  onPress={() => reopenMutation.mutate()}
                  disabled={reopenMutation.isPending}
                  style={{ paddingRight: 4 }}
                >
                  {reopenMutation.isPending ? (
                    <ActivityIndicator size="small" color={PRIMARY} />
                  ) : (
                    <RotateCcw size={20} color={PRIMARY} />
                  )}
                </TouchableOpacity>
              )
            : undefined,
          headerShown: true,
        }}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        {/* Description card */}
        <View style={styles.descCard}>
          <View style={styles.descHeader}>
            <Text style={styles.descLabel}>ISSUE DESCRIPTION</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.statusText, { color: statusStyle.text }]}>
                {issue.status.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>
          <Text style={styles.descText}>{issue.description}</Text>
          <Text style={styles.nurseryText}>{issue.nursery.name}</Text>
        </View>

        {/* Closed banner */}
        {isClosed && (
          <View style={styles.closedBanner}>
            <Text style={styles.closedBannerText}>
              This issue is closed and cannot be replied to.
            </Text>
          </View>
        )}

        {/* Comments */}
        <FlatList
          data={displayComments}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={styles.commentList}
          ListEmptyComponent={
            <View style={styles.emptyComments}>
              <Text style={styles.emptyCommentsText}>No replies yet.</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isCustomer = item.author.role === 'CUSTOMER';
            return (
              <View
                style={[
                  styles.bubbleWrapper,
                  isCustomer ? styles.bubbleRight : styles.bubbleLeft,
                  item.isPending && { opacity: 0.6 },
                ]}
              >
                {!isCustomer && (
                  <Text style={[styles.authorName, styles.authorLeft]}>
                    {item.author.name}
                  </Text>
                )}
                {isCustomer && (
                  <Text style={[styles.authorName, styles.authorRight]}>
                    {item.author.name}
                  </Text>
                )}
                <View
                  style={[
                    styles.bubble,
                    isCustomer ? styles.bubbleCustomer : styles.bubbleManager,
                  ]}
                >
                  <Text style={styles.bubbleText}>{item.body}</Text>
                </View>
                <Text
                  style={[
                    styles.timestamp,
                    isCustomer ? styles.timestampRight : styles.timestampLeft,
                  ]}
                >
                  {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                </Text>
              </View>
            );
          }}
        />

        {/* Reply bar */}
        <View style={styles.replyBar}>
          <TextInput
            style={styles.replyInput}
            placeholder={isClosed ? 'Issue is closed' : 'Write a reply...'}
            placeholderTextColor="#9CA3AF"
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={2000}
            editable={!isClosed}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!replyText.trim() || commentMutation.isPending || isClosed}
            activeOpacity={0.7}
          >
            {commentMutation.isPending ? (
              <ActivityIndicator size="small" color={PRIMARY} />
            ) : (
              <Send
                size={24}
                color={replyText.trim() && !isClosed ? PRIMARY : '#D1D5DB'}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB' },
  descCard: {
    backgroundColor: '#F3F4F6', margin: 12, borderRadius: 12, padding: 14, gap: 6,
  },
  descHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  descLabel: { fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.6, textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '600' },
  descText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  nurseryText: { fontSize: 12, color: '#9CA3AF' },
  closedBanner: {
    marginHorizontal: 12, backgroundColor: '#FEF3C7', borderRadius: 8,
    padding: 10, marginBottom: 4,
  },
  closedBannerText: { fontSize: 13, color: '#92400E', textAlign: 'center', fontWeight: '500' },
  commentList: { padding: 12, paddingBottom: 8, flexGrow: 1 },
  emptyComments: { alignItems: 'center', paddingVertical: 24 },
  emptyCommentsText: { color: '#9CA3AF', fontSize: 13 },
  bubbleWrapper: { marginBottom: 14, maxWidth: '80%' },
  bubbleLeft: { alignSelf: 'flex-start' },
  bubbleRight: { alignSelf: 'flex-end' },
  authorName: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 3 },
  authorLeft: { textAlign: 'left' },
  authorRight: { textAlign: 'right' },
  bubble: { borderRadius: 12, padding: 10 },
  bubbleCustomer: {
    backgroundColor: '#DBEAFE',
    borderBottomRightRadius: 2,
  },
  bubbleManager: {
    backgroundColor: '#D1FAE5',
    borderBottomLeftRadius: 2,
  },
  bubbleText: { fontSize: 14, color: '#111827', lineHeight: 20 },
  timestamp: { fontSize: 10, color: '#9CA3AF', marginTop: 3 },
  timestampLeft: { textAlign: 'left' },
  timestampRight: { textAlign: 'right' },
  replyBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, paddingBottom: 16, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  replyInput: {
    flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 8, fontSize: 14, color: '#111827', maxHeight: 100,
  },
});
