import { Text } from 'react-native';
import { Screen } from '@/components/common/Screen';

export default function OrdersScreen() {
  return (
    <Screen>
      <Text className="text-xl font-semibold text-gray-900">Orders</Text>
      <Text className="text-gray-500 mt-2">Your orders — coming soon</Text>
    </Screen>
  );
}
