'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Bell } from 'lucide-react';
import { ManagerSidebar } from './ManagerSidebar';
import { UserMenu } from './UserMenu';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard/nurseries': 'Nurseries',
  '/dashboard/orders': 'Orders',
  '/dashboard/issues': 'Issues',
  '/dashboard/reports': 'Reports',
  '/dashboard/notifications': 'Notifications',
  '/dashboard': 'Overview',
};

function getPageTitle(pathname: string): string {
  for (const [route, title] of Object.entries(ROUTE_TITLES)) {
    if (pathname.startsWith(route)) return title;
  }
  return 'Dashboard';
}

export function ManagerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) setIsCollapsed(stored === 'true');
    setMounted(true);
  }, []);

  const toggle = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar-collapsed', String(next));
      return next;
    });
  };

  const title = getPageTitle(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:flex">
        {mounted && (
          <ManagerSidebar isCollapsed={isCollapsed} onToggle={toggle} />
        )}
        {!mounted && (
          <div className="w-64 border-r bg-background shrink-0" />
        )}
      </div>

      {/* Content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <header className="h-14 flex items-center justify-between border-b px-4 bg-background shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <ManagerSidebar
                  isCollapsed={false}
                  onToggle={() => setMobileOpen(false)}
                  isMobile
                />
              </SheetContent>
            </Sheet>

            <h1 className="font-semibold text-lg">{title}</h1>
          </div>

          <div className="flex items-center gap-1">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

function NotificationBell() {
  return (
    <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
      <Bell className="h-5 w-5" />
    </Button>
  );
}
