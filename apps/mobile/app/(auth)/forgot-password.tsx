import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { api } from '@/lib/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!email) return;
    try {
      setLoading(true);
      await api.post('/api/auth/forget-password', {
        email,
        redirectTo: 'seednest://reset-password',
      });
    } catch {
      // swallow — never reveal whether email exists
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-3xl font-bold text-primary mb-4">SeedNest</Text>
        <Text className="text-center text-gray-600 mb-8">
          If that email exists, you'll receive a reset link shortly.
        </Text>
        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity>
            <Text className="text-primary font-medium">Back to sign in</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-primary mb-1">SeedNest</Text>
        <Text className="text-gray-500 mb-8">Enter your email to receive a reset link.</Text>

        <Input
          label="Email"
          placeholder="jane@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          value={email}
          onChangeText={setEmail}
        />

        <Button onPress={handleSubmit} loading={loading}>
          Send reset link
        </Button>

        <Link href="/(auth)/sign-in" asChild>
          <TouchableOpacity className="mt-4 items-center">
            <Text className="text-primary text-sm">Back to sign in</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
