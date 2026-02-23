import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ROUTINE_TEMPLATES } from "../domain/templates";
import type { DayOfWeek } from "../domain/models";
import { useAppState } from "../state/AppStateProvider";
import { trackEvent } from "../analytics/analytics";
import { Icon } from "../components/Icon";
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 h-[56px] flex items-center justify-between border-b border-gray-100">
        <Link to="/home" className="w-10 h-10 flex items-center justify-start text-gray-600">
          <Icon name="arrow_back" size={24} />
        </Link>
        <h1 className="text-[17px] font-bold text-[#101828]">새 루틴 만들기</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 px-5 pt-6 pb-24 overflow-y-auto">
        {/* Name Input */}
        <section className="mb-10">
          <label className="block text-[15px] font-bold text-[#101828] mb-3">
            어떤 루틴을 시작할까요?
          </label>
          <input
            type="text"
            value={title}
            onChange={(event) => {
              setSelectedTemplateKey(null);
              setTitle(event.target.value);
            }}
            placeholder="루틴 이름을 입력해주세요"
            className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-[16px] text-[#101828] outline-none focus:border-[#111827] focus:ring-1 focus:ring-[#111827] transition-all placeholder:text-gray-400"
            maxLength={20}
          />
          <p className="mt-2 text-[13px] text-gray-500 text-right">{title.length}/20</p>
        </section>

        {/* Recommendations */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-[15px] font-bold text-[#101828]">추천 루틴</label>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {ROUTINE_TEMPLATES.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => {
                  trackEvent("routine_template_select", { templateKey: template.key });
                  setSelectedTemplateKey(template.key);
                  setTitle(template.title);
                  setDays(template.daysOfWeek);
                }}
                className={cn(
                  "px-4 py-2.5 rounded-2xl text-[15px] font-medium transition-all",
                  selectedTemplateKey === template.key
                    ? "bg-[#111827] text-white font-semibold"
                    : "bg-[#f2f4f7] text-[#344054] hover:bg-gray-200"
                )}
              >
                {template.title}
              </button>
            ))}
          </div>
        </section>

        {/* Day Selection */}
        <section className="mb-6">
          <label className="block text-[15px] font-bold text-[#101828] mb-4">실천할 요일</label>
          <div className="flex justify-between items-center px-1">
            {allDays.map((day) => {
              const isSelected = days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center text-[14px] font-medium transition-all",
                    isSelected
                      ? "bg-[#111827] text-white font-semibold shadow-md shadow-gray-900/10"
                      : "bg-[#f2f4f7] text-[#344054] hover:bg-gray-200"
                  )}
                >
                  {dayLabel[day]}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-[14px] text-gray-500 text-center">
            매주 <span className="text-[#101828] font-semibold">{days.length}일</span> 실천해요
          </p>
        </section>
      </main>

      {/* Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 max-w-[640px] mx-auto pb-[env(safe-area-inset-bottom)]">
        <button
          type="button"
          onClick={saveRoutine}
          disabled={!canSave}
          className="w-full h-[52px] rounded-2xl bg-[#111827] text-white text-[16px] font-bold shadow-sm disabled:bg-gray-300 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center"
        >
          저장하기
        </button>
      </div>
    </div>
  );
}
