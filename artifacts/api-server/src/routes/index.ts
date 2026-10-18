import { Router, type IRouter } from "express";
import healthRouter from "./health";
import subscriptionsRouter from "./subscriptions";
import { requireAccount } from "../middlewares/requireAccount";
import purchasesRouter from "./purchases";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireAccount);
router.use(subscriptionsRouter);
router.use(purchasesRouter);

export default router;
