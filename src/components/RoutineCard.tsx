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
            className={isSelected ? "text-[#111827]" : "text-gray-300"}
          />
        </button>
      )}

      {/* Swipe hint layers */}
      {effectiveCanSwipe && (
        <>
          <motion.div
            className="absolute inset-0 rounded-[20px] bg-emerald-100 flex items-center pl-5 pointer-events-none"
            style={{ opacity: rightHintOpacity }}
          >
            <Icon name="check_circle" size={28} className="text-emerald-600" />
          </motion.div>
          <motion.div
            className="absolute inset-0 rounded-[20px] bg-gray-200 flex items-center justify-end pr-5 pointer-events-none"
            style={{ opacity: leftHintOpacity }}
          >
            <Icon name="fast_forward" size={28} className="text-gray-500" />
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
          "bg-white rounded-[20px] p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all border border-transparent border-l-4",
          color.accent,
          isCompleted && "bg-emerald-50/60 border-emerald-100 shadow-emerald-100/50"
        )}
      >
        {isCompleted && (
          <div className="absolute inset-0 bg-gray-50/50 pointer-events-none z-0" />
        )}

        <div className="flex justify-between items-start z-10">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <span className="bg-green-100 text-green-700 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Icon name="check" size={12} /> 완료됨
                </span>
              ) : isSkipped ? (
                <span className="bg-gray-100 text-gray-500 text-[11px] font-bold px-2.5 py-1 rounded-full">
                  건너뜀
                </span>
              ) : currentStreak > 0 ? (
                <span className="bg-orange-50 text-orange-700 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Icon name="local_fire_department" size={12} /> {currentStreak}일 연속
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-500 text-[11px] font-bold px-2.5 py-1 rounded-full">
                  미체크
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5">
              <Link
                to={`/routine/${routineId}`}
                className="text-[18px] font-bold text-[#101828] transition-colors hover:underline decoration-2 underline-offset-4"
              >
                {title}
              </Link>
              {isCompleted && note && (
                <p className="text-[14px] text-gray-600 mt-1 pl-3 border-l-[3px] border-emerald-300 bg-white/50 py-1 pr-2 rounded-r-md">
                  {note}
                </p>
              )}
            </div>
          </div>
          {!isCompleted && !isSkipped && !isSelectMode && (
            <Link to={`/routine/${routineId}`} className="text-gray-400 hover:text-gray-600">
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
                className="flex-1 h-[38px] px-3 rounded-lg border border-gray-200 text-[14px] text-[#101828] placeholder:text-gray-400 focus:outline-none focus:border-emerald-400"
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
                className="h-[38px] px-3 rounded-lg bg-emerald-600 text-white text-[13px] font-semibold shrink-0 active:scale-95"
                type="button"
                onClick={onInlineMemoSubmit}
              >
                저장
              </button>
              <button
                className="text-[13px] text-gray-400 shrink-0"
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
                className="col-span-3 h-[42px] rounded-xl bg-gray-100 text-gray-400 text-[14px] font-medium flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors"
                type="button"
                disabled
              >
                건너뜀 처리됨
              </button>
            ) : (
              <>
                <button
                  className="h-[46px] rounded-xl bg-[#111827] text-white text-[15px] font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center shadow-sm active:scale-95"
                  type="button"
                  onClick={onComplete}
                >
                  완료
                </button>
                <button
                  className="h-[46px] w-[46px] rounded-xl bg-[#f2f4f7] text-[#344054] hover:bg-gray-200 transition-colors flex items-center justify-center active:scale-95"
                  type="button"
                  onClick={onOpenNote}
                  title="메모+완료"
                >
                  <Icon name="edit_note" size={20} />
                </button>
                <button
                  className="h-[46px] w-[46px] rounded-xl bg-white border border-gray-200 text-[#475467] hover:bg-gray-50 transition-colors flex items-center justify-center active:scale-95"
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
