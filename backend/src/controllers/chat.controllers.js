import mongoose from "mongoose";
import { generateTitle } from "../services/ai.service.js";
import { runAgent } from "../features/agent/service/agent.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";

// CREATE NEW CHAT
export async function createNewChat(req, res) {
  try {
    const chat = await chatModel.create({
      user: req.user.id,

      title: "New Chat",
    });

    return res.status(201).json({
      success: true,

      chat,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
}

// HANDLE CHAT MESSAGE
export async function handleChat(req, res) {
  try {
    const { message, attachments = [] } = req.body;

    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,

        message: "Invalid chat ID",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,

        message: "Message cannot be empty",
      });
    }

    // FIND CHAT
    const chat = await chatModel.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,

        message: "Chat not found",
      });
    }

    // SECURITY CHECK
    if (chat.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,

        message: "Unauthorized",
      });
    }

    // SAVE USER MESSAGE
    await messageModel.create({
      chat: chatId,

      role: "user",

      content: message,

      attachments: Array.isArray(attachments)
        ? attachments
            .filter((attachment) => attachment?.name && attachment?.kind)
            .map((attachment) => ({
              id: attachment.id,

              kind: attachment.kind,

              name: attachment.name,

              size: attachment.size,

              mimeType: attachment.mimeType,

              status: attachment.status || "ready",
            }))
        : [],
    });

    // SSE HEADERS
    res.setHeader("Content-Type", "text/event-stream");

    res.setHeader("Cache-Control", "no-cache");

    res.setHeader("Connection", "keep-alive");

    // RUN LANGGRAPH AGENT
    // build previous messages array from stored messages
    const previousMessagesDocs = await messageModel
      .find({ chat: chatId })
      .sort({ _id: 1 })
      .lean();

    const previousMessages = previousMessagesDocs.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const response = await runAgent({
      input: message,
      messages: previousMessages,
    });
    let fullResponse = response;

    // SEND RESPONSE
    res.write(
      `data:${JSON.stringify({
        chunk: fullResponse,
      })}\n\n`,
    );

    // SAVE AI RESPONSE
    await messageModel.create({
      chat: chatId,

      role: "assistant",

      content: fullResponse,
    });

    // AUTO TITLE GENERATION
    if (chat.title === "New Chat") {
      try {
        const generatedTitle = await generateTitle(message);

        chat.title = generatedTitle;

        await chat.save();

        // SEND TITLE UPDATE
        res.write(
          `data:${JSON.stringify({
            type: "title",

            title: generatedTitle,
          })}\n\n`,
        );
      } catch (titleError) {
        console.log("Title generation failed:", titleError.message);
      }
    }
    res.end();
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
}

// GET ALL USER CHATS
export async function getAllChats(req, res) {
  try {
    const chats = await chatModel
      .find({
        user: req.user.id,

        isDeleted: false,
      })
      .sort({
        updatedAt: -1,
      });

    return res.status(200).json({
      success: true,

      chats,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
}

// GET SINGLE CHAT MESSAGES
export async function getChatMessages(req, res) {
  try {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,

        message: "Invalid chat ID",
      });
    }

    // FIND CHAT
    const chat = await chatModel.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,

        message: "Chat not found",
      });
    }

    // SECURITY CHECK
    if (chat.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,

        message: "Unauthorized",
      });
    }

    // GET MESSAGES
    const messages = await messageModel.find({
      chat: chatId,
    });

    return res.status(200).json({
      success: true,

      messages,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
}

// DELETE CHAT
export async function deleteChat(req, res) {
  try {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,

        message: "Invalid chat ID",
      });
    }

    // FIND CHAT
    const chat = await chatModel.findById(chatId);

    if (!chat) {
      return res.status(404).json({
        success: false,

        message: "Chat not found",
      });
    }

    // SECURITY CHECK
    if (chat.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,

        message: "Unauthorized",
      });
    }

    await messageModel.deleteMany({
      chat: chatId,
    });

    await chatModel.deleteOne({
      _id: chatId,
    });

    return res.status(200).json({
      success: true,

      message: "Chat deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
}
