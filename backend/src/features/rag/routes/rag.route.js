import { Router } from "express";
import multer from "multer";
import { uploadPDF, askPDFQuestion, deletePDF } from "../controllers/rag.controller.js";
import { authMiddleware } from "../../../middleware/auth.middleware.js";

const ragRouter = Router();

// MEMORY STORAGE
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

ragRouter.post("/upload", authMiddleware, upload.single("pdf"), uploadPDF);
ragRouter.post("/ask", authMiddleware, askPDFQuestion);
ragRouter.delete("/:documentId", authMiddleware, deletePDF);

export default ragRouter;
