import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import chatRouter from "./routes/chat.routes.js";
import authRouter from "./routes/auth.routes.js";

const app = express();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_REDIRECT_URI ||
        "http://localhost:3000/api/auth/google/callback",
    },

    async (accessToken, refreshToken, profile, done) => {
      try {
        return done(null, profile);
      } catch (error) {
        return done(error, null);
      }
    },
  ),
);

// MIDDLEWARE
app.use(morgan("dev"));

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(passport.initialize());

// ROUTES
app.get("/", (req, res) => {
  res.send("Welcome to MentoAI Backend!");
});

app.use("/api/chat/message", chatRouter);

app.use("/api/auth", authRouter);

export default app;
