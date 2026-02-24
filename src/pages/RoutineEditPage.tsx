import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackEvent } from "../analytics/analytics";
import type { DayOfWeek } from "../domain/models";
import { useAppState } from "../state/AppStateProvider";
import { Icon } from "../components/Icon";
import DaySelector from "../components/DaySelector";
import RoutineNotFound from "../components/RoutineNotFound";

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

  const canSave = useMemo(
    () => title.trim().length > 0 && days.length > 0 && goalPerDay >= 1 && goalPerDay <= 10,
    [title, days.length, goalPerDay]
  );

  if (!routine) {
    return <RoutineNotFound />;
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 h-[56px] flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-start text-gray-600" type="button">
          <Icon name="arrow_back" size={24} />
        </button>
        <h1 className="text-[17px] font-bold text-[#101828]">루틴 편집</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-5 pt-6 pb-32 overflow-y-auto flex flex-col gap-6">
        {/* Title */}
        <section>
          <label className="block text-[15px] font-bold text-[#101828] mb-3" htmlFor="edit-title">
            루틴 이름
          </label>
          <input
            id="edit-title"
            type="text"
            value={title}
            maxLength={20}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-[16px] text-[#101828] outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all placeholder:text-gray-400"
          />
          <p className="mt-2 text-[13px] text-gray-500 text-right">{title.length}/20</p>
        </section>

        {/* Goal per day */}
        <section>
          <label className="block text-[15px] font-bold text-[#101828] mb-3" htmlFor="edit-goal-per-day">
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
            className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-[16px] text-[#101828] outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all"
          />
          <p className="mt-2 text-[13px] text-gray-500">1~10 사이에서 설정할 수 있어요.</p>
        </section>

        {/* Day Selection */}
        <section>
          <p className="block text-[15px] font-bold text-[#101828] mb-4">목표 요일</p>
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
          className="mt-4 text-red-600 text-[15px] font-medium py-3 hover:text-red-700 transition-colors flex items-center justify-center gap-2"
          type="button"
          onClick={() => {
            const ok = window.confirm("정말 삭제할까요? 이 루틴의 체크인 기록도 함께 삭제돼요.");
            if (!ok) {
              return;
            }
            deleteRoutine(routine.id);
            trackEvent("routine_delete", { routineId: routine.id });
            navigate("/home");
          }}
        >
          <Icon name="delete" size={18} className="text-red-600" />
          루틴 삭제
        </button>
      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-[640px] mx-auto pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          disabled={!canSave}
          onClick={() => {
            updateRoutine(routine.id, { title, daysOfWeek: days, goalPerDay });
            trackEvent("routine_edit_save", { routineId: routine.id });
            navigate(`/routine/${routine.id}`);
          }}
          className="w-full h-[52px] rounded-2xl bg-[#111827] text-white text-[16px] font-bold shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center"
        >
          저장
        </button>
      </div>
    </div>
  );
}
