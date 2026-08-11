import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, categoriesTable, businessesTable } from "@workspace/db";
import {
  ListCategoriesParams,
  ListCategoriesQueryParams,
  CreateCategoryParams,
  CreateCategoryBody,
  DeleteCategoryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Helper to verify business ownership
async function verifyBusiness(userId: string, businessId: number) {
  const [business] = await db
    .select()
    .from(businessesTable)
    .where(
      and(eq(businessesTable.id, businessId), eq(businessesTable.userId, userId)),
    );
  return business;
}

// GET /businesses/:businessId/categories
router.get(
  "/businesses/:businessId/categories",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = ListCategoriesParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const query = ListCategoriesQueryParams.safeParse(req.query);
    const business = await verifyBusiness(
      req.user.id,
      params.data.businessId,
    );
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    let dbQuery = db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.businessId, params.data.businessId));
    const categories = await dbQuery.orderBy(categoriesTable.name);
    const type = query.success ? query.data.type : undefined;
    const filtered = type
      ? categories.filter((c) => c.type === type)
      : categories;
    res.json(filtered);
  },
);

// POST /businesses/:businessId/categories
router.post(
  "/businesses/:businessId/categories",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = CreateCategoryParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateCategoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [category] = await db
      .insert(categoriesTable)
      .values({ ...parsed.data, businessId: params.data.businessId })
      .returning();
    res.status(201).json(category);
  },
);

// DELETE /businesses/:businessId/categories/:categoryId
router.delete(
  "/businesses/:businessId/categories/:categoryId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = DeleteCategoryParams.safeParse(req.params);
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
      .delete(categoriesTable)
      .where(
        and(
          eq(categoriesTable.id, params.data.categoryId),
          eq(categoriesTable.businessId, params.data.businessId),
        ),
      );
    res.sendStatus(204);
  },
);

export default router;
