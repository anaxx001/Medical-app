import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import pushRouter from "./push";
import generateFlashcardsRouter from "./generateFlashcards";

const router: IRouter = Router();

router.use(healthRouter);
router.use(chatRouter);
router.use(pushRouter);
router.use(generateFlashcardsRouter);

export default router;
