import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { authenticate } from "../src/middlewares/auth.middleware.js";
import { authorize } from "../src/middlewares/role.middleware.js";

const secret = "test-only-jwt-secret";
let previousSecret;

before(() => {
    previousSecret = process.env.JWT_SECRET;
    process.env.JWT_SECRET = secret;
});

after(() => {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
});

function invoke(token) {
    const req = { headers: token ? { authorization: `Bearer ${token}` } : {} };
    const res = {
        statusCode: 200,
        body: undefined,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; },
    };
    let nextCalled = false;
    authenticate(req, res, () => { nextCalled = true; });
    return { req, res, nextCalled };
}

test("rejects a missing bearer token", () => {
    const { res, nextCalled } = invoke();
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
});

test("rejects an invalid token", () => {
    const { res, nextCalled } = invoke("not-a-jwt");
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
});

test("rejects an expired token", () => {
    const token = jwt.sign({ id: 12, role: "USER" }, secret, { expiresIn: -1 });
    const { res, nextCalled } = invoke(token);
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
});

test("rejects a validly signed token with an invalid role", () => {
    const token = jwt.sign({ id: 12, role: "ROOT" }, secret);
    const { res, nextCalled } = invoke(token);
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
});

test("accepts a valid USER token and attaches its claims", () => {
    const token = jwt.sign({ id: 12, role: "USER" }, secret);
    const { req, res, nextCalled } = invoke(token);
    assert.equal(res.statusCode, 200);
    assert.equal(nextCalled, true);
    assert.equal(req.user.id, 12);
    assert.equal(req.user.role, "USER");
});

test("authorize returns 401 if authentication was not run", () => {
    const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json() { return this; },
    };
    let nextCalled = false;
    authorize("ADMIN")({}, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 401);
    assert.equal(nextCalled, false);
});

test("authorize rejects USER on an ADMIN-only operation", () => {
    const req = { user: { id: 12, role: "USER" } };
    const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json() { return this; },
    };
    let nextCalled = false;
    authorize("ADMIN")(req, res, () => { nextCalled = true; });
    assert.equal(res.statusCode, 403);
    assert.equal(nextCalled, false);
});

test("authorize allows ADMIN on an ADMIN-only operation", () => {
    const req = { user: { id: 1, role: "ADMIN" } };
    const res = {};
    let nextCalled = false;
    authorize("ADMIN")(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, true);
});
