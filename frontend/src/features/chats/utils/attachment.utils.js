/**
 * Determines whether a File is a PDF or image.
 * Returns "pdf" | "image" | null.
 */
export function getAttachmentKind(file) {
  if (!file) return null;

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    return "pdf";
  }

  if (file.type.startsWith("image/")) {
    return "image";
  }

  return null;
}

/**
 * Builds a pending-attachment descriptor from a raw File.
 * Returns null when the file type is unsupported.
 */
export function createAttachment(file) {
  const kind = getAttachmentKind(file);

  if (!kind) return null;

  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    file,
    kind,
    name: file.name || (kind === "image" ? "Pasted image" : "Attached PDF"),
    size: file.size,
    mimeType: file.type,
    previewUrl: kind === "image" ? URL.createObjectURL(file) : "",
    status: kind === "pdf" ? "uploading" : "ready",
  };
}

/**
 * Strips the raw File reference from a pending attachment so it can be
 * safely serialised and sent as message metadata.
 */
export function toMessageAttachment(attachment) {
  return {
    id: attachment.id,
    kind: attachment.kind,
    name: attachment.name,
    size: attachment.size,
    mimeType: attachment.mimeType,
    previewUrl: attachment.previewUrl,
    status: attachment.status,
  };
}
