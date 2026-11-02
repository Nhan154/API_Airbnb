
import express from "express";

import {
    getBookings,
    createBooking,
    getBookingById,
    updateBooking,
    deleteBooking,
    getBookingsByUser,
} from "../controllers/bookings.controller.js";

const router = express.Router();

router.get("/", getBookings);
router.post("/", createBooking);

// Route cụ thể phải đặt trước route /:id
router.get("/lay-theo-nguoi-dung/:MaNguoiDung", getBookingsByUser);

router.get("/:id", getBookingById);
router.put("/:id", updateBooking);
router.delete("/:id", deleteBooking);

export default router;
