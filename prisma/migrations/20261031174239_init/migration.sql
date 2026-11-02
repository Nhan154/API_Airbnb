-- CreateTable
CREATE TABLE `NguoiDung` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `pass_word` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(50) NULL,
    `birth_day` VARCHAR(50) NULL,
    `gender` BOOLEAN NULL,
    `role` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `NguoiDung_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ViTri` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ten_vi_tri` VARCHAR(255) NOT NULL,
    `tinh_thanh` VARCHAR(255) NOT NULL,
    `quoc_gia` VARCHAR(255) NOT NULL,
    `hinh_anh` VARCHAR(500) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Phong` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ten_phong` VARCHAR(255) NOT NULL,
    `khach` INTEGER NOT NULL,
    `phong_ngu` INTEGER NOT NULL,
    `giuong` INTEGER NOT NULL,
    `phong_tam` INTEGER NOT NULL,
    `mo_ta` TEXT NOT NULL,
    `gia_tien` INTEGER NOT NULL,
    `may_giat` BOOLEAN NOT NULL DEFAULT false,
    `ban_la` BOOLEAN NOT NULL DEFAULT false,
    `tivi` BOOLEAN NOT NULL DEFAULT false,
    `dieu_hoa` BOOLEAN NOT NULL DEFAULT false,
    `wifi` BOOLEAN NOT NULL DEFAULT false,
    `bep` BOOLEAN NOT NULL DEFAULT false,
    `do_xe` BOOLEAN NOT NULL DEFAULT false,
    `ho_boi` BOOLEAN NOT NULL DEFAULT false,
    `ban_ui` BOOLEAN NOT NULL DEFAULT false,
    `ma_vi_tri` INTEGER NOT NULL,
    `hinh_anh` VARCHAR(500) NULL,

    INDEX `Phong_ma_vi_tri_idx`(`ma_vi_tri`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DatPhong` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_phong` INTEGER NOT NULL,
    `ngay_den` DATETIME(3) NOT NULL,
    `ngay_di` DATETIME(3) NOT NULL,
    `so_luong_khach` INTEGER NOT NULL,
    `ma_nguoi_dat` INTEGER NOT NULL,

    INDEX `DatPhong_ma_phong_idx`(`ma_phong`),
    INDEX `DatPhong_ma_nguoi_dat_idx`(`ma_nguoi_dat`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BinhLuan` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ma_phong` INTEGER NOT NULL,
    `ma_nguoi_binh_luan` INTEGER NOT NULL,
    `ngay_binh_luan` DATETIME(3) NOT NULL,
    `noi_dung` TEXT NOT NULL,
    `sao_binh_luan` INTEGER NOT NULL,

    INDEX `BinhLuan_ma_phong_idx`(`ma_phong`),
    INDEX `BinhLuan_ma_nguoi_binh_luan_idx`(`ma_nguoi_binh_luan`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Phong` ADD CONSTRAINT `Phong_ma_vi_tri_fkey` FOREIGN KEY (`ma_vi_tri`) REFERENCES `ViTri`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DatPhong` ADD CONSTRAINT `DatPhong_ma_phong_fkey` FOREIGN KEY (`ma_phong`) REFERENCES `Phong`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DatPhong` ADD CONSTRAINT `DatPhong_ma_nguoi_dat_fkey` FOREIGN KEY (`ma_nguoi_dat`) REFERENCES `NguoiDung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BinhLuan` ADD CONSTRAINT `BinhLuan_ma_phong_fkey` FOREIGN KEY (`ma_phong`) REFERENCES `Phong`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BinhLuan` ADD CONSTRAINT `BinhLuan_ma_nguoi_binh_luan_fkey` FOREIGN KEY (`ma_nguoi_binh_luan`) REFERENCES `NguoiDung`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
