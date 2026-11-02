import express from "express";

import {
    getUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    searchUsers,
    getUsersPagination,
} from "../controllers/users.controller.js";
import upload from "../middlewares/upload.middleware.js";
import { uploadAvatar } from "../controllers/users.controller.js";

const router = express.Router();

// Lấy danh sách
router.get("/", getUsers);

// Tạo người dùng
router.post("/", createUser);

// Phân trang và tìm kiếm
router.get("/phan-trang-tim-kiem", getUsersPagination);

// Tìm kiếm theo tên
router.get("/search/:TenNguoiDung", searchUsers);

// Lấy chi tiết
router.get("/:id", getUserById);

// Cập nhật
router.put("/:id", updateUser);

router.post(
    "/upload-avatar",
    upload.single("formFile"),
    uploadAvatar
);

// Xóa theo query id
router.delete("/", deleteUser);

export default router;