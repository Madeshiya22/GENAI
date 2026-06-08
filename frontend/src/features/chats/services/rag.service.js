import axios from "axios";

import { API_BASE_URL } from "../../../config/config";

// UPLOAD PDF
export async function uploadPDF(file) {
  try {
    const formData = new FormData();

    formData.append("pdf", file);

    const response = await axios.post(`${API_BASE_URL}/api/rag/upload`, formData, {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.log(error);

    throw error;
  }
}

// ASK PDF QUESTION
export async function askPDFQuestion(question, documentId) {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/rag/ask`,
      {
        question,
        documentId,
      },
      {
        withCredentials: true,
      },
    );

    return response.data;
  } catch (error) {
    console.log(error);

    throw error;
  }
}
