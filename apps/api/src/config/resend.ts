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

export async function sendLowStockAlert(
  to: string,
  managerName: string,
  seedlingName: string,
  quantity: number,
  nurseryName: string,
): Promise<void> {
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#2D6A4F;padding:24px;text-align:center;">
        <h1 style="color:white;margin:0;font-size:24px;">SeedNest</h1>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#1a1a1a;">⚠️ Low Stock Alert</h2>
        <p>Hi ${managerName},</p>
        <p>Your seedling <strong>${seedlingName}</strong> at <strong>${nurseryName}</strong>
           is running low.</p>
        <div style="background:#FEF3C7;border:1px solid #F59E0B;border-radius:8px;padding:16px;margin:24px 0;">
          <p style="margin:0;font-size:18px;font-weight:bold;color:#92400E;">
            Only ${quantity} unit${quantity === 1 ? '' : 's'} remaining
          </p>
        </div>
        <p>Please restock soon to avoid missing sales.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard/nurseries"
           style="background:#2D6A4F;color:white;padding:12px 24px;border-radius:6px;
                  text-decoration:none;display:inline-block;margin-top:16px;">
          Manage Inventory
        </a>
      </div>
      <div style="padding:24px;text-align:center;color:#9CA3AF;font-size:14px;
                  border-top:1px solid #E5E7EB;">
        SeedNest · Nurturing Uganda's forests
      </div>
    </div>
  `;
  await resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Low Stock: ${seedlingName} at ${nurseryName}`,
    html,
  });
}
