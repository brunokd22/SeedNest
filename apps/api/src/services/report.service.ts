import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { prisma } from '../config/prisma';
import { ForbiddenError } from '../middleware/errorHandler';

// ── Types ─────────────────────────────────────────────────────────────────────
type SalesAnalyticsResult = {
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  revenueByDay: { date: string; revenue: number; orders: number }[];
  revenueByNursery: { nurseryId: string; nurseryName: string; revenue: number; orders: number }[];
  topSeedlings: { seedlingId: string; name: string; totalSold: number; revenue: number }[];
  ordersByFulfillmentType: { type: string; count: number }[];
  ordersBySaleMethod: { method: string; count: number }[];
};

type ReportParams = {
  dateFrom: Date;
  dateTo: Date;
  nurseryId?: string;
};

type RawDayRow = { date: Date; revenue: unknown; orders: unknown };
type RawSeedlingRow = { seedlingId: string; seedlingName: string; totalSold: unknown; revenue: unknown };

// ── helpers ───────────────────────────────────────────────────────────────────
async function resolveNurseryIds(managerId: string, nurseryId?: string): Promise<string[]> {
  const nurseries = await prisma.nursery.findMany({
    where: { managerId },
    select: { id: true },
  });
  const allIds = nurseries.map((n) => n.id);
  if (nurseryId) {
    if (!allIds.includes(nurseryId)) throw new ForbiddenError();
    return [nurseryId];
  }
  return allIds;
}

// ── getSalesAnalytics ─────────────────────────────────────────────────────────
export async function getSalesAnalytics(
  managerId: string,
  params: ReportParams,
): Promise<SalesAnalyticsResult> {
  const nurseryIds = await resolveNurseryIds(managerId, params.nurseryId);

  const where = {
    nurseryId: { in: nurseryIds },
    createdAt: { gte: params.dateFrom, lte: params.dateTo },
  };

  // Run all queries in parallel
  const [summary, byNurseryRaw, byFulfillment, bySaleMethod, byDayRaw, topSeedlingsRaw] =
    await Promise.all([
      // a. Summary stats
      prisma.order.aggregate({
        where,
        _sum: { totalAmount: true },
        _count: { id: true },
        _avg: { totalAmount: true },
      }),

      // c. Revenue by nursery
      prisma.order.groupBy({
        by: ['nurseryId'],
        where,
        _sum: { totalAmount: true },
        _count: { id: true },
      }),

      // e. By fulfillment type
      prisma.order.groupBy({
        by: ['fulfillmentType'],
        where,
        _count: { id: true },
      }),

      // f. By sale method
      prisma.order.groupBy({
        by: ['saleMethod'],
        where,
        _count: { id: true },
      }),

      // b. Revenue by day (raw SQL)
      prisma.$queryRaw<RawDayRow[]>`
        SELECT DATE("createdAt") as date,
               SUM("totalAmount") as revenue,
               COUNT(id)::int as orders
        FROM "Order"
        WHERE "nurseryId" = ANY(${nurseryIds})
          AND "createdAt" >= ${params.dateFrom}
          AND "createdAt" <= ${params.dateTo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,

      // d. Top 10 seedlings
      prisma.$queryRaw<RawSeedlingRow[]>`
        SELECT oi."seedlingId",
               oi."seedlingName",
               SUM(oi.quantity)::int as "totalSold",
               SUM(oi."unitPrice" * oi.quantity) as revenue
        FROM "OrderItem" oi
        INNER JOIN "Order" o ON oi."orderId" = o.id
        WHERE o."nurseryId" = ANY(${nurseryIds})
          AND o."createdAt" >= ${params.dateFrom}
          AND o."createdAt" <= ${params.dateTo}
        GROUP BY oi."seedlingId", oi."seedlingName"
        ORDER BY revenue DESC
        LIMIT 10
      `,
    ]);

  // Enrich nursery names
  const nurseries = await prisma.nursery.findMany({
    where: { id: { in: nurseryIds } },
    select: { id: true, name: true },
  });
  const nurseryMap = new Map(nurseries.map((n) => [n.id, n.name]));

  return {
    totalRevenue: summary._sum.totalAmount ?? 0,
    totalOrders: summary._count.id,
    avgOrderValue: summary._avg.totalAmount ?? 0,

    revenueByDay: byDayRaw.map((r) => ({
      date: format(new Date(r.date), 'yyyy-MM-dd'),
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    })),

    revenueByNursery: byNurseryRaw.map((r) => ({
      nurseryId: r.nurseryId,
      nurseryName: nurseryMap.get(r.nurseryId) ?? r.nurseryId,
      revenue: r._sum.totalAmount ?? 0,
      orders: r._count.id,
    })),

    topSeedlings: topSeedlingsRaw.map((r) => ({
      seedlingId: r.seedlingId,
      name: r.seedlingName,
      totalSold: Number(r.totalSold),
      revenue: Number(r.revenue),
    })),

    ordersByFulfillmentType: byFulfillment.map((r) => ({
      type: r.fulfillmentType,
      count: r._count.id,
    })),

    ordersBySaleMethod: bySaleMethod.map((r) => ({
      method: r.saleMethod,
      count: r._count.id,
    })),
  };
}

// ── shared: fetch orders list ─────────────────────────────────────────────────
async function fetchOrdersList(nurseryIds: string[], params: ReportParams) {
  return prisma.order.findMany({
    where: {
      nurseryId: { in: nurseryIds },
      createdAt: { gte: params.dateFrom, lte: params.dateTo },
    },
    include: {
      nursery: { select: { name: true } },
      customer: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

// ── exportToExcel ─────────────────────────────────────────────────────────────
export async function exportToExcel(managerId: string, params: ReportParams): Promise<Buffer> {
  const nurseryIds = await resolveNurseryIds(managerId, params.nurseryId);
  const [analytics, orders] = await Promise.all([
    getSalesAnalytics(managerId, params),
    fetchOrdersList(nurseryIds, params),
  ]);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SeedNest';
  workbook.created = new Date();

  const GREEN = '2D6A4F';
  const WHITE = 'FFFFFF';
  const LIGHT_GRAY = 'F2F2F2';

  const headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: WHITE } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: GREEN } } as ExcelJS.FillPattern,
    alignment: { vertical: 'middle', horizontal: 'center' },
  };

  // ── Sheet 1: Summary ──────────────────────────────────────────────────────
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Label', key: 'label', width: 24 },
    { header: 'Value', key: 'value', width: 30 },
  ];
  summarySheet.getRow(1).font = { bold: true };

  const dateRangeStr = `${format(params.dateFrom, 'dd MMM yyyy')} – ${format(params.dateTo, 'dd MMM yyyy')}`;
  [
    ['Total Revenue (UGX)', analytics.totalRevenue.toLocaleString()],
    ['Total Orders', analytics.totalOrders.toString()],
    ['Avg Order Value (UGX)', Math.round(analytics.avgOrderValue).toLocaleString()],
    ['Date Range', dateRangeStr],
    ['Generated At', format(new Date(), 'dd MMM yyyy HH:mm')],
  ].forEach(([label, value]) => {
    const row = summarySheet.addRow({ label, value });
    row.getCell(1).font = { bold: true };
  });

  // ── Sheet 2: Orders ───────────────────────────────────────────────────────
  const ordersSheet = workbook.addWorksheet('Orders');
  ordersSheet.columns = [
    { key: 'orderNum', width: 12 },
    { key: 'date', width: 14 },
    { key: 'nursery', width: 20 },
    { key: 'customer', width: 20 },
    { key: 'items', width: 8 },
    { key: 'total', width: 14 },
    { key: 'method', width: 10 },
    { key: 'status', width: 14 },
  ];
  const ordersHeader = ordersSheet.addRow([
    'Order #', 'Date', 'Nursery', 'Customer', 'Items', 'Total (UGX)', 'Method', 'Status',
  ]);
  ordersHeader.eachCell((cell) => Object.assign(cell, { style: headerStyle }));

  orders.forEach((order, idx) => {
    const row = ordersSheet.addRow([
      order.id.slice(0, 8).toUpperCase(),
      format(new Date(order.createdAt), 'dd MMM yyyy'),
      order.nursery.name,
      order.customer?.name ?? order.guestName ?? 'Walk-in',
      order._count.items,
      order.totalAmount,
      order.saleMethod,
      order.fulfillmentStatus,
    ]);
    if (idx % 2 !== 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } } as ExcelJS.FillPattern;
      });
    }
  });

  // ── Sheet 3: Top Seedlings ────────────────────────────────────────────────
  const seedlingsSheet = workbook.addWorksheet('Top Seedlings');
  seedlingsSheet.columns = [
    { key: 'rank', width: 6 },
    { key: 'name', width: 28 },
    { key: 'unitsSold', width: 12 },
    { key: 'revenue', width: 16 },
  ];
  const seedHeader = seedlingsSheet.addRow(['Rank', 'Seedling Name', 'Units Sold', 'Revenue (UGX)']);
  seedHeader.eachCell((cell) => Object.assign(cell, { style: headerStyle }));
  analytics.topSeedlings.forEach((s, idx) => {
    const row = seedlingsSheet.addRow([idx + 1, s.name, s.totalSold, s.revenue]);
    if (idx % 2 !== 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } } as ExcelJS.FillPattern;
      });
    }
  });

  // ── Sheet 4: By Nursery ───────────────────────────────────────────────────
  const nurserySheet = workbook.addWorksheet('By Nursery');
  nurserySheet.columns = [
    { key: 'name', width: 24 },
    { key: 'revenue', width: 20 },
    { key: 'orders', width: 14 },
    { key: 'avg', width: 20 },
  ];
  const nurseryHeader = nurserySheet.addRow([
    'Nursery Name', 'Total Revenue (UGX)', 'Total Orders', 'Avg Order Value (UGX)',
  ]);
  nurseryHeader.eachCell((cell) => Object.assign(cell, { style: headerStyle }));
  analytics.revenueByNursery.forEach((n, idx) => {
    const avg = n.orders > 0 ? Math.round(n.revenue / n.orders) : 0;
    const row = nurserySheet.addRow([n.nurseryName, n.revenue, n.orders, avg]);
    if (idx % 2 !== 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT_GRAY } } as ExcelJS.FillPattern;
      });
    }
  });

  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf);
}

// ── exportToPDF ───────────────────────────────────────────────────────────────
export async function exportToPDF(managerId: string, params: ReportParams): Promise<Buffer> {
  const nurseryIds = await resolveNurseryIds(managerId, params.nurseryId);
  const [analytics, orders, manager] = await Promise.all([
    getSalesAnalytics(managerId, params),
    fetchOrdersList(nurseryIds, params),
    prisma.user.findUnique({ where: { id: managerId }, select: { name: true } }),
  ]);

  return new Promise<Buffer>((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));

    const GREEN = '#2D6A4F';
    const DARK = '#1a1a1a';
    const GRAY = '#6B7280';
    const PAGE_W = doc.page.width - 100; // usable width

    // ── Cover page ───────────────────────────────────────────────────────────
    doc.fontSize(24).font('Helvetica-Bold').fillColor(GREEN).text('SeedNest', 50, 60);
    doc.fontSize(18).font('Helvetica').fillColor(DARK).text('Sales Report', { continued: false });
    doc.moveDown(0.5);
    doc.fontSize(12).fillColor(GRAY).text(
      `Date Range: ${format(params.dateFrom, 'dd MMM yyyy')} – ${format(params.dateTo, 'dd MMM yyyy')}`,
    );
    doc.text(`Manager: ${manager?.name ?? managerId}`);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}`);
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke(GRAY);
    doc.moveDown();

    // ── Summary stats ─────────────────────────────────────────────────────────
    doc.fontSize(14).font('Helvetica-Bold').fillColor(DARK).text('Summary', { underline: true });
    doc.moveDown(0.5);

    const stats = [
      ['Total Revenue', `UGX ${analytics.totalRevenue.toLocaleString()}`],
      ['Total Orders', analytics.totalOrders.toString()],
      ['Avg Order Value', `UGX ${Math.round(analytics.avgOrderValue).toLocaleString()}`],
    ];

    const colW = PAGE_W / stats.length;
    const statY = doc.y;
    stats.forEach(([label, value], i) => {
      const x = 50 + i * colW;
      doc.fontSize(10).font('Helvetica').fillColor(GRAY).text(label, x, statY, { width: colW });
      doc.fontSize(14).font('Helvetica-Bold').fillColor(DARK).text(value, x, statY + 16, { width: colW });
    });
    doc.y = statY + 50;
    doc.moveDown();

    // ── Top Seedlings table ───────────────────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK).text('Top Selling Seedlings');
    doc.moveDown(0.5);

    const seedCols = [40, PAGE_W - 140, 60, 80];
    const seedHeaders = ['#', 'Seedling', 'Sold', 'Revenue'];
    const ROW_H = 20;

    // Header row
    let x = 50;
    const hY = doc.y;
    doc.rect(50, hY, PAGE_W, ROW_H).fill(GREEN);
    seedHeaders.forEach((h, i) => {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#fff').text(h, x + 4, hY + 5, { width: seedCols[i], lineBreak: false });
      x += seedCols[i];
    });
    doc.y = hY + ROW_H;

    analytics.topSeedlings.forEach((s, idx) => {
      if (doc.y > doc.page.height - 100) doc.addPage();
      const rY = doc.y;
      if (idx % 2 === 1) doc.rect(50, rY, PAGE_W, ROW_H).fill('#F9FAFB');
      let rx = 50;
      [
        (idx + 1).toString(),
        s.name.slice(0, 30),
        s.totalSold.toString(),
        `UGX ${s.revenue.toLocaleString()}`,
      ].forEach((val, i) => {
        doc.fontSize(9).font('Helvetica').fillColor(DARK).text(val, rx + 4, rY + 5, { width: seedCols[i], lineBreak: false });
        rx += seedCols[i];
      });
      doc.y = rY + ROW_H;
    });

    doc.moveDown();

    // ── Orders table ──────────────────────────────────────────────────────────
    if (doc.y > doc.page.height - 150) doc.addPage();
    doc.fontSize(12).font('Helvetica-Bold').fillColor(DARK).text('Orders');
    doc.moveDown(0.5);

    const ordCols = [55, 65, 90, 70, 55, 70];
    const ordHeaders = ['Order #', 'Date', 'Customer', 'Total', 'Method', 'Status'];

    // Header row
    let ox = 50;
    const ohY = doc.y;
    doc.rect(50, ohY, PAGE_W, ROW_H).fill(GREEN);
    ordHeaders.forEach((h, i) => {
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#fff').text(h, ox + 3, ohY + 5, { width: ordCols[i], lineBreak: false });
      ox += ordCols[i];
    });
    doc.y = ohY + ROW_H;

    orders.forEach((order, idx) => {
      if (doc.y > doc.page.height - 80) doc.addPage();
      const rY = doc.y;
      if (idx % 2 === 1) doc.rect(50, rY, PAGE_W, ROW_H).fill('#F9FAFB');
      let rx = 50;
      [
        order.id.slice(0, 8).toUpperCase(),
        format(new Date(order.createdAt), 'dd MMM yyyy'),
        (order.customer?.name ?? order.guestName ?? 'Walk-in').slice(0, 14),
        `UGX ${order.totalAmount.toLocaleString()}`,
        order.saleMethod,
        order.fulfillmentStatus.replace(/_/g, ' ').slice(0, 10),
      ].forEach((val, i) => {
        doc.fontSize(8).font('Helvetica').fillColor(DARK).text(String(val), rx + 3, rY + 5, { width: ordCols[i], lineBreak: false });
        rx += ordCols[i];
      });
      doc.y = rY + ROW_H;
    });

    doc.end();
  });
}
