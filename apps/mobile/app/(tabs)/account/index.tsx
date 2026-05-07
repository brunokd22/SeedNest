import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, ChevronRight, ClipboardList, ShoppingBag } from 'lucide-react-native';
import { useAuthStore } from '@/store/auth-store';
import { clearToken } from '@/lib/auth';
import { UserRole } from '@seednest/shared';

const PRIMARY = '#2D6A4F';
const NOTIFICATIONS_KEY = 'notificationsEnabled';

export default function AccountScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(NOTIFICATIONS_KEY).then((val) => {
      if (val !== null) setNotificationsEnabled(val === 'true');
    });
  }, []);

  const toggleNotifications = (val: boolean) => {
    setNotificationsEnabled(val);
    AsyncStorage.setItem(NOTIFICATIONS_KEY, String(val));
  };

  const handleSignOut = async () => {
    await clearToken();
    clearAuth();
    router.replace('/(auth)/sign-in' as never);
  };

  const isManager = user?.role === UserRole.MANAGER;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile header */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user?.name ?? '?').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.name ?? '—'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? ''}</Text>
          </View>
          <View
            style={[
              styles.roleBadge,
              isManager ? styles.roleBadgeManager : styles.roleBadgeCustomer,
            ]}
          >
            <Text
              style={[
                styles.roleBadgeText,
                isManager ? styles.roleBadgeTextManager : styles.roleBadgeTextCustomer,
              ]}
            >
              {user?.role ?? 'CUSTOMER'}
            </Text>
          </View>
        </View>

        {/* Manager Tools */}
        {isManager && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Manager Tools</Text>
            <View style={styles.listCard}>
              <TouchableOpacity
                style={styles.listRow}
                onPress={() => router.push('/manager/orders' as never)}
                activeOpacity={0.7}
              >
                <View style={styles.listRowLeft}>
                  <ClipboardList size={20} color={PRIMARY} />
                  <Text style={styles.listRowText}>My Orders</Text>
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>

              <View style={styles.rowDivider} />

              <TouchableOpacity
                style={styles.listRow}
                onPress={() => router.push('/manager/walkin-sale' as never)}
                activeOpacity={0.7}
              >
                <View style={styles.listRowLeft}>
                  <ShoppingBag size={20} color={PRIMARY} />
                  <Text style={styles.listRowText}>Walk-in Sale</Text>
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Settings</Text>
          <View style={styles.listCard}>
            <TouchableOpacity
              style={styles.listRow}
              onPress={() => router.push('/(tabs)/account/notifications' as never)}
              activeOpacity={0.7}
            >
              <View style={styles.listRowLeft}>
                <Bell size={20} color={PRIMARY} />
                <Text style={styles.listRowText}>Notifications</Text>
              </View>
              <ChevronRight size={18} color="#9CA3AF" />
            </TouchableOpacity>

            <View style={styles.rowDivider} />

            <View style={[styles.listRow, { justifyContent: 'space-between' }]}>
              <Text style={styles.listRowText}>Push Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ true: PRIMARY, false: '#E5E7EB' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  content: { padding: 16, gap: 20, paddingBottom: 40 },
  profileCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1, borderColor: '#E5E7EB',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: PRIMARY, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  userEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  roleBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  roleBadgeManager: { backgroundColor: '#DCFCE7' },
  roleBadgeCustomer: { backgroundColor: '#DBEAFE' },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
  roleBadgeTextManager: { color: '#166534' },
  roleBadgeTextCustomer: { color: '#1D4ED8' },
  section: { gap: 8 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, paddingHorizontal: 4 },
  listCard: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  listRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  listRowText: { fontSize: 15, color: '#111827', fontWeight: '500' },
  rowDivider: { height: 1, backgroundColor: '#F3F4F6', marginHorizontal: 14 },
  signOutBtn: {
    borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 12,
    padding: 14, alignItems: 'center', backgroundColor: '#FFF5F5',
  },
  signOutText: { color: '#DC2626', fontWeight: '600', fontSize: 15 },
});
