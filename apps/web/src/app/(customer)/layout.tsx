import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { CustomerNav } from '@/components/layout/CustomerNav';

async function getSession(cookieHeader: string) {
  try {
    const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:4000';
    const res = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: { cookie: cookieHeader },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return (await res.json()) as { user?: { role?: string } } | null;
  } catch {
    return null;
  }
}

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie') ?? '';
  const session = await getSession(cookieHeader);

  if (session?.user?.role !== 'CUSTOMER') {
    redirect('/dashboard');
  }

  return (
    <>
      <CustomerNav />
      <main className="min-h-screen">{children}</main>
    </>
  );
}
