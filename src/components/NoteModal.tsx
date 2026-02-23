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
    <div className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-sm flex justify-center items-end p-4" role="presentation">
      <div
        className="w-[min(100%,560px)] bg-white rounded-2xl shadow-[0_16px_32px_rgba(16,24,40,0.2)] p-5 flex flex-col gap-3"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-note-title"
      >
        <h2 id="checkin-note-title" className="text-[16px] font-bold text-[#101828]">
          {title}
        </h2>
        <p className="text-[14px] text-gray-500">{description}</p>
        <textarea
          ref={textareaRef}
          className="w-full min-h-[110px] border border-gray-300 rounded-xl px-4 py-3 text-[15px] text-[#101828] outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all placeholder:text-gray-400 resize-y"
          value={note}
          onChange={(event) => onChangeNote(event.target.value)}
          placeholder={placeholder}
          maxLength={120}
        />
        <div className="flex gap-2">
          <button
            className="flex-1 h-[44px] rounded-xl bg-[#f2f4f7] text-[#344054] text-[15px] font-medium hover:bg-gray-200 transition-colors"
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="flex-1 h-[44px] rounded-xl bg-[#111827] text-white text-[15px] font-semibold hover:bg-gray-800 transition-colors active:scale-[0.98]"
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
