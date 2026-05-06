import express from "express";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import { generateResponse } from "./services/ai.service";

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
const message = [];

app.post("/chat", async (req, res) => {
  const userInput = req.body.messages;

  message.push({
    role: "user",
    content: userInput,
  });
});

const content = await generateResponse(message);

message.push({
  role: "assistant",
  content,
});

res.json({ content });

export default app;
