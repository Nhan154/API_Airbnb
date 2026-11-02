
import express from "express";

import {
    getComments,
    createComment,
    updateComment,
    deleteComment,
    getCommentsByRoom,
} from "../controllers/comments.controller.js";

const router = express.Router();

router.get("/", getComments);
router.post("/", createComment);

// Đặt route cụ thể trước route /:id
router.get(
    "/lay-binh-luan-theo-phong/:MaPhong",
    getCommentsByRoom
);

router.put("/:id", updateComment);
router.delete("/:id", deleteComment);

export default router;
