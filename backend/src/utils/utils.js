import jwt from 'jsonwebtoken';
import config from '../config/config.js';

export function generateJWT(data) {

    return jwt.sign(data, config.JWT_SECRET, {
        expiresIn: "3d",
    });
}

export function verifyJWT(token) {

    try {

        return jwt.verify(token, config.JWT_SECRET);

    } catch (error) {

        throw new Error("Invalid token");
    }
}