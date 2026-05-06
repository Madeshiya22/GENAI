import * as utils from "../utils/util.js";

export function authMiddleware(req, res, next) {
    // In local development, bypass authentication to simplify testing.
    if (process.env.NODE_ENV !== 'production') {
        return next();
    }

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const decoded = utils.verifyJWT(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
}
