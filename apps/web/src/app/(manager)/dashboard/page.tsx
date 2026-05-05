'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Leaf,
  TreePine,
} from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useDashboardStats } from '@/lib/hooks/useDashboard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-700',
  PROCESSING: 'bg-blue-100 text-blue-700',
  DISPATCHED: 'bg-amber-100 text-amber-700',
  DELIVERED: 'bg-green-100 text-green-700',
  READY_FOR_PICKUP: 'bg-purple-100 text-purple-700',
  COLLECTED: 'bg-green-100 text-green-700',
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const { data, isLoading } = useDashboardStats();

  const userName = session?.user?.name?.split(' ')[0] ?? 'there';

  // No nurseries state
  if (!isLoading && data && data.totalNurseries === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Card className="text-center py-16 px-8">
          <CardContent>
            <TreePine className="mx-auto h-16 w-16 text-green-300 mb-4" />
            <h2 className="text-xl font-semibold">Welcome to SeedNest!</h2>
            <p className="text-muted-foreground mt-2 mb-6">
              Create your first nursery to start managing seedlings and sales.
            </p>
            <Button asChild>
              <Link href="/dashboard/nurseries">Create Your First Nursery</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {userName}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your nurseries today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Nurseries"
          value={data?.totalNurseries ?? 0}
          icon={<TreePine className="h-6 w-6" />}
          iconBg="bg-green-100"
          iconColor="text-green-700"
          isLoading={isLoading}
          description="Active nurseries"
        />
        <StatCard
          title="Total Seedlings"
          value={data?.totalSeedlings ?? 0}
          icon={<Leaf className="h-6 w-6" />}
          iconBg="bg-teal-100"
          iconColor="text-teal-700"
          isLoading={isLoading}
          description="Across all nurseries"
        />
        <StatCard
          title="Revenue This Month"
          value={
            data ? `UGX ${data.revenueThisMonth.toLocaleString()}` : 'UGX 0'
          }
          icon={<DollarSign className="h-6 w-6" />}
          iconBg="bg-emerald-100"
          iconColor="text-emerald-700"
          isLoading={isLoading}
          description="Current calendar month"
        />
        <StatCard
          title="Open Issues"
          value={data?.openIssuesCount ?? 0}
          icon={<AlertCircle className="h-6 w-6" />}
          iconBg="bg-orange-100"
          iconColor="text-orange-700"
          isLoading={isLoading}
          description="Require attention"
        />
      </div>

      {/* Bottom row: recent orders + low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent orders (col-span-3) */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Orders</CardTitle>
            <Link
              href="/dashboard/orders"
              className="text-sm text-primary hover:underline"
            >
              View all →
            </Link>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Nursery</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 6 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !data?.recentOrders.length ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No orders yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.orderNumber}
                      </TableCell>
                      <TableCell className="text-sm">{order.nurseryName}</TableCell>
                      <TableCell className="text-sm">{order.customerName}</TableCell>
                      <TableCell className="text-sm">
                        UGX {order.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'text-xs hover:opacity-100',
                            STATUS_BADGE[order.fulfillmentStatus] ??
                              'bg-gray-100 text-gray-700',
                          )}
                        >
                          {order.fulfillmentStatus.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(order.createdAt), 'MMM d')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Low stock (col-span-2) */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Low Stock</CardTitle>
            </div>
            <Link
              href="/dashboard/nurseries"
              className="text-sm text-primary hover:underline"
            >
              Manage inventory →
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-10" />
                </div>
              ))
            ) : !data?.lowStockSeedlings.length ? (
              <div className="flex items-center gap-2 text-green-600 py-4">
                <CheckCircle className="h-5 w-5 shrink-0" />
                <p className="text-sm font-medium">
                  All seedlings are well-stocked ✓
                </p>
              </div>
            ) : (
              data.lowStockSeedlings.map((item) => (
                <div
                  key={item.seedlingId}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.nurseryName}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'text-sm font-semibold shrink-0 tabular-nums',
                      item.quantity <= 2 ? 'text-red-600' : 'text-amber-600',
                    )}
                  >
                    {item.quantity}/{item.threshold}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
