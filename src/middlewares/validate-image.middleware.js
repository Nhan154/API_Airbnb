const signatures = {
    "image/jpeg": (buffer) => buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
    "image/png": (buffer) => buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/webp": (buffer) => buffer.length >= 12 && buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP",
    "image/gif": (buffer) => buffer.length >= 6 && ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6)),
};

export const validateImageUpload = (req, res, next) => {
    if (!req.file) return res.status(400).json({ message: "Vui lòng chọn file ảnh." });
    const matches = signatures[req.file.mimetype];
    if (!req.file.buffer?.length || !matches || !matches(req.file.buffer)) {
        return res.status(400).json({ message: "Nội dung file không phải ảnh hợp lệ hoặc không khớp định dạng khai báo." });
    }
    return next();
};
