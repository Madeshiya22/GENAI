import { useCallback, useEffect, useRef, useState } from "react";
import { createAttachment, toMessageAttachment } from "../utils/attachment.utils";

/**
 * Manages all pending-attachment state plus drag/paste/file-change event handling.
 *
 * Responsibilities:
 *  - Accumulate pending attachments (with status "uploading" | "ready" | "error")
 *  - Revoke object URLs on unmount to prevent memory leaks
 *  - Coordinate PDF upload via the injected `uploadSelectedPDF` callback
 *  - Expose derived boolean flags consumed by the composer and submit handler
 *  - Handle drag-enter/over/leave/drop and clipboard-paste events
 *
 * @param {object} params
 * @param {Function} params.uploadSelectedPDF  - async fn from useRagChat
 * @param {Function} params.resetPDF          - resets rag state when last PDF is removed
 * @param {Function} params.onError           - reports a user-visible error string
 * @param {Function} params.onClearError      - clears any current error
 * @param {React.RefObject} params.textareaRef - focused after files are added
 */
export function useAttachments({
  uploadSelectedPDF,
  resetPDF,
  onError,
  onClearError,
  textareaRef,
}) {
  const [pendingAttachments, setPendingAttachments] = useState([]);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const dragDepthRef = useRef(0);
  const objectUrlsRef = useRef([]);

  // Revoke all object URLs when the component unmounts
  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // ─── Derived flags ────────────────────────────────────────────────────────

  const hasUploadingAttachments = pendingAttachments.some(
    (a) => a.status === "uploading",
  );
  const hasAttachmentErrors = pendingAttachments.some(
    (a) => a.status === "error",
  );
  const hasReadyPDF = pendingAttachments.some(
    (a) => a.kind === "pdf" && a.status === "ready",
  );

  // ─── Core helpers ─────────────────────────────────────────────────────────

  /**
   * Adds files, kicks off PDF uploads, and returns the count that were accepted.
   */
  const addFiles = useCallback(
    (files) => {
      const incomingFiles = Array.from(files || []);
      const attachments = incomingFiles.map(createAttachment).filter(Boolean);

      if (!attachments.length) {
        if (incomingFiles.length) {
          onError("Only PDF and image attachments are supported.");
        }
        return 0;
      }

      // Track object URLs so we can revoke them later
      attachments.forEach((a) => {
        if (a.previewUrl) objectUrlsRef.current.push(a.previewUrl);
      });

      onClearError();
      setPendingAttachments((current) => [...current, ...attachments]);

      // Kick off async PDF uploads
      attachments
        .filter((a) => a.kind === "pdf")
        .forEach(async (attachment) => {
          const result = await uploadSelectedPDF(attachment.file);
          const uploaded = result?.success === true;

          setPendingAttachments((current) =>
            current.map((item) =>
              item.id === attachment.id
                ? {
                    ...item,
                    id: uploaded ? result.documentId : item.id,
                    status: uploaded ? "ready" : "error",
                    error: uploaded ? "" : result?.error || "PDF upload failed",
                  }
                : item,
            ),
          );
        });

      textareaRef.current?.focus();
      return attachments.length;
    },
    [uploadSelectedPDF, onError, onClearError, textareaRef],
  );

  const removeAttachment = useCallback(
    (attachmentId) => {
      setPendingAttachments((current) => {
        const removed = current.find((a) => a.id === attachmentId);
        const next = current.filter((a) => a.id !== attachmentId);

        if (removed?.previewUrl) {
          URL.revokeObjectURL(removed.previewUrl);
          objectUrlsRef.current = objectUrlsRef.current.filter(
            (url) => url !== removed.previewUrl,
          );
        }

        // If no PDFs remain, reset RAG state
        if (!next.some((a) => a.kind === "pdf")) {
          resetPDF();
        }

        return next;
      });
    },
    [resetPDF],
  );

  /**
   * Builds the serialisable attachments array ready to be sent with a message.
   */
  const getReadyAttachments = useCallback(
    () => pendingAttachments.filter((a) => a.status === "ready").map(toMessageAttachment),
    [pendingAttachments],
  );

  const clearAttachments = useCallback(() => setPendingAttachments([]), []);

  // ─── Event handlers ───────────────────────────────────────────────────────

  const handleFileChange = useCallback(
    (event) => {
      const files = Array.from(event.target.files || []);
      event.target.value = "";
      addFiles(files);
    },
    [addFiles],
  );

  const handlePaste = useCallback(
    (event) => {
      const clipboardFiles = Array.from(event.clipboardData?.files || []);
      const itemFiles = Array.from(event.clipboardData?.items || [])
        .filter((item) => item.kind === "file")
        .map((item) => item.getAsFile())
        .filter(Boolean);
      const files = clipboardFiles.length ? clipboardFiles : itemFiles;
      const addedCount = addFiles(files);
      if (addedCount > 0) event.preventDefault();
    },
    [addFiles],
  );

  const handleDragEnter = useCallback((event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingFiles(true);
  }, []);

  const handleDragOver = useCallback((event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const handleDragLeave = useCallback((event) => {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) setIsDraggingFiles(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return;
      event.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingFiles(false);
      addFiles(event.dataTransfer.files);
    },
    [addFiles],
  );

  return {
    // State
    pendingAttachments,
    isDraggingFiles,

    // Derived flags
    hasUploadingAttachments,
    hasAttachmentErrors,
    hasReadyPDF,

    // Helpers
    addFiles,
    removeAttachment,
    getReadyAttachments,
    clearAttachments,
    setPendingAttachments,

    // Event handlers
    handleFileChange,
    handlePaste,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
