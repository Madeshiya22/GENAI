import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

export async function extractTextFromPDF(buffer) {

  try {

    const pdf = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
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

    return fullText;

  } catch (error) {

    console.log(error);

    throw new Error("Failed to extract PDF text");
  }
}