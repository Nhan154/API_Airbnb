import express from "express";

import {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    searchUsers,
    getUsersPagination,
    uploadAvatar,
} from "../controllers/users.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import { validateImageUpload } from "../middlewares/validate-image.middleware.js";

const router = express.Router();

// Chỉ ADMIN được xem danh sách
router.get("/", authenticate, authorize("ADMIN"), getUsers);

// Chỉ ADMIN được tạo người dùng
router.post("/", authenticate, authorize("ADMIN"), createUser);

// Chỉ ADMIN được phân trang
router.get(
    "/phan-trang-tim-kiem",
    authenticate,
    authorize("ADMIN"),
    getUsersPagination
);

// Chỉ ADMIN được tìm kiếm người dùng
router.get(
    "/search/:TenNguoiDung",
    authenticate,
    authorize("ADMIN"),
    searchUsers
);

// USER chỉ xem tài khoản của mình
// ADMIN xem được tất cả
router.get("/:id", authenticate, getUserById);

// USER chỉ cập nhật tài khoản của mình
// ADMIN cập nhật được tất cả
router.put("/:id", authenticate, updateUser);

// Upload avatar
router.post(
    "/upload-avatar",
    authenticate,
    upload.single("formFile"),
    validateImageUpload,
    uploadAvatar
);

// Chỉ ADMIN được xóa
router.delete("/", authenticate, authorize("ADMIN"), deleteUser);

export default router;
