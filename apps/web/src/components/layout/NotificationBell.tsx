'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, Bell, MessageCircle, PackageOpen, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useUnreadCount,
  useNotifications,
  useMarkAsRead,
  useMarkAllRead,
  type Notification,
} from '@/lib/hooks/useNotifications';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  NEW_ISSUE: { icon: AlertCircle, color: 'text-orange-500 bg-orange-50' },
  NEW_COMMENT: { icon: MessageCircle, color: 'text-blue-500 bg-blue-50' },
  LOW_STOCK: { icon: PackageOpen, color: 'text-red-500 bg-red-50' },
  ORDER_UPDATE: { icon: ShoppingBag, color: 'text-green-500 bg-green-50' },
};

function getNavUrl(notification: Notification): string {
  switch (notification.type) {
    case 'NEW_ISSUE':
    case 'NEW_COMMENT':
      return `/dashboard/issues/${notification.relatedId}`;
    case 'ORDER_UPDATE':
      return `/dashboard/orders/${notification.relatedId}`;
    case 'LOW_STOCK':
      return '/dashboard/nurseries';
    default:
      return '/dashboard/notifications';
  }
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { data: unreadData } = useUnreadCount();
  const { data: notifData, isLoading } = useNotifications(1, 5);
  const markAsRead = useMarkAsRead();
  const markAllRead = useMarkAllRead();

  const unreadCount = unreadData?.count ?? 0;
  const notifications = notifData?.data ?? [];

  const handleNotifClick = (notification: Notification) => {
    markAsRead.mutate(notification.id);
    setOpen(false);
    router.push(getNavUrl(notification));
  };

  const handleMarkAll = () => {
    markAllRead.mutate();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-0.5 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[380px] max-h-[480px] p-0 flex flex-col" align="end">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <p className="font-semibold text-sm">Notifications</p>
          <button
            onClick={handleMarkAll}
            disabled={markAllRead.isPending || unreadCount === 0}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
          >
            Mark all read
          </button>
        </div>
        <Separator />

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItem
                key={n.id}
                notification={n}
                onClick={() => handleNotifClick(n)}
              />
            ))
          )}
        </div>

        <Separator />
        {/* Footer */}
        <div className="shrink-0 px-4 py-2.5 text-center">
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="text-xs text-primary hover:underline"
          >
            View all notifications →
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function NotificationItem({
  notification,
  onClick,
}: {
  notification: Notification;
  onClick: () => void;
}) {
  const typeConf = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.NEW_ISSUE;
  const IconComp = typeConf.icon;

  return (
    <button
      className={cn(
        'w-full flex gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors',
        notification.isRead ? 'bg-gray-50' : 'bg-white',
      )}
      onClick={onClick}
    >
      {/* Icon circle */}
      <div className={cn('h-9 w-9 rounded-full flex items-center justify-center shrink-0', typeConf.color)}>
        <IconComp className="h-4 w-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-xs font-semibold truncate">{notification.title}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
      </div>

      {/* Time */}
      <p className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
      </p>
    </button>
  );
}
