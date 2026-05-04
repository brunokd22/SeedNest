'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const schema = z.object({ email: z.string().email() });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: FormValues) {
    try {
      setLoading(true);
      // Type cast needed: emailOTPClient plugin merges forgetPassword into a namespace
      type ForgetPasswordFn = (opts: { email: string; redirectTo: string }) => Promise<unknown>;
      await (authClient.forgetPassword as unknown as ForgetPasswordFn)({
        email: data.email,
        redirectTo: '/reset-password',
      });
    } catch {
      // swallow — never reveal whether email exists
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border bg-card p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-primary">SeedNest</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          If that email exists, you'll receive a reset link shortly.
        </p>
        <Link
          href="/sign-in"
          className="mt-6 block text-sm font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-primary">SeedNest</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email and we'll send a reset link.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="jane@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      </Form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
