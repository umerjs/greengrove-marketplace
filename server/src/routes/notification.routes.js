import { Router } from "express";
import * as ctrl from "../controllers/notification.controller.js";
import { verifyJWT } from "../middleware/auth.js";

const router = Router();

router.use(verifyJWT);

router.get("/my", ctrl.myNotifications);
router.patch("/read-all", ctrl.markAllRead);
router.patch("/:id/read", ctrl.markRead);

export default router;
