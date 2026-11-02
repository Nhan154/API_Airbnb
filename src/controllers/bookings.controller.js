import { sendPrismaError, logRequestError } from "../utils/sendPrismaError.js";

import prisma from "../config/prisma.js";
import { hasNonEmptyBody, isPastCalendarDate, parseDate } from "../utils/requestValidation.js";

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
        if (sendPrismaError(res, error)) return;
        logRequestError("Get bookings error", error);
        return res.status(500).json({
            message: "Lỗi khi lấy danh sách đặt phòng.",
        });
    }
};

// POST /api/dat-phong
export const createBooking = async (req, res) => {
    try {
        const body = req.body ?? {};
        if (!hasNonEmptyBody(body)) {
            return res.status(400).json({ message: "Body phải là object JSON không rỗng." });
        }
        const {
            maPhong,
            ngayDen,
            ngayDi,
            soLuongKhach,
        } = body;

        const roomId = Number(maPhong);
        const requestedUserId = body.maNguoiDung;
        const userId = req.user.role === "ADMIN" && requestedUserId !== undefined
            ? Number(requestedUserId)
            : Number(req.user.id);
        const guests = Number(soLuongKhach);
        const checkIn = parseDate(ngayDen);
        const checkOut = parseDate(ngayDi);

        if (
            !maPhong ||
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
            roomId <= 0 ||
            !Number.isInteger(userId) || userId <= 0 ||
            !Number.isInteger(guests) ||
            guests < 1
        ) {
            return res.status(400).json({
                message: "Mã phòng, mã người dùng hoặc số lượng khách không hợp lệ.",
            });
        }

        if (
            !checkIn || !checkOut ||
            checkOut <= checkIn
        ) {
            return res.status(400).json({
                message: "Ngày đi phải hợp lệ và sau ngày đến.",
            });
        }

        if (isPastCalendarDate(checkIn)) {
            return res.status(400).json({ message: "Ngày nhận phòng không được ở trong quá khứ." });
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

        const result = await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT id FROM Phong WHERE id = ${roomId} FOR UPDATE`;
            const lockedRoom = await tx.phong.findUnique({ where: { id: roomId } });
            if (!lockedRoom) return { missingRoom: true };
            if (guests > lockedRoom.khach) return { overCapacity: true };

            const conflict = await tx.datPhong.findFirst({
                where: { maPhong: roomId, ngayDen: { lt: checkOut }, ngayDi: { gt: checkIn } },
                select: { id: true },
            });
            if (conflict) return { conflict: true };

            const booking = await tx.datPhong.create({
                data: { maPhong: roomId, ngayDen: checkIn, ngayDi: checkOut, soLuongKhach: guests, maNguoiDat: userId },
            });
            return { booking };
        });

        if (result.missingRoom) return res.status(404).json({ message: "Không tìm thấy phòng." });
        if (result.overCapacity) return res.status(400).json({ message: "Số lượng khách vượt quá sức chứa của phòng." });
        if (result.conflict) return res.status(409).json({ message: "Phòng đã được đặt trong khoảng thời gian này." });

        return res.status(201).json({
            message: "Đặt phòng thành công.",
            data: result.booking,
        });
    } catch (error) {
        if (sendPrismaError(res, error)) return;
        logRequestError("Create booking error", error);
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

        if (req.user.role !== "ADMIN" && booking.maNguoiDat !== Number(req.user.id)) {
            return res.status(403).json({ message: "Bạn không có quyền xem đặt phòng này." });
        }

        return res.status(200).json(booking);
    } catch (error) {
        if (sendPrismaError(res, error)) return;
        logRequestError("Get booking error", error);
        return res.status(500).json({
            message: "Lỗi khi lấy thông tin đặt phòng.",
        });
    }
};

// PUT /api/dat-phong/:id
export const updateBooking = async (req, res) => {
    try {
        const body = req.body ?? {};
        if (!hasNonEmptyBody(body)) return res.status(400).json({ message: "Body phải là object JSON không rỗng." });
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

        if (req.user.role !== "ADMIN" && existingBooking.maNguoiDat !== Number(req.user.id)) {
            return res.status(403).json({ message: "Bạn không có quyền cập nhật đặt phòng này." });
        }

        if (req.user.role !== "ADMIN" && body.maNguoiDung !== undefined) {
            return res.status(403).json({ message: "Không được thay đổi chủ sở hữu đặt phòng." });
        }
        const finalRoomId = body.maPhong === undefined ? existingBooking.maPhong : Number(body.maPhong);
        const finalGuests = body.soLuongKhach === undefined ? existingBooking.soLuongKhach : Number(body.soLuongKhach);
        const finalCheckIn = body.ngayDen === undefined ? existingBooking.ngayDen : parseDate(body.ngayDen);
        const finalCheckOut = body.ngayDi === undefined ? existingBooking.ngayDi : parseDate(body.ngayDi);
        const finalUserId = req.user.role === "ADMIN" && body.maNguoiDung !== undefined
            ? Number(body.maNguoiDung)
            : existingBooking.maNguoiDat;

        if (!Number.isInteger(finalRoomId) || finalRoomId <= 0 ||
            !Number.isInteger(finalGuests) || finalGuests <= 0 ||
            !Number.isInteger(finalUserId) || finalUserId <= 0 || !finalCheckIn || !finalCheckOut) {
            return res.status(400).json({ message: "Mã phòng, người dùng, số khách hoặc ngày không hợp lệ." });
        }
        if (finalCheckOut <= finalCheckIn) return res.status(400).json({ message: "Ngày đi phải sau ngày đến." });
        if (isPastCalendarDate(finalCheckIn)) return res.status(400).json({ message: "Ngày nhận phòng không được ở trong quá khứ." });

        const [firstLock, secondLock] = [existingBooking.maPhong, finalRoomId].sort((a, b) => a - b);
        const result = await prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT id FROM Phong WHERE id = ${firstLock} FOR UPDATE`;
            if (secondLock !== firstLock) await tx.$queryRaw`SELECT id FROM Phong WHERE id = ${secondLock} FOR UPDATE`;

            const room = await tx.phong.findUnique({ where: { id: finalRoomId } });
            if (!room) return { missingRoom: true };
            if (finalGuests > room.khach) return { overCapacity: true };
            if (!await tx.nguoiDung.findUnique({ where: { id: finalUserId }, select: { id: true } })) return { missingUser: true };

            const conflict = await tx.datPhong.findFirst({
                where: { id: { not: id }, maPhong: finalRoomId, ngayDen: { lt: finalCheckOut }, ngayDi: { gt: finalCheckIn } },
                select: { id: true },
            });
            if (conflict) return { conflict: true };

            const data = { maPhong: finalRoomId, maNguoiDat: finalUserId, soLuongKhach: finalGuests, ngayDen: finalCheckIn, ngayDi: finalCheckOut };
            return { booking: await tx.datPhong.update({ where: { id }, data }) };
        });

        if (result.missingRoom) return res.status(404).json({ message: "Không tìm thấy phòng." });
        if (result.missingUser) return res.status(404).json({ message: "Không tìm thấy người dùng." });
        if (result.overCapacity) return res.status(400).json({ message: "Số lượng khách vượt quá sức chứa của phòng." });
        if (result.conflict) return res.status(409).json({ message: "Phòng đã được đặt trong khoảng thời gian này." });

        return res.status(200).json({
            message: "Cập nhật đặt phòng thành công.",
            data: result.booking,
        });
    } catch (error) {
        if (sendPrismaError(res, error)) return;
        logRequestError("Update booking error", error);
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

        if (req.user.role !== "ADMIN" && booking.maNguoiDat !== Number(req.user.id)) {
            return res.status(403).json({ message: "Bạn không có quyền xóa đặt phòng này." });
        }

        await prisma.datPhong.delete({
            where: { id },
        });

        return res.status(200).json({
            message: "Xóa đặt phòng thành công.",
        });
    } catch (error) {
        if (sendPrismaError(res, error)) return;
        logRequestError("Delete booking error", error);
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

        if (req.user.role !== "ADMIN" && Number(req.user.id) !== userId) {
            return res.status(403).json({ message: "Bạn không có quyền xem đặt phòng của người dùng này." });
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
        if (sendPrismaError(res, error)) return;
        logRequestError("Get bookings by user error", error);
        return res.status(500).json({
            message: "Lỗi khi lấy danh sách đặt phòng của người dùng.",
        });
    }
};
