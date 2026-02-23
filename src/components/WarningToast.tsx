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
      <div className="rounded-2xl border border-red-200 bg-orange-50 shadow-[0_8px_24px_rgba(16,24,40,0.14)] p-4 flex flex-col gap-3">
        <p className="text-[14px] font-semibold text-red-800">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            className="h-[38px] px-4 rounded-xl bg-white border border-gray-200 text-[#344054] text-[14px] font-medium hover:bg-gray-50 transition-colors"
            type="button"
            onClick={onDismiss}
          >
            {dismissLabel}
          </button>
          <button
            className="h-[38px] px-4 rounded-xl bg-[#111827] text-white text-[14px] font-semibold hover:bg-gray-800 transition-colors active:scale-[0.98]"
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
