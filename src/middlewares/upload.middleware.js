import multer from "multer";

// Lưu file tạm trong bộ nhớ, không lưu trực tiếp vào ổ đĩa
const storage = multer.memoryStorage();

// Chỉ chấp nhận các định dạng hình ảnh
const fileFilter = (req, file, callback) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
    ];

    if (allowedTypes.includes(file.mimetype)) {
        callback(null, true);
    } else {
        callback(
            new Error("Chỉ chấp nhận file JPG, PNG, WEBP hoặc GIF.")
        );
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Tối đa 5MB
    },
});

export default upload;
