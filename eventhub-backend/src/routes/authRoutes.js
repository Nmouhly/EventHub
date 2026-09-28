import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import { signIn, me } from "../controllers/authController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema } from "../validators/authValidators.js";
const router = Router();
router.post(
  "/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 50,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many login attempts. Please try again later.",
      },
    },
  }),
  validate(loginSchema),
  signIn,
);
router.get("/me", authenticate, me);
export default router;
