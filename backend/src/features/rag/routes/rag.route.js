import { Router } from "express";
import multer from "multer";

import { uploadPDF, askPDFQuestion } from "../controllers/rag.controller.js";

const ragRouter = Router();

// MEMORY STORAGE
const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

ragRouter.post("/upload", upload.single("pdf"), uploadPDF);

ragRouter.post("/ask", askPDFQuestion);

export default ragRouter;
