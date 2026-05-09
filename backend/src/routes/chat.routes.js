import { Router } from "express";

import {
  createNewChat,
  handleChat,
  getAllChats,
  getChatMessages,
  deleteChat,
} from "../controllers/chat.controllers.js";

import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// CREATE CHAT
router.post("/new", authMiddleware, createNewChat);

// SEND MESSAGE
router.post("/:chatId", authMiddleware, handleChat);

// GET ALL CHATS
router.get("/all", authMiddleware, getAllChats);

// GET CHAT MESSAGES
router.get("/:chatId/messages", authMiddleware, getChatMessages);

// DELETE CHAT
router.delete("/:chatId", authMiddleware, deleteChat);

export default router;
