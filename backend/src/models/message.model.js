import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chat",
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    attachments: [
      {
        id: {
          type: String,
        },
        kind: {
          type: String,
          enum: ["pdf", "image"],
        },
        name: {
          type: String,
        },
        size: {
          type: Number,
        },
        mimeType: {
          type: String,
        },
        status: {
          type: String,
          enum: ["ready", "uploading", "error"],
          default: "ready",
        },
      },
    ],
    sources: [
      {
        id: {
          type: Number,
        },
        title: {
          type: String,
        },
        url: {
          type: String,
        },
        content: {
          type: String,
        },
        publishedDate: {
          type: String,
        },
        favicon: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const messageModel = mongoose.model("message", messageSchema);

export default messageModel;
