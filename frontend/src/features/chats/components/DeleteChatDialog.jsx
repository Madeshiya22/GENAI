import { createPortal } from "react-dom";

const DeleteChatDialog = ({
  open,
  title,
  loading,
  error,
  onCancel,
  onConfirm,
}) => {
  if (!open) {
    return null;
  }

  return createPortal(
    <div className="delete-chat-modal" role="presentation">
      <div className="delete-chat-modal__backdrop" onClick={onCancel} />

      <div
        className="delete-chat-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-chat-title"
      >
        <h2 id="delete-chat-title">Delete chat?</h2>
        <p>
          This will permanently remove <strong>{title}</strong> from your chat history.
        </p>

        {error ? <div className="delete-chat-modal__error">{error}</div> : null}

        <div className="delete-chat-modal__actions">
          <button type="button" className="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button type="button" className="danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete chat"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default DeleteChatDialog;
