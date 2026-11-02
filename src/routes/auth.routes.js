import express from "express";
import { signup, signin } from "../controllers/auth.controller.js";
import { createRateLimiter } from "../middlewares/rate-limit.middleware.js";

const router = express.Router();

const authRateLimit = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: "Quá nhiều lần thử xác thực. Vui lòng thử lại sau.",
});

router.post("/signup", authRateLimit, signup);
router.post("/signin", authRateLimit, signin);

export default router;
