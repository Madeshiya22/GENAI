import jwt from 'jsonwebtoken';
import * as userDao from "../dao/user.dao.js";
import * as utils from "../utils/util.js";
import config from '../config/config.js';


export async function googleAuthCallback(req, res) {

    const userData = req.user; // The authenticated user from Passport

    let user = await userDao.findUserByEmail(userData.emails[ 0 ].value);

    if (!user) {
        user = await userDao.createUser({
            fullname: userData.displayName,
            email: userData.emails[ 0 ].value,
        });
    }

    const token = utils.generateJWT({
        id: user._id,
        fullname: user.fullname,
    })

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    })

    res.redirect(config.CLIENT_URL);


}