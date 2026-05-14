import { FileUp } from "lucide-react";

function AttachmentDropzone({ active }) {
  return (
    <div className={`attachment-dropzone ${active ? "active" : ""}`} aria-hidden={!active}>
      <div className="attachment-dropzone__panel">
        <FileUp size={28} />
        <span>Drop files to attach</span>
        <small>PDFs and images</small>
      </div>
    </div>
  );
}

export default AttachmentDropzone;
