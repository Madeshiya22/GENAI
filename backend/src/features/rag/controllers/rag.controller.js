import model from "../../../services/ai.service.js";

import {
  searchSimilarChunks,
  createVectorStore,
} from "../services/vector.service.js";

import { chunkText } from "../utils/chunk.utils.js";

import { extractTextFromPDF } from "../utils/pdf.utils.js";

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
        message: "No readable text found in PDF",
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

    // CREATE VECTOR STORE
    await createVectorStore(chunks);

    return res.status(200).json({
      success: true,

      message: "PDF processed successfully",

      totalChunks: chunks.length,
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

    if (!question) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    // SEARCH RELEVANT CHUNKS
    const chunks = await searchSimilarChunks(question);

    if (chunks.length === 0) {
      return res.status(200).json({
        success: true,
        answer: "Answer not found in PDF.",
        chunksUsed: 0,
      });
    }

    // COMBINE CONTEXT
    const context = chunks.map((chunk) => chunk.pageContent).join("\n\n");

    // PROMPT
    const prompt = `
Answer the user's question ONLY
from the provided PDF context.

If the answer is not present
in the context,
say:
"Answer not found in PDF."

PDF Context:
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

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}
