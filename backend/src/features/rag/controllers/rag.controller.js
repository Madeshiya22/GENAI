import model from "../../../services/ai.service.js";

import {
  searchSimilarChunks,
  createVectorStore,
} from "../services/vector.service.js";

import { chunkText }
from "../utils/chunk.utils.js";

import { extractTextFromPDF }
from "../utils/pdf.utils.js";


// UPLOAD PDF
export async function uploadPDF(
  req,
  res,
) {

  try {

    if (!req.file) {

      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    // EXTRACT PDF TEXT
    const extractedText =
      await extractTextFromPDF(
        req.file.buffer,
      );

    // CHUNK TEXT
    const chunks =
      await chunkText(extractedText);

    // CREATE VECTOR STORE
    await createVectorStore(chunks);

    return res.status(200).json({
      success: true,

      message:
        "PDF processed successfully",

      totalChunks: chunks.length,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}


// ASK QUESTION FROM PDF
export async function askPDFQuestion(
  req,
  res,
) {

  try {

    console.log(
      "BODY:",
      req.body,
    );

    const question =
      req.body?.question;

    if (!question) {

      return res.status(400).json({
        success: false,
        message:
          "Question is required",
      });
    }

    // SEARCH RELEVANT CHUNKS
    const chunks =
      await searchSimilarChunks(
        question,
      );

    // COMBINE CONTEXT
    const context = chunks
      .map(
        (chunk) =>
          chunk.pageContent,
      )
      .join("\n\n");

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
    const response =
      await model.invoke(prompt);

    return res.status(200).json({
      success: true,

      answer:
        response.content,

      chunksUsed:
        chunks.length,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
}