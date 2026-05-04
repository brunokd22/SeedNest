import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '@/lib/api';
import { Button } from '@/components/common/Button';

const OTP_LENGTH = 6;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleSubmit() {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setErrorMsg('Please enter all 6 digits.');
      return;
    }
    try {
      setLoading(true);
      setErrorMsg('');
      await api.post('/api/auth/email-otp/verify-email', { email, otp: code });
      router.replace('/(tabs)/explore');
    } catch {
      setErrorMsg('Verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    try {
      await api.post('/api/auth/email-otp/send-verification-otp', {
        email,
        type: 'email-verification',
      });
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setErrorMsg('Failed to resend code.');
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 px-6 pt-12">
        <Text className="text-3xl font-bold text-primary mb-2">SeedNest</Text>
        <Text className="text-gray-500 mb-1">Enter the 6-digit code sent to</Text>
        <Text className="font-medium mb-8">{email}</Text>

        <View className="flex-row justify-between mb-6">
          {otp.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              value={digit}
              onChangeText={(v) => handleChange(i, v)}
              onKeyPress={({ nativeEvent }) => handleKeyPress(i, nativeEvent.key)}
              maxLength={1}
              keyboardType="number-pad"
              className="w-12 h-14 border-2 border-gray-300 rounded-xl text-center text-xl font-bold text-gray-900"
              style={{ textAlign: 'center' }}
            />
          ))}
        </View>

        {errorMsg ? (
          <Text className="text-red-500 text-sm mb-4">{errorMsg}</Text>
        ) : null}

        <Button onPress={handleSubmit} loading={loading}>
          Verify email
        </Button>

        <TouchableOpacity
          onPress={handleResend}
          disabled={cooldown > 0}
          className="mt-4 items-center"
        >
          <Text className={cooldown > 0 ? 'text-gray-400 text-sm' : 'text-primary text-sm'}>
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
