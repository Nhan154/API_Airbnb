import { test } from "node:test";
import assert from "node:assert/strict";
import { validateImageUpload } from "../src/middlewares/validate-image.middleware.js";
import { createRateLimiter } from "../src/middlewares/rate-limit.middleware.js";
import { createUploadToCloudinary } from "../src/utils/uploadToCloudinary.js";

function response() {
    return { statusCode: 200, body: null, headers: {}, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; }, setHeader(key, value) { this.headers[key] = value; } };
}

test("image signature validator rejects a missing file", () => {
    const res = response();
    let nextCalled = false;
    validateImageUpload({ file: undefined }, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 400);
    assert.equal(nextCalled, false);
});

test("image signature validator rejects an empty file", () => {
    const res = response();
    validateImageUpload({ file: { mimetype: "image/png", buffer: Buffer.alloc(0) } }, res, () => {});
    assert.equal(res.statusCode, 400);
});

test("image signature validator rejects MIME spoofing", () => {
    const res = response();
    validateImageUpload({ file: { mimetype: "image/png", buffer: Buffer.from("not an image") } }, res, () => {});
    assert.equal(res.statusCode, 400);
});

test("image signature validator accepts matching PNG signature", () => {
    const res = response();
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    let nextCalled = false;
    validateImageUpload({ file: { mimetype: "image/png", buffer: pngHeader } }, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
});

test("rate limiter allows requests within its limit and blocks the next one", () => {
    const limit = createRateLimiter({ windowMs: 60000, max: 1, message: "slow down" });
    const invoke = () => {
        const res = response();
        let nextCalled = false;
        limit({ ip: "test-address" }, res, () => { nextCalled = true; });
        return { res, nextCalled };
    };
    assert.equal(invoke().nextCalled, true);
    const second = invoke();
    assert.equal(second.res.statusCode, 429);
    assert.equal(second.nextCalled, false);
});

test("Cloudinary upload helper resolves only a complete secure result", async () => {
    const fakeClient = { uploader: { upload_stream(options, callback) { return { end() { callback(null, { secure_url: "https://images.example.test/photo.png", public_id: "airbnb/test/photo" }); } }; } } };
    const upload = createUploadToCloudinary(fakeClient);
    assert.deepEqual(await upload(Buffer.from("image"), "rooms"), { url: "https://images.example.test/photo.png", publicId: "airbnb/test/photo" });
});

test("Cloudinary upload helper propagates provider errors", async () => {
    const fakeClient = { uploader: { upload_stream(options, callback) { return { end() { callback(new Error("provider rejected request")); } }; } } };
    await assert.rejects(createUploadToCloudinary(fakeClient)(Buffer.from("image"), "rooms"), /provider rejected request/);
});

test("Cloudinary upload helper rejects an incomplete provider response", async () => {
    const fakeClient = { uploader: { upload_stream(options, callback) { return { end() { callback(null, { public_id: "missing-url" }); } }; } } };
    await assert.rejects(createUploadToCloudinary(fakeClient)(Buffer.from("image"), "rooms"), /invalid upload result/);
});
