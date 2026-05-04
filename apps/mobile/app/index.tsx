import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuthStore } from '@/store/auth-store';

export default function Index() {
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <LoadingSpinner />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/sign-in" />;
  return <Redirect href="/(tabs)/explore" />;
}
