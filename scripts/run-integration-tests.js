import "dotenv/config";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const originalNodeEnv = process.env.NODE_ENV;
process.env.NODE_ENV = "development";

const { default: prisma } = await import("../src/config/prisma.js");
const sourceUrl = new URL(process.env.DATABASE_URL);
const sourceDatabase = decodeURIComponent(sourceUrl.pathname.slice(1));
let testUrl;

const useFreshTestDatabase = process.argv.includes("--fresh-db");
if (useFreshTestDatabase) {
    testUrl = new URL(process.env.TEST_DATABASE_URL ?? sourceUrl);
    const safePrefix = sourceDatabase.replace(/[^A-Za-z0-9_]/g, "_").slice(0, 32) || "airbnb";
    testUrl.pathname = `/${safePrefix}_casefix_${Date.now()}_${randomBytes(3).toString("hex")}_test`;
} else if (process.env.TEST_DATABASE_URL) {
    testUrl = new URL(process.env.TEST_DATABASE_URL);
} else {
    testUrl = new URL(sourceUrl);
    testUrl.pathname = `/${sourceDatabase}_test`;
}

const testDatabase = decodeURIComponent(testUrl.pathname.slice(1));
const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);

if (!localHosts.has(sourceUrl.hostname.toLowerCase()) ||
    !localHosts.has(testUrl.hostname.toLowerCase()) ||
    sourceUrl.hostname.toLowerCase() !== testUrl.hostname.toLowerCase() ||
    sourceUrl.port !== testUrl.port) {
    await prisma.$disconnect();
    throw new Error("Integration tests require local DATABASE_URL and TEST_DATABASE_URL on the same local server.");
}
if (!/^[A-Za-z0-9_]+$/.test(testDatabase) || !/_test$/i.test(testDatabase)) {
    await prisma.$disconnect();
    throw new Error("TEST_DATABASE_URL must use a local database name ending in _test.");
}
if (testUrl.hostname === sourceUrl.hostname && testDatabase.toLowerCase() === sourceDatabase.toLowerCase()) {
    await prisma.$disconnect();
    throw new Error("Refusing to run integration tests against DATABASE_URL.");
}

try {
    await prisma.$executeRawUnsafe(`CREATE DATABASE IF NOT EXISTS \`${testDatabase}\``);
} catch (error) {
    throw new Error(`Could not provision the isolated test database (${error?.code ?? error?.name ?? "unknown error"}).`);
} finally {
    await prisma.$disconnect();
}

const testEnv = {
    ...process.env,
    NODE_ENV: "test",
    DATABASE_URL: testUrl.toString(),
    TEST_DATABASE_URL: testUrl.toString(),
    INTEGRATION_SOURCE_DATABASE_URL: sourceUrl.toString(),
    RUN_INTEGRATION_TESTS: "1",
};
const require = createRequire(import.meta.url);
const prismaCli = require.resolve("prisma/build/index.js");

const runNode = (args) => {
    const result = spawnSync(process.execPath, args, {
        cwd: projectRoot,
        env: testEnv,
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
    });
    let output = `${result.stdout ?? ""}${result.stderr ?? ""}`
        .replace(/mysql:\/\/[^/\s]+@/gi, "mysql://<redacted>@");
    const credentials = [sourceUrl.username, sourceUrl.password, testUrl.username, testUrl.password]
        .map(decodeURIComponent)
        .filter((credential) => credential.length > 0);
    for (const credential of new Set(credentials)) {
        output = output.replaceAll(credential, "<redacted>");
    }
    if (output) process.stdout.write(output);
    if (result.error) throw new Error(`Could not start ${args[0]}: ${result.error.name}`);
    if (result.status !== 0) throw new Error(`Integration command failed with exit code ${result.status}.`);
};

console.log(`Preparing isolated local integration database (${testDatabase}).`);
runNode([prismaCli, "migrate", "deploy", "--config", "prisma7.config.ts"]);
runNode(["--test", "test/api.integration.test.js"]);

if (originalNodeEnv !== undefined) process.env.NODE_ENV = originalNodeEnv;
