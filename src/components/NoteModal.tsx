import { useEffect, useRef } from "react";

interface NoteModalProps {
  open: boolean;
  title: string;
  description: string;
  note: string;
  placeholder?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onChangeNote: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function NoteModal({
  open,
  title,
  description,
  note,
  placeholder = "오늘 기록 메모 (선택)",
  confirmLabel = "저장",
  cancelLabel = "취소",
  onChangeNote,
  onConfirm,
  onCancel,
}: NoteModalProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    textareaRef.current?.focus();
  }, [open]);

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
        aria-labelledby="checkin-note-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="checkin-note-title" className="text-[16px] font-bold text-text">
          {title}
        </h2>
        <p className="text-[14px] text-text-secondary">{description}</p>
        <textarea
          ref={textareaRef}
          className="w-full min-h-[110px] border border-border rounded-input px-4 py-3 text-[15px] text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-tertiary resize-y"
          value={note}
          onChange={(event) => onChangeNote(event.target.value)}
          placeholder={placeholder}
          maxLength={120}
        />
        <div className="flex gap-2">
          <button
            className="flex-1 h-[44px] rounded-button bg-muted text-text-secondary text-[15px] font-medium hover:bg-border transition-colors"
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="flex-1 h-[44px] rounded-button bg-primary text-white text-[15px] font-semibold hover:bg-primary-light transition-colors active:scale-[0.98]"
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
