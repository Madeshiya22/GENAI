import jwt from "jsonwebtoken";
import * as userDao from "../dao/user.dao.js";
import * as utils from "../utils/util.js";
import config from "../config/config.js";
import * as userDao from "../dao/user.dao.js";

export async function googleAuthCallback(req, res) {
  const userData = req.user; // The authenticated user from Passport

  let user = await userDao.findUserByEmail(userData.emails[0].value);

  if (!user) {
    user = await userDao.createUser({
      fullname: userData.displayName,
      email: userData.emails[0].value,
    });
  }

  const token = utils.generateJWT({
    id: user._id,
    fullname: user.fullname,
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",

    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",

    maxAge: 3 * 24 * 60 * 60 * 1000,
  });

  res.redirect(config.CLIENT_URL);
}

export async function getCurrentUser(req, res) {
  try {
    const user = await userDao.findUserById(req.user.id);

    return res.status(200).json({
      success: true,

      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
}

export function logout(req, res) {
  res.clearCookie("token", {
    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });

  return res.status(200).json({
    success: true,

    message: "Logged out",
  });
}
