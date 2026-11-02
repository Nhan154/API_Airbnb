import express from "express";

import {
    getRooms,
    createRoom,
    getRoomsByLocation,
    getRoomById,
    updateRoom,
    deleteRoom,
    getRoomsPagination,
    uploadRoomImage,
} from "../controllers/rooms.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import { validateImageUpload } from "../middlewares/validate-image.middleware.js";

const router = express.Router();

// USER và ADMIN đều được xem danh sách phòng
router.get("/", getRooms);

// Chỉ ADMIN được tạo phòng
router.post("/", authenticate, authorize("ADMIN"), createRoom);

// USER và ADMIN đều được xem phòng theo vị trí
router.get("/lay-phong-theo-vi-tri", getRoomsByLocation);

// USER và ADMIN đều được tìm kiếm, phân trang
router.get("/phan-trang-tim-kiem", getRoomsPagination);

// Chỉ ADMIN được upload ảnh phòng
router.post(
    "/upload-hinh-phong",
    authenticate,
    authorize("ADMIN"),
    upload.single("formFile"),
    validateImageUpload,
    uploadRoomImage
);

// USER và ADMIN đều được xem chi tiết phòng
router.get("/:id", getRoomById);

// Chỉ ADMIN được cập nhật phòng
router.put("/:id", authenticate, authorize("ADMIN"), updateRoom);

// Chỉ ADMIN được xóa phòng
router.delete("/:id", authenticate, authorize("ADMIN"), deleteRoom);

export default router;
