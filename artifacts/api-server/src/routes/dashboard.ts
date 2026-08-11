import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  db,
  transactionsTable,
  businessesTable,
  categoriesTable,
} from "@workspace/db";
import {
  GetDashboardStatsParams,
  GetDashboardStatsQueryParams,
  GetCashFlowChartParams,
  GetCashFlowChartQueryParams,
  GetExpenseBreakdownParams,
  GetExpenseBreakdownQueryParams,
  GetRecentTransactionsParams,
  GetRecentTransactionsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function verifyBusiness(userId: string, businessId: number) {
  const [business] = await db
    .select()
    .from(businessesTable)
    .where(
      and(
        eq(businessesTable.id, businessId),
        eq(businessesTable.userId, userId),
      ),
    );
  return business;
}

function getPeriodDates(period: string): { start: Date; end: Date } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDay();

  switch (period) {
    case "this_week": {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - day);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      return { start: startOfWeek, end: endOfWeek };
    }
    case "last_month": {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case "this_year": {
      const start = new Date(year, 0, 1);
      const end = new Date(year, 11, 31);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    default: {
      // this_month
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    }
  }
}

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

// GET /businesses/:businessId/dashboard
router.get(
  "/businesses/:businessId/dashboard",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = GetDashboardStatsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const query = GetDashboardStatsQueryParams.safeParse(req.query);
    const period = (query.success && query.data.period) ?? "this_month";
    const { start, end } = getPeriodDates(period);
    const startStr = toDateStr(start);
    const endStr = toDateStr(end);

    // Period transactions
    const periodTxns = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.businessId, params.data.businessId),
          sql`${transactionsTable.date} >= ${startStr}`,
          sql`${transactionsTable.date} <= ${endStr}`,
        ),
      );

    // All transactions for balance
    const allTxns = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.businessId, params.data.businessId));

    const totalMoneyIn = periodTxns
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalMoneyOut = periodTxns
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const netCashFlow = totalMoneyIn - totalMoneyOut;

    const allIn = allTxns
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const allOut = allTxns
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const balance = allIn - allOut;

    const transactionCount = allTxns.length;
    const receiptsAttached = allTxns.filter((t) => t.receiptPath).length;
    const receiptsMissing = transactionCount - receiptsAttached;
    const receiptCoverage =
      transactionCount > 0
        ? Math.round((receiptsAttached / transactionCount) * 100)
        : 100;

    res.json({
      totalMoneyIn: totalMoneyIn.toFixed(2),
      totalMoneyOut: totalMoneyOut.toFixed(2),
      netCashFlow: netCashFlow.toFixed(2),
      balance: balance.toFixed(2),
      transactionCount,
      receiptsAttached,
      receiptsMissing,
      receiptCoverage,
    });
  },
);

// GET /businesses/:businessId/dashboard/cashflow
router.get(
  "/businesses/:businessId/dashboard/cashflow",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = GetCashFlowChartParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const query = GetCashFlowChartQueryParams.safeParse(req.query);
    const period = (query.success && query.data.period) ?? "this_month";
    const { start, end } = getPeriodDates(period);

    const txns = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.businessId, params.data.businessId),
          sql`${transactionsTable.date} >= ${toDateStr(start)}`,
          sql`${transactionsTable.date} <= ${toDateStr(end)}`,
        ),
      );

    // Group by week or day depending on period
    const isWeek = period === "this_week";
    const isYear = period === "this_year";
    const groupMap: Record<string, { moneyIn: number; moneyOut: number }> = {};

    txns.forEach((t) => {
      const d = new Date(t.date);
      let label: string;
      if (isYear) {
        label = d.toLocaleString("en-US", { month: "short" });
      } else if (isWeek) {
        label = d.toLocaleString("en-US", { weekday: "short" });
      } else {
        label = `${d.getDate()} ${d.toLocaleString("en-US", { month: "short" })}`;
      }
      if (!groupMap[label]) groupMap[label] = { moneyIn: 0, moneyOut: 0 };
      if (t.type === "income") {
        groupMap[label].moneyIn += parseFloat(t.amount);
      } else {
        groupMap[label].moneyOut += parseFloat(t.amount);
      }
    });

    // Generate all labels for the period
    const points: Array<{ label: string; moneyIn: number; moneyOut: number }> =
      [];
    if (isYear) {
      const months = [
        "Jan","Feb","Mar","Apr","May","Jun",
        "Jul","Aug","Sep","Oct","Nov","Dec",
      ];
      months.forEach((m) => {
        points.push({
          label: m,
          moneyIn: groupMap[m]?.moneyIn ?? 0,
          moneyOut: groupMap[m]?.moneyOut ?? 0,
        });
      });
    } else if (isWeek) {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      days.forEach((d) => {
        points.push({
          label: d,
          moneyIn: groupMap[d]?.moneyIn ?? 0,
          moneyOut: groupMap[d]?.moneyOut ?? 0,
        });
      });
    } else {
      // Monthly — show every 3rd day for readability
      const cur = new Date(start);
      while (cur <= end) {
        const label = `${cur.getDate()} ${cur.toLocaleString("en-US", { month: "short" })}`;
        points.push({
          label,
          moneyIn: groupMap[label]?.moneyIn ?? 0,
          moneyOut: groupMap[label]?.moneyOut ?? 0,
        });
        cur.setDate(cur.getDate() + 1);
      }
    }

    res.json(points);
  },
);

// GET /businesses/:businessId/dashboard/expense-breakdown
router.get(
  "/businesses/:businessId/dashboard/expense-breakdown",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = GetExpenseBreakdownParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const query = GetExpenseBreakdownQueryParams.safeParse(req.query);
    const period = (query.success && query.data.period) ?? "this_month";
    const { start, end } = getPeriodDates(period);

    const txns = await db
      .select({
        amount: transactionsTable.amount,
        categoryId: transactionsTable.categoryId,
      })
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.businessId, params.data.businessId),
          eq(transactionsTable.type, "expense"),
          sql`${transactionsTable.date} >= ${toDateStr(start)}`,
          sql`${transactionsTable.date} <= ${toDateStr(end)}`,
        ),
      );

    const catMap: Record<number | string, { total: number; count: number }> =
      {};
    txns.forEach((t) => {
      const key = t.categoryId ?? -1;
      if (!catMap[key]) catMap[key] = { total: 0, count: 0 };
      catMap[key].total += parseFloat(t.amount);
      catMap[key].count++;
    });

    // Fetch category names
    const catIds = Object.keys(catMap)
      .map(Number)
      .filter((id) => id > 0);
    const cats =
      catIds.length > 0
        ? await db
            .select({ id: categoriesTable.id, name: categoriesTable.name })
            .from(categoriesTable)
            .where(sql`${categoriesTable.id} = ANY(${catIds})`)
        : [];
    const catNameMap: Record<number, string> = {};
    cats.forEach((c) => (catNameMap[c.id] = c.name));

    const result = Object.entries(catMap).map(([key, val]) => ({
      categoryName: catNameMap[Number(key)] ?? "Uncategorized",
      total: val.total,
      count: val.count,
    }));
    result.sort((a, b) => b.total - a.total);
    res.json(result);
  },
);

// GET /businesses/:businessId/dashboard/recent-transactions
router.get(
  "/businesses/:businessId/dashboard/recent-transactions",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = GetRecentTransactionsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const query = GetRecentTransactionsQueryParams.safeParse(req.query);
    const limit = (query.success && query.data.limit) ?? 10;

    const txns = await db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.businessId, params.data.businessId))
      .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
      .limit(limit);

    const enriched = await Promise.all(
      txns.map(async (t) => {
        const [category] = t.categoryId
          ? await db
              .select({ name: categoriesTable.name })
              .from(categoriesTable)
              .where(eq(categoriesTable.id, t.categoryId))
          : [];
        return {
          ...t,
          categoryName: category?.name ?? null,
          customerName: null,
          supplierName: null,
          receiptStatus: t.receiptPath ? "attached" : "missing",
        };
      }),
    );

    res.json(enriched);
  },
);

export default router;
