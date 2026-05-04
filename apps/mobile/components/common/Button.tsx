import { ActivityIndicator, Text, TouchableOpacity } from 'react-native';

type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  children: React.ReactNode;
};

const containerClass = {
  primary:   'bg-primary',
  secondary: 'bg-secondary',
  outline:   'border-2 border-primary bg-transparent',
} as const;

const textClass = {
  primary:   'text-white',
  secondary: 'text-white',
  outline:   'text-primary',
} as const;

export function Button({ variant = 'primary', loading = false, disabled, onPress, children }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      className={`rounded-xl py-4 items-center ${containerClass[variant]} ${isDisabled ? 'opacity-50' : ''}`}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? '#2D6A4F' : '#ffffff'} />
      ) : (
        <Text className={`font-semibold text-base ${textClass[variant]}`}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}
