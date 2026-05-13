import { useRef, useState } from "react";
import { useDispatch } from "react-redux";

import {
  addMessage,
  appendContentToLastMessage,
  removeLastMessage,
  setStreaming,
} from "../state/chat.slice";
import { clearSources } from "../state/webSearch.slice";
import { askPDFQuestion, uploadPDF } from "../services/rag.service";

const PDF_MIME_TYPE = "application/pdf";

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

export function useRagChat() {
  const dispatch = useDispatch();
  const pendingQuestionRef = useRef("");
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadedPDF, setUploadedPDF] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isAskingPDF, setIsAskingPDF] = useState(false);

  const isPDFReady = uploadStatus === "ready" && Boolean(uploadedPDF);
  const isUploadingPDF = uploadStatus === "uploading";

  const uploadSelectedPDF = async (file) => {
    if (!file) return false;

    const isPDF =
      file.type === PDF_MIME_TYPE ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPDF) {
      setUploadStatus("error");
      setUploadError("Please select a PDF file.");
      setUploadedPDF(null);
      return false;
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
        totalChunks: data?.totalChunks,
      });
      setUploadStatus("ready");
      return true;
    } catch (error) {
      setUploadStatus("error");
      setUploadedPDF(null);
      setUploadError(getErrorMessage(error, "Unable to upload PDF."));
      return false;
    }
  };

  const askUploadedPDF = async (question) => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || !isPDFReady || isAskingPDF) {
      return false;
    }

    if (pendingQuestionRef.current === trimmedQuestion) {
      return false;
    }

    pendingQuestionRef.current = trimmedQuestion;
    setIsAskingPDF(true);
    dispatch(clearSources());
    dispatch(setStreaming(true));

    dispatch(
      addMessage({
        role: "user",
        content: trimmedQuestion,
        timestamp: Date.now(),
      }),
    );

    dispatch(
      addMessage({
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      }),
    );

    try {
      const data = await askPDFQuestion(trimmedQuestion);

      if (data?.success === false) {
        throw new Error(data?.message || "Unable to answer from PDF.");
      }

      dispatch(
        appendContentToLastMessage({
          chunk: data?.answer || "Answer not found in PDF.",
        }),
      );

      return true;
    } catch (error) {
      dispatch(removeLastMessage());
      dispatch(removeLastMessage());
      throw new Error(getErrorMessage(error, "Unable to answer from PDF."));
    } finally {
      dispatch(setStreaming(false));
      pendingQuestionRef.current = "";
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
