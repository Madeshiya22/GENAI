import mongoose from "mongoose";

import {
  getStream,
  generateTitle,
  shouldSearchWeb,
  optimizeSearchQuery,
} from "../services/ai.service.js";

import { searchWeb } from "../services/tavily.service.js";

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

    // GET ALL PREVIOUS MESSAGES
    const previousMessages = await messageModel.find({
      chat: chatId,
    });

    // FORMAT FOR AI
    const formattedMessages = previousMessages.map((msg) => ({
      role: msg.role,

      content: msg.content,
    }));

    const shouldSearch = await shouldSearchWeb(message);

    let webResults = [];

    // SSE HEADERS
    res.setHeader("Content-Type", "text/event-stream");

    res.setHeader("Cache-Control", "no-cache");

    res.setHeader("Connection", "keep-alive");

    // WEB SEARCH
    if (shouldSearch) {

      res.write(
        `data:${JSON.stringify({
          type: "searching",
        })}\n\n`
      );

      // OPTIMIZE QUERY
      const optimizedQuery =
        await optimizeSearchQuery(message);

      // SEARCH WEB
      webResults =
        await searchWeb(optimizedQuery);

      // SEND SOURCES
      res.write(
        `data:${JSON.stringify({
          type: "sources",
          sources: webResults,
        })}\n\n`
      );
    }

    // PREPARE FINAL AI MESSAGES
    let finalMessages = [...formattedMessages];

    if (webResults.length > 0) {

      const formattedResults = webResults
        .map(
          (result, index) =>
            `${index + 1}. ${result.title}\n${result.content}`
        )
        .join("\n\n");

      finalMessages.push({
        role: "system",
        content: `
You MUST use these realtime web search results while answering.

Rules:
- Prefer factual information from the sources
- If multiple sources disagree, mention uncertainty
- Keep the answer concise and accurate
- Mention important dates or teams if available

Web Results:

${formattedResults}
        `,
      });
    }

    // GET AI STREAM
    const stream = await getStream(finalMessages);

    let fullResponse = "";
    let connectionClosed = false;

    req.on("close", () => {
      connectionClosed = true;
    });

    // STREAM RESPONSE
    for await (const chunk of stream) {

      if (connectionClosed) {
        break;
      }

      // LangChain stream parsing
      let aiChunk = "";

      if (Array.isArray(chunk)) {

        const [msg] = chunk;

        aiChunk = msg?.content || "";

      } else if (chunk?.choices) {

        aiChunk =
          chunk.choices[0]?.delta?.content || "";

      } else if (chunk?.content !== undefined) {

        aiChunk = chunk.content || "";
      }

      if (aiChunk) {

        fullResponse += aiChunk;

        res.write(
          `data:${JSON.stringify({
            chunk: aiChunk,
          })}\n\n`
        );
      }
    }

    if (connectionClosed) {
      return;
    }

    // SAVE AI RESPONSE
    await messageModel.create({
      chat: chatId,

      role: "assistant",

      content: fullResponse,
    });

    // AUTO TITLE GENERATION
    if (chat.title === "New Chat") {

      try {

        const generatedTitle =
          await generateTitle(message);

        chat.title = generatedTitle;

        await chat.save();

        // SEND TITLE UPDATE
        if (!connectionClosed) {

          res.write(
            `data:${JSON.stringify({
              type: "title",
              title: generatedTitle,
            })}\n\n`
          );
        }

      } catch (titleError) {

        console.log(
          "Title generation failed:",
          titleError.message
        );
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
