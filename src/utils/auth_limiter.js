import rateLimit from "express-rate-limit";
const authlimiter = (maxRequests) => {
    return rateLimit({
        windowMs: 15 * 60 * 1000,
        max: maxRequests ?? 50,
        message: "Too many login attempts, try again later"
    });
}

export { authlimiter };