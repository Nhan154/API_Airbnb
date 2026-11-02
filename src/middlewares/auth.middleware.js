import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    try {
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({ message: "Dịch vụ xác thực chưa được cấu hình." });
        }
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Vui lòng đăng nhập để tiếp tục.",
            });
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                message: "Token không hợp lệ.",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Kiểm tra payload JWT
        if (
            !Number.isInteger(decoded.id) || decoded.id <= 0 ||
            !decoded.role ||
            !["USER", "ADMIN"].includes(decoded.role)
        ) {
            return res.status(401).json({
                message: "Thông tin xác thực không hợp lệ.",
            });
        }

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Token không hợp lệ hoặc đã hết hạn.",
        });
    }
};
