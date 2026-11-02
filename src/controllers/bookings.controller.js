
import prisma from "../config/prisma.js";

// GET /api/dat-phong
export const getBookings = async (req, res) => {
    try {
        const bookings = await prisma.datPhong.findMany({
            include: {
                phong: true,
                nguoiDung: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: { id: "desc" },
        });

        return res.status(200).json(bookings);
    } catch (error) {
        console.error("Get bookings error:", error);
        return res.status(500).json({
            message: "Lỗi khi lấy danh sách đặt phòng.",
        });
    }
};

// POST /api/dat-phong
export const createBooking = async (req, res) => {
    try {
        const {
            maPhong,
            ngayDen,
            ngayDi,
            soLuongKhach,
            maNguoiDung,
        } = req.body;

        const roomId = Number(maPhong);
        const userId = Number(maNguoiDung);
        const guests = Number(soLuongKhach);
        const checkIn = new Date(ngayDen);
        const checkOut = new Date(ngayDi);

        if (
            !maPhong ||
            !maNguoiDung ||
            !ngayDen ||
            !ngayDi ||
            soLuongKhach === undefined
        ) {
            return res.status(400).json({
                message: "Vui lòng nhập đầy đủ thông tin đặt phòng.",
            });
        }

        if (
            !Number.isInteger(roomId) ||
            !Number.isInteger(userId) ||
            !Number.isInteger(guests) ||
            guests < 1
        ) {
            return res.status(400).json({
                message: "Mã phòng, mã người dùng hoặc số lượng khách không hợp lệ.",
            });
        }

        if (
            Number.isNaN(checkIn.getTime()) ||
            Number.isNaN(checkOut.getTime()) ||
            checkOut <= checkIn
        ) {
            return res.status(400).json({
                message: "Ngày đi phải hợp lệ và sau ngày đến.",
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

        if (guests > room.khach) {
            return res.status(400).json({
                message: "Số lượng khách vượt quá sức chứa của phòng.",
            });
        }

        const booking = await prisma.datPhong.create({
            data: {
                maPhong: roomId,
                ngayDen: checkIn,
                ngayDi: checkOut,
                soLuongKhach: guests,
                maNguoiDat: userId,
            },
        });

        return res.status(201).json({
            message: "Đặt phòng thành công.",
            data: booking,
        });
    } catch (error) {
        console.error("Create booking error:", error);
        return res.status(500).json({
            message: "Lỗi khi tạo đặt phòng.",
        });
    }
};

// GET /api/dat-phong/:id
export const getBookingById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID đặt phòng không hợp lệ.",
            });
        }

        const booking = await prisma.datPhong.findUnique({
            where: { id },
            include: {
                phong: true,
                nguoiDung: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });

        if (!booking) {
            return res.status(404).json({
                message: "Không tìm thấy thông tin đặt phòng.",
            });
        }

        return res.status(200).json(booking);
    } catch (error) {
        console.error("Get booking error:", error);
        return res.status(500).json({
            message: "Lỗi khi lấy thông tin đặt phòng.",
        });
    }
};

// PUT /api/dat-phong/:id
export const updateBooking = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID đặt phòng không hợp lệ.",
            });
        }

        const existingBooking = await prisma.datPhong.findUnique({
            where: { id },
        });

        if (!existingBooking) {
            return res.status(404).json({
                message: "Không tìm thấy thông tin đặt phòng.",
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

            data.maPhong = roomId;
        }

        if (req.body.maNguoiDung !== undefined) {
            const userId = Number(req.body.maNguoiDung);

            if (!Number.isInteger(userId) || userId <= 0) {
                return res.status(400).json({
                    message: "Mã người dùng không hợp lệ.",
                });
            }

            data.maNguoiDat = userId;
        }

        if (req.body.soLuongKhach !== undefined) {
            const guests = Number(req.body.soLuongKhach);

            if (!Number.isInteger(guests) || guests < 1) {
                return res.status(400).json({
                    message: "Số lượng khách phải là số nguyên lớn hơn 0.",
                });
            }

            data.soLuongKhach = guests;
        }

        if (req.body.ngayDen !== undefined) {
            const checkIn = new Date(req.body.ngayDen);

            if (Number.isNaN(checkIn.getTime())) {
                return res.status(400).json({
                    message: "Ngày đến không hợp lệ.",
                });
            }

            data.ngayDen = checkIn;
        }

        if (req.body.ngayDi !== undefined) {
            const checkOut = new Date(req.body.ngayDi);

            if (Number.isNaN(checkOut.getTime())) {
                return res.status(400).json({
                    message: "Ngày đi không hợp lệ.",
                });
            }

            data.ngayDi = checkOut;
        }

        const finalCheckIn = data.ngayDen ?? existingBooking.ngayDen;
        const finalCheckOut = data.ngayDi ?? existingBooking.ngayDi;

        if (finalCheckOut <= finalCheckIn) {
            return res.status(400).json({
                message: "Ngày đi phải sau ngày đến.",
            });
        }

        const finalRoomId = data.maPhong ?? existingBooking.maPhong;
        const finalUserId = data.maNguoiDat ?? existingBooking.maNguoiDat;
        const finalGuests = data.soLuongKhach ?? existingBooking.soLuongKhach;

        const room = await prisma.phong.findUnique({
            where: { id: finalRoomId },
        });

        if (!room) {
            return res.status(404).json({
                message: "Không tìm thấy phòng.",
            });
        }

        const user = await prisma.nguoiDung.findUnique({
            where: { id: finalUserId },
        });

        if (!user) {
            return res.status(404).json({
                message: "Không tìm thấy người dùng.",
            });
        }

        if (finalGuests > room.khach) {
            return res.status(400).json({
                message: "Số lượng khách vượt quá sức chứa của phòng.",
            });
        }

        const updatedBooking = await prisma.datPhong.update({
            where: { id },
            data,
        });

        return res.status(200).json({
            message: "Cập nhật đặt phòng thành công.",
            data: updatedBooking,
        });
    } catch (error) {
        console.error("Update booking error:", error);
        return res.status(500).json({
            message: "Lỗi khi cập nhật đặt phòng.",
        });
    }
};

// DELETE /api/dat-phong/:id
export const deleteBooking = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID đặt phòng không hợp lệ.",
            });
        }

        const booking = await prisma.datPhong.findUnique({
            where: { id },
        });

        if (!booking) {
            return res.status(404).json({
                message: "Không tìm thấy thông tin đặt phòng.",
            });
        }

        await prisma.datPhong.delete({
            where: { id },
        });

        return res.status(200).json({
            message: "Xóa đặt phòng thành công.",
        });
    } catch (error) {
        console.error("Delete booking error:", error);
        return res.status(500).json({
            message: "Lỗi khi xóa đặt phòng.",
        });
    }
};

// GET /api/dat-phong/lay-theo-nguoi-dung/:MaNguoiDung
export const getBookingsByUser = async (req, res) => {
    try {
        const userId = Number(req.params.MaNguoiDung);

        if (!Number.isInteger(userId) || userId <= 0) {
            return res.status(400).json({
                message: "Mã người dùng không hợp lệ.",
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

        const bookings = await prisma.datPhong.findMany({
            where: { maNguoiDat: userId },
            include: {
                phong: true,
            },
            orderBy: { id: "desc" },
        });

        return res.status(200).json(bookings);
    } catch (error) {
        console.error("Get bookings by user error:", error);
        return res.status(500).json({
            message: "Lỗi khi lấy danh sách đặt phòng của người dùng.",
        });
    }
};
