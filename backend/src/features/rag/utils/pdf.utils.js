import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const standardFontDataUrl = `${path
  .join(__dirname, "../../../../node_modules/pdfjs-dist/standard_fonts")
  .replace(/\\/g, "/")}/`;

export async function extractTextFromPDF(buffer) {

  try {

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      standardFontDataUrl,
    }).promise;

    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {

      const page = await pdf.getPage(pageNum);

      const content = await page.getTextContent();

      const strings = content.items.map(
        (item) => item.str,
      );

      fullText += strings.join(" ");
      fullText += "\n";
    }

    return fullText.trim();

  } catch (error) {

    console.error("PDF text extraction failed:", error);

    const extractionError = new Error(
      "Unable to read this PDF. Please upload a text-based, unlocked PDF.",
    );

    extractionError.statusCode = 400;

    throw extractionError;
  }
}
