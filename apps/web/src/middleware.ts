import { NextRequest, NextResponse } from 'next/server';

const CUSTOMER_ROUTES = ['/explore', '/cart', '/checkout', '/my-orders', '/my-issues'];
const MANAGER_ROUTES = ['/dashboard'];

async function getSession(cookieHeader: string) {
  try {
    const baseUrl = process.env.BETTER_AUTH_URL ?? 'http://localhost:4000';
    const res = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: { cookie: cookieHeader },
    });
    if (!res.ok) return null;
    return (await res.json()) as { user?: { role?: string } } | null;
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isCustomer = CUSTOMER_ROUTES.some((r) => pathname.startsWith(r));
  const isManager = MANAGER_ROUTES.some((r) => pathname.startsWith(r));

  if (!isCustomer && !isManager) return NextResponse.next();

  const session = await getSession(request.headers.get('cookie') ?? '');

  if (!session?.user) {
    const url = request.nextUrl.clone();
    url.pathname = '/sign-in';
    return NextResponse.redirect(url);
  }

  const role = session.user.role;

  if (isCustomer && role === 'MANAGER') {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (isManager && role === 'CUSTOMER') {
    const url = request.nextUrl.clone();
    url.pathname = '/explore';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/explore/:path*',
    '/cart/:path*',
    '/checkout/:path*',
    '/my-orders/:path*',
    '/my-issues/:path*',
    '/dashboard/:path*',
  ],
};
