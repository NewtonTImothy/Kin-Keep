import { Router, type IRouter } from "express";
import { eq, and, sql, ilike, desc } from "drizzle-orm";
import {
  db,
  customersTable,
  businessesTable,
  transactionsTable,
} from "@workspace/db";
import {
  ListCustomersParams,
  ListCustomersQueryParams,
  CreateCustomerParams,
  CreateCustomerBody,
  GetCustomerParams,
  UpdateCustomerParams,
  UpdateCustomerBody,
  DeleteCustomerParams,
  MarkCustomerCreditPaidParams,
  MarkCustomerCreditPaidBody,
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

async function getCustomerStats(customerId: number, businessId: number) {
  const txns = await db
    .select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.customerId, customerId),
        eq(transactionsTable.businessId, businessId),
      ),
    );
  const totalCredit = txns
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalPaid = txns
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
  return {
    totalCredit: totalCredit.toFixed(2),
    totalPaid: totalPaid.toFixed(2),
    outstandingBalance: (totalCredit - totalPaid).toFixed(2),
  };
}

function generateReferenceNumber(id: number): string {
  return `KK-TXN-${String(id).padStart(6, "0")}`;
}

// GET /businesses/:businessId/customers
router.get(
  "/businesses/:businessId/customers",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = ListCustomersParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const query = ListCustomersQueryParams.safeParse(req.query);
    const conditions = [eq(customersTable.businessId, params.data.businessId)];
    if (query.success && query.data.search) {
      conditions.push(ilike(customersTable.name, `%${query.data.search}%`));
    }
    const customers = await db
      .select()
      .from(customersTable)
      .where(and(...conditions))
      .orderBy(customersTable.name);

    const enriched = await Promise.all(
      customers.map(async (c) => {
        const stats = await getCustomerStats(c.id, params.data.businessId);
        return { ...c, ...stats };
      }),
    );
    res.json(enriched);
  },
);

// POST /businesses/:businessId/customers
router.post(
  "/businesses/:businessId/customers",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = CreateCustomerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateCustomerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [customer] = await db
      .insert(customersTable)
      .values({ ...parsed.data, businessId: params.data.businessId })
      .returning();
    res.status(201).json({
      ...customer,
      totalCredit: "0.00",
      totalPaid: "0.00",
      outstandingBalance: "0.00",
    });
  },
);

// GET /businesses/:businessId/customers/:customerId
router.get(
  "/businesses/:businessId/customers/:customerId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = GetCustomerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(
        and(
          eq(customersTable.id, params.data.customerId),
          eq(customersTable.businessId, params.data.businessId),
        ),
      );
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    const stats = await getCustomerStats(customer.id, params.data.businessId);
    res.json({ ...customer, ...stats });
  },
);

// PATCH /businesses/:businessId/customers/:customerId
router.patch(
  "/businesses/:businessId/customers/:customerId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = UpdateCustomerParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateCustomerBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [customer] = await db
      .update(customersTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(
        and(
          eq(customersTable.id, params.data.customerId),
          eq(customersTable.businessId, params.data.businessId),
        ),
      )
      .returning();
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    const stats = await getCustomerStats(customer.id, params.data.businessId);
    res.json({ ...customer, ...stats });
  },
);

// DELETE /businesses/:businessId/customers/:customerId
router.delete(
  "/businesses/:businessId/customers/:customerId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = DeleteCustomerParams.safeParse(req.params);
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
      .delete(customersTable)
      .where(
        and(
          eq(customersTable.id, params.data.customerId),
          eq(customersTable.businessId, params.data.businessId),
        ),
      );
    res.sendStatus(204);
  },
);

// POST /businesses/:businessId/customers/:customerId/mark-paid
router.post(
  "/businesses/:businessId/customers/:customerId/mark-paid",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = MarkCustomerCreditPaidParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = MarkCustomerCreditPaidBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [customer] = await db
      .select()
      .from(customersTable)
      .where(
        and(
          eq(customersTable.id, params.data.customerId),
          eq(customersTable.businessId, params.data.businessId),
        ),
      );
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    // Create a money-in transaction for the payment
    const [txn] = await db
      .insert(transactionsTable)
      .values({
        businessId: params.data.businessId,
        type: "income",
        amount: parsed.data.amount,
        description: `Credit payment from ${customer.name}`,
        date: parsed.data.date,
        paymentMethod: "Cash",
        customerId: customer.id,
        referenceNumber: "TEMP",
        notes: parsed.data.notes ?? null,
      })
      .returning();
    const refNum = `KK-TXN-${String(txn.id).padStart(6, "0")}`;
    const [updated] = await db
      .update(transactionsTable)
      .set({ referenceNumber: refNum })
      .where(eq(transactionsTable.id, txn.id))
      .returning();
    res.status(201).json({
      ...updated,
      categoryName: null,
      customerName: customer.name,
      supplierName: null,
      receiptStatus: "missing",
    });
  },
);

export default router;
