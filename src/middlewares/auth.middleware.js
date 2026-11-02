import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        // Kiểm tra token
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Vui lòng đăng nhập để tiếp tục",
            });
        }

        // Lấy token từ Header
        const token = authHeader.split(" ")[1];

        // Xác minh token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Lưu thông tin người dùng vào request
        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Token không hợp lệ hoặc đã hết hạn",
        });
    }
};