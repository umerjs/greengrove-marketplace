import { Router } from "express";
import authRoutes from "./auth.routes.js";
import marketplaceRoutes from "./marketplace.routes.js";
import orderRoutes from "./order.routes.js";
import sellerRoutes from "./seller.routes.js";
import adminRoutes from "./admin.routes.js";
import notificationRoutes from "./notification.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/marketplace", marketplaceRoutes);
router.use("/orders", orderRoutes);
router.use("/seller", sellerRoutes);
router.use("/admin", adminRoutes);
router.use("/notifications", notificationRoutes);

export default router;
