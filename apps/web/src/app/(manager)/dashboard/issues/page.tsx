'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Eye,
  HelpCircle,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useNurseries } from '@/lib/hooks/useNurseries';
import { useManagerIssues, type Issue } from '@/lib/hooks/useManagerIssues';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

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

const STATUS_OPTIONS = [
  { label: 'All Statuses', value: '' },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

const TYPE_OPTIONS = [
  { label: 'All Types', value: '' },
  { label: 'Replacement Request', value: 'REPLACEMENT_REQUEST' },
  { label: 'Query', value: 'QUERY' },
  { label: 'Complaint', value: 'COMPLAINT' },
  { label: 'General Request', value: 'GENERAL_REQUEST' },
];

export default function ManagerIssuesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const nurseryId = searchParams.get('nurseryId') ?? '';
  const status = searchParams.get('status') ?? '';
  const type = searchParams.get('type') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';
  const page = parseInt(searchParams.get('page') ?? '1') || 1;

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== 'page') params.delete('page');
    router.replace(`${pathname}?${params}`);
  };

  const { data: nurseries } = useNurseries();

  // Main list
  const { data: result, isLoading } = useManagerIssues({
    nurseryId: nurseryId || undefined,
    status: status || undefined,
    type: type || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize: PAGE_SIZE,
  });

  // Stat counts (parallel)
  const { data: openData } = useManagerIssues({ status: 'OPEN', page: 1, pageSize: 1 });
  const { data: inProgressData } = useManagerIssues({ status: 'IN_PROGRESS', page: 1, pageSize: 1 });
  const { data: resolvedData } = useManagerIssues({ status: 'RESOLVED', page: 1, pageSize: 1 });

  const total = result?.total ?? 0;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-2xl font-semibold">Support Issues</h1>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="text-sm text-muted-foreground">Open</span>
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">
            {openData?.total ?? '—'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="text-sm text-muted-foreground">In Progress</span>
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
            {inProgressData?.total ?? '—'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 rounded-lg border px-4 py-2">
          <span className="text-sm text-muted-foreground">Resolved</span>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            {resolvedData?.total ?? '—'}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Nursery</Label>
          <Select value={nurseryId} onValueChange={(v) => updateFilter('nurseryId', v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Nurseries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Nurseries</SelectItem>
              {nurseries?.map((n) => (
                <SelectItem key={n.id} value={n.id}>{n.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={(v) => updateFilter('status', v)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Type</Label>
          <Select value={type} onValueChange={(v) => updateFilter('type', v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input
            type="date"
            className="w-36"
            value={dateFrom}
            onChange={(e) => updateFilter('dateFrom', e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input
            type="date"
            className="w-36"
            value={dateTo}
            onChange={(e) => updateFilter('dateTo', e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Nursery</TableHead>
              <TableHead className="text-center">Replies</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 10 }).map((__, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : !result?.data.length ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                  No issues found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              result.data.map((issue, idx) => (
                <IssueRow key={issue.id} issue={issue} rowNum={(page - 1) * PAGE_SIZE + idx + 1} />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Showing {from}–{to} of {total} issues
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateFilter('page', String(page - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateFilter('page', String(page + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function IssueRow({ issue, rowNum }: { issue: Issue; rowNum: number }) {
  const router = useRouter();
  const typeConf = TYPE_CONFIG[issue.type] ?? TYPE_CONFIG.GENERAL_REQUEST;
  const TypeIcon = typeConf.icon;
  const isOpen = issue.status === 'OPEN';

  return (
    <TableRow
      className={cn('cursor-pointer hover:bg-muted/40', isOpen && 'border-l-4 border-orange-400')}
      onClick={() => router.push(`/dashboard/issues/${issue.id}`)}
    >
      <TableCell className="text-xs text-muted-foreground">{rowNum}</TableCell>
      <TableCell className="max-w-[180px]">
        <Link
          href={`/dashboard/issues/${issue.id}`}
          className="font-medium text-sm hover:text-primary truncate block"
          onClick={(e) => e.stopPropagation()}
        >
          {issue.title.length > 40 ? issue.title.slice(0, 40) + '…' : issue.title}
        </Link>
      </TableCell>
      <TableCell>
        <Badge className={cn('text-xs hover:opacity-100', typeConf.color)}>
          <TypeIcon className="h-3 w-3 mr-1" />
          {typeConf.label}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge className={cn('text-xs hover:opacity-100', STATUS_COLOR[issue.status] ?? 'bg-gray-100 text-gray-700')}>
          {issue.status.replace(/_/g, ' ')}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">{issue.customer?.name ?? '—'}</TableCell>
      <TableCell className="text-sm">{issue.nursery.name}</TableCell>
      <TableCell className="text-center text-sm">{issue._count?.comments ?? 0}</TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {format(new Date(issue.createdAt), 'dd MMM yyyy')}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
      </TableCell>
      <TableCell>
        <Button
          variant="ghost"
          size="icon"
          asChild
          onClick={(e) => e.stopPropagation()}
        >
          <Link href={`/dashboard/issues/${issue.id}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      </TableCell>
    </TableRow>
  );
}
