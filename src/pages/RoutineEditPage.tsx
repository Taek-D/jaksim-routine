import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackEvent } from "../analytics/analytics";
import type { DayOfWeek } from "../domain/models";
import { useAppState } from "../state/AppStateProvider";
import { Icon } from "../components/Icon";
import DaySelector from "../components/DaySelector";
import RoutineNotFound from "../components/RoutineNotFound";
import ConfirmDialog from "../components/ConfirmDialog";


function clampGoalPerDay(value: number): number {
  return Math.max(1, Math.min(10, value));
}

export default function RoutineEditPage() {
  const navigate = useNavigate();
  const { routineId = "" } = useParams();
  const { state, updateRoutine, deleteRoutine } = useAppState();

  const routine = state.routines.find((item) => item.id === routineId);
  const [title, setTitle] = useState(routine?.title ?? "");
  const [days, setDays] = useState<DayOfWeek[]>(routine?.daysOfWeek ?? []);
  const [goalPerDay, setGoalPerDay] = useState(routine?.goalPerDay ?? 1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const canSave = useMemo(
    () => title.trim().length > 0 && days.length > 0 && goalPerDay >= 1 && goalPerDay <= 10,
    [title, days.length, goalPerDay]
  );

  if (!routine) {
    return <RoutineNotFound />;
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      <main className="flex-1 px-5 pt-6 pb-32 overflow-y-auto flex flex-col gap-6">
        <h1 className="text-[24px] font-bold text-text tracking-tight">루틴 편집</h1>

        {/* Title */}
        <section>
          <label className="block text-[15px] font-bold text-text mb-3" htmlFor="edit-title">
            루틴 이름
          </label>
          <input
            id="edit-title"
            type="text"
            value={title}
            maxLength={20}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full border border-border rounded-input px-4 py-3.5 text-[16px] text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all placeholder:text-text-tertiary"
          />
          <p className="mt-2 text-[13px] text-text-secondary text-right">{title.length}/20</p>
        </section>

        {/* Goal per day */}
        <section>
          <label className="block text-[15px] font-bold text-text mb-3" htmlFor="edit-goal-per-day">
            하루 목표 횟수
          </label>
          <input
            id="edit-goal-per-day"
            type="number"
            inputMode="numeric"
            min={1}
            max={10}
            step={1}
            value={goalPerDay}
            onChange={(event) => {
              const nextValue = Number(event.target.value);
              if (Number.isNaN(nextValue)) {
                return;
              }
              setGoalPerDay(clampGoalPerDay(nextValue));
            }}
            className="w-full border border-border rounded-input px-4 py-3.5 text-[16px] text-text outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
          />
          <p className="mt-2 text-[13px] text-text-secondary">1~10 사이에서 설정할 수 있어요.</p>
        </section>

        {/* Day Selection */}
        <section>
          <p className="block text-[15px] font-bold text-text mb-4">목표 요일</p>
          <DaySelector
            days={days}
            onToggle={(day) =>
              setDays((prev) =>
                prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
              )
            }
          />
        </section>

        {/* Delete */}
        <button
          className="mt-4 text-danger text-[15px] font-medium py-3 hover:text-red-700 transition-colors flex items-center justify-center gap-2"
          type="button"
          onClick={() => setDeleteConfirmOpen(true)}
        >
          <Icon name="delete" size={18} className="text-danger" />
          루틴 삭제
        </button>
      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-surface border-t border-border/50 max-w-[640px] mx-auto pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            updateRoutine(routine.id, { title, daysOfWeek: days, goalPerDay });
            trackEvent("routine_edit_save", { routineId: routine.id });
            navigate(`/routine/${routine.id}`);
          }}
          className="w-full h-[52px] rounded-card bg-primary text-white text-[16px] font-bold shadow-sm disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center"
        >
          저장
        </button>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="루틴을 삭제할까요?"
        description="이 루틴의 체크인 기록과 메모도 함께 삭제돼요. 되돌릴 수 없어요."
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          deleteRoutine(routine.id);
          trackEvent("routine_delete", { routineId: routine.id });
          navigate("/home");
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
