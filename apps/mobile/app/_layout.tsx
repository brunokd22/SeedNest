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
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </StripeProvider>
    </QueryProvider>
  );
}
