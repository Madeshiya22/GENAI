import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import Routers from "./routes/index.js";


const app = express();

// Middleware
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
    res.send("Welcome to MentoAI Backend!");
});

const messages = [];

// Use chat routes
app.use("/api/chat/message", Routers);

export default app;