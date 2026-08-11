import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, businessesTable, categoriesTable } from "@workspace/db";
import {
  CreateBusinessBody,
  UpdateBusinessBody,
  GetBusinessParams,
  UpdateBusinessParams,
  DeleteBusinessParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Seed default categories for a new business
async function seedDefaultCategories(businessId: number) {
  const incomeCategories = [
    "Sales",
    "Services",
    "Customer Payment",
    "Business Investment",
    "Loan Received",
    "Other Income",
  ];
  const expenseCategories = [
    "Stock Purchase",
    "Fuel",
    "Transport",
    "Rent",
    "Wages",
    "Electricity",
    "Water",
    "Internet",
    "Phone",
    "Office Supplies",
    "Repairs",
    "Equipment",
    "Loan Repayment",
    "Marketing",
    "Other Expense",
  ];
  const rows = [
    ...incomeCategories.map((name) => ({
      businessId,
      name,
      type: "income",
      isDefault: true,
    })),
    ...expenseCategories.map((name) => ({
      businessId,
      name,
      type: "expense",
      isDefault: true,
    })),
  ];
  await db.insert(categoriesTable).values(rows);
}

// GET /businesses
router.get("/businesses", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const businesses = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.userId, req.user.id));
  res.json(businesses);
});

// POST /businesses
router.post("/businesses", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [business] = await db
    .insert(businessesTable)
    .values({ ...parsed.data, userId: req.user.id })
    .returning();
  await seedDefaultCategories(business.id);
  res.status(201).json(business);
});

// GET /businesses/:businessId
router.get("/businesses/:businessId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = GetBusinessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [business] = await db
    .select()
    .from(businessesTable)
    .where(
      and(
        eq(businessesTable.id, params.data.businessId),
        eq(businessesTable.userId, req.user.id),
      ),
    );
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  res.json(business);
});

// PATCH /businesses/:businessId
router.patch("/businesses/:businessId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = UpdateBusinessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBusinessBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [business] = await db
    .update(businessesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(
      and(
        eq(businessesTable.id, params.data.businessId),
        eq(businessesTable.userId, req.user.id),
      ),
    )
    .returning();
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  res.json(business);
});

// DELETE /businesses/:businessId
router.delete("/businesses/:businessId", async (req, res): Promise<void> => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const params = DeleteBusinessParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db
    .delete(businessesTable)
    .where(
      and(
        eq(businessesTable.id, params.data.businessId),
        eq(businessesTable.userId, req.user.id),
      ),
    );
  res.sendStatus(204);
});

export default router;
