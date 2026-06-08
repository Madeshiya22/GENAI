import { FileText, Image } from "lucide-react";

function formatFileSize(size) {
  if (!size) return "";

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageAttachmentRenderer({ attachments = [] }) {
  if (!attachments.length) return null;

  return (
    <div className="message-attachments">
      {attachments.map((attachment) => {
        const isImage = attachment.kind === "image";
        const fileSize = formatFileSize(attachment.size);
        const label = attachment.kind === "pdf" ? "PDF" : "Image";

        return (
          <div
            className={`message-attachment ${isImage ? "image" : "pdf"}`}
            key={attachment.id || attachment.name}
          >
            {isImage && attachment.previewUrl ? (
              <img
                className="message-attachment__image"
                src={attachment.previewUrl}
                alt={attachment.name || "Attached image"}
              />
            ) : (
              <div className="message-attachment__icon">
                {attachment.kind === "pdf" ? <FileText size={20} /> : <Image size={20} />}
              </div>
            )}

            {!isImage || !attachment.previewUrl ? (
              <div className="message-attachment__body">
                <span title={attachment.name}>{attachment.name}</span>
                <small>{label}</small>
              </div>
            ) : (
              <div className="message-attachment__caption">
                <span title={attachment.name}>{attachment.name}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MessageAttachmentRenderer;
