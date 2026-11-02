import express from "express";
import cors from "cors";
import "dotenv/config";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

import prisma from "./config/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import testRoutes from "./routes/test.routes.js";
import usersRoutes from "./routes/users.routes.js";
import locationsRoutes from "./routes/locations.routes.js";
import roomsRoutes from "./routes/rooms.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import commentsRoutes from "./routes/comments.routes.js";

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN?.split(",").map((origin) => origin.trim()).filter(Boolean);
app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins?.includes(origin) || (!allowedOrigins?.length && process.env.NODE_ENV !== "production")) {
            return callback(null, true);
        }
        return callback(new Error("Origin is not allowed by CORS"));
    },
}));

// Phải đặt middleware đọc JSON trước khi khai báo routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kiểm tra API
app.get("/", (req, res) => {
    res.status(200).json({
        message: "Airbnb Backend API is running!",
    });
});

// Kiểm tra Database
app.get("/api/health/db", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            message: "Database connected successfully!",
        });
    } catch (error) {
        console.error("Database health check failed");

        res.status(500).json({
            message: "Database connection failed!",
        });
    }
});

// Auth Routes
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/vi-tri", locationsRoutes);
app.use("/api/phong-thue", roomsRoutes);
app.use("/api/dat-phong", bookingsRoutes);
app.use("/api/binh-luan", commentsRoutes);

app.use((req, res) => res.status(404).json({ message: "Không tìm thấy API." }));

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && Object.hasOwn(error, "body")) {
        return res.status(400).json({ message: "JSON request body không hợp lệ." });
    }
    if (error?.name === "MulterError") {
        const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
        return res.status(status).json({ message: "Tệp tải lên không hợp lệ hoặc vượt giới hạn." });
    }
    if (error?.message?.startsWith("Chỉ chấp nhận file")) {
        return res.status(400).json({ message: error.message });
    }
    if (error?.message === "Origin is not allowed by CORS") {
        return res.status(403).json({ message: "Origin không được phép." });
    }
    console.error("Unhandled request error");
    return res.status(500).json({ message: "Lỗi hệ thống không mong muốn." });
});

export default app;

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server is running on port ${PORT}`);
    });
}
