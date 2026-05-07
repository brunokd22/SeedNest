'use client';

import { useState } from 'react';
import { format, startOfMonth, startOfWeek, subMonths, endOfMonth } from 'date-fns';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarChart2,
  Building2,
  Calculator,
  Download,
  FileText,
  Loader2,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useAnalytics } from '@/lib/hooks/useReports';
import { useNurseries } from '@/lib/hooks/useNurseries';
import { authClient } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const formatUGX = (n: number) => `UGX ${Math.round(n).toLocaleString('en-UG')}`;
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

type Preset = 'week' | 'month' | 'lastMonth' | 'custom';

function getPresetDates(preset: Preset): { from: string; to: string } {
  const today = new Date();
  switch (preset) {
    case 'week':
      return {
        from: format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        to: format(today, 'yyyy-MM-dd'),
      };
    case 'month':
      return {
        from: format(startOfMonth(today), 'yyyy-MM-dd'),
        to: format(today, 'yyyy-MM-dd'),
      };
    case 'lastMonth': {
      const last = subMonths(today, 1);
      return {
        from: format(startOfMonth(last), 'yyyy-MM-dd'),
        to: format(endOfMonth(last), 'yyyy-MM-dd'),
      };
    }
    default:
      return { from: '', to: '' };
  }
}

export default function ReportsPage() {
  const { data: session } = authClient.useSession();
  const { data: nurseries } = useNurseries();

  // Filters state
  const [preset, setPreset] = useState<Preset>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [nurseryId, setNurseryId] = useState('');

  // Applied params (only update when user clicks Apply)
  const [appliedParams, setAppliedParams] = useState(() => {
    const d = getPresetDates('month');
    return { dateFrom: d.from, dateTo: d.to, nurseryId: '' };
  });

  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: analytics, isLoading } = useAnalytics(appliedParams);

  const activeDateFrom = preset === 'custom' ? customFrom : getPresetDates(preset).from;
  const activeDateTo = preset === 'custom' ? customTo : getPresetDates(preset).to;

  const handleApply = () => {
    setAppliedParams({
      dateFrom: activeDateFrom,
      dateTo: activeDateTo,
      nurseryId,
    });
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    const setter = type === 'excel' ? setExcelLoading : setPdfLoading;
    setter(true);
    try {
      const token = (session as unknown as { token?: string })?.token ?? '';
      const qs = new URLSearchParams({
        dateFrom: appliedParams.dateFrom,
        dateTo: appliedParams.dateTo,
        ...(appliedParams.nurseryId ? { nurseryId: appliedParams.nurseryId } : {}),
      });
      const res = await fetch(`${API_URL}/api/reports/export/${type}?${qs}`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seednest-report-${format(new Date(), 'yyyy-MM-dd')}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setter(false);
    }
  };

  const topNursery = analytics?.revenueByNursery?.sort((a, b) => b.revenue - a.revenue)[0];

  const PRESETS: { label: string; value: Preset }[] = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Last Month', value: 'lastMonth' },
    { label: 'Custom', value: 'custom' },
  ];

  return (
    <div className="space-y-6">
      {/* Sticky filters bar */}
      <div className="sticky top-0 z-10 bg-background border-b px-1 py-3 -mx-1">
        <div className="flex flex-wrap items-end gap-3">
          {/* Date preset buttons */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Period</p>
            <div className="flex gap-1">
              {PRESETS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPreset(p.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium border transition-colors',
                    preset === p.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border text-muted-foreground hover:bg-muted',
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom date pickers */}
          {preset === 'custom' && (
            <>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">From</p>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="h-9 rounded-md border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">To</p>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="h-9 rounded-md border px-3 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </>
          )}

          {/* Nursery select */}
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">Nursery</p>
            <Select value={nurseryId} onValueChange={setNurseryId}>
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

          <Button
            onClick={handleApply}
            disabled={preset === 'custom' && (!customFrom || !customTo)}
          >
            Apply
          </Button>
        </div>
      </div>

      {/* Empty / no-query state */}
      {!appliedParams.dateFrom && (
        <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
          <BarChart2 className="h-12 w-12 opacity-30" />
          <p>Select a date range and click Apply to view analytics.</p>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}><CardContent className="p-6"><Skeleton className="h-16 w-full" /></CardContent></Card>
            ))}
          </div>
          <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <Card className="lg:col-span-3"><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
            <Card className="lg:col-span-2"><CardContent className="p-6"><Skeleton className="h-48 w-full" /></CardContent></Card>
          </div>
        </div>
      )}

      {/* Empty data state */}
      {!isLoading && analytics && analytics.totalOrders === 0 && (
        <div className="flex flex-col items-center py-20 gap-3 text-muted-foreground">
          <BarChart2 className="h-12 w-12 opacity-30" />
          <p>No sales data for the selected period. Try a different date range.</p>
        </div>
      )}

      {/* Analytics content */}
      {!isLoading && analytics && analytics.totalOrders > 0 && (
        <>
          {/* Row 1: Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Revenue"
              value={formatUGX(analytics.totalRevenue)}
              icon={TrendingUp}
              iconBg="bg-green-100"
              iconColor="text-green-700"
              cardBg="bg-green-50/30"
            />
            <StatCard
              title="Total Orders"
              value={analytics.totalOrders.toString()}
              icon={ShoppingBag}
              iconBg="bg-blue-100"
              iconColor="text-blue-700"
              cardBg="bg-blue-50/30"
            />
            <StatCard
              title="Avg Order Value"
              value={formatUGX(analytics.avgOrderValue)}
              icon={Calculator}
              iconBg="bg-purple-100"
              iconColor="text-purple-700"
              cardBg="bg-purple-50/30"
            />
            <StatCard
              title="Top Nursery"
              value={topNursery?.nurseryName ?? '—'}
              icon={Building2}
              iconBg="bg-teal-100"
              iconColor="text-teal-700"
              cardBg="bg-teal-50/30"
            />
          </div>

          {/* Row 2: Revenue trend */}
          <Card>
            <CardHeader><CardTitle className="text-base">Revenue Over Time</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analytics.revenueByDay}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2D6A4F" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2D6A4F" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => format(new Date(d + 'T00:00:00'), 'dd MMM')}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickFormatter={(v) => `UGX ${(v / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 11 }}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'revenue'
                        ? [`UGX ${Number(value ?? 0).toLocaleString()}`, 'Revenue']
                        : [value, 'Orders']
                    }
                    labelFormatter={(label) => format(new Date(String(label) + 'T00:00:00'), 'dd MMM yyyy')}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2D6A4F"
                    fill="url(#revenueGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Row 3: Bar chart + Pie chart */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Revenue by nursery */}
            <Card className="lg:col-span-3">
              <CardHeader><CardTitle className="text-base">Revenue by Nursery</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    layout="vertical"
                    data={[...analytics.revenueByNursery].sort((a, b) => b.revenue - a.revenue)}
                  >
                    <XAxis
                      type="number"
                      tickFormatter={(v) => `UGX ${(v / 1000).toFixed(0)}K`}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="nurseryName"
                      width={120}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip formatter={(v) => `UGX ${Number(v ?? 0).toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#2D6A4F" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fulfillment type donut */}
            <Card className="lg:col-span-2">
              <CardHeader><CardTitle className="text-base">Order Breakdown</CardTitle></CardHeader>
              <CardContent>
                <div className="relative">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={analytics.ordersByFulfillmentType}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                      >
                        <Cell fill="#2D6A4F" />
                        <Cell fill="#52B788" />
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center -mt-6">
                      <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                      <p className="text-xs text-muted-foreground">orders</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 4: Top seedlings table */}
          <Card>
            <CardHeader><CardTitle className="text-base">Top Selling Seedlings</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Rank</TableHead>
                    <TableHead>Seedling Name</TableHead>
                    <TableHead className="text-right">Units Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics.topSeedlings.slice(0, 10).map((s, idx) => (
                    <TableRow key={s.seedlingId}>
                      <TableCell className="font-medium text-center">
                        {idx === 0 ? '🏆 1' : idx + 1}
                      </TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right">{s.totalSold.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatUGX(s.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Export section */}
          <div className="flex gap-3 pb-6">
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
              disabled={excelLoading}
            >
              {excelLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
              disabled={pdfLoading}
            >
              {pdfLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Export PDF
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  cardBg,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  cardBg: string;
}) {
  return (
    <Card className={cn('overflow-hidden', cardBg)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium">{title}</p>
            <p className="text-xl font-bold truncate">{value}</p>
          </div>
          <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0 ml-2', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
