import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

// Loại bỏ password trước khi trả dữ liệu về client
const removePassword = (user) => {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
};

// GET /api/users
// Lấy danh sách tất cả người dùng
export const getUsers = async (req, res) => {
    try {
        const users = await prisma.nguoiDung.findMany({
            orderBy: {
                id: "desc",
            },
        });

        return res.status(200).json({
            message: "Lấy danh sách người dùng thành công",
            data: users.map(removePassword),
        });
    } catch (error) {
        console.error("Get users error:", error);

        return res.status(500).json({
            message: "Lỗi server khi lấy danh sách người dùng",
        });
    }
};

// POST /api/users
// Tạo người dùng mới
export const createUser = async (req, res) => {
    try {
        const {
            name,
            email,
            password,
            phone,
            birthday,
            gender,
            role,
        } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Vui lòng nhập name, email, password và role",
            });
        }

        const existingUser = await prisma.nguoiDung.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                message: "Email đã được sử dụng",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.nguoiDung.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone,
                birthday,
                gender,
                role,
            },
        });

        return res.status(201).json({
            message: "Tạo người dùng thành công",
            data: removePassword(newUser),
        });
    } catch (error) {
        console.error("Create user error:", error);

        return res.status(500).json({
            message: "Lỗi server khi tạo người dùng",
        });
    }
};

// GET /api/users/:id
// Lấy thông tin một người dùng
export const getUserById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID người dùng không hợp lệ",
            });
        }

        const user = await prisma.nguoiDung.findUnique({
            where: { id },
        });

        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng",
            });
        }

        return res.status(200).json({
            message: "Lấy thông tin người dùng thành công",
            data: removePassword(user),
        });
    } catch (error) {
        console.error("Get user by ID error:", error);

        return res.status(500).json({
            message: "Lỗi server khi lấy thông tin người dùng",
        });
    }
};

// PUT /api/users/:id
// Cập nhật thông tin người dùng
export const updateUser = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID người dùng không hợp lệ",
            });
        }

        const existingUser = await prisma.nguoiDung.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng",
            });
        }

        const {
            name,
            email,
            phone,
            birthday,
            gender,
            role,
        } = req.body;

        if (email && email !== existingUser.email) {
            const emailExists = await prisma.nguoiDung.findUnique({
                where: { email },
            });

            if (emailExists) {
                return res.status(409).json({
                    message: "Email đã được sử dụng",
                });
            }
        }

        const updatedUser = await prisma.nguoiDung.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(email !== undefined && { email }),
                ...(phone !== undefined && { phone }),
                ...(birthday !== undefined && { birthday }),
                ...(gender !== undefined && { gender }),
                ...(role !== undefined && { role }),
            },
        });

        return res.status(200).json({
            message: "Cập nhật người dùng thành công",
            data: removePassword(updatedUser),
        });
    } catch (error) {
        console.error("Update user error:", error);

        return res.status(500).json({
            message: "Lỗi server khi cập nhật người dùng",
        });
    }
};

// DELETE /api/users?id=1
// Xóa người dùng
export const deleteUser = async (req, res) => {
    try {
        const id = Number(req.query.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "Vui lòng cung cấp ID người dùng hợp lệ",
            });
        }

        const existingUser = await prisma.nguoiDung.findUnique({
            where: { id },
        });

        if (!existingUser) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng",
            });
        }

        await prisma.nguoiDung.delete({
            where: { id },
        });

        return res.status(200).json({
            message: "Xóa người dùng thành công",
        });
    } catch (error) {
        console.error("Delete user error:", error);

        // P2003: Người dùng đang được tham chiếu bởi bảng khác
        if (error.code === "P2003") {
            return res.status(409).json({
                message: "Không thể xóa người dùng vì đang có dữ liệu liên quan",
            });
        }

        return res.status(500).json({
            message: "Lỗi server khi xóa người dùng",
        });
    }
};

// GET /api/users/search/:TenNguoiDung
// Tìm kiếm người dùng theo tên
export const searchUsers = async (req, res) => {
    try {
        const keyword = req.params.TenNguoiDung;

        const users = await prisma.nguoiDung.findMany({
            where: {
                name: {
                    contains: keyword,
                },
            },
            orderBy: {
                id: "desc",
            },
        });

        return res.status(200).json({
            message: "Tìm kiếm người dùng thành công",
            data: users.map(removePassword),
        });
    } catch (error) {
        console.error("Search users error:", error);

        return res.status(500).json({
            message: "Lỗi server khi tìm kiếm người dùng",
        });
    }
};

// GET /api/users/phan-trang-tim-kiem
// Phân trang và tìm kiếm người dùng
export const getUsersPagination = async (req, res) => {
    try {
        const pageIndex = Math.max(
            1,
            Number.parseInt(req.query.pageIndex, 10) || 1
        );

        const pageSize = Math.min(
            100,
            Math.max(1, Number.parseInt(req.query.pageSize, 10) || 10)
        );

        const keyword = req.query.keyword?.trim() || "";

        const where = keyword
            ? {
                OR: [
                    {
                        name: {
                            contains: keyword,
                        },
                    },
                    {
                        email: {
                            contains: keyword,
                        },
                    },
                ],
            }
            : {};

        const [users, totalItems] = await prisma.$transaction([
            prisma.nguoiDung.findMany({
                where,
                skip: (pageIndex - 1) * pageSize,
                take: pageSize,
                orderBy: {
                    id: "desc",
                },
            }),
            prisma.nguoiDung.count({ where }),
        ]);

        return res.status(200).json({
            message: "Lấy danh sách người dùng phân trang thành công",
            pageIndex,
            pageSize,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            data: users.map(removePassword),
        });
    } catch (error) {
        console.error("Pagination users error:", error);

        return res.status(500).json({
            message: "Lỗi server khi phân trang người dùng",
        });
    }
};

// Upload ảnh đại diện người dùng
export const uploadAvatar = async (req, res) => {
    try {
        const { id } = req.body;

        // Kiểm tra mã người dùng
        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                message: "Vui lòng cung cấp id người dùng hợp lệ.",
            });
        }

        // Kiểm tra file
        if (!req.file) {
            return res.status(400).json({
                message: "Vui lòng chọn file ảnh.",
            });
        }

        // Kiểm tra người dùng có tồn tại không
        const user = await prisma.nguoiDung.findUnique({
            where: {
                id: Number(id),
            },
        });

        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng.",
            });
        }

        // Upload ảnh lên Cloudinary
        const uploadedImage = await uploadToCloudinary(
            req.file.buffer,
            "avatars"
        );

        // Cập nhật URL ảnh vào database
        const updatedUser = await prisma.nguoiDung.update({
            where: {
                id: Number(id),
            },
            data: {
                avatar: uploadedImage.url,
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
            },
        });

        return res.status(200).json({
            message: "Upload ảnh đại diện thành công.",
            content: updatedUser,
        });
    } catch (error) {
        console.error("Upload avatar error:", error);

        return res.status(500).json({
            message: "Lỗi khi upload ảnh đại diện.",
        });
    }
};