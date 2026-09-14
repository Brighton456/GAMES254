import { Router, type IRouter } from "express";
import brightpayRouter from "./brightpay";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(brightpayRouter);

export default router;
