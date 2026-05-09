import jwt from "jsonwebtoken";
import * as userDao from "../dao/user.dao.js";
import * as utils from "../utils/utils.js";
import config from "../config/config.js";

export async function googleAuthCallback(req, res) {
  try {
    const userData = req.user;
    const email = userData?.emails?.[0]?.value || userData?._json?.email;

    if (!email) {
      return res.redirect(`${config.CLIENT_URL}/login?error=oauth_email_missing`);
    }

    let user = await userDao.findUserByEmail(email);

    if (!user) {
      user = await userDao.createUser({
        fullname: userData?.displayName || "Google User",
        email,
        googleId: userData?.id,
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

    return res.redirect(config.CLIENT_URL);
  } catch (error) {
    console.log("Google OAuth callback error:", error.message);
    return res.redirect(`${config.CLIENT_URL}/login?error=oauth_callback_failed`);
  }
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
