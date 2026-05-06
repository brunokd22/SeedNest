import { Stack } from 'expo-router';
import { StripeProvider } from '@stripe/stripe-react-native';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import '../global.css';

export default function RootLayout() {
  return (
    <QueryProvider>
      <StripeProvider publishableKey={process.env.EXPO_PUBLIC_STRIPE_KEY ?? ''}>
        <AuthProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="checkout" options={{ presentation: 'modal', headerShown: true, title: 'Checkout' }} />
            <Stack.Screen name="order-confirmation" options={{ headerShown: false }} />
            <Stack.Screen name="manager/orders" options={{ headerShown: true, title: 'Orders' }} />
            <Stack.Screen name="manager/orders/[orderId]" options={{ headerShown: true, title: 'Order Detail' }} />
            <Stack.Screen name="manager/walkin-sale" options={{ headerShown: true, title: 'Walk-in Sale' }} />
          </Stack>
        </AuthProvider>
      </StripeProvider>
    </QueryProvider>
  );
}
