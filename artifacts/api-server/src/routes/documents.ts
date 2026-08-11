import { Router, type IRouter } from "express";
import { eq, and, ilike, desc } from "drizzle-orm";
import { db, documentsTable, businessesTable } from "@workspace/db";
import {
  ListDocumentsParams,
  ListDocumentsQueryParams,
  CreateDocumentParams,
  CreateDocumentBody,
  GetDocumentParams,
  UpdateDocumentParams,
  UpdateDocumentBody,
  DeleteDocumentParams,
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

// GET /businesses/:businessId/documents
router.get(
  "/businesses/:businessId/documents",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = ListDocumentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const query = ListDocumentsQueryParams.safeParse(req.query);
    const conditions = [eq(documentsTable.businessId, params.data.businessId)];
    if (query.success && query.data.category) {
      conditions.push(eq(documentsTable.category, query.data.category));
    }
    if (query.success && query.data.search) {
      conditions.push(ilike(documentsTable.name, `%${query.data.search}%`));
    }
    const documents = await db
      .select()
      .from(documentsTable)
      .where(and(...conditions))
      .orderBy(desc(documentsTable.createdAt));
    res.json(documents);
  },
);

// POST /businesses/:businessId/documents
router.post(
  "/businesses/:businessId/documents",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = CreateDocumentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateDocumentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [doc] = await db
      .insert(documentsTable)
      .values({ ...parsed.data, businessId: params.data.businessId })
      .returning();
    res.status(201).json(doc);
  },
);

// GET /businesses/:businessId/documents/:documentId
router.get(
  "/businesses/:businessId/documents/:documentId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = GetDocumentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [doc] = await db
      .select()
      .from(documentsTable)
      .where(
        and(
          eq(documentsTable.id, params.data.documentId),
          eq(documentsTable.businessId, params.data.businessId),
        ),
      );
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    res.json(doc);
  },
);

// PATCH /businesses/:businessId/documents/:documentId
router.patch(
  "/businesses/:businessId/documents/:documentId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = UpdateDocumentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateDocumentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const business = await verifyBusiness(req.user.id, params.data.businessId);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [doc] = await db
      .update(documentsTable)
      .set(parsed.data)
      .where(
        and(
          eq(documentsTable.id, params.data.documentId),
          eq(documentsTable.businessId, params.data.businessId),
        ),
      )
      .returning();
    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }
    res.json(doc);
  },
);

// DELETE /businesses/:businessId/documents/:documentId
router.delete(
  "/businesses/:businessId/documents/:documentId",
  async (req, res): Promise<void> => {
    if (!req.isAuthenticated()) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const params = DeleteDocumentParams.safeParse(req.params);
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
      .delete(documentsTable)
      .where(
        and(
          eq(documentsTable.id, params.data.documentId),
          eq(documentsTable.businessId, params.data.businessId),
        ),
      );
    res.sendStatus(204);
  },
);

export default router;
