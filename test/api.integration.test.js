import "dotenv/config";
import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import prisma from "../src/config/prisma.js";
import app from "../src/server.js";

const enabled = process.env.RUN_INTEGRATION_TESTS === "1";
const secret = process.env.JWT_SECRET;
let server;
let baseUrl;
let admin;
let primaryUser;
let secondUser;
let location;
let room;
let booking;
let comment;
const createdEmails = [];

const request = async (path, { method = "GET", token, body, form } = {}) => {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    let payload;
    if (form) payload = form;
    else if (body !== undefined) {
        headers["Content-Type"] = "application/json";
        payload = JSON.stringify(body);
    }
    const response = await fetch(`${baseUrl}${path}`, { method, headers, body: payload });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : null };
};

const tomorrow = (offsetDays = 1) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() + offsetDays);
    return date.toISOString().slice(0, 10);
};

const bookingPayload = (userId, start = 10, end = 12) => ({
    maPhong: room.id,
    maNguoiDung: userId,
    ngayDen: `${tomorrow(start)}T00:00:00.000Z`,
    ngayDi: `${tomorrow(end)}T00:00:00.000Z`,
    soLuongKhach: 2,
});

before(async () => {
    if (!enabled) return;
    assert.ok(secret, "JWT_SECRET must be configured for integration tests");
    const [{ caseMode }] = await prisma.$queryRaw`SELECT @@lower_case_table_names AS caseMode`;
    const userTables = await prisma.$queryRaw`SELECT TABLE_NAME AS tableName FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND LOWER(TABLE_NAME) = 'nguoidung'`;
    console.log(`MySQL identifier mode=${Number(caseMode)}; user table=${userTables.map(({ tableName }) => tableName).join(",") || "missing"}`);
    server = app.listen(0);
    await new Promise((resolve) => server.once("listening", resolve));
    baseUrl = `http://127.0.0.1:${server.address().port}`;

    const suffix = randomUUID();
    const password = "Integration-test-password-92!";
    const adminEmail = `it-admin-${suffix}@example.test`;
    const primaryEmail = `it-user-${suffix}@example.test`;
    const secondEmail = `it-user2-${suffix}@example.test`;
    createdEmails.push(adminEmail, primaryEmail, secondEmail);
    admin = await prisma.nguoiDung.create({
        data: { name: "Integration Admin", email: adminEmail, password: await bcrypt.hash(password, 10), role: "ADMIN" },
    });

    const adminLogin = await request("/api/auth/signin", { method: "POST", body: { email: adminEmail, password } });
    assert.equal(adminLogin.status, 200);
    admin.token = adminLogin.body.content.token;

    const signup = await request("/api/auth/signup", { method: "POST", body: { name: "Integration User", email: primaryEmail.toUpperCase(), password } });
    assert.equal(signup.status, 201);
    assert.equal("password" in signup.body.data, false);
    primaryUser = await prisma.nguoiDung.findUnique({ where: { email: primaryEmail } });
    const userLogin = await request("/api/auth/signin", { method: "POST", body: { email: primaryEmail, password } });
    assert.equal(userLogin.status, 200);
    primaryUser.token = userLogin.body.content.token;

    secondUser = await prisma.nguoiDung.create({
        data: { name: "Second Integration User", email: secondEmail, password: await bcrypt.hash(password, 10), role: "USER" },
    });
    secondUser.token = jwt.sign({ id: secondUser.id, role: "USER" }, secret, { expiresIn: "10m" });
});

after(async () => {
    if (!enabled) return;
    try {
        if (comment) await prisma.binhLuan.deleteMany({ where: { maPhong: room.id } });
        if (booking) await prisma.datPhong.deleteMany({ where: { maPhong: room.id } });
        if (room) await prisma.phong.deleteMany({ where: { id: room.id } });
        if (location) await prisma.viTri.deleteMany({ where: { id: location.id } });
        if (createdEmails.length) await prisma.nguoiDung.deleteMany({ where: { email: { in: createdEmails } } });
    } finally {
        if (server) await new Promise((resolve) => server.close(resolve));
        await prisma.$disconnect();
    }
});

test("API integration: auth, users, locations, rooms, bookings, comments and upload validation", { skip: !enabled }, async (t) => {
    await t.test("auth rejects invalid input and signin returns no password hash", async () => {
        assert.equal((await request("/api/auth/signup", { method: "POST", body: {} })).status, 400);
        assert.equal((await request("/api/auth/signup", { method: "POST", body: { name: "Bad", email: "bad", password: "short" } })).status, 400);
        const signedIn = await request("/api/auth/signin", { method: "POST", body: { email: primaryUser.email, password: "Integration-test-password-92!" } });
        assert.equal(signedIn.status, 200);
        assert.equal("password" in signedIn.body.content.user, false);
        assert.equal((await request("/api/auth/signup", { method: "POST", body: { name: "Integration User", email: primaryUser.email, password: "Integration-test-password-92!" } })).status, 409);
    });

    await t.test("users enforce ownership, validate fields, normalize email and omit hashes", async () => {
        const own = await request(`/api/users/${primaryUser.id}`, { token: primaryUser.token });
        assert.equal(own.status, 200);
        assert.equal("password" in own.body.data, false);
        assert.equal((await request(`/api/users/${secondUser.id}`, { token: primaryUser.token })).status, 403);
        assert.equal((await request(`/api/users/${primaryUser.id}`, { method: "PUT", token: primaryUser.token, body: { role: "ADMIN" } })).status, 403);
        assert.equal((await request(`/api/users/${primaryUser.id}`, { method: "PUT", token: primaryUser.token, body: { name: " " } })).status, 400);
        assert.equal((await request(`/api/users/${primaryUser.id}`, { method: "PUT", token: primaryUser.token, body: { name: "Integration User Updated" } })).status, 200);
        const list = await request("/api/users", { token: admin.token });
        assert.equal(list.status, 200);
        assert.ok(list.body.data.every((user) => !("password" in user)));
        assert.equal((await request("/api/users/search/Integration", { token: admin.token })).status, 200);
        assert.equal((await request("/api/users/phan-trang-tim-kiem?pageIndex=1&pageSize=5&keyword=Integration", { token: admin.token })).status, 200);

        const temporaryEmail = `it-created-${randomUUID()}@example.test`;
        createdEmails.push(temporaryEmail);
        const temporary = await request("/api/users", { method: "POST", token: admin.token, body: { name: "Temporary User", email: temporaryEmail, password: "Temporary-password-92!", role: "USER" } });
        assert.equal(temporary.status, 201);
        assert.equal("password" in temporary.body.data, false);
        assert.equal((await request(`/api/users?id=${temporary.body.data.id}`, { method: "DELETE", token: admin.token })).status, 200);
    });

    await t.test("locations and rooms validate bodies and support create/read/update", async () => {
        assert.equal((await request("/api/vi-tri", { method: "POST", token: admin.token, body: null })).status, 400);
        assert.equal((await request("/api/vi-tri", { method: "POST", token: admin.token, body: [] })).status, 400);
        assert.equal((await request("/api/vi-tri", { method: "POST", token: admin.token, body: { tenViTri: 1, tinhThanh: "City", quocGia: "Country" } })).status, 400);
        const createdLocation = await request("/api/vi-tri", { method: "POST", token: admin.token, body: { tenViTri: "Integration Location", tinhThanh: "Test City", quocGia: "Testland" } });
        assert.equal(createdLocation.status, 201);
        location = createdLocation.body.data;
        assert.equal((await request(`/api/vi-tri/${location.id}`, { method: "PUT", token: admin.token, body: {} })).status, 400);
        assert.equal((await request(`/api/vi-tri/${location.id}`, { method: "PUT", token: admin.token, body: { tinhThanh: "Updated Test City" } })).status, 200);
        assert.equal((await request("/api/vi-tri", { token: primaryUser.token })).status, 200);
        assert.equal((await request("/api/vi-tri/phan-trang-tim-kiem?pageIndex=1&pageSize=5&keyword=Test", { token: primaryUser.token })).status, 200);
        const disposableLocation = await request("/api/vi-tri", { method: "POST", token: admin.token, body: { tenViTri: "Disposable", tinhThanh: "Delete City", quocGia: "Testland" } });
        assert.equal(disposableLocation.status, 201);
        assert.equal((await request(`/api/vi-tri/${disposableLocation.body.data.id}`, { method: "DELETE", token: admin.token })).status, 200);

        const createdRoom = await request("/api/phong-thue", { method: "POST", token: admin.token, body: { tenPhong: "Integration Room", khach: 2, phongNgu: 1, giuong: 1, phongTam: 1, moTa: "Test room", giaTien: 100, maViTri: location.id } });
        assert.equal(createdRoom.status, 201);
        room = createdRoom.body.data;
        assert.equal((await request(`/api/phong-thue/${room.id}`, { method: "PUT", token: admin.token, body: [] })).status, 400);
        assert.equal((await request(`/api/phong-thue/${room.id}`, { method: "PUT", token: admin.token, body: { giaTien: 150 } })).status, 200);
        assert.equal((await request("/api/phong-thue", { method: "POST", token: admin.token, body: { tenPhong: "Bad", khach: "2", phongNgu: 1, giuong: 1, phongTam: 1, moTa: "Bad", giaTien: 100, maViTri: location.id } })).status, 400);
        assert.equal((await request(`/api/phong-thue/${room.id}`, { token: primaryUser.token })).status, 200);
        assert.equal((await request("/api/phong-thue/lay-phong-theo-vi-tri?maViTri=" + location.id, { token: primaryUser.token })).status, 200);
        assert.equal((await request("/api/phong-thue/phan-trang-tim-kiem?pageIndex=1&pageSize=5&keyword=Integration", { token: primaryUser.token })).status, 200);
        const disposableRoom = await request("/api/phong-thue", { method: "POST", token: admin.token, body: { tenPhong: "Disposable Room", khach: 1, phongNgu: 0, giuong: 0, phongTam: 0, moTa: "Delete this room", giaTien: 1, maViTri: location.id } });
        assert.equal(disposableRoom.status, 201);
        assert.equal((await request(`/api/phong-thue/${disposableRoom.body.data.id}`, { method: "DELETE", token: admin.token })).status, 200);
    });

    await t.test("bookings validate dates/capacity/ownership and prevent overlap", async () => {
        assert.equal((await request("/api/dat-phong", { method: "POST", token: primaryUser.token, body: { ...bookingPayload(primaryUser.id), maPhong: -1 } })).status, 400);
        assert.equal((await request("/api/dat-phong", { method: "POST", token: primaryUser.token, body: { ...bookingPayload(primaryUser.id), ngayDen: "not-a-date" } })).status, 400);
        assert.equal((await request("/api/dat-phong", { method: "POST", token: primaryUser.token, body: { ...bookingPayload(primaryUser.id), ngayDen: `${tomorrow(10)}T00:00:00Z`, ngayDi: `${tomorrow(10)}T00:00:00Z` } })).status, 400);
        assert.equal((await request("/api/dat-phong", { method: "POST", token: primaryUser.token, body: { ...bookingPayload(primaryUser.id), ngayDen: `${tomorrow(-1)}T00:00:00Z` } })).status, 400);
        assert.equal((await request("/api/dat-phong", { method: "POST", token: primaryUser.token, body: { ...bookingPayload(primaryUser.id), soLuongKhach: 3 } })).status, 400);
        const attempts = await Promise.all([
            request("/api/dat-phong", { method: "POST", token: primaryUser.token, body: bookingPayload(admin.id, 20, 22) }),
            request("/api/dat-phong", { method: "POST", token: secondUser.token, body: bookingPayload(admin.id, 20, 22) }),
        ]);
        assert.deepEqual(attempts.map((result) => result.status).sort(), [201, 409]);
        const successful = attempts.find((result) => result.status === 201);
        booking = successful.body.data;
        assert.ok([primaryUser.id, secondUser.id].includes(booking.maNguoiDat));
        assert.equal((await request(`/api/dat-phong/${booking.id}`, { token: admin.token })).status, 200);
        assert.equal((await request("/api/dat-phong", { token: admin.token })).status, 200);
        assert.equal((await request(`/api/dat-phong/lay-theo-nguoi-dung/${booking.maNguoiDat}`, { token: booking.maNguoiDat === primaryUser.id ? primaryUser.token : secondUser.token })).status, 200);
        const notOwner = booking.maNguoiDat === primaryUser.id ? secondUser : primaryUser;
        assert.equal((await request(`/api/dat-phong/${booking.id}`, { token: notOwner.token })).status, 403);
        assert.equal((await request(`/api/dat-phong/${booking.id}`, { method: "PUT", token: notOwner.token, body: { soLuongKhach: 1 } })).status, 403);

        const owner = booking.maNguoiDat === primaryUser.id ? primaryUser : secondUser;
        assert.equal((await request(`/api/dat-phong/${booking.id}`, { method: "PUT", token: owner.token, body: { ngayDi: `${tomorrow(22)}T00:00:00Z` } })).status, 200);
        assert.equal((await request(`/api/dat-phong/${booking.id}`, { method: "PUT", token: owner.token, body: { ngayDi: `${tomorrow(20)}T00:00:00Z` } })).status, 400);
        const adjacent = await request("/api/dat-phong", { method: "POST", token: owner.token, body: bookingPayload(primaryUser.id, 22, 24) });
        assert.equal(adjacent.status, 201);
        assert.equal((await request(`/api/dat-phong/${adjacent.body.data.id}`, { method: "PUT", token: owner.token, body: { ngayDen: `${tomorrow(20)}T00:00:00Z`, ngayDi: `${tomorrow(22)}T00:00:00Z` } })).status, 409);
        assert.equal((await request(`/api/phong-thue/${room.id}`, { method: "DELETE", token: admin.token })).status, 409);
        assert.equal((await request(`/api/dat-phong/${booking.id}`, { method: "DELETE", token: owner.token })).status, 200);
    });

    await t.test("comments derive author from JWT and enforce ownership", async () => {
        assert.equal((await request("/api/binh-luan", { method: "POST", token: primaryUser.token, body: { maPhong: room.id, ngayBinhLuan: new Date().toISOString(), noiDung: " ", saoBinhLuan: 5 } })).status, 400);
        assert.equal((await request("/api/binh-luan", { method: "POST", token: primaryUser.token, body: { maPhong: room.id, ngayBinhLuan: new Date().toISOString(), noiDung: "Bad rating", saoBinhLuan: 6 } })).status, 400);
        const created = await request("/api/binh-luan", { method: "POST", token: primaryUser.token, body: { maPhong: room.id, maNguoiBinhLuan: secondUser.id, ngayBinhLuan: new Date().toISOString(), noiDung: "Integration review", saoBinhLuan: 5 } });
        assert.equal(created.status, 201);
        comment = created.body.data;
        assert.equal(comment.maNguoiBinhLuan, primaryUser.id);
        assert.equal((await request(`/api/binh-luan/${comment.id}`, { method: "PUT", token: primaryUser.token, body: { noiDung: "Updated integration review" } })).status, 200);
        assert.equal((await request(`/api/binh-luan/${comment.id}`, { method: "PUT", token: secondUser.token, body: { noiDung: "forged edit" } })).status, 403);
        assert.equal((await request(`/api/binh-luan/lay-binh-luan-theo-phong/${room.id}`)).status, 200);
        assert.equal((await request("/api/binh-luan")).status, 200);
        assert.equal((await request(`/api/binh-luan/${comment.id}`, { method: "DELETE", token: primaryUser.token })).status, 200);
        assert.equal((await request(`/api/vi-tri/${location.id}`, { method: "DELETE", token: admin.token })).status, 409);
    });

    await t.test("upload rejects missing, invalid signature and oversized files", async () => {
        const endpoints = [
            [`/api/users/upload-avatar`, primaryUser.token],
            [`/api/phong-thue/upload-hinh-phong?maPhong=${room.id}`, admin.token],
            [`/api/vi-tri/upload-hinh-vitri?maViTri=${location.id}`, admin.token],
        ];
        for (const [path, token] of endpoints) {
            assert.equal((await request(path, { method: "POST", token, form: new FormData() })).status, 400);
        }
        for (const [path, token] of endpoints) {
            const form = new FormData();
            form.append("formFile", new Blob(["plain text"], { type: "image/png" }), "fake.png");
            assert.equal((await request(path, { method: "POST", token, form })).status, 400);
        }
        const tooLarge = new FormData();
        tooLarge.append("formFile", new Blob([Buffer.alloc(5 * 1024 * 1024 + 1)], { type: "image/png" }), "large.png");
        assert.equal((await request(`/api/vi-tri/upload-hinh-vitri?maViTri=${location.id}`, { method: "POST", token: admin.token, form: tooLarge })).status, 413);
    });
});
