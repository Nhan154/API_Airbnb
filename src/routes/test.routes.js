import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

const router = express.Router();

// API yêu cầu đăng nhập
router.get("/profile", authenticate, (req, res) => {
    res.status(200).json({
        message: "Xác thực thành công",
        user: req.user,
    });
});

// API chỉ ADMIN được truy cập
router.get("/admin", authenticate, authorize("ADMIN"), (req, res) => {
    res.status(200).json({
        message: "Bạn có quyền ADMIN",
        user: req.user,
    });
});

export default router;