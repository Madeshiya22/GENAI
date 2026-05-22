import model from "../../../services/ai.service.js";
import { randomUUID } from "node:crypto";

import {
  searchSimilarChunks,
  createVectorStore,
} from "../services/vector.service.js";

import { chunkText } from "../utils/chunk.utils.js";

import { extractTextFromPDF } from "../utils/pdf.utils.js";

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
    await createVectorStore(chunks, documentId);

    return res.status(200).json({
      success: true,

      message: "PDF processed successfully",

      documentId,

      totalChunks: chunks.length,
    });
  } catch (error) {
    console.error(error);

    return res.status(error.statusCode || 500).json({
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
    const chunks = await searchSimilarChunks(question, documentId);

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
