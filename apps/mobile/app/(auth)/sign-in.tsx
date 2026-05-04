import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AuthUser } from '@seednest/shared';
import { api } from '@/lib/api';
import { setToken } from '@/lib/auth';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

const schema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { control, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: FormValues) {
    try {
      setLoading(true);
      setErrorMsg('');
      const response = await api.post<{ user: AuthUser; session: { token: string } }>(
        '/api/auth/sign-in/email',
        { email: data.email, password: data.password },
      );
      const { user, session } = response.data;
      const token = session?.token;
      await setToken(token);
      setAuth(user, token);
      router.replace('/(tabs)/explore');
    } catch {
      setErrorMsg('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
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
        <Text className="text-gray-500 mb-8">Sign in to your account</Text>

        <Controller
          control={control}
          name="email"
          render={({ field }) => (
            <Input
              label="Email"
              placeholder="jane@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field }) => (
            <Input
              label="Password"
              placeholder="••••••••"
              secureTextEntry
              error={errors.password?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

        {errorMsg ? (
          <Text className="text-red-500 text-sm mb-4">{errorMsg}</Text>
        ) : null}

        <Button onPress={handleSubmit(onSubmit)} loading={loading}>
          Sign in
        </Button>

        <Link href="/(auth)/forgot-password" asChild>
          <TouchableOpacity className="mt-4 items-center">
            <Text className="text-primary text-sm">Forgot password?</Text>
          </TouchableOpacity>
        </Link>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500 text-sm">Don't have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text className="text-primary text-sm font-medium">Create one</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
