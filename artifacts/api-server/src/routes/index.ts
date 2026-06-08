import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import pushRouter from "./push";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(pushRouter);

export default router;
