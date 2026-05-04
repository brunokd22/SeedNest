import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { ManagerShell } from '@/components/layout/ManagerShell';

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

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie') ?? '';
  const session = await getSession(cookieHeader);

  if (session?.user?.role !== 'MANAGER') {
    redirect('/explore');
  }

  return <ManagerShell>{children}</ManagerShell>;
}
