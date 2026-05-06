import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { handleMessage } from "../controllers/chat.controller.js";

const chatRouter = Router();


// Development: allow unauthenticated chat requests to simplify local testing.
chatRouter.post("/", handleMessage);

export default chatRouter;