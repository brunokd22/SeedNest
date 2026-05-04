import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  plugins: [emailOTPClient()],
});

export function signUpWithRole(opts: {
  name: string;
  email: string;
  password: string;
  role: string;
  callbackURL?: string;
}) {
  return authClient.signUp.email(
    opts as Parameters<typeof authClient.signUp.email>[0],
  );
}
