import mongoose from "mongoose";
import { generateTitle } from "../services/ai.service.js";
import { runAgent } from "../features/agent/service/agent.service.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import documentModel from "../models/document.model.js";
import { deleteDocumentVectors } from "../features/rag/services/vector.service.js";

function looksLikeRealtimeQuery(message) {
  return /\b(latest|today|current|realtime|real-time|live|now|news|weather|score|stock|price|crypto|market|trending|recent)\b/i.test(
    message,
  );
}

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
    const userId = req.user.id;

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
    if (chat.user.toString() !== userId) {
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
              id: attachment.id, // Stores the documentId for PDFs
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

    // Proactively send searching indicator if query looks like real-time
    const searchIndicatorStarted = looksLikeRealtimeQuery(message);
    if (searchIndicatorStarted) {
      res.write(
        `data:${JSON.stringify({
          type: "searching",
          searching: true,
        })}\n\n`,
      );
    }

    // FETCH CHAT HISTORY (to construct agent state & find uploaded documents)
    const previousMessagesDocs = await messageModel
      .find({ chat: chatId })
      .sort({ _id: 1 })
      .lean();

    const previousMessages = previousMessagesDocs.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Collect all PDF document IDs uploaded in this chat
    const documentIds = [];
    previousMessagesDocs.forEach((m) => {
      if (m.attachments) {
        m.attachments.forEach((att) => {
          if (att.kind === "pdf" && att.status === "ready" && att.id) {
            documentIds.push(att.id);
          }
        });
      }
    });

    // Also include current attachments in query
    if (Array.isArray(attachments)) {
      attachments.forEach((att) => {
        if (att.kind === "pdf" && att.id) {
          documentIds.push(att.id);
        }
      });
    }

    const uniqueDocumentIds = [...new Set(documentIds)];

    // Associate documents with this chat in the MongoDB collection if not already associated
    if (uniqueDocumentIds.length > 0) {
      await documentModel.updateMany(
        { documentId: { $in: uniqueDocumentIds }, chat: { $exists: false } },
        { $set: { chat: chatId } }
      );
    }

    let finalResponse = "";
    let finalSources = [];

    // RUN LANGGRAPH AGENT WITH SSE STREAMING CALLBACKS
    const agentResult = await runAgent(
      {
        input: message,
        messages: previousMessages,
        userId,
        documentIds: uniqueDocumentIds,
      },
      {
        configurable: {
          onChunk: (text) => {
            finalResponse += text;
            res.write(`data:${JSON.stringify({ chunk: text })}\n\n`);
          },
          onSearching: (searching) => {
            res.write(`data:${JSON.stringify({ type: "searching", searching })}\n\n`);
          },
          onSources: (sources) => {
            finalSources = sources;
            res.write(`data:${JSON.stringify({ type: "sources", sources })}\n\n`);
          },
        },
      }
    );

    // Save AI response message
    await messageModel.create({
      chat: chatId,
      role: "assistant",
      content: finalResponse || agentResult.response || "",
      sources: finalSources || agentResult.sources || [],
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
    console.error("Express handleChat error:", error);
    try {
      res.write(
        `data:${JSON.stringify({
          chunk: "An unexpected error occurred while processing your request.",
        })}\n\n`
      );
      res.end();
    } catch {
      // ignore
    }
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
    const userId = req.user.id;

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
    if (chat.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 1. Find all documents uploaded in this chat
    const documents = await documentModel.find({ chat: chatId, user: userId });

    // 2. Clean up Pinecone vectors and delete documents
    for (const doc of documents) {
      try {
        await deleteDocumentVectors(doc.documentId, userId);
      } catch (err) {
        console.error(`Failed to clean up Pinecone vectors for doc: ${doc.documentId}`, err);
      }
    }
    await documentModel.deleteMany({ chat: chatId, user: userId });

    // 3. Clean up messages & chat
    await messageModel.deleteMany({
      chat: chatId,
    });

    await chatModel.deleteOne({
      _id: chatId,
    });

    return res.status(200).json({
      success: true,
      message: "Chat and associated documents deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
