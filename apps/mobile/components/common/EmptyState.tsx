import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
};

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center py-16">
      <Icon size={48} color="#9CA3AF" />
      <Text className="text-lg font-semibold text-gray-900 mt-4">{title}</Text>
      <Text className="text-gray-500 text-center mt-2 text-sm">{description}</Text>
    </View>
  );
}
