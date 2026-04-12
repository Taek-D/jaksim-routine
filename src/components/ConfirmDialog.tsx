import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex justify-center items-end p-4"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="w-[min(100%,560px)] bg-surface rounded-card shadow-elevated p-5 flex flex-col gap-3"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-[16px] font-bold text-text">{title}</h2>
        {description && (
          <p className="text-[14px] text-text-secondary leading-relaxed">{description}</p>
        )}
        <div className="flex gap-2 mt-1">
          <button
            className="flex-1 h-[44px] rounded-button bg-muted text-text-secondary text-[15px] font-medium hover:bg-border transition-colors"
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className={cn(
              "flex-1 h-[44px] rounded-button text-white text-[15px] font-semibold transition-colors active:scale-[0.98]",
              destructive
                ? "bg-danger hover:bg-red-600"
                : "bg-primary hover:bg-primary-light"
            )}
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
