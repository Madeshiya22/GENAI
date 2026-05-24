import model from "../../../services/ai.service.js";
import { randomUUID } from "node:crypto";
import {
  searchSimilarChunks,
  createVectorStore,
  deleteDocumentVectors,
} from "../services/vector.service.js";
import { chunkText } from "../utils/chunk.utils.js";
import { extractTextFromPDF } from "../utils/pdf.utils.js";
import documentModel from "../../../models/document.model.js";

function createDocumentId() {
  return `pdf-${randomUUID()}`;
}

// UPLOAD PDF
export async function uploadPDF(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    const userId = req.user.id;
    const fileName = req.file.originalname;

    // EXTRACT PDF TEXT
    const extractedText = await extractTextFromPDF(req.file.buffer);

    if (!extractedText) {
      return res.status(400).json({
        success: false,
        message:
          "No readable text found in this PDF. Scanned/image-only PDFs are not supported yet.",
      });
    }

    // CHUNK TEXT
    const chunks = await chunkText(extractedText);

    if (chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid text chunks found in PDF",
      });
    }

    const documentId = createDocumentId();

    // CREATE VECTOR STORE
    await createVectorStore(chunks, documentId, userId, fileName);

    // SAVE TO MONGO
    const doc = await documentModel.create({
      user: userId,
      documentId,
      name: fileName,
      size: req.file.size,
      mimeType: req.file.mimetype,
      totalChunks: chunks.length,
    });

    return res.status(200).json({
      success: true,
      message: "PDF processed successfully",
      documentId,
      totalChunks: chunks.length,
      document: doc,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
}

// DELETE PDF
export async function deletePDF(req, res) {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const doc = await documentModel.findOne({ documentId, user: userId });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Document not found or unauthorized",
      });
    }

    // Clean up Pinecone vectors
    await deleteDocumentVectors(documentId, userId);

    // Delete MongoDB record
    await documentModel.deleteOne({ _id: doc._id });

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

// ASK QUESTION FROM PDF
export async function askPDFQuestion(req, res) {
  try {
    const question = req.body?.question?.trim();
    const documentId = req.body?.documentId?.trim();
    const userId = req.user.id;

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: "PDF document ID is required. Please upload the PDF again.",
      });
    }

    // SEARCH RELEVANT CHUNKS
    const chunks = await searchSimilarChunks(question, userId, [documentId]);

    if (chunks.length === 0) {
      return res.status(200).json({
        success: true,
        answer: "Answer not found in PDF.",
        chunksUsed: 0,
      });
    }

    // COMBINE CONTEXT
    const context = chunks
      .map((chunk, index) => {
        const chunkLabel = chunk.chunk || index + 1;
        return `[Chunk ${chunkLabel}]\n${chunk.pageContent}`;
      })
      .join("\n\n");

    // PROMPT
    const prompt = `
You answer questions from a PDF.
Use ONLY the provided retrieved PDF chunks.
Do not scan, invent, or use information outside these chunks.

Important:
- Reply with exact words from the PDF whenever possible.
- Prefer short verbatim quotes copied from the PDF context.
- Do not paraphrase unless you must connect two exact quotes.
- If the exact answer is not present in the retrieved chunks, say:
"Answer not found in PDF."

Format:
Answer: "<exact words from the PDF>"

Retrieved PDF Chunks:
${context}

Question:
${question}
`;

    // AI RESPONSE
    const response = await model.invoke(prompt);

    return res.status(200).json({
      success: true,
      answer: response.content,
      chunksUsed: chunks.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
}
