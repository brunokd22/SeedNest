import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { MapPin, MessageSquare, Package, ShoppingCart, User } from 'lucide-react-native';
import { NotificationBadge } from '@/components/NotificationBadge';
import { useUnreadCount } from '@/lib/hooks/useNotifications';

const ACTIVE = '#2D6A4F';
const INACTIVE = '#9CA3AF';

export default function TabLayout() {
  const { data } = useUnreadCount();
  const unreadCount = data?.count ?? 0;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: { backgroundColor: '#ffffff' },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color, size }) => <ShoppingCart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="issues"
        options={{
          title: 'Issues',
          tabBarIcon: ({ color, size }) => (
            <View>
              <MessageSquare color={color} size={size} />
              <NotificationBadge count={unreadCount} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
