
import prisma from "../config/prisma.js";

// GET /api/binh-luan
export const getComments = async (req, res) => {
    try {
        const comments = await prisma.binhLuan.findMany({
            include: {
                phong: true,
                nguoiDung: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { id: "desc" },
        });

        return res.status(200).json(comments);
    } catch (error) {
        console.error("Get comments error:", error);
        return res.status(500).json({
            message: "Lỗi khi lấy danh sách bình luận.",
        });
    }
};

// POST /api/binh-luan
export const createComment = async (req, res) => {
    try {
        const {
            maPhong,
            maNguoiBinhLuan,
            ngayBinhLuan,
            noiDung,
            saoBinhLuan,
        } = req.body;

        const roomId = Number(maPhong);
        const userId = Number(maNguoiBinhLuan);
        const rating = Number(saoBinhLuan);
        const commentDate = new Date(ngayBinhLuan);

        if (
            maPhong === undefined ||
            maNguoiBinhLuan === undefined ||
            !ngayBinhLuan ||
            !noiDung ||
            saoBinhLuan === undefined
        ) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin bình luận.",
            });
        }

        if (
            !Number.isInteger(roomId) ||
            roomId <= 0 ||
            !Number.isInteger(userId) ||
            userId <= 0 ||
            !Number.isInteger(rating) ||
            rating < 1 ||
            rating > 5 ||
            Number.isNaN(commentDate.getTime())
        ) {
            return res.status(400).json({
                message: "Thông tin bình luận không hợp lệ.",
            });
        }

        const room = await prisma.phong.findUnique({
            where: { id: roomId },
        });

        if (!room) {
            return res.status(404).json({
                message: "Không tìm thấy phòng.",
            });
        }

        const user = await prisma.nguoiDung.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng.",
            });
        }

        const comment = await prisma.binhLuan.create({
            data: {
                maPhong: roomId,
                maNguoiBinhLuan: userId,
                ngayBinhLuan: commentDate,
                noiDung: String(noiDung).trim(),
                saoBinhLuan: rating,
            },
        });

        return res.status(201).json({
            message: "Thêm bình luận thành công.",
            data: comment,
        });
    } catch (error) {
        console.error("Create comment error:", error);
        return res.status(500).json({
            message: "Lỗi khi tạo bình luận.",
        });
    }
};

// PUT /api/binh-luan/:id
export const updateComment = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID bình luận không hợp lệ.",
            });
        }

        const existingComment = await prisma.binhLuan.findUnique({
            where: { id },
        });

        if (!existingComment) {
            return res.status(404).json({
                message: "Không tìm thấy bình luận.",
            });
        }

        const data = {};

        if (req.body.maPhong !== undefined) {
            const roomId = Number(req.body.maPhong);

            if (!Number.isInteger(roomId) || roomId <= 0) {
                return res.status(400).json({
                    message: "Mã phòng không hợp lệ.",
                });
            }

            const room = await prisma.phong.findUnique({
                where: { id: roomId },
            });

            if (!room) {
                return res.status(404).json({
                    message: "Không tìm thấy phòng.",
                });
            }

            data.maPhong = roomId;
        }

        if (req.body.maNguoiBinhLuan !== undefined) {
            const userId = Number(req.body.maNguoiBinhLuan);

            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(400).json({
                    message: "Mã người bình luận không hợp lệ.",
                });
            }

            const user = await prisma.nguoiDung.findUnique({
                where: { id: userId },
            });

            if (!user) {
                return res.status(404).json({
                    message: "Không tìm thấy người dùng.",
                });
            }

            data.maNguoiBinhLuan = userId;
        }

        if (req.body.ngayBinhLuan !== undefined) {
            const date = new Date(req.body.ngayBinhLuan);

            if (Number.isNaN(date.getTime())) {
                return res.status(400).json({
                    message: "Ngày bình luận không hợp lệ.",
                });
            }

            data.ngayBinhLuan = date;
        }

        if (req.body.noiDung !== undefined) {
            if (
                typeof req.body.noiDung !== "string" ||
                !req.body.noiDung.trim()
            ) {
                return res.status(400).json({
                    message: "Nội dung bình luận không được để trống.",
                });
            }

            data.noiDung = req.body.noiDung.trim();
        }

        if (req.body.saoBinhLuan !== undefined) {
            const rating = Number(req.body.saoBinhLuan);

            if (
                !Number.isInteger(rating) ||
                rating < 1 ||
                rating > 5
            ) {
                return res.status(400).json({
                    message: "Số sao phải là số nguyên từ 1 đến 5.",
                });
            }

            data.saoBinhLuan = rating;
        }

        const updatedComment = await prisma.binhLuan.update({
            where: { id },
            data,
        });

        return res.status(200).json({
            message: "Cập nhật bình luận thành công.",
            data: updatedComment,
        });
    } catch (error) {
        console.error("Update comment error:", error);
        return res.status(500).json({
            message: "Lỗi khi cập nhật bình luận.",
        });
    }
};

// DELETE /api/binh-luan/:id
export const deleteComment = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID bình luận không hợp lệ.",
            });
        }

        const comment = await prisma.binhLuan.findUnique({
            where: { id },
        });

        if (!comment) {
            return res.status(404).json({
                message: "Không tìm thấy bình luận.",
            });
        }

        await prisma.binhLuan.delete({
            where: { id },
        });

        return res.status(200).json({
            message: "Xóa bình luận thành công.",
        });
    } catch (error) {
        console.error("Delete comment error:", error);
        return res.status(500).json({
            message: "Lỗi khi xóa bình luận.",
        });
    }
};

// GET /api/binh-luan/lay-binh-luan-theo-phong/:MaPhong
export const getCommentsByRoom = async (req, res) => {
    try {
        const roomId = Number(req.params.MaPhong);

        if (!Number.isInteger(roomId) || roomId <= 0) {
            return res.status(400).json({
                message: "Mã phòng không hợp lệ.",
            });
        }

        const room = await prisma.phong.findUnique({
            where: { id: roomId },
        });

        if (!room) {
            return res.status(404).json({
                message: "Không tìm thấy phòng.",
            });
        }

        const comments = await prisma.binhLuan.findMany({
            where: { maPhong: roomId },
            include: {
                nguoiDung: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: { id: "desc" },
        });

        return res.status(200).json(comments);
    } catch (error) {
        console.error("Get comments by room error:", error);
        return res.status(500).json({
            message: "Lỗi khi lấy bình luận theo phòng.",
        });
    }
};
