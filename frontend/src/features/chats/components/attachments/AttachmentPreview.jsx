import AttachmentChip from "./AttachmentChip";

function AttachmentPreview({ attachments, onRemove }) {
  if (!attachments.length) return null;

  return (
    <div className="attachment-preview" aria-label="Selected attachments">
      {attachments.map((attachment) => (
        <AttachmentChip
          key={attachment.id}
          attachment={attachment}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}

export default AttachmentPreview;
