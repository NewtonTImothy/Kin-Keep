import { Router, type IRouter } from "express";
import { eq, and, sql, ilike, or, desc } from "drizzle-orm";
import {
  db,
  transactionsTable,
  businessesTable,
  categoriesTable,
  customersTable,
  suppliersTable,
} from "@workspace/db";
import {
  ListTransactionsParams,
  ListTransactionsQueryParams,
  CreateTransactionParams,
  CreateTransactionBody,
  GetTransactionParams,
  UpdateTransactionParams,
  UpdateTransactionBody,
  DeleteTransactionParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function verifyBusiness(userId: string, businessId: number) {
  const [business] = await db
    .select()
    .from(businessesTable)
    .where(
      and(eq(businessesTable.id, businessId), eq(businessesTable.userId, userId)),
    );
  return business;
}

function generateReferenceNumber(id: number, prefix: string): string {
  return `KK-${prefix}-${String(id).padStart(6, "0")}`;
}

async function enrichTransaction(txn: typeof transactionsTable.$inferSelect) {
  const [category] = txn.categoryId
    ? await db
        .select({ name: categoriesTable.name })
        .from(categoriesTable)
        .where(eq(categoriesTable.id, txn.categoryId))
    : [];
  const [customer] = txn.customerId
    ? await db
        .select({ name: customersTable.name })
        .from(customersTable)
        .where(eq(customersTable.id, txn.customerId))
    : [];
  const [supplier] = txn.supplierId
    ? await db
        .select({ name: suppliersTable.name })
        .from(suppliersTable)
        .where(eq(suppliersTable.id, txn.supplierId))
    : [];
  return {
    ...txn,
    categoryName: category?.name ?? null,
    customerName: customer?.name ?? null,
    supplierName: supplier?.name ?? null,
    receiptStatus: txn.receiptPath ? "attached" : "missing",
  };
}

// GET /businesses/:businessId/transactions
router.get(
  "/businesses/:businessId/transactions",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = ListTransactionsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const query = ListTransactionsQueryParams.safeParse(req.query);
    const {
      type,
      categoryId,
      paymentMethod,
      receiptStatus,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = query.success ? query.data : {};

    const conditions = [eq(transactionsTable.businessId, params.data.businessId)];
    if (type) conditions.push(eq(transactionsTable.type, type));
    if (categoryId) conditions.push(eq(transactionsTable.categoryId, categoryId));
    if (paymentMethod) conditions.push(eq(transactionsTable.paymentMethod, paymentMethod));
    if (receiptStatus === "attached") {
      conditions.push(sql`${transactionsTable.receiptPath} IS NOT NULL`);
    } else if (receiptStatus === "missing") {
      conditions.push(sql`${transactionsTable.receiptPath} IS NULL`);
    }
    if (startDate) conditions.push(sql`${transactionsTable.date} >= ${startDate}`);
    if (endDate) conditions.push(sql`${transactionsTable.date} <= ${endDate}`);
    if (search) {
      conditions.push(
        or(
          ilike(transactionsTable.description, `%${search}%`),
          ilike(transactionsTable.referenceNumber, `%${search}%`),
        )!,
      );
    }

    const pageNum = page ?? 1;
    const limitNum = limit ?? 20;
    const offset = (pageNum - 1) * limitNum;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(transactionsTable)
      .where(and(...conditions));

    const txns = await db
      .select()
      .from(transactionsTable)
      .where(and(...conditions))
      .orderBy(desc(transactionsTable.date), desc(transactionsTable.createdAt))
      .limit(limitNum)
      .offset(offset);

    const enriched = await Promise.all(txns.map(enrichTransaction));

    res.json({
      transactions: enriched,
      total: countResult.count,
      page: pageNum,
      limit: limitNum,
    });
  },
);

// POST /businesses/:businessId/transactions
router.post(
  "/businesses/:businessId/transactions",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = CreateTransactionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateTransactionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    // Temp reference number, will be updated after insert
    const prefix = parsed.data.type === "income" ? "TXN" : "TXN";
    const receiptPrefix = "REC";

    const [txn] = await db
      .insert(transactionsTable)
      .values({
        ...parsed.data,
        businessId: params.data.businessId,
        referenceNumber: "TEMP",
        receiptReference: parsed.data.receiptPath
          ? `KK-${receiptPrefix}-${new Date().getFullYear()}-TEMP`
          : null,
      })
      .returning();

    // Update with proper reference numbers
    const refNum = generateReferenceNumber(txn.id, "TXN");
    const receiptRef = txn.receiptPath
      ? `KK-${receiptPrefix}-${new Date().getFullYear()}-${String(txn.id).padStart(6, "0")}`
      : null;

    const [updated] = await db
      .update(transactionsTable)
      .set({ referenceNumber: refNum, receiptReference: receiptRef })
      .where(eq(transactionsTable.id, txn.id))
      .returning();

    const enriched = await enrichTransaction(updated);
    res.status(201).json(enriched);
  },
);

// GET /businesses/:businessId/transactions/:transactionId
router.get(
  "/businesses/:businessId/transactions/:transactionId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = GetTransactionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [txn] = await db
      .select()
      .from(transactionsTable)
      .where(
        and(
          eq(transactionsTable.id, params.data.transactionId),
          eq(transactionsTable.businessId, params.data.businessId),
        ),
      );
    if (!txn) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    const enriched = await enrichTransaction(txn);
    res.json(enriched);
  },
);

// PATCH /businesses/:businessId/transactions/:transactionId
router.patch(
  "/businesses/:businessId/transactions/:transactionId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = UpdateTransactionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateTransactionBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }

    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updatedAt: new Date(),
    };
    // Update receipt reference if receipt path changes
    if (parsed.data.receiptPath !== undefined) {
      if (parsed.data.receiptPath) {
        updateData.receiptReference = `KK-REC-${new Date().getFullYear()}-${String(params.data.transactionId).padStart(6, "0")}`;
      } else {
        updateData.receiptReference = null;
      }
    }

    const [txn] = await db
      .update(transactionsTable)
      .set(updateData)
      .where(
        and(
          eq(transactionsTable.id, params.data.transactionId),
          eq(transactionsTable.businessId, params.data.businessId),
        ),
      )
      .returning();
    if (!txn) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }
    const enriched = await enrichTransaction(txn);
    res.json(enriched);
  },
);

// DELETE /businesses/:businessId/transactions/:transactionId
router.delete(
  "/businesses/:businessId/transactions/:transactionId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = DeleteTransactionParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    await db
      .delete(transactionsTable)
      .where(
        and(
          eq(transactionsTable.id, params.data.transactionId),
          eq(transactionsTable.businessId, params.data.businessId),
        ),
      );
    res.sendStatus(204);
  },
);

export default router;
