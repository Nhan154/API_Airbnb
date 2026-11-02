import prisma from "../config/prisma.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

// GET /api/vi-tri
// Lấy danh sách tất cả vị trí
export const getLocations = async (req, res) => {
    try {
        const locations = await prisma.viTri.findMany({
            orderBy: {
                id: "desc",
            },
        });

        return res.status(200).json({
            message: "Lấy danh sách vị trí thành công",
            data: locations,
        });
    } catch (error) {
        console.error("Get locations error:", error);

        return res.status(500).json({
            message: "Lỗi server khi lấy danh sách vị trí",
        });
    }
};

// POST /api/vi-tri
// Tạo vị trí mới
export const createLocation = async (req, res) => {
    try {
        const {
            tenViTri,
            tinhThanh,
            quocGia,
            hinhAnh,
        } = req.body;

        if (!tenViTri || !tinhThanh || !quocGia) {
            return res.status(400).json({
                message: "Vui lòng nhập tenViTri, tinhThanh và quocGia",
            });
        }

        const newLocation = await prisma.viTri.create({
            data: {
                tenViTri,
                tinhThanh,
                quocGia,
                hinhAnh: hinhAnh || null,
            },
        });

        return res.status(201).json({
            message: "Tạo vị trí thành công",
            data: newLocation,
        });
    } catch (error) {
        console.error("Create location error:", error);

        return res.status(500).json({
            message: "Lỗi server khi tạo vị trí",
        });
    }
};

// GET /api/vi-tri/:id
// Lấy thông tin vị trí theo ID
export const getLocationById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID vị trí không hợp lệ",
            });
        }

        const location = await prisma.viTri.findUnique({
            where: { id },
        });

        if (!location) {
            return res.status(404).json({
                message: "Không tìm thấy vị trí",
            });
        }

        return res.status(200).json({
            message: "Lấy thông tin vị trí thành công",
            data: location,
        });
    } catch (error) {
        console.error("Get location by ID error:", error);

        return res.status(500).json({
            message: "Lỗi server khi lấy thông tin vị trí",
        });
    }
};

// PUT /api/vi-tri/:id
// Cập nhật thông tin vị trí
export const updateLocation = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID vị trí không hợp lệ",
            });
        }

        const existingLocation = await prisma.viTri.findUnique({
            where: { id },
        });

        if (!existingLocation) {
            return res.status(404).json({
                message: "Không tìm thấy vị trí",
            });
        }

        const {
            tenViTri,
            tinhThanh,
            quocGia,
            hinhAnh,
        } = req.body;

        const updatedLocation = await prisma.viTri.update({
            where: { id },
            data: {
                ...(tenViTri !== undefined && { tenViTri }),
                ...(tinhThanh !== undefined && { tinhThanh }),
                ...(quocGia !== undefined && { quocGia }),
                ...(hinhAnh !== undefined && { hinhAnh }),
            },
        });

        return res.status(200).json({
            message: "Cập nhật vị trí thành công",
            data: updatedLocation,
        });
    } catch (error) {
        console.error("Update location error:", error);

        return res.status(500).json({
            message: "Lỗi server khi cập nhật vị trí",
        });
    }
};

// DELETE /api/vi-tri/:id
// Xóa vị trí
export const deleteLocation = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID vị trí không hợp lệ",
            });
        }

        const existingLocation = await prisma.viTri.findUnique({
            where: { id },
        });

        if (!existingLocation) {
            return res.status(404).json({
                message: "Không tìm thấy vị trí",
            });
        }

        await prisma.viTri.delete({
            where: { id },
        });

        return res.status(200).json({
            message: "Xóa vị trí thành công",
        });
    } catch (error) {
        console.error("Delete location error:", error);

        if (error.code === "P2003") {
            return res.status(409).json({
                message: "Không thể xóa vị trí vì vẫn còn phòng thuê liên quan",
            });
        }

        return res.status(500).json({
            message: "Lỗi server khi xóa vị trí",
        });
    }
};

// GET /api/vi-tri/phan-trang-tim-kiem
// Phân trang và tìm kiếm vị trí
export const getLocationsPagination = async (req, res) => {
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
                        tenViTri: {
                            contains: keyword,
                        },
                    },
                    {
                        tinhThanh: {
                            contains: keyword,
                        },
                    },
                    {
                        quocGia: {
                            contains: keyword,
                        },
                    },
                ],
            }
            : {};

        const [locations, totalItems] = await prisma.$transaction([
            prisma.viTri.findMany({
                where,
                skip: (pageIndex - 1) * pageSize,
                take: pageSize,
                orderBy: {
                    id: "desc",
                },
            }),
            prisma.viTri.count({ where }),
        ]);

        return res.status(200).json({
            message: "Lấy danh sách vị trí phân trang thành công",
            pageIndex,
            pageSize,
            totalItems,
            totalPages: Math.ceil(totalItems / pageSize),
            data: locations,
        });
    } catch (error) {
        console.error("Pagination locations error:", error);

        return res.status(500).json({
            message: "Lỗi server khi phân trang vị trí",
        });
    }
};

// Upload hình ảnh vị trí
export const uploadLocationImage = async (req, res) => {
    try {
        const { maViTri } = req.query;

        // Kiểm tra mã vị trí
        if (!maViTri || isNaN(Number(maViTri))) {
            return res.status(400).json({
                message: "Vui lòng cung cấp maViTri hợp lệ.",
            });
        }

        // Kiểm tra file ảnh
        if (!req.file) {
            return res.status(400).json({
                message: "Vui lòng chọn hình ảnh vị trí.",
            });
        }

        // Kiểm tra vị trí có tồn tại không
        const location = await prisma.viTri.findUnique({
            where: {
                id: Number(maViTri),
            },
        });

        if (!location) {
            return res.status(404).json({
                message: "Không tìm thấy vị trí.",
            });
        }

        // Upload ảnh lên Cloudinary
        const uploadedImage = await uploadToCloudinary(
            req.file.buffer,
            "locations"
        );

        // Cập nhật URL ảnh vào database
        const updatedLocation = await prisma.viTri.update({
            where: {
                id: Number(maViTri),
            },
            data: {
                hinhAnh: uploadedImage.url,
            },
        });

        return res.status(200).json({
            message: "Upload hình ảnh vị trí thành công.",
            content: updatedLocation,
        });
    } catch (error) {
        console.error("Upload location image error:", error);

        return res.status(500).json({
            message: "Lỗi khi upload hình ảnh vị trí.",
        });
    }
};