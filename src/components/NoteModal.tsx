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

  if (!open) {
    return null;
  }

  return (
    <div className="overlay-backdrop" role="presentation">
      <div className="overlay-card" role="dialog" aria-modal="true" aria-labelledby="checkin-note-title">
        <h2 id="checkin-note-title" className="subheading">
          {title}
        </h2>
        <p className="muted">{description}</p>
        <textarea
          ref={textareaRef}
          className="note-textarea"
          value={note}
          onChange={(event) => onChangeNote(event.target.value)}
          placeholder={placeholder}
          maxLength={120}
        />
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="primary-button" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
