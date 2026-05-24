import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "chat",
    },
    documentId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
    },
    mimeType: {
      type: String,
    },
    totalChunks: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

const documentModel = mongoose.model("document", documentSchema);
export default documentModel;
