import { Text } from 'react-native';
import { Screen } from '@/components/common/Screen';

export default function CartScreen() {
  return (
    <Screen>
      <Text className="text-xl font-semibold text-gray-900">Cart</Text>
      <Text className="text-gray-500 mt-2">Your cart — coming soon</Text>
    </Screen>
  );
}
