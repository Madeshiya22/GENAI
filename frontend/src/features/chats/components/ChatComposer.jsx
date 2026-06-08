import { Loader2, Paperclip } from "lucide-react";
import AttachmentPreview from "./attachments/AttachmentPreview";
import { ACCEPTED_ATTACHMENT_TYPES, ATTACHMENT_INPUT_ID } from "../constants/chat.constants";

/**
 * The full message-input zone: hidden file input, attachment preview strip,
 * attach button, auto-resizing textarea, send button, and the disclaimer.
 *
 * This component is intentionally stateless — all values and handlers come
 * from the parent via props so they remain testable and composable.
 *
 * @param {{
 *   message: string,
 *   streaming: boolean,
 *   pendingAttachments: any[],
 *   hasUploadingAttachments: boolean,
 *   hasAttachmentErrors: boolean,
 *   activeChatId: string | null,
 *   tempChatActive: boolean,
 *   textareaRef: React.RefObject,
 *   onMessageChange: (e: React.ChangeEvent) => void,
 *   onKeyDown: (e: React.KeyboardEvent) => void,
 *   onPaste: (e: React.ClipboardEvent) => void,
 *   onFileChange: (e: React.ChangeEvent) => void,
 *   onRemoveAttachment: (id: string) => void,
 *   onSubmit: () => void,
 * }} props
 */
const ChatComposer = ({
  message,
  streaming,
  pendingAttachments,
  hasUploadingAttachments,
  hasAttachmentErrors,
  activeChatId,
  tempChatActive,
  textareaRef,
  onMessageChange,
  onKeyDown,
  onPaste,
  onFileChange,
  onRemoveAttachment,
  onSubmit,
}) => {
  const isSendDisabled =
    streaming ||
    hasUploadingAttachments ||
    hasAttachmentErrors ||
    !message.trim() ||
    (!activeChatId && !tempChatActive);

  return (
    <div className="chat__input">
      <div className={`chat__input-wrapper ${pendingAttachments.length ? "has-attachments" : ""}`}>
        {/* Hidden native file picker — triggered by the attach label below */}
        <input
          id={ATTACHMENT_INPUT_ID}
          type="file"
          accept={ACCEPTED_ATTACHMENT_TYPES}
          className="chat__file-input"
          multiple
          disabled={streaming}
          onChange={onFileChange}
        />

        <AttachmentPreview attachments={pendingAttachments} onRemove={onRemoveAttachment} />

        <div className="chat__composer-row">
          {/* Attach button — a <label> so it opens the hidden file input */}
          <label
            htmlFor={ATTACHMENT_INPUT_ID}
            className={`chat__attach-btn ${pendingAttachments.length ? "ready" : ""}`}
            aria-disabled={streaming}
            aria-label="Attach files"
            title="Attach files"
            tabIndex={streaming ? -1 : 0}
            onClick={(event) => {
              if (streaming) event.preventDefault();
            }}
            onKeyDown={(event) => {
              if (streaming) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                document.getElementById(ATTACHMENT_INPUT_ID)?.click();
              }
            }}
          >
            {hasUploadingAttachments ? <Loader2 size={18} /> : <Paperclip size={18} />}
          </label>

          <textarea
            ref={textareaRef}
            placeholder="Message Mento AI..."
            value={message}
            onChange={onMessageChange}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            rows={1}
            disabled={streaming}
          />

          <button
            className="chat__send-btn"
            onClick={onSubmit}
            disabled={isSendDisabled}
            aria-label="Send message"
          >
            {streaming ? (
              <div className="chat__send-spinner" />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <span className="chat__disclaimer">
        Mento AI can make mistakes. Verify important information.
      </span>
    </div>
  );
};

export default ChatComposer;
