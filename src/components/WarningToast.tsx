interface WarningToastProps {
  open: boolean;
  message: string;
  actionLabel?: string;
  dismissLabel?: string;
  onAction: () => void;
  onDismiss: () => void;
}

export default function WarningToast({
  open,
  message,
  actionLabel = "계속",
  dismissLabel = "취소",
  onAction,
  onDismiss,
}: WarningToastProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="toast-anchor" role="status" aria-live="polite">
      <div className="warning-toast">
        <p className="warning-toast-message">{message}</p>
        <div className="button-row warning-toast-actions">
          <button className="secondary-button" type="button" onClick={onDismiss}>
            {dismissLabel}
          </button>
          <button className="primary-button" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
