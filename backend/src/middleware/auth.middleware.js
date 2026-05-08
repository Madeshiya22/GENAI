import * as utils from '../utils/utils.js';

export const authMiddleware = (req, res, next) => {

    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    try {

        const decoded = utils.verifyJWT(token);

        req.user = decoded;

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid token"
        });
    }
};