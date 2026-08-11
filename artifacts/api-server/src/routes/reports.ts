import { Router, type IRouter } from "express";
import { eq, and, sql, desc } from "drizzle-orm";
import {
  db,
  transactionsTable,
  businessesTable,
  categoriesTable,
} from "@workspace/db";
import {
  GetReportSummaryParams,
  GetReportSummaryQueryParams,
  GetIncomeBreakdownParams,
  GetIncomeBreakdownQueryParams,
  GetReportExpenseBreakdownParams,
  GetReportExpenseBreakdownQueryParams,
  GetMissingReceiptsReportParams,
  GetMissingReceiptsReportQueryParams,
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

async function getCategoryBreakdown(
  businessId: number,
  type: "income" | "expense",
  startDate: string,
  endDate: string,
) {
  const txns = await db
    .select({
      amount: transactionsTable.amount,
      categoryId: transactionsTable.categoryId,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.businessId, businessId),
        eq(transactionsTable.type, type),
        sql`${transactionsTable.date} >= ${startDate}`,
        sql`${transactionsTable.date} <= ${endDate}`,
      ),
    );

  const catMap: Record<number | string, { total: number; count: number }> = {};
  txns.forEach((t) => {
    const key = t.categoryId ?? -1;
    if (!catMap[key]) catMap[key] = { total: 0, count: 0 };
    catMap[key].total += parseFloat(t.amount);
    catMap[key].count++;
  });

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
  return result;
}

// GET /businesses/:businessId/reports/summary
router.get(
  "/businesses/:businessId/reports/summary",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = GetReportSummaryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const query = GetReportSummaryQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const { startDate, endDate } = query.data;
    const txns = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.businessId, params.data.businessId),
          sql`${transactionsTable.date} >= ${startDate}`,
          sql`${transactionsTable.date} <= ${endDate}`,
        ),
      );

    const totalMoneyIn = txns
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalMoneyOut = txns
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const netCashFlow = totalMoneyIn - totalMoneyOut;
    const transactionCount = txns.length;
    const receiptsAttached = txns.filter((t) => t.receiptPath).length;
    const receiptsMissing = transactionCount - receiptsAttached;
    const receiptCoverage =
      transactionCount > 0
        ? Math.round((receiptsAttached / transactionCount) * 100)
        : 100;

    res.json({
      startDate,
      endDate,
      totalMoneyIn: totalMoneyIn.toFixed(2),
      totalMoneyOut: totalMoneyOut.toFixed(2),
      netCashFlow: netCashFlow.toFixed(2),
      transactionCount,
      receiptsAttached,
      receiptsMissing,
      receiptCoverage,
    });
  },
);

// GET /businesses/:businessId/reports/income-breakdown
router.get(
  "/businesses/:businessId/reports/income-breakdown",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = GetIncomeBreakdownParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const query = GetIncomeBreakdownQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const breakdown = await getCategoryBreakdown(
      params.data.businessId,
      "income",
      query.data.startDate,
      query.data.endDate,
    );
    res.json(breakdown);
  },
);

// GET /businesses/:businessId/reports/expense-breakdown
router.get(
  "/businesses/:businessId/reports/expense-breakdown",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = GetReportExpenseBreakdownParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const query = GetReportExpenseBreakdownQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: query.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const breakdown = await getCategoryBreakdown(
      params.data.businessId,
      "expense",
      query.data.startDate,
      query.data.endDate,
    );
    res.json(breakdown);
  },
);

// GET /businesses/:businessId/reports/missing-receipts
router.get(
  "/businesses/:businessId/reports/missing-receipts",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = GetMissingReceiptsReportParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const query = GetMissingReceiptsReportQueryParams.safeParse(req.query);
    const conditions = [
      eq(transactionsTable.businessId, params.data.businessId),
      sql`${transactionsTable.receiptPath} IS NULL`,
    ];
    if (query.success && query.data.startDate) {
      conditions.push(
        sql`${transactionsTable.date} >= ${query.data.startDate}`,
      );
    }
    if (query.success && query.data.endDate) {
      conditions.push(
        sql`${transactionsTable.date} <= ${query.data.endDate}`,
      );
    }
    const txns = await db
      .select()
      .from(transactionsTable)
      .where(and(...conditions))
      .orderBy(desc(transactionsTable.date));

    const enriched = txns.map((t) => ({
      ...t,
      categoryName: null,
      customerName: null,
      supplierName: null,
      receiptStatus: "missing",
    }));
    res.json(enriched);
  },
);

export default router;
