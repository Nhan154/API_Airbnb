import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const databaseUrlValue = process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

if (!databaseUrlValue) {
    throw new Error(process.env.NODE_ENV === "test" ? "TEST_DATABASE_URL is required in test mode" : "DATABASE_URL is required");
}

const databaseUrl = new URL(databaseUrlValue);

const adapter = new PrismaMariaDb({
    host: databaseUrl.hostname,
    port: Number(databaseUrl.port || 3306),
    user: decodeURIComponent(databaseUrl.username),
    password: decodeURIComponent(databaseUrl.password),
    database: databaseUrl.pathname.replace("/", ""),
    connectionLimit: 5,
});

const prisma = new PrismaClient({
    adapter,
});

export default prisma;
