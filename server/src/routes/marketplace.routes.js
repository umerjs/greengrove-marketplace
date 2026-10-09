import { Router } from "express";
import * as ctrl from "../controllers/marketplace.controller.js";
import { verifyJWT } from "../middleware/auth.js";
import { requireRole } from "../middleware/requireRole.js";
import { validate } from "../middleware/validate.js";
import { requestSchema } from "../validators/schemas.js";

const router = Router();

router.get("/products", ctrl.listProducts);
router.get("/products/:id", ctrl.getProduct);
router.get("/stats", ctrl.stats);
router.get("/nurseries", ctrl.featuredNurseries);
router.post("/request", verifyJWT, requireRole("buyer"), validate(requestSchema), ctrl.createRequest);
router.get("/requests/my", verifyJWT, requireRole("buyer"), ctrl.myRequests);

export default router;
