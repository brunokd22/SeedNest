import { Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { useAuthStore } from '@/store/auth-store';
import { clearToken } from '@/lib/auth';

export default function AccountScreen() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  async function handleSignOut() {
    await clearToken();
    clearAuth();
    router.replace('/(auth)/sign-in');
  }

  return (
    <Screen>
      <Text className="text-xl font-semibold text-gray-900">Account</Text>
      {user ? (
        <View className="mt-4">
          <Text className="text-gray-700 font-medium">{user.name}</Text>
          <Text className="text-gray-500 text-sm">{user.email}</Text>
          <TouchableOpacity
            onPress={handleSignOut}
            className="mt-6 bg-red-50 border border-red-200 rounded-xl py-3 items-center"
          >
            <Text className="text-red-600 font-medium">Sign out</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Screen>
  );
}
