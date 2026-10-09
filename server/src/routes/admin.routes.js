import { Router } from "express";
import * as ctrl from "../controllers/admin.controller.js";
import { verifyJWT } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { approveSchema, productSchema, productUpdateSchema } from "../validators/schemas.js";

const router = Router();

router.use(verifyJWT, requireRole("super_admin"));

router.get("/stats", ctrl.stats);
router.get("/sellers", ctrl.allSellers);
router.get("/sellers/pending", ctrl.pendingSellers);
router.patch("/sellers/:id/approve", validate(approveSchema), ctrl.approveSeller);
router.get("/inventory", ctrl.inventoryOverview);
router.get("/orders", ctrl.allOrders);
router.get("/products", ctrl.listProducts);
router.post("/products", validate(productSchema), ctrl.createProduct);
router.patch("/products/:id", validate(productUpdateSchema), ctrl.updateProduct);

export default router;
