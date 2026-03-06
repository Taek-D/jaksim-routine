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
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[84px] w-[min(calc(100%-32px),560px)] z-[110]" role="status" aria-live="polite">
      <div className="rounded-card border border-danger/30 bg-red-50 shadow-elevated p-4 flex flex-col gap-3">
        <p className="text-[14px] font-semibold text-red-800">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            className="h-[38px] px-4 rounded-button bg-surface border border-border text-text-secondary text-[14px] font-medium hover:bg-muted transition-colors"
            type="button"
            onClick={onDismiss}
          >
            {dismissLabel}
          </button>
          <button
            className="h-[38px] px-4 rounded-button bg-primary text-white text-[14px] font-semibold hover:bg-primary-light transition-colors active:scale-[0.98]"
            type="button"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
