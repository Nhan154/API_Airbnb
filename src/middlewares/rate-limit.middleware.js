const windows = new Map();

export const createRateLimiter = ({ windowMs, max, message }) => (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    let entry = windows.get(key);

    if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        windows.set(key, entry);
    }

    entry.count += 1;
    res.setHeader("RateLimit-Limit", String(max));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    res.setHeader("RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
        return res.status(429).json({ message, retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000) });
    }

    if (windows.size > 10000) {
        for (const [address, state] of windows) {
            if (state.resetAt <= now) windows.delete(address);
        }
    }
    return next();
};
