'use client';

import { useState } from 'react';
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
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useManagerIssue,
  useAddManagerComment,
  useUpdateIssueStatus,
  type IssueComment,
} from '@/lib/hooks/useManagerIssues';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  REPLACEMENT_REQUEST: { icon: RefreshCw, color: 'bg-orange-100 text-orange-700', label: 'Replacement Request' },
  QUERY: { icon: HelpCircle, color: 'bg-blue-100 text-blue-700', label: 'Query' },
  COMPLAINT: { icon: AlertTriangle, color: 'bg-red-100 text-red-700', label: 'Complaint' },
  GENERAL_REQUEST: { icon: MessageSquare, color: 'bg-gray-100 text-gray-700', label: 'General Request' },
};

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
  CLOSED: 'bg-gray-100 text-gray-700',
};

const STATUS_OPTIONS = [
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

type OptimisticComment = IssueComment & { isPending?: boolean };

export default function ManagerIssueDetailPage() {
  const { issueId } = useParams<{ issueId: string }>();
  const { data: session } = authClient.useSession();
  const { data: issue, isLoading, error } = useManagerIssue(issueId);
  const addComment = useAddManagerComment(issueId);
  const updateStatus = useUpdateIssueStatus(issueId);

  const [replyBody, setReplyBody] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [optimisticComments, setOptimisticComments] = useState<OptimisticComment[]>([]);

  // Set selectedStatus once issue loads
  if (issue && !selectedStatus) {
    setSelectedStatus(issue.status);
  }

  if (isLoading) return <ManagerIssueSkeleton />;

  if (error || !issue) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-muted-foreground/40 mx-auto" />
        <p className="text-muted-foreground">Issue not found.</p>
        <Button variant="outline" asChild>
          <Link href="/dashboard/issues">Back to Issues</Link>
        </Button>
      </div>
    );
  }

  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.GENERAL_REQUEST;
  const TypeIcon = typeConf.icon;
  const allComments: OptimisticComment[] = [...issue.comments, ...optimisticComments];

  const handleSend = () => {
    const body = replyBody.trim();
    if (!body) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: OptimisticComment = {
      id: tempId,
      issueId,
      authorId: session?.user?.id ?? '',
      body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: { name: session?.user?.name ?? 'You', role: 'MANAGER' },
      isPending: true,
    };
    setOptimisticComments((prev) => [...prev, optimistic]);
    setReplyBody('');

    addComment.mutate(
      { body },
      {
        onSuccess: () => {
          setOptimisticComments((prev) => prev.filter((c) => c.id !== tempId));
          toast.success('Reply sent');
        },
        onError: () => {
          setOptimisticComments((prev) => prev.filter((c) => c.id !== tempId));
          toast.error('Failed to send reply');
        },
      },
    );
  };

  const handleUpdateStatus = () => {
    if (!selectedStatus || selectedStatus === issue.status) return;
    updateStatus.mutate({ status: selectedStatus });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ── Left column: thread (65%) ─────────────────────────────────────── */}
      <div className="lg:col-span-3 space-y-5">
        <div>
          <h2 className="text-xl font-bold leading-snug">{issue.title}</h2>
        </div>

        {/* Description */}
        <Card>
          <CardContent className="pt-5 pb-3">
            <p className="text-sm whitespace-pre-wrap">{issue.description}</p>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground border-t pt-3">
            {issue.customer?.name} · {format(new Date(issue.createdAt), 'dd MMM yyyy, HH:mm')}
          </CardFooter>
        </Card>

        {/* Comment thread */}
        {allComments.length > 0 && (
          <div className="space-y-3">
            <Separator />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Thread</p>
            {allComments.map((comment) => {
              const isManager = comment.author.role === 'MANAGER';
              const initials = comment.author.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
              return (
                <div
                  key={comment.id}
                  className={cn('flex gap-3', isManager ? 'flex-row-reverse' : 'flex-row')}
                >
                  <div className={cn('h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', isManager ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800')}>
                    {initials}
                  </div>
                  <div className={cn('max-w-[75%] space-y-1 flex flex-col', isManager ? 'items-end' : 'items-start')}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{comment.author.name}</span>
                      {isManager && (
                        <Badge className="text-[10px] py-0 bg-green-100 text-green-800 hover:bg-green-100">Manager</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <div className={cn(
                      'rounded-2xl px-4 py-2.5 text-sm',
                      isManager ? 'rounded-tr-sm bg-[#D1FAE5] text-green-900' : 'rounded-tl-sm bg-[#DBEAFE] text-blue-900',
                      (comment as OptimisticComment).isPending && 'opacity-50',
                    )}>
                      <p className="whitespace-pre-wrap">{comment.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply form */}
        <div className="space-y-2 pt-2">
          <Textarea
            placeholder="Write a reply to the customer..."
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={3}
            className="resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
            }}
          />
          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={!replyBody.trim() || addComment.isPending}>
              {addComment.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Reply
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right column: sidebar (35%) ───────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">
        {/* Status card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-center">
              <Badge className={cn('text-sm px-4 py-1 hover:opacity-100', STATUS_COLOR[issue.status] ?? 'bg-gray-100 text-gray-700')}>
                {issue.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              className="w-full"
              onClick={handleUpdateStatus}
              disabled={updateStatus.isPending || selectedStatus === issue.status}
            >
              {updateStatus.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Status
            </Button>
          </CardContent>
        </Card>

        {/* Issue details card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Issue Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Type">
              <Badge className={cn('text-xs hover:opacity-100', typeConf.color)}>
                <TypeIcon className="h-3 w-3 mr-1" />
                {typeConf.label}
              </Badge>
            </DetailRow>
            <DetailRow label="Customer">
              <div>
                <p className="font-medium">{issue.customer?.name}</p>
                {issue.customer && 'email' in issue.customer && (
                  <a href={`mailto:${(issue.customer as { email: string }).email}`} className="text-xs text-primary hover:underline">
                    {(issue.customer as { email: string }).email}
                  </a>
                )}
              </div>
            </DetailRow>
            <DetailRow label="Nursery">
              <span>{issue.nursery.name}</span>
            </DetailRow>
            <DetailRow label="Linked Order">
              {issue.order ? (
                <Link href={`/dashboard/orders/${issue.order.id}`} className="text-primary hover:underline font-mono text-xs">
                  #{issue.order.id.slice(0, 8).toUpperCase()}
                </Link>
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </DetailRow>
            <DetailRow label="Linked Seedling">
              {issue.seedling ? (
                <span className="text-xs">{issue.seedling.name}</span>
              ) : (
                <span className="text-muted-foreground">None</span>
              )}
            </DetailRow>
            <DetailRow label="Created">
              <span className="text-muted-foreground">
                {format(new Date(issue.createdAt), 'dd MMM yyyy HH:mm')}
              </span>
            </DetailRow>
            <DetailRow label="Updated">
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
              </span>
            </DetailRow>
          </CardContent>
        </Card>

        {/* Customer info card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Customer Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-sm font-bold">
                {issue.customer?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'}
              </div>
              <div>
                <p className="font-semibold text-sm">{issue.customer?.name}</p>
                {issue.customer && 'email' in issue.customer && (
                  <p className="text-xs text-muted-foreground">
                    {(issue.customer as { email: string }).email}
                  </p>
                )}
                {issue.customer && 'createdAt' in issue.customer && (
                  <p className="text-xs text-muted-foreground">
                    Member since {format(new Date((issue.customer as { createdAt: string }).createdAt), 'dd MMM yyyy')}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground shrink-0 text-xs mt-0.5">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

function ManagerIssueSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-16 w-3/4" style={{ marginLeft: i % 2 !== 0 ? 'auto' : 0 }} />)}
        </div>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </div>
    </div>
  );
}
