
import express from "express";
import { authenticate } from "../middlewares/auth.middleware.js";

import {
    getComments,
    createComment,
    updateComment,
    deleteComment,
    getCommentsByRoom,
} from "../controllers/comments.controller.js";

const router = express.Router();

router.get("/", getComments);
router.post("/", authenticate, createComment);

// Đặt route cụ thể trước route /:id
router.get(
    "/lay-binh-luan-theo-phong/:MaPhong",
    getCommentsByRoom
);

router.put("/:id", authenticate, updateComment);
router.delete("/:id", authenticate, deleteComment);

export default router;
