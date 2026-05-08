import { getStream, generateTitle } from "../services/ai.service.js";
import chatModel from "../models/chat.model.js";

import messageModel from "../models/message.model.js";

import { getStream } from "../services/ai.service.js";

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
    const { message } = req.body;

    const { chatId } = req.params;

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
    });

    // GET ALL PREVIOUS MESSAGES
    const previousMessages = await messageModel.find({
      chat: chatId,
    });

    // FORMAT FOR AI
    const formattedMessages = previousMessages.map((msg) => ({
      role: msg.role,

      content: msg.content,
    }));

    // GET AI STREAM
    const stream = await getStream(formattedMessages);

    // SSE HEADERS
    res.setHeader("Content-Type", "text/event-stream");

    res.setHeader("Cache-Control", "no-cache");

    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";

    // STREAM RESPONSE
    for await (const chunk of stream) {
      const aiChunk = chunk.choices[0]?.delta?.content || "";

      fullResponse += aiChunk;

      res.write(
        `data:${JSON.stringify({
          chunk: aiChunk,
        })}\n\n`,
      );
    }

    // SAVE AI RESPONSE
    await messageModel.create({
      chat: chatId,

      role: "assistant",

      content: fullResponse,
    });

    // AUTO TITLE GENERATION
    if (chat.title === "New Chat") {
      const generatedTitle = await generateTitle(message);

      chat.title = generatedTitle;

      await chat.save();
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

    // SOFT DELETE
    chat.isDeleted = true;

    await chat.save();

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
