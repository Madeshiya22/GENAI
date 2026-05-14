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
  },
  {
    timestamps: true,
  },
);

const messageModel = mongoose.model("message", messageSchema);

export default messageModel;
