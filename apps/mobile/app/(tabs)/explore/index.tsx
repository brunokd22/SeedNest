import { Text } from 'react-native';
import { Screen } from '@/components/common/Screen';

export default function ExploreScreen() {
  return (
    <Screen>
      <Text className="text-xl font-semibold text-gray-900">Explore</Text>
      <Text className="text-gray-500 mt-2">Discover nearby nurseries — coming soon</Text>
    </Screen>
  );
}
