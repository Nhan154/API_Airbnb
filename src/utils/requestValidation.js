export const isPlainObject = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

export const hasNonEmptyBody = (body) =>
    isPlainObject(body) && Object.keys(body).length > 0;

export const isOptionalString = (value) =>
    value === undefined || value === null || typeof value === "string";

export const isOptionalBoolean = (value) =>
    value === undefined || value === null || typeof value === "boolean";

export const parseDate = (value) => {
    if (typeof value !== "string" && !(value instanceof Date)) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && date.toISOString().slice(0, 10) !== value) return null;
    return date;
};

export const isPastCalendarDate = (date) => {
    const today = new Date();
    const startOfTodayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const dateUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return dateUtc < startOfTodayUtc;
};
