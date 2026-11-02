
import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/role.middleware.js";

import {
    getBookings,
    createBooking,
    getBookingById,
    updateBooking,
    deleteBooking,
    getBookingsByUser,
} from "../controllers/bookings.controller.js";

const router = express.Router();

router.get("/", authenticate, authorize("ADMIN"), getBookings);
router.post("/", authenticate, createBooking);

// Route cụ thể phải đặt trước route /:id
router.get("/lay-theo-nguoi-dung/:MaNguoiDung", authenticate, getBookingsByUser);

router.get("/:id", authenticate, getBookingById);
router.put("/:id", authenticate, updateBooking);
router.delete("/:id", authenticate, deleteBooking);

export default router;
