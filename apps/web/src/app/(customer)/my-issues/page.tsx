'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useMyIssues, type Issue } from '@/lib/hooks/useIssues';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 10;

const STATUS_TABS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  REPLACEMENT_REQUEST: { icon: RefreshCw, color: 'bg-orange-100 text-orange-700', label: 'Replacement' },
  QUERY: { icon: HelpCircle, color: 'bg-blue-100 text-blue-700', label: 'Query' },
  COMPLAINT: { icon: AlertTriangle, color: 'bg-red-100 text-red-700', label: 'Complaint' },
  GENERAL_REQUEST: { icon: MessageSquare, color: 'bg-gray-100 text-gray-700', label: 'General' },
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
};

export default function MyIssuesPage() {
  const [activeStatus, setActiveStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useMyIssues({
    status: activeStatus || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  const handleTabChange = (value: string) => {
    setActiveStatus(value);
    setPage(1);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Support Issues</h1>
        <Button asChild>
          <Link href="/my-issues/new">
            <Plus className="mr-2 h-4 w-4" />
            Raise New Issue
          </Link>
        </Button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              activeStatus === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <IssueCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-destructive/50" />
          <p className="text-muted-foreground">Failed to load issues.</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : !data?.data.length ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/30" />
          <h3 className="font-semibold">You haven&apos;t raised any issues yet</h3>
          <p className="text-sm text-muted-foreground">
            Have a question or problem? We&apos;re here to help.
          </p>
          <Button asChild>
            <Link href="/my-issues/new">Raise an Issue</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.data.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
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
        </>
      )}
    </div>
  );
}

function IssueCard({ issue }: { issue: Issue }) {
  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.GENERAL_REQUEST;
  const TypeIcon = typeConf.icon;
  const commentCount = issue._count?.comments ?? 0;

  return (
    <div className="rounded-lg border p-4 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold truncate leading-tight">{issue.title}</h3>
        <div className="flex gap-1.5 shrink-0">
          <Badge className={cn('text-xs hover:opacity-100', typeConf.color)}>
            <TypeIcon className="h-3 w-3 mr-1" />
            {typeConf.label}
          </Badge>
          <Badge className={cn('text-xs hover:opacity-100', STATUS_COLOR[issue.status] ?? 'bg-gray-100 text-gray-700')}>
            {issue.status.replace(/_/g, ' ')}
          </Badge>
        </div>
      </div>

      <div className="text-xs text-muted-foreground space-y-0.5">
        <p>{issue.nursery.name}</p>
        {issue.order && (
          <p>Re: Order #{issue.order.id.slice(0, 8).toUpperCase()}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>💬 {commentCount} {commentCount === 1 ? 'reply' : 'replies'}</span>
          <span>
            {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
          </span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/my-issues/${issue.id}`}>View</Link>
        </Button>
      </div>
    </div>
  );
}

function IssueCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex justify-between">
        <Skeleton className="h-5 w-48" />
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-3 w-32" />
      <div className="flex justify-between pt-1 border-t">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-7 w-14" />
      </div>
    </div>
  );
}
