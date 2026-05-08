import { Router } from "express";
import passport from "passport";
import {googleAuthCallback,getCurrentUser,logout} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const authRouter = Router();

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
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),

  googleAuthCallback,
);

// GET CURRENT USER
authRouter.get("/me", authMiddleware, getCurrentUser);

// LOGOUT
authRouter.post("/logout", logout);

export default authRouter;
