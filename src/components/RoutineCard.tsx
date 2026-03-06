import { Link } from "react-router-dom";
import { Icon } from "./Icon";
import { cn } from "@/lib/utils";
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  type PanInfo,
} from "motion/react";
import type { getRoutineColor } from "../utils/routineColor";

const SWIPE_THRESHOLD = 80;

interface RoutineCardProps {
  routineId: string;
  title: string;
  isCompleted: boolean;
  isSkipped: boolean;
  justCompleted: boolean;
  note: string | undefined;
  currentStreak: number;
  color: ReturnType<typeof getRoutineColor>;
  canSwipe: boolean;
  showInlineMemo: boolean;
  inlineMemoText: string;
  isSelectMode: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onInlineMemoChange: (text: string) => void;
  onInlineMemoSubmit: () => void;
  onInlineMemoDismiss: () => void;
  onComplete: () => void;
  onOpenNote: () => void;
  onSkip: () => void;
}

export default function RoutineCard({
  routineId,
  title,
  isCompleted,
  isSkipped,
  justCompleted,
  note,
  currentStreak,
  color,
  canSwipe,
  showInlineMemo,
  inlineMemoText,
  isSelectMode,
  isSelected,
  onToggleSelect,
  onInlineMemoChange,
  onInlineMemoSubmit,
  onInlineMemoDismiss,
  onComplete,
  onOpenNote,
  onSkip,
}: RoutineCardProps) {
  const effectiveCanSwipe = canSwipe && !isSelectMode;
  const x = useMotionValue(0);
  const rightHintOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftHintOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onComplete();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSkip();
    }
  };

  return (
    <div className="relative flex items-stretch gap-0">
      {/* Select mode checkbox */}
      {isSelectMode && (
        <button
          type="button"
          className="flex items-center justify-center w-10 shrink-0 self-center"
          onClick={onToggleSelect}
        >
          <Icon
            name={isSelected ? "check_box" : "check_box_outline_blank"}
            size={24}
            className={isSelected ? "text-primary" : "text-gray-300"}
          />
        </button>
      )}

      {/* Swipe hint layers */}
      {effectiveCanSwipe && (
        <>
          <motion.div
            className="absolute inset-0 rounded-card bg-accent-light flex items-center pl-5 pointer-events-none"
            style={{ opacity: rightHintOpacity }}
          >
            <Icon name="check_circle" size={28} className="text-accent" />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-card bg-muted flex items-center justify-end pr-5 pointer-events-none"
            style={{ opacity: leftHintOpacity }}
          >
            <Icon name="fast_forward" size={28} className="text-text-tertiary" />
          </motion.div>
        </>
      )}

      <motion.article
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        drag={effectiveCanSwipe ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragEnd={effectiveCanSwipe ? handleDragEnd : undefined}
        style={effectiveCanSwipe ? { x } : undefined}
        className={cn(
          "flex-1",
          "bg-surface rounded-card px-5 py-[22px] shadow-card flex flex-col gap-4 relative overflow-hidden transition-all border border-transparent border-l-4",
          color.accent,
          isCompleted && "bg-emerald-50/40 border-emerald-100 shadow-emerald-100/50",
          isSkipped && "opacity-60 bg-gray-50/60"
        )}
      >
        {isCompleted && (
          <div className="absolute inset-0 bg-emerald-50/20 pointer-events-none z-0" />
        )}

        <div className="flex justify-between items-start z-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <motion.span
                  className="bg-accent-light text-emerald-700 text-[11px] font-bold px-2.5 py-1 rounded-badge flex items-center gap-1"
                  initial={justCompleted ? { scale: 0 } : false}
                  animate={{ scale: 1 }}
                  transition={justCompleted ? { type: "spring", stiffness: 300, damping: 15 } : undefined}
                >
                  <Icon name="check" size={12} /> 완료됨
                </motion.span>
              ) : isSkipped ? (
                <span className="bg-muted text-text-tertiary text-[11px] font-bold px-2.5 py-1 rounded-badge">
                  건너뜀
                </span>
              ) : currentStreak > 0 ? (
                <span className="bg-streak-light text-streak text-[11px] font-bold px-2.5 py-1 rounded-badge flex items-center gap-1">
                  <Icon name="local_fire_department" size={12} /> {currentStreak}일 연속
                </span>
              ) : (
                <span className="bg-muted text-text-tertiary text-[11px] font-bold px-2.5 py-1 rounded-badge">
                  미체크
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <Link
                to={`/routine/${routineId}`}
                className="text-[18px] font-bold text-text transition-colors hover:underline decoration-2 underline-offset-4"
              >
                {title}
              </Link>
              {isCompleted && note && (
                <p className="text-[14px] text-text-secondary mt-1 pl-3 border-l-[3px] border-accent bg-white/50 py-1 pr-2 rounded-r-md">
                  {note}
                </p>
              )}
            </div>
          </div>
          {!isCompleted && !isSkipped && !isSelectMode && (
            <Link to={`/routine/${routineId}`} className="text-text-tertiary hover:text-text-secondary">
              <Icon name="more_horiz" />
            </Link>
          )}
        </div>

        {/* Inline memo after completion */}
        <AnimatePresence>
          {showInlineMemo && (
            <motion.div
              className="z-10 flex items-center gap-2"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <input
                type="text"
                className="flex-1 h-[38px] px-3 rounded-input border border-border text-[14px] text-text placeholder:text-text-tertiary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                placeholder="한 줄 메모 남기기 (선택)"
                maxLength={120}
                value={inlineMemoText}
                onChange={(e) => onInlineMemoChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onInlineMemoSubmit();
                  }
                }}
                autoFocus
              />
              <button
                className="h-[38px] px-3 rounded-input bg-accent text-white text-[13px] font-semibold shrink-0 active:scale-95 transition-transform"
                type="button"
                onClick={onInlineMemoSubmit}
              >
                저장
              </button>
              <button
                className="text-[13px] text-text-tertiary shrink-0"
                type="button"
                onClick={onInlineMemoDismiss}
              >
                건너뛰기
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!isCompleted && !isSelectMode && (
          <div className="grid grid-cols-[1fr_auto_auto] gap-2 z-10">
            {isSkipped ? (
              <button
                className="col-span-3 h-[42px] rounded-button bg-muted text-text-tertiary text-[14px] font-medium flex items-center justify-center gap-1.5 transition-colors"
                type="button"
                disabled
              >
                건너뜀 처리됨
              </button>
            ) : (
              <>
                <button
                  className="h-[46px] rounded-button bg-primary text-white text-[15px] font-semibold hover:bg-primary-light transition-colors flex items-center justify-center shadow-sm active:scale-95"
                  type="button"
                  onClick={onComplete}
                >
                  완료
                </button>
                <button
                  className="h-[46px] w-[46px] rounded-button bg-muted text-text-secondary hover:bg-border transition-colors flex items-center justify-center active:scale-95"
                  type="button"
                  onClick={onOpenNote}
                  title="메모+완료"
                >
                  <Icon name="edit_note" size={20} />
                </button>
                <button
                  className="h-[46px] w-[46px] rounded-button bg-surface border border-border text-text-secondary hover:bg-muted transition-colors flex items-center justify-center active:scale-95"
                  type="button"
                  onClick={onSkip}
                >
                  <Icon name="fast_forward" size={20} />
                </button>
              </>
            )}
          </div>
        )}
      </motion.article>
    </div>
  );
}
