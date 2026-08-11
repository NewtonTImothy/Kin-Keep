import { Router, type IRouter } from "express";
import { eq, and, ilike } from "drizzle-orm";
import { db, suppliersTable, businessesTable, transactionsTable } from "@workspace/db";
import {
  ListSuppliersParams,
  ListSuppliersQueryParams,
  CreateSupplierParams,
  CreateSupplierBody,
  GetSupplierParams,
  UpdateSupplierParams,
  UpdateSupplierBody,
  DeleteSupplierParams,
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

async function getSupplierStats(supplierId: number, businessId: number) {
  const txns = await db
    .select()
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.supplierId, supplierId),
        eq(transactionsTable.businessId, businessId),
        eq(transactionsTable.type, "expense"),
      ),
    );
  const totalPurchases = txns
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
    .toFixed(2);
  return { totalPurchases };
}

// GET /businesses/:businessId/suppliers
router.get(
  "/businesses/:businessId/suppliers",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = ListSuppliersParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const query = ListSuppliersQueryParams.safeParse(req.query);
    const conditions = [eq(suppliersTable.businessId, params.data.businessId)];
    if (query.success && query.data.search) {
      conditions.push(ilike(suppliersTable.name, `%${query.data.search}%`));
    }
    const suppliers = await db
      .select()
      .from(suppliersTable)
      .where(and(...conditions))
      .orderBy(suppliersTable.name);
    const enriched = await Promise.all(
      suppliers.map(async (s) => {
        const stats = await getSupplierStats(s.id, params.data.businessId);
        return { ...s, ...stats };
      }),
    );
    res.json(enriched);
  },
);

// POST /businesses/:businessId/suppliers
router.post(
  "/businesses/:businessId/suppliers",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = CreateSupplierParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateSupplierBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [supplier] = await db
      .insert(suppliersTable)
      .values({ ...parsed.data, businessId: params.data.businessId })
      .returning();
    res.status(201).json({ ...supplier, totalPurchases: "0.00" });
  },
);

// GET /businesses/:businessId/suppliers/:supplierId
router.get(
  "/businesses/:businessId/suppliers/:supplierId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = GetSupplierParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [supplier] = await db
      .select()
      .from(suppliersTable)
      .where(
        and(
          eq(suppliersTable.id, params.data.supplierId),
          eq(suppliersTable.businessId, params.data.businessId),
        ),
      );
    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }
    const stats = await getSupplierStats(supplier.id, params.data.businessId);
    res.json({ ...supplier, ...stats });
  },
);

// PATCH /businesses/:businessId/suppliers/:supplierId
router.patch(
  "/businesses/:businessId/suppliers/:supplierId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = UpdateSupplierParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateSupplierBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [supplier] = await db
      .update(suppliersTable)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(
        and(
          eq(suppliersTable.id, params.data.supplierId),
          eq(suppliersTable.businessId, params.data.businessId),
        ),
      )
      .returning();
    if (!supplier) {
      res.status(404).json({ error: "Supplier not found" });
      return;
    }
    const stats = await getSupplierStats(supplier.id, params.data.businessId);
    res.json({ ...supplier, ...stats });
  },
);

// DELETE /businesses/:businessId/suppliers/:supplierId
router.delete(
  "/businesses/:businessId/suppliers/:supplierId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = DeleteSupplierParams.safeParse(req.params);
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
      .delete(suppliersTable)
      .where(
        and(
          eq(suppliersTable.id, params.data.supplierId),
          eq(suppliersTable.businessId, params.data.businessId),
        ),
      );
    res.sendStatus(204);
  },
);

export default router;
