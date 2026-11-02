import { readFile } from "node:fs/promises";
import { test } from "node:test";
import assert from "node:assert/strict";

const collectionUrl = new URL("../postman/AirbnbBackend.postman_collection.json", import.meta.url);
const collection = JSON.parse(await readFile(collectionUrl, "utf8"));
const allRequests = collection.item.flatMap((folder) => folder.item.map((item) => ({ folder: folder.name, ...item })));

const expectedPaths = [
    "POST /api/auth/signup", "POST /api/auth/signin",
    "GET /api/users", "POST /api/users", "GET /api/users/phan-trang-tim-kiem", "GET /api/users/search/{{name}}", "GET /api/users/{{userId}}", "PUT /api/users/{{userId}}", "DELETE /api/users", "POST /api/users/upload-avatar",
    "GET /api/phong-thue", "POST /api/phong-thue", "GET /api/phong-thue/lay-phong-theo-vi-tri", "GET /api/phong-thue/phan-trang-tim-kiem", "GET /api/phong-thue/{{roomId}}", "PUT /api/phong-thue/{{roomId}}", "DELETE /api/phong-thue/{{roomId}}", "POST /api/phong-thue/upload-hinh-phong",
    "GET /api/vi-tri", "POST /api/vi-tri", "GET /api/vi-tri/phan-trang-tim-kiem", "GET /api/vi-tri/{{locationId}}", "PUT /api/vi-tri/{{locationId}}", "DELETE /api/vi-tri/{{locationId}}", "POST /api/vi-tri/upload-hinh-vitri",
    "GET /api/dat-phong", "POST /api/dat-phong", "GET /api/dat-phong/{{id}}", "PUT /api/dat-phong/{{id}}", "DELETE /api/dat-phong/{{id}}", "GET /api/dat-phong/lay-theo-nguoi-dung/{{userId}}",
    "GET /api/binh-luan", "POST /api/binh-luan", "PUT /api/binh-luan/{{id}}", "DELETE /api/binh-luan/{{id}}", "GET /api/binh-luan/lay-binh-luan-theo-phong/{{roomId}}",
];

test("Postman collection contains the expected 36 method/path operations", () => {
    const actual = allRequests.map(({ request }) => {
        const url = typeof request.url === "string" ? request.url : request.url.raw;
        const path = url.replace("{{baseUrl}}", "").split("?")[0];
        return `${request.method} ${path}`;
    }).sort();
    assert.equal(actual.length, 36);
    assert.deepEqual(actual, [...expectedPaths].sort());
});

test("Postman collection preserves query and multipart field contracts", () => {
    const find = (name) => allRequests.find((item) => item.name === name).request;
    assert.match(find("Delete user by query id (ADMIN)").url, /\?id=\{\{userId\}\}/);
    assert.match(find("Rooms by location").url, /\?maViTri=/);
    assert.match(find("Upload room image (formFile)").url, /\?maPhong=/);
    assert.match(find("Upload location image (formFile)").url, /\?maViTri=/);
    for (const name of ["Upload avatar (formFile)", "Upload room image (formFile)", "Upload location image (formFile)"]) {
        assert.equal(find(name).body.formdata[0].key, "formFile");
    }
});
