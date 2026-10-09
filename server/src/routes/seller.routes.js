import { Router } from "express";
import * as ctrl from "../controllers/seller.controller.js";
import { verifyJWT } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { loadNursery } from "../middleware/loadNursery.js";
import { requireApproved } from "../middleware/requireApproved.js";
import { validate } from "../middleware/validate.js";
import {
  profileSchema,
  inventorySchema,
  inventoryUpdateSchema,
  sellerStatusSchema,
} from "../validators/schemas.js";

const router = Router();

router.use(verifyJWT, requireRole("nursery_seller"), loadNursery);

router.get("/profile", ctrl.getProfile);
router.patch("/profile", validate(profileSchema), ctrl.updateProfile);
router.get("/dashboard", ctrl.getDashboard);
router.get("/catalog", ctrl.getCatalog);

router.use(requireApproved);

router.get("/inventory", ctrl.getInventory);
router.post("/inventory", validate(inventorySchema), ctrl.upsertInventory);
router.patch("/inventory/:id", validate(inventoryUpdateSchema), ctrl.updateInventory);
router.get("/orders", ctrl.getOrders);
router.patch("/orders/:id/status", validate(sellerStatusSchema), ctrl.updateOrderStatus);

export default router;
