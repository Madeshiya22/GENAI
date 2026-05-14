import { AlertCircle, CheckCircle2, FileText, Image, Loader2, X } from "lucide-react";

function formatFileSize(size) {
  if (!size) return "";

  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentChip({ attachment, onRemove }) {
  const isImage = attachment.kind === "image";
  const isUploading = attachment.status === "uploading";
  const isReady = attachment.status === "ready";
  const hasError = attachment.status === "error";
  const fileSize = formatFileSize(attachment.size);
  const fileType = attachment.kind === "pdf" ? "PDF" : "Image";
  const readyMeta = fileSize ? `${fileType} - ${fileSize}` : fileType;

  return (
    <div className={`attachment-chip ${attachment.status || "ready"}`}>
      <div className="attachment-chip__preview">
        {isImage && attachment.previewUrl ? (
          <img src={attachment.previewUrl} alt="" />
        ) : attachment.kind === "pdf" ? (
          <FileText size={18} />
        ) : (
          <Image size={18} />
        )}
      </div>

      <div className="attachment-chip__body">
        <span className="attachment-chip__name" title={attachment.name}>
          {attachment.name}
        </span>
        <span className="attachment-chip__meta">
          {isUploading && (attachment.kind === "pdf" ? "Reading PDF" : "Uploading")}
          {isReady && readyMeta}
          {hasError && (attachment.error || "Upload failed")}
        </span>
      </div>

      <span className="attachment-chip__status" aria-hidden="true">
        {isUploading && <Loader2 size={14} />}
        {isReady && attachment.kind === "pdf" && <CheckCircle2 size={14} />}
        {hasError && <AlertCircle size={14} />}
      </span>

      <button
        type="button"
        className="attachment-chip__remove"
        onClick={() => onRemove(attachment.id)}
        aria-label={`Remove ${attachment.name}`}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export default AttachmentChip;
