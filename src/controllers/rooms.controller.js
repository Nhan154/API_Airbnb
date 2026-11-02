import prisma from "../config/prisma.js";

// Các trường tiện ích của phòng
const amenityFields = [
    "mayGiat",
    "banLa",
    "tivi",
    "dieuHoa",
    "wifi",
    "bep",
    "doXe",
    "hoBoi",
    "banUi",
];
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

// Kiểm tra dữ liệu số nguyên không âm
const isValidNonNegativeInteger = (value) => {
    return Number.isInteger(value) && value >= 0;
};

// GET /api/phong-thue
// Lấy danh sách tất cả phòng thuê
export const getRooms = async (req, res) => {
    try {
        const rooms = await prisma.phong.findMany({
            include: {
                viTri: true,
            },
            orderBy: {
                id: "desc",
            },
        });

        return res.status(200).json({
            message: "Lấy danh sách phòng thuê thành công",
            data: rooms,
        });
    } catch (error) {
        console.error("Get rooms error:", error);

        return res.status(500).json({
            message: "Lỗi server khi lấy danh sách phòng thuê",
        });
    }
};

// POST /api/phong-thue
// Tạo phòng thuê mới
export const createRoom = async (req, res) => {
    try {
        const {
            tenPhong,
            khach,
            phongNgu,
            giuong,
            phongTam,
            moTa,
            giaTien,
            maViTri,
            hinhAnh,
            ...amenities
        } = req.body;

        // Kiểm tra các trường bắt buộc
        if (
            !tenPhong ||
            !moTa ||
            khach === undefined ||
            phongNgu === undefined ||
            giuong === undefined ||
            phongTam === undefined ||
            giaTien === undefined ||
            maViTri === undefined
        ) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin phòng thuê",
            });
        }

        // Kiểm tra các trường số
        const numericFields = {
            khach,
            phongNgu,
            giuong,
            phongTam,
            giaTien,
            maViTri,
        };

        for (const [field, value] of Object.entries(numericFields)) {
            if (!isValidNonNegativeInteger(value)) {
                return res.status(400).json({
                    message: `${field} phải là số nguyên không âm`,
                });
            }
        }

        if (maViTri <= 0) {
            return res.status(400).json({
                message: "maViTri phải lớn hơn 0",
            });
        }

        // Kiểm tra các tiện ích phải là Boolean
        for (const field of amenityFields) {
            if (
                amenities[field] !== undefined &&
                typeof amenities[field] !== "boolean"
            ) {
                return res.status(400).json({
                    message: `${field} phải có giá trị true hoặc false`,
                });
            }
        }

        const newRoom = await prisma.phong.create({
            data: {
                tenPhong,
                khach,
                phongNgu,
                giuong,
                phongTam,
                moTa,
                giaTien,
                maViTri,
                hinhAnh: hinhAnh || null,

                mayGiat: amenities.mayGiat ?? false,
                banLa: amenities.banLa ?? false,
                tivi: amenities.tivi ?? false,
                dieuHoa: amenities.dieuHoa ?? false,
                wifi: amenities.wifi ?? false,
                bep: amenities.bep ?? false,
                doXe: amenities.doXe ?? false,
                hoBoi: amenities.hoBoi ?? false,
                banUi: amenities.banUi ?? false,
            },
            include: {
                viTri: true,
            },
        });

        return res.status(201).json({
            message: "Tạo phòng thuê thành công",
            data: newRoom,
        });
    } catch (error) {
        console.error("Create room error:", error);

        if (error.code === "P2003") {
            return res.status(400).json({
                message: "Vị trí được chọn không tồn tại",
            });
        }

        return res.status(500).json({
            message: "Lỗi server khi tạo phòng thuê",
        });
    }
};

// GET /api/phong-thue/lay-phong-theo-vi-tri?maViTri=1
// Lấy danh sách phòng theo mã vị trí
export const getRoomsByLocation = async (req, res) => {
    try {
        const maViTri = Number(req.query.maViTri);

        if (!Number.isInteger(maViTri) || maViTri <= 0) {
            return res.status(400).json({
                message: "Vui lòng cung cấp maViTri hợp lệ",
            });
        }

        const location = await prisma.viTri.findUnique({
            where: {
                id: maViTri,
            },
        });

        if (!location) {
            return res.status(404).json({
                message: "Không tìm thấy vị trí",
            });
        }

        const rooms = await prisma.phong.findMany({
            where: {
                maViTri,
            },
            include: {
                viTri: true,
            },
            orderBy: {
                id: "desc",
            },
        });

        return res.status(200).json({
            message: "Lấy danh sách phòng theo vị trí thành công",
            data: rooms,
        });
    } catch (error) {
        console.error("Get rooms by location error:", error);

        return res.status(500).json({
            message: "Lỗi server khi lấy phòng theo vị trí",
        });
    }
};

// GET /api/phong-thue/:id
// Lấy thông tin phòng theo ID
export const getRoomById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID phòng không hợp lệ",
            });
        }

        const room = await prisma.phong.findUnique({
            where: {
                id,
            },
            include: {
                viTri: true,
                binhLuans: true,
            },
        });

        if (!room) {
            return res.status(404).json({
                message: "Không tìm thấy phòng thuê",
            });
        }

        return res.status(200).json({
            message: "Lấy thông tin phòng thuê thành công",
            data: room,
        });
    } catch (error) {
        console.error("Get room by ID error:", error);

        return res.status(500).json({
            message: "Lỗi server khi lấy thông tin phòng thuê",
        });
    }
};

// PUT /api/phong-thue/:id
// Cập nhật thông tin phòng thuê
export const updateRoom = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID phòng không hợp lệ",
            });
        }

        const existingRoom = await prisma.phong.findUnique({
            where: {
                id,
            },
        });

        if (!existingRoom) {
            return res.status(404).json({
                message: "Không tìm thấy phòng thuê",
            });
        }

        const {
            tenPhong,
            khach,
            phongNgu,
            giuong,
            phongTam,
            moTa,
            giaTien,
            maViTri,
            hinhAnh,
            ...amenities
        } = req.body;

        const numericFields = {
            khach,
            phongNgu,
            giuong,
            phongTam,
            giaTien,
            maViTri,
        };

        for (const [field, value] of Object.entries(numericFields)) {
            if (
                value !== undefined &&
                !isValidNonNegativeInteger(value)
            ) {
                return res.status(400).json({
                    message: `${field} phải là số nguyên không âm`,
                });
            }
        }

        if (maViTri !== undefined && maViTri <= 0) {
            return res.status(400).json({
                message: "maViTri phải lớn hơn 0",
            });
        }

        for (const field of amenityFields) {
            if (
                amenities[field] !== undefined &&
                typeof amenities[field] !== "boolean"
            ) {
                return res.status(400).json({
                    message: `${field} phải có giá trị true hoặc false`,
                });
            }
        }

        const updateData = {
            ...(tenPhong !== undefined && { tenPhong }),
            ...(khach !== undefined && { khach }),
            ...(phongNgu !== undefined && { phongNgu }),
            ...(giuong !== undefined && { giuong }),
            ...(phongTam !== undefined && { phongTam }),
            ...(moTa !== undefined && { moTa }),
            ...(giaTien !== undefined && { giaTien }),
            ...(maViTri !== undefined && { maViTri }),
            ...(hinhAnh !== undefined && { hinhAnh }),
        };

        for (const field of amenityFields) {
            if (amenities[field] !== undefined) {
                updateData[field] = amenities[field];
            }
        }

        const updatedRoom = await prisma.phong.update({
            where: {
                id,
            },
            data: updateData,
            include: {
                viTri: true,
            },
        });

        return res.status(200).json({
            message: "Cập nhật phòng thuê thành công",
            data: updatedRoom,
        });
    } catch (error) {
        console.error("Update room error:", error);

        if (error.code === "P2003") {
            return res.status(400).json({
                message: "Vị trí được chọn không tồn tại",
            });
        }

        return res.status(500).json({
            message: "Lỗi server khi cập nhật phòng thuê",
        });
    }
};

// DELETE /api/phong-thue/:id
// Xóa phòng thuê
export const deleteRoom = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID phòng không hợp lệ",
            });
        }

        const existingRoom = await prisma.phong.findUnique({
            where: {
                id,
            },
        });

        if (!existingRoom) {
            return res.status(404).json({
                message: "Không tìm thấy phòng thuê",
            });
        }

        await prisma.phong.delete({
            where: {
                id,
            },
        });

        return res.status(200).json({
            message: "Xóa phòng thuê thành công",
        });
    } catch (error) {
        console.error("Delete room error:", error);

        if (error.code === "P2003") {
            return res.status(409).json({
                message: "Không thể xóa phòng vì vẫn còn đặt phòng hoặc bình luận liên quan",
            });
        }

        return res.status(500).json({
            message: "Lỗi server khi xóa phòng thuê",
        });
    }
};

// GET /api/phong-thue/phan-trang-tim-kiem
// Phân trang và tìm kiếm phòng thuê
export const getRoomsPagination = async (req, res) => {
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
                        tenPhong: {
                            contains: keyword,
                        },
                    },
                    {
                        moTa: {
                            contains: keyword,
                        },
                    },
                ],
            }
            : {};

        const [rooms, totalItems] = await prisma.$transaction([
            prisma.phong.findMany({
                where,
                include: {
                    viTri: true,
                },
                skip: (pageIndex - 1) * pageSize,
                take: pageSize,
                orderBy: {
                    id: "desc",
                },
            }),
            prisma.phong.count({
                where,
            }),
        ]);

        return res.status(200).json({
            message: "Lấy danh sách phòng thuê phân trang thành công",
            pageIndex,
            pageSize,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            data: rooms,
        });
    } catch (error) {
        console.error("Pagination rooms error:", error);

        return res.status(500).json({
            message: "Lỗi server khi phân trang phòng thuê",
        });
    }
};

// Upload hình ảnh phòng thuê
export const uploadRoomImage = async (req, res) => {
    try {
        const { maPhong } = req.query;

        // Kiểm tra mã phòng
        if (!maPhong || isNaN(Number(maPhong))) {
            return res.status(400).json({
                message: "Vui lòng cung cấp maPhong hợp lệ.",
            });
        }

        // Kiểm tra file ảnh
        if (!req.file) {
            return res.status(400).json({
                message: "Vui lòng chọn hình ảnh phòng thuê.",
            });
        }

        // Kiểm tra phòng có tồn tại không
        const room = await prisma.phong.findUnique({
            where: {
                id: Number(maPhong),
            },
        });

        if (!room) {
            return res.status(404).json({
                message: "Không tìm thấy phòng thuê.",
            });
        }

        // Upload ảnh lên Cloudinary
        const uploadedImage = await uploadToCloudinary(
            req.file.buffer,
            "rooms"
        );

        // Cập nhật URL ảnh vào database
        const updatedRoom = await prisma.phong.update({
            where: {
                id: Number(maPhong),
            },
            data: {
                hinhAnh: uploadedImage.url,
            },
        });

        return res.status(200).json({
            message: "Upload hình ảnh phòng thuê thành công.",
            content: updatedRoom,
        });
    } catch (error) {
        console.error("Upload room image error:", error);

        return res.status(500).json({
            message: "Lỗi khi upload hình ảnh phòng thuê.",
        });
    }
};