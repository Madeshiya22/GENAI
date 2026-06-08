import { useState } from "react";
import { useSelector } from "react-redux";
import { useChat } from "./useChat";
import { uploadPDF } from "../services/rag.service";

const PDF_MIME_TYPE = "application/pdf";

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export function useRagChat() {
  const { handleSendMessage } = useChat();
  const { activeChatId } = useSelector((state) => state.chat);

  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadedPDF, setUploadedPDF] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isAskingPDF, setIsAskingPDF] = useState(false);

  const isPDFReady =
    uploadStatus === "ready" && Boolean(uploadedPDF?.documentId);
  const isUploadingPDF = uploadStatus === "uploading";

  const uploadSelectedPDF = async (file) => {
    if (!file) {
      return {
        success: false,
        error: "No file selected.",
      };
    }

    const isPDF =
      file.type === PDF_MIME_TYPE ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPDF) {
      setUploadStatus("error");
      setUploadError("Please select a PDF file.");
      setUploadedPDF(null);
      return {
        success: false,
        error: "Please select a PDF file.",
      };
    }

    setUploadStatus("uploading");
    setUploadError("");
    setUploadedPDF({
      name: file.name,
      size: file.size,
    });

    try {
      const data = await uploadPDF(file);

      if (data?.success === false) {
        throw new Error(data?.message || "Unable to process PDF.");
      }

      setUploadedPDF({
        name: file.name,
        size: file.size,
        documentId: data?.documentId,
        totalChunks: data?.totalChunks,
      });
      setUploadStatus("ready");
      return {
        success: true,
        documentId: data?.documentId,
        totalChunks: data?.totalChunks,
      };
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Unable to upload PDF.");

      setUploadStatus("error");
      setUploadedPDF(null);
      setUploadError(errorMessage);

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  const askUploadedPDF = async (question, attachments = []) => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || !isPDFReady || isAskingPDF) {
      return false;
    }

    setIsAskingPDF(true);

    try {
      // Route through the unified streaming sendMessage pathway
      return await handleSendMessage(activeChatId, trimmedQuestion, attachments);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Unable to answer from PDF."), {
        cause: error,
      });
    } finally {
      setIsAskingPDF(false);
    }
  };

  const resetPDF = () => {
    if (isUploadingPDF || isAskingPDF) return;

    setUploadStatus("idle");
    setUploadedPDF(null);
    setUploadError("");
  };

  return {
    askUploadedPDF,
    isAskingPDF,
    isPDFReady,
    isUploadingPDF,
    resetPDF,
    uploadedPDF,
    uploadError,
    uploadSelectedPDF,
    uploadStatus,
  };
}
