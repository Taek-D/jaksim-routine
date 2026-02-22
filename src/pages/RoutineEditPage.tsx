import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { trackEvent } from "../analytics/analytics";
import type { DayOfWeek } from "../domain/models";
import { useAppState } from "../state/AppStateProvider";

const allDays: DayOfWeek[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
const dayLabel: Record<DayOfWeek, string> = {
  MON: "월",
  TUE: "화",
  WED: "수",
  THU: "목",
  FRI: "금",
  SAT: "토",
  SUN: "일",
};

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
    return (
      <section className="screen">
        <div className="card">
          <h1 className="heading">루틴을 찾을 수 없어요</h1>
          <button className="secondary-button" type="button" onClick={() => navigate("/home")}>
            홈으로
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="screen">
      <h1 className="heading">루틴 편집</h1>
      <div className="card">
        <label className="field-label" htmlFor="edit-title">
          루틴 이름
        </label>
        <input
          id="edit-title"
          className="text-input"
          value={title}
          maxLength={20}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="card">
        <label className="field-label" htmlFor="edit-goal-per-day">
          하루 목표 횟수
        </label>
        <input
          id="edit-goal-per-day"
          className="text-input"
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
        />
        <p className="muted">1~10 사이에서 설정할 수 있어요.</p>
      </div>

      <div className="card">
        <p className="field-label">목표 요일</p>
        <div className="chip-grid">
          {allDays.map((day) => (
            <button
              key={day}
              className={days.includes(day) ? "chip-button active" : "chip-button"}
              type="button"
              onClick={() =>
                setDays((prev) =>
                  prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]
                )
              }
            >
              {dayLabel[day]}
            </button>
          ))}
        </div>
      </div>

      <button
        className="primary-button full"
        type="button"
        disabled={!canSave}
        onClick={() => {
          updateRoutine(routine.id, { title, daysOfWeek: days, goalPerDay });
          trackEvent("routine_edit_save", { routineId: routine.id });
          navigate(`/routine/${routine.id}`);
        }}
      >
        저장
      </button>

      <button
        className="secondary-button danger full"
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
        루틴 삭제
      </button>
    </section>
  );
}
