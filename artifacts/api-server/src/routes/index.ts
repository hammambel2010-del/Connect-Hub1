import { Router, type IRouter } from "express";
import healthRouter from "./health";
import storageRouter from "./storage";
import usersRouter from "./users";
import friendsRouter from "./friends";
import messagesRouter from "./messages";
import groupsRouter from "./groups";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(storageRouter);
router.use(usersRouter);
router.use(friendsRouter);
router.use(messagesRouter);
router.use(groupsRouter);
router.use(adminRouter);

export default router;
