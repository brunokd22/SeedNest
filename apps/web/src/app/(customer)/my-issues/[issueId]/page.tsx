'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Loader2,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  useMyIssue,
  useAddCustomerComment,
  useReopenIssue,
  type IssueComment,
} from '@/lib/hooks/useIssues';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

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

// Temp optimistic comment
type OptimisticComment = IssueComment & { isPending?: boolean };

export default function IssueDetailPage() {
  const { issueId } = useParams<{ issueId: string }>();
  const { data: session } = authClient.useSession();
  const { data: issue, isLoading, error } = useMyIssue(issueId);
  const addComment = useAddCustomerComment(issueId);
  const reopenIssue = useReopenIssue(issueId);

  const [replyBody, setReplyBody] = useState('');
  const [optimisticComments, setOptimisticComments] = useState<OptimisticComment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (isLoading) return <IssueDetailSkeleton />;

  if (error || !issue) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <p className="text-muted-foreground">Issue not found.</p>
        <Button variant="outline" asChild>
          <Link href="/my-issues">Back to My Issues</Link>
        </Button>
      </div>
    );
  }

  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.GENERAL_REQUEST;
  const TypeIcon = typeConf.icon;
  const isClosed = issue.status === 'CLOSED';
  const canReopen = issue.status === 'RESOLVED' || issue.status === 'CLOSED';
  const allComments: OptimisticComment[] = [...issue.comments, ...optimisticComments];

  const handleSend = () => {
    const body = replyBody.trim();
    if (!body) return;

    // Optimistic append
    const tempId = `temp-${Date.now()}`;
    const optimistic: OptimisticComment = {
      id: tempId,
      issueId,
      authorId: session?.user?.id ?? '',
      body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: { name: session?.user?.name ?? 'You', role: 'CUSTOMER' },
      isPending: true,
    };
    setOptimisticComments((prev) => [...prev, optimistic]);
    setReplyBody('');

    addComment.mutate(
      { body },
      {
        onSuccess: () => {
          setOptimisticComments((prev) => prev.filter((c) => c.id !== tempId));
        },
        onError: () => {
          setOptimisticComments((prev) => prev.filter((c) => c.id !== tempId));
          toast.error('Failed to send reply');
        },
      },
    );
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/my-issues">My Issues</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="truncate max-w-[240px]">{issue.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-2xl font-bold leading-snug">{issue.title}</h1>
        <div className="flex flex-wrap gap-2">
          <Badge className={cn('hover:opacity-100', typeConf.color)}>
            <TypeIcon className="h-3 w-3 mr-1" />
            {typeConf.label}
          </Badge>
          <Badge className={cn('hover:opacity-100', STATUS_COLOR[issue.status] ?? 'bg-gray-100 text-gray-700')}>
            {issue.status.replace(/_/g, ' ')}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Raised on {format(new Date(issue.createdAt), 'dd MMM yyyy')}
          {' · '}
          <span>{issue.nursery.name}</span>
          {issue.order && (
            <>
              {' · '}
              <Link href={`/my-orders/${issue.order.id}`} className="text-primary hover:underline">
                Order #{issue.order.id.slice(0, 8).toUpperCase()}
              </Link>
            </>
          )}
          {issue.seedling && (
            <>{' · '}<span>{issue.seedling.name}</span></>
          )}
        </p>
      </div>

      {/* Description card */}
      <Card>
        <CardContent className="pt-5 pb-3">
          <p className="whitespace-pre-wrap text-sm">{issue.description}</p>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground border-t pt-3">
          {issue.customer.name} · {format(new Date(issue.createdAt), 'dd MMM yyyy, HH:mm')}
        </CardFooter>
      </Card>

      {/* Comment thread */}
      {allComments.length > 0 && (
        <div className="space-y-3">
          <Separator />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Replies
          </h2>
          {allComments.map((comment) => {
            const isCustomer = comment.author.role === 'CUSTOMER';
            const initials = comment.author.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
            return (
              <div
                key={comment.id}
                className={cn('flex gap-3', isCustomer ? 'flex-row-reverse' : 'flex-row')}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    isCustomer ? 'bg-blue-200 text-blue-800' : 'bg-green-200 text-green-800',
                  )}
                >
                  {initials}
                </div>

                {/* Bubble */}
                <div className={cn('max-w-[75%] space-y-1', isCustomer ? 'items-end' : 'items-start', 'flex flex-col')}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{comment.author.name}</span>
                    {!isCustomer && (
                      <Badge className="text-[10px] py-0 bg-green-100 text-green-800 hover:bg-green-100">
                        Manager
                      </Badge>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div
                    className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm',
                      isCustomer
                        ? 'rounded-tr-sm bg-[#DBEAFE] text-blue-900'
                        : 'rounded-tl-sm bg-[#D1FAE5] text-green-900',
                      (comment as OptimisticComment).isPending && 'opacity-50',
                    )}
                  >
                    <p className="whitespace-pre-wrap">{comment.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reopen button */}
      {canReopen && (
        <Button
          variant="outline"
          className="gap-2"
          disabled={reopenIssue.isPending}
          onClick={() => reopenIssue.mutate()}
        >
          <RotateCcw className="h-4 w-4" />
          Reopen Issue
        </Button>
      )}

      {/* Closed banner */}
      {isClosed && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600">
          This issue has been closed and cannot be replied to.
        </div>
      )}

      {/* Reply area */}
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          placeholder="Write a reply..."
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          disabled={isClosed}
          rows={2}
          className={cn('resize-none', isClosed && 'opacity-50 cursor-not-allowed')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
          }}
        />
        <div className="flex justify-end">
          <Button
            onClick={handleSend}
            disabled={!replyBody.trim() || isClosed || addComment.isPending}
          >
            {addComment.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function IssueDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <Skeleton className="h-4 w-48" />
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" />
        <div className="flex gap-2"><Skeleton className="h-5 w-20 rounded-full" /><Skeleton className="h-5 w-16 rounded-full" /></div>
        <Skeleton className="h-3 w-64" />
      </div>
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="space-y-3">
        {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-3/4" style={{ marginLeft: i % 2 === 0 ? 'auto' : 0 }} />)}
      </div>
    </div>
  );
}
