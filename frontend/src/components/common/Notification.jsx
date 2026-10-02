import { AlertCircle, Check, X } from "lucide-react";

function Notification({ notice, onDismiss }) {
  return (
    <div className={`notice ${notice.type}`} role="status">
      {notice.type === "success" ? (
        <Check size={17} />
      ) : (
        <AlertCircle size={17} />
      )}
      <span>{notice.message}</span>
      <button
        aria-label="Dismiss notification"
        className="icon-button"
        onClick={onDismiss}
        type="button"
      >
        <X size={16} />
      </button>
    </div>
  );
}

export default Notification;