import express from "express";

import {
    getRooms,
    createRoom,
    getRoomsByLocation,
    getRoomById,
    updateRoom,
    deleteRoom,
    getRoomsPagination,
} from "../controllers/rooms.controller.js";
import upload from "../middlewares/upload.middleware.js";
import { uploadRoomImage } from "../controllers/rooms.controller.js";


const router = express.Router();

// Lấy danh sách phòng
router.get("/", getRooms);

// Tạo phòng
router.post("/", createRoom);

// Lấy phòng theo vị trí
router.get("/lay-phong-theo-vi-tri", getRoomsByLocation);

// Phân trang và tìm kiếm
router.get("/phan-trang-tim-kiem", getRoomsPagination);

router.post(
    "/upload-hinh-phong",
    upload.single("formFile"),
    uploadRoomImage
);

// Lấy chi tiết phòng
router.get("/:id", getRoomById);

// Cập nhật phòng
router.put("/:id", updateRoom);

// Xóa phòng
router.delete("/:id", deleteRoom);

export default router;