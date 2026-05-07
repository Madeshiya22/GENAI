import e, { Router } from "express";
import { handleChat } from "../controllers/chat.controllers";

const router = Router();


/**
 * @route POST /chat
 * @desc Handle chat messages and stream AI responses
 * @access Public
 */

 router.post("/message", handleChat);

export default router;
