import express from "express";
import cors from "cors";
import "dotenv/config";

import prisma from "./config/prisma.js";
import authRoutes from "./routes/auth.routes.js";
import testRoutes from "./routes/test.routes.js";
import usersRoutes from "./routes/users.routes.js";
import locationsRoutes from "./routes/locations.routes.js";
import roomsRoutes from "./routes/rooms.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import commentsRoutes from "./routes/comments.routes.js";

const app = express();

// Middleware
app.use(cors());

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
        console.error("Database connection error:", error);

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

// Khởi động Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});