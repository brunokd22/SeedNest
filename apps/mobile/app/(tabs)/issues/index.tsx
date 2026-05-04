import { Text } from 'react-native';
import { Screen } from '@/components/common/Screen';

export default function IssuesScreen() {
  return (
    <Screen>
      <Text className="text-xl font-semibold text-gray-900">Issues</Text>
      <Text className="text-gray-500 mt-2">Support issues — coming soon</Text>
    </Screen>
  );
}
