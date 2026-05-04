'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const OTP_LENGTH = 6;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>(Array(OTP_LENGTH).fill(null));

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const next = [...otp];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setOtp(next);
    const focusIdx = Math.min(text.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      toast.error('Please enter all 6 digits.');
      return;
    }
    try {
      setLoading(true);
      const { error } = await authClient.emailOtp.verifyEmail({ email, otp: code });
      if (error) {
        toast.error(error.message ?? 'Verification failed. Please try again.');
        return;
      }
      const { data: session } = await authClient.getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      router.push(role === 'MANAGER' ? '/dashboard' : '/explore');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (cooldown > 0) return;
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email,
        type: 'email-verification',
      });
      toast.success('Verification code resent!');
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
    } catch {
      toast.error('Failed to resend code. Please try again.');
    }
  }

  return (
    <div className="rounded-lg border bg-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary">SeedNest</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the 6-digit code we sent to
        </p>
        <p className="font-medium text-sm">{email}</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <Input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-12 w-10 text-center text-lg font-semibold"
            />
          ))}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify email'}
        </Button>
      </form>

      <div className="mt-4 text-center">
        <Button
          type="button"
          variant="ghost"
          className="text-sm text-muted-foreground"
          onClick={handleResend}
          disabled={cooldown > 0}
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </Button>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="rounded-lg border bg-card p-8 shadow-sm text-center text-muted-foreground">Loading…</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
