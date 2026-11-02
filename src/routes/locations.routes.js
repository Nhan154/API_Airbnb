import express from "express";

import {
    getLocations,
    createLocation,
    getLocationById,
    updateLocation,
    deleteLocation,
    getLocationsPagination,
} from "../controllers/locations.controller.js";
import upload from "../middlewares/upload.middleware.js";
import { uploadLocationImage } from "../controllers/locations.controller.js";

const router = express.Router();

// Lấy danh sách vị trí
router.get("/", getLocations);

// Tạo vị trí
router.post("/", createLocation);

// Phân trang và tìm kiếm
router.get("/phan-trang-tim-kiem", getLocationsPagination);

router.post(
    "/upload-hinh-vitri",
    upload.single("formFile"),
    uploadLocationImage
);

// Lấy chi tiết vị trí
router.get("/:id", getLocationById);

// Cập nhật vị trí
router.put("/:id", updateLocation);

// Xóa vị trí
router.delete("/:id", deleteLocation);

export default router;