const knownErrors = {
    P2000: [400, "Dữ liệu vượt quá giới hạn cho phép."],
    P2002: [409, "Dữ liệu bị trùng."],
    P2003: [409, "Dữ liệu đang được tham chiếu hoặc quan hệ không hợp lệ."],
    P2009: [400, "Dữ liệu truy vấn không hợp lệ."],
    P2011: [400, "Thiếu trường bắt buộc."],
    P2012: [400, "Thiếu trường bắt buộc."],
    P2025: [404, "Không tìm thấy dữ liệu cần thao tác."],
};

export const sendPrismaError = (res, error) => {
    const known = knownErrors[error?.code];
    if (!known) return false;
    console.error("Prisma request rejected", { code: error.code });
    res.status(known[0]).json({ message: known[1] });
    return true;
};

export const logRequestError = (label, error) => {
    console.error(label, {
        code: typeof error?.code === "string" ? error.code : undefined,
        name: typeof error?.name === "string" ? error.name : "Error",
    });
};
