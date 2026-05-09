import { Router } from "express";
import passport from "passport";
import {googleAuthCallback,getCurrentUser,logout} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const authRouter = Router();
const clientLoginUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/login`;

function handleGoogleCallback(req, res, next) {
  passport.authenticate("google", { session: false }, (error, user) => {
    if (error) {
      const oauthRaw = error?.oauthError?.data;
      let oauthDetail = error.message;

      if (oauthRaw) {
        try {
          const parsed = JSON.parse(oauthRaw);
          oauthDetail = parsed.error_description || parsed.error || oauthDetail;
        } catch {
          oauthDetail = oauthRaw;
        }
      }

      console.log("Google OAuth passport error:", oauthDetail);
      return res.redirect(`${clientLoginUrl}?error=oauth_token_exchange_failed`);
    }

    if (!user) {
      return res.redirect(`${clientLoginUrl}?error=oauth_failed`);
    }

    req.user = user;
    return googleAuthCallback(req, res, next);
  })(req, res, next);
}

// GOOGLE LOGIN
authRouter.get(
  "/google",
  passport.authenticate("google", {
    session: false,
    scope: ["profile", "email"],
  }),
);

// GOOGLE CALLBACK
authRouter.get(
  "/google/callback",
  handleGoogleCallback,
);

// Compatibility route for existing Google Console configs.
authRouter.get("/callback/google", handleGoogleCallback);

// GET CURRENT USER
authRouter.get("/me", authMiddleware, getCurrentUser);

// LOGOUT
authRouter.post("/logout", logout);

export default authRouter;
