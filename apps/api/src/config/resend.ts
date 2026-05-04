import React from 'react';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { UserRole } from '@seednest/shared';
import { env } from './env';
import { VerificationEmail } from '../emails/verification-email';
import { ResetPasswordEmail } from '../emails/reset-password';
import { WelcomeEmail } from '../emails/welcome-email';
import { OtpEmail } from '../emails/otp-email';

export const resend = new Resend(env.RESEND_API_KEY);

const FROM = 'SeedNest <noreply@seednest.com>';

export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  const html = await render(React.createElement(VerificationEmail, { url }));
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Verify your SeedNest email',
    html,
  });
}

export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  const html = await render(React.createElement(ResetPasswordEmail, { url }));
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your SeedNest password',
    html,
  });
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const html = await render(React.createElement(OtpEmail, { otp }));
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Your SeedNest verification code',
    html,
  });
}

export async function sendWelcomeEmail(to: string, name: string, role: UserRole): Promise<void> {
  const html = await render(React.createElement(WelcomeEmail, { name, role }));
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to SeedNest',
    html,
  });
}
