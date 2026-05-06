import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { generateResponse } from "./services/ai.service.js";

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

app.post("/chat", async (req, res) => {
    try {
        const userInput = req.body.message;

        messages.push({
            role: "user",
            content: userInput,
        });

        // Important headers for streaming Ye dono headers browser/client ko batate hain ki: data chunks mein aa raha hai aur content type kya hai
        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Transfer-Encoding", "chunked");

        let finalResponse = "";

        await generateResponse(messages, (chunk) => {

            finalResponse += chunk;

            // Client ko live bhejna
            res.write(chunk);

            // Terminal mein bhi
            process.stdout.write(chunk);
        });

        messages.push({
            role: "assistant",
            content: finalResponse,
        });

        // Stream close
        res.end();

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: error.message,
        });
    }
});

export default app;