import express from "express";

import {
    getLocations,
    createLocation,
    getLocationById,
    updateLocation,
    deleteLocation,
    getLocationsPagination,
    uploadLocationImage,
} from "../controllers/locations.controller.js";

import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";
import upload from "../middlewares/upload.middleware.js";
import { validateImageUpload } from "../middlewares/validate-image.middleware.js";

const router = express.Router();

// USER và ADMIN đều được xem danh sách vị trí
router.get("/", getLocations);

// Chỉ ADMIN được tạo vị trí
router.post("/", authenticate, authorize("ADMIN"), createLocation);

// USER và ADMIN đều được phân trang, tìm kiếm
router.get("/phan-trang-tim-kiem", getLocationsPagination);

// Chỉ ADMIN được upload ảnh vị trí
router.post(
    "/upload-hinh-vitri",
    authenticate,
    authorize("ADMIN"),
    upload.single("formFile"),
    validateImageUpload,
    uploadLocationImage
);

// USER và ADMIN đều được xem chi tiết vị trí
router.get("/:id", getLocationById);

// Chỉ ADMIN được cập nhật vị trí
router.put("/:id", authenticate, authorize("ADMIN"), updateLocation);

// Chỉ ADMIN được xóa vị trí
router.delete("/:id", authenticate, authorize("ADMIN"), deleteLocation);

export default router;
