'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  Bell,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  PackageOpen,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllRead,
  type Notification,
} from '@/lib/hooks/useNotifications';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  NEW_ISSUE: { icon: AlertCircle, color: 'text-orange-500 bg-orange-50', label: 'Issues' },
  NEW_COMMENT: { icon: MessageCircle, color: 'text-blue-500 bg-blue-50', label: 'Issues' },
  LOW_STOCK: { icon: PackageOpen, color: 'text-red-500 bg-red-50', label: 'Low Stock' },
  ORDER_UPDATE: { icon: ShoppingBag, color: 'text-green-500 bg-green-50', label: 'Orders' },
};

const FILTER_TABS = [
  { label: 'All', value: 'all' },
  { label: 'Unread', value: 'unread' },
  { label: 'Issues', value: 'issues' },
  { label: 'Low Stock', value: 'lowstock' },
  { label: 'Orders', value: 'orders' },
] as const;

type FilterTab = (typeof FILTER_TABS)[number]['value'];

function applyFilter(notifications: Notification[], filter: FilterTab): Notification[] {
  switch (filter) {
    case 'unread':
      return notifications.filter((n) => !n.isRead);
    case 'issues':
      return notifications.filter((n) => n.type === 'NEW_ISSUE' || n.type === 'NEW_COMMENT');
    case 'lowstock':
      return notifications.filter((n) => n.type === 'LOW_STOCK');
    case 'orders':
      return notifications.filter((n) => n.type === 'ORDER_UPDATE');
    default:
      return notifications;
  }
}

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

export default function NotificationsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  const { data, isLoading } = useNotifications(page, PAGE_SIZE);
  const markAsRead = useMarkAsRead();
  const markAllRead = useMarkAllRead();

  const allNotifications = data?.data ?? [];
  const filtered = applyFilter(allNotifications, activeFilter);
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const handleMarkAll = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success('All notifications marked as read'),
    });
  };

  const handleClick = (notification: Notification) => {
    markAsRead.mutate(notification.id);
    router.push(getNavUrl(notification));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Notifications</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAll}
          disabled={markAllRead.isPending}
        >
          Mark All Read
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveFilter(tab.value)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeFilter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="rounded-lg border overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center gap-3">
            <Bell className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-muted-foreground">You&apos;re all caught up! No notifications.</p>
          </div>
        ) : (
          filtered.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onClick={() => handleClick(notification)}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && activeFilter === 'all' && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationRow({
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
        'w-full flex items-start gap-4 px-4 py-4 text-left hover:bg-muted/40 transition-colors border-b last:border-b-0 relative',
        notification.isRead ? 'bg-white' : 'bg-white',
      )}
      onClick={onClick}
    >
      {/* Unread indicator dot */}
      {!notification.isRead && (
        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
      )}

      {/* Icon circle */}
      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', typeConf.color)}>
        <IconComp className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className={cn('text-sm font-semibold', !notification.isRead && 'text-foreground')}>
          {notification.title}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-3">{notification.message}</p>
      </div>

      {/* Time */}
      <p className="text-xs text-muted-foreground shrink-0 mt-0.5">
        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
      </p>
    </button>
  );
}
