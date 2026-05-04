import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { emailOTP } from 'better-auth/plugins';
import { UserRole } from '@seednest/shared';
import { prisma } from './prisma';
import { env } from './env';
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail, sendOtpEmail } from './resend';

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  trustedOrigins: [env.FRONTEND_URL],

  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendPasswordResetEmail(user.email, url);
    },
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
      await sendVerificationEmail(user.email, url);
    },
  },

  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp }: { email: string; otp: string }) {
        await sendOtpEmail(email, otp);
      },
    }),
  ],

  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },

  user: {
    additionalFields: {
      role: {
        type: 'string' as const,
        defaultValue: UserRole.CUSTOMER,
        required: false,
      },
    },
  },

  databaseHooks: {
    user: {
      create: {
        after: async (user: { email: string; name: string; role?: string }) => {
          await sendWelcomeEmail(
            user.email,
            user.name,
            (user.role as UserRole) ?? UserRole.CUSTOMER,
          );
        },
      },
    },
  },
});
