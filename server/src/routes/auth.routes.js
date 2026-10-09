import { Router } from "express";
import * as ctrl from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { verifyJWT } from "../middleware/auth.js";
import { authLimiter, loginLimiter } from "../middleware/rateLimit.js";
import { registerSchema, loginSchema } from "../validators/schemas.js";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), ctrl.register);
router.post("/login", loginLimiter, validate(loginSchema), ctrl.login);
router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);
router.get("/me", verifyJWT, ctrl.me);

export default router;
