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
import { UserRole } from '@seednest/shared';
import { api } from '@/lib/api';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role:     z.enum(['MANAGER', 'CUSTOMER']),
});

type FormValues = z.infer<typeof schema>;

type RoleOption = { label: string; value: 'MANAGER' | 'CUSTOMER' };

const ROLES: RoleOption[] = [
  { label: "I'm a Customer", value: 'CUSTOMER' },
  { label: "I'm a Manager", value: 'MANAGER' },
];

export default function SignUpScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', role: UserRole.CUSTOMER as 'CUSTOMER' },
  });

  const selectedRole = watch('role');

  async function onSubmit(data: FormValues) {
    try {
      setLoading(true);
      setErrorMsg('');
      await api.post('/api/auth/sign-up/email', {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      router.push({ pathname: '/(auth)/verify-email', params: { email: data.email } });
    } catch {
      setErrorMsg('Sign up failed. Please try again.');
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
        contentContainerStyle={{ padding: 24, paddingTop: 48 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-3xl font-bold text-primary mb-1">SeedNest</Text>
        <Text className="text-gray-500 mb-8">Create your account</Text>

        <Controller
          control={control}
          name="name"
          render={({ field }) => (
            <Input
              label="Full Name"
              placeholder="Jane Doe"
              autoCapitalize="words"
              error={errors.name?.message}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />

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

        <Text className="text-sm font-medium text-gray-700 mb-2">I am a…</Text>
        <View className="flex-row gap-3 mb-4">
          {ROLES.map((opt) => {
            const isSelected = selectedRole === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                onPress={() => setValue('role', opt.value)}
                className={`flex-1 p-4 rounded-xl border-2 items-center ${
                  isSelected ? 'border-primary bg-primary' : 'border-gray-200 bg-white'
                }`}
              >
                <Text
                  className={`font-medium text-sm ${
                    isSelected ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {errorMsg ? (
          <Text className="text-red-500 text-sm mb-4">{errorMsg}</Text>
        ) : null}

        <Button onPress={handleSubmit(onSubmit)} loading={loading}>
          Create account
        </Button>

        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500 text-sm">Already have an account? </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text className="text-primary text-sm font-medium">Sign in</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
