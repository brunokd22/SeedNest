import React from 'react';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { UserRole } from '@seednest/shared';
import { env } from './env';
import { prisma } from './prisma';
import { VerificationEmail } from '../emails/verification-email';
import { ResetPasswordEmail } from '../emails/reset-password';
import { WelcomeEmail } from '../emails/welcome-email';
import { OtpEmail } from '../emails/otp-email';
import { OrderReceiptEmail } from '../emails/order-receipt';

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

export async function sendOrderReceiptEmail(params: {
  to: string;
  customerName: string;
  orderId: string;
  nurseryName: string;
  items: { name: string; size: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  fulfillmentType: string;
  deliveryAddress?: string;
}): Promise<void> {
  try {
    const orderNumber = params.orderId.substring(0, 8).toUpperCase();

    const html = await render(
      React.createElement(OrderReceiptEmail, {
        orderNumber,
        customerName: params.customerName,
        nurseryName: params.nurseryName,
        items: params.items.map((i) => ({
          ...i,
          subtotal: i.unitPrice * i.quantity,
        })),
        totalAmount: params.totalAmount,
        fulfillmentType: params.fulfillmentType as 'DELIVERY' | 'PICKUP',
        deliveryAddress: params.deliveryAddress,
        orderId: params.orderId,
      }),
    );

    await resend.emails.send({
      from: FROM,
      to: params.to,
      subject: `Your SeedNest Order #${orderNumber}`,
      html,
    });

    await prisma.order.update({
      where: { id: params.orderId },
      data: { receiptEmailSent: true },
    });
  } catch (err) {
    console.error('sendOrderReceiptEmail failed:', err);
  }
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

export async function sendIssueNotificationEmail(
  to: string,
  managerName: string,
  issueTitle: string,
  customerName: string,
  issueUrl: string,
): Promise<void> {
  try {
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#2D6A4F;padding:24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">SeedNest</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1a1a1a;">New Issue Raised</h2>
          <p>Hi ${managerName},</p>
          <p><strong>${customerName}</strong> has raised a new issue on your nursery:</p>
          <div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:12px 16px;margin:16px 0;border-radius:4px;">
            <p style="margin:0;font-weight:600;color:#92400E;">${issueTitle}</p>
          </div>
          <p>Please log in to view the full details and respond.</p>
          <a href="${issueUrl}" style="background:#2D6A4F;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px;">
            View &amp; Respond
          </a>
        </div>
        <div style="padding:24px;text-align:center;color:#9CA3AF;font-size:12px;border-top:1px solid #E5E7EB;">
          SeedNest — connecting plant lovers with local nurseries
        </div>
      </div>`;
    await resend.emails.send({ from: FROM, to, subject: `New Issue Raised: ${issueTitle}`, html });
  } catch (err) {
    console.error('sendIssueNotificationEmail failed:', err);
  }
}

export async function sendIssueReplyEmail(
  to: string,
  customerName: string,
  issueTitle: string,
  replyPreview: string,
  issueUrl: string,
): Promise<void> {
  try {
    const preview = replyPreview.length > 200 ? replyPreview.slice(0, 200) + '…' : replyPreview;
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#2D6A4F;padding:24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">SeedNest</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1a1a1a;">New Reply on Your Issue</h2>
          <p>Hi ${customerName},</p>
          <p>A reply has been posted on your issue: <strong>${issueTitle}</strong></p>
          <div style="background:#F0FDF4;border-left:4px solid #2D6A4F;padding:12px 16px;margin:16px 0;border-radius:4px;color:#374151;font-style:italic;">
            "${preview}"
          </div>
          <a href="${issueUrl}" style="background:#2D6A4F;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:8px;">
            View Full Thread
          </a>
        </div>
        <div style="padding:24px;text-align:center;color:#9CA3AF;font-size:12px;border-top:1px solid #E5E7EB;">
          SeedNest — connecting plant lovers with local nurseries
        </div>
      </div>`;
    await resend.emails.send({ from: FROM, to, subject: `New reply on your issue: ${issueTitle}`, html });
  } catch (err) {
    console.error('sendIssueReplyEmail failed:', err);
  }
}

export async function sendCareReminderEmail(
  to: string,
  customerName: string,
  seedlingNames: string[],
  nurseryName: string,
  tips: string,
): Promise<void> {
  try {
    const seedlingList = seedlingNames.map((n) => `<li>${n}</li>`).join('');
    const html = `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:#2D6A4F;padding:24px;text-align:center;">
          <h1 style="color:white;margin:0;font-size:24px;">SeedNest</h1>
        </div>
        <div style="padding:32px;">
          <h2 style="color:#1a1a1a;">🌱 Care Tips for Your Seedlings</h2>
          <p>Hi ${customerName},</p>
          <p>Here are some care tips from <strong>${nurseryName}</strong> for your seedlings:</p>
          <ul style="color:#374151;line-height:1.8;">${seedlingList}</ul>
          <div style="background:#D8F3DC;border-radius:8px;padding:16px;margin:20px 0;">
            <p style="margin:0;color:#1B4332;">${tips}</p>
          </div>
          <p style="color:#6B7280;font-size:13px;margin-top:24px;">
            Happy growing! The team at ${nurseryName} is here if you need anything.
          </p>
        </div>
        <div style="padding:24px;text-align:center;color:#9CA3AF;font-size:12px;border-top:1px solid #E5E7EB;">
          SeedNest — connecting plant lovers with local nurseries
        </div>
      </div>`;
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Care Tips for Your Seedlings from ${nurseryName}`,
      html,
    });
  } catch (err) {
    console.error('sendCareReminderEmail failed:', err);
  }
}
