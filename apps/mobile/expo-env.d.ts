/// <reference types="expo-router/types" />
/// <reference types="nativewind/types" />

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_STRIPE_KEY?: string;
    [key: string]: string | undefined;
  };
};
