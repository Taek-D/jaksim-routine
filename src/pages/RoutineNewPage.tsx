import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTINE_TEMPLATES } from "../domain/templates";
import type { DayOfWeek } from "../domain/models";
import { useAppState } from "../state/AppStateProvider";
import { trackEvent } from "../analytics/analytics";

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

export default function RoutineNewPage() {
  const navigate = useNavigate();
  const { createRoutine } = useAppState();
  const hasTrackedStartRef = useRef(false);

  const [title, setTitle] = useState("");
  const [days, setDays] = useState<DayOfWeek[]>(["MON", "TUE", "WED", "THU", "FRI"]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);

  const canSave = useMemo(() => title.trim().length > 0 && days.length > 0, [title, days.length]);

  useEffect(() => {
    if (hasTrackedStartRef.current) {
      return;
    }
    hasTrackedStartRef.current = true;
    trackEvent("routine_create_start", { source: "routine_new" });
  }, []);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedTemplateKey(null);
    setDays((prev) => (prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]));
  };

  const saveRoutine = () => {
    if (!canSave) {
      return;
    }

    const result = createRoutine({ title, daysOfWeek: days, goalPerDay: 1 });
    if (!result.ok && result.reason === "LIMIT_REACHED") {
      navigate("/paywall?trigger=routine_limit");
      return;
    }

    trackEvent("routine_create_complete", {
      type: selectedTemplateKey ? "template" : "custom",
    });
    navigate("/home");
  };

  return (
    <section className="screen">
      <h1 className="heading">루틴 만들기</h1>
      <p className="muted">템플릿 선택 또는 직접 입력으로 루틴을 추가해요. 무료는 최대 3개까지 가능해요.</p>

      <div className="card">
        <p className="subheading">템플릿</p>
        <div className="chip-grid">
          {ROUTINE_TEMPLATES.map((template) => (
            <button
              key={template.key}
              type="button"
              className="chip-button"
              onClick={() => {
                trackEvent("routine_template_select", { templateKey: template.key });
                setSelectedTemplateKey(template.key);
                setTitle(template.title);
                setDays(template.daysOfWeek);
              }}
            >
              {template.title}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <label className="field-label" htmlFor="routine-title">
          루틴 이름
        </label>
        <input
          id="routine-title"
          className="text-input"
          value={title}
          maxLength={20}
          onChange={(event) => {
            setSelectedTemplateKey(null);
            setTitle(event.target.value);
          }}
          placeholder="예: 운동 30분"
        />
      </div>

      <div className="card">
        <p className="field-label">목표 요일</p>
        <div className="chip-grid">
          {allDays.map((day) => (
            <button
              key={day}
              type="button"
              className={days.includes(day) ? "chip-button active" : "chip-button"}
              onClick={() => toggleDay(day)}
            >
              {dayLabel[day]}
            </button>
          ))}
        </div>
      </div>

      <button className="primary-button full" type="button" disabled={!canSave} onClick={saveRoutine}>
        저장
      </button>
    </section>
  );
}
