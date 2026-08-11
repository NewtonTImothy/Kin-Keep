import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import storageRouter from "./storage";
import businessesRouter from "./businesses";
import categoriesRouter from "./categories";
import transactionsRouter from "./transactions";
import customersRouter from "./customers";
import suppliersRouter from "./suppliers";
import documentsRouter from "./documents";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(storageRouter);
router.use(businessesRouter);
router.use(categoriesRouter);
router.use(transactionsRouter);
router.use(customersRouter);
router.use(suppliersRouter);
router.use(documentsRouter);
router.use(dashboardRouter);
router.use(reportsRouter);

export default router;
