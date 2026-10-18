import { Router, type IRouter } from "express";
import healthRouter from "./health";
import subscriptionsRouter from "./subscriptions";
import { requireAccount } from "../middlewares/requireAccount";

const router: IRouter = Router();

router.use(healthRouter);
router.use(requireAccount);
router.use(subscriptionsRouter);

export default router;
