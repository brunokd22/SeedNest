'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TreePine,
  ShoppingBag,
  MessageSquare,
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const NAV_ITEMS = [
  { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Nurseries', href: '/dashboard/nurseries', icon: TreePine },
  { label: 'Orders', href: '/dashboard/orders', icon: ShoppingBag },
  { label: 'Issues', href: '/dashboard/issues', icon: MessageSquare },
  { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
  { label: 'Notifications', href: '/dashboard/notifications', icon: Bell },
];

interface ManagerSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export function ManagerSidebar({ isCollapsed, onToggle, isMobile }: ManagerSidebarProps) {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'flex flex-col h-full border-r bg-background transition-all duration-200 ease-in-out shrink-0',
          isCollapsed ? 'w-16' : 'w-64',
        )}
      >
        {/* Header */}
        <div
          className={cn(
            'flex h-14 items-center border-b px-3 shrink-0',
            isCollapsed ? 'justify-center' : 'justify-between',
          )}
        >
          {!isCollapsed && (
            <span className="font-semibold text-primary text-lg">SeedNest</span>
          )}
          {!isMobile && (
            <button
              onClick={onToggle}
              className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ label, href, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);

            const linkEl = (
              <Link
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  isCollapsed && 'justify-center px-2',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!isCollapsed && <span>{label}</span>}
              </Link>
            );

            if (isCollapsed) {
              return (
                <Tooltip key={href}>
                  <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              );
            }

            return <React.Fragment key={href}>{linkEl}</React.Fragment>;
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}
