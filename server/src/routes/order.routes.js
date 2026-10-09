import { Router } from "express";
import * as ctrl from "../controllers/order.controller.js";
import { verifyJWT } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { checkoutSchema, confirmSchema } from "../validators/schemas.js";

const router = Router();

router.post("/checkout", verifyJWT, requireRole("buyer"), validate(checkoutSchema), ctrl.checkout);
router.post("/confirm", verifyJWT, requireRole("buyer"), validate(confirmSchema), ctrl.confirm);
router.get("/my", verifyJWT, requireRole("buyer"), ctrl.myOrders);
router.get("/:id", verifyJWT, ctrl.getOrder);
router.post("/:id/cancel", verifyJWT, requireRole("buyer"), ctrl.cancelOrder);

export default router;
