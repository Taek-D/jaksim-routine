import { useEffect, useMemo, useRef, useState } from "react";
import { buildWeeklyReportSummary } from "../domain/progress";
import { useAppState } from "../state/AppStateProvider";
import { trackEvent } from "../analytics/analytics";
import { Icon } from "../components/Icon";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const BADGE_DISPLAY: Record<string, { icon: string; label: string; color: string }> = {
  FIRST_CHECKIN: { icon: "🏅", label: "첫 체크인", color: "bg-yellow-50 border-yellow-200" },
  STREAK_3: { icon: "🔥", label: "3일 연속", color: "bg-orange-50 border-orange-200" },
  STREAK_7: { icon: "⚡", label: "7일 연속", color: "bg-blue-50 border-blue-200" },
  STREAK_14: { icon: "🏆", label: "14일 완주", color: "bg-purple-50 border-purple-200" },
  COMEBACK: { icon: "💪", label: "다시 시작", color: "bg-green-50 border-green-200" },
};

export default function ReportPage() {
  const { state } = useAppState();
  const hasTrackedReportViewRef = useRef(false);
  const lastWeekOffsetRef = useRef(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const summary = useMemo(() => buildWeeklyReportSummary(state, weekOffset), [state, weekOffset]);

  useEffect(() => {
    if (hasTrackedReportViewRef.current) {
      return;
    }
    hasTrackedReportViewRef.current = true;
    trackEvent("report_view", {
      week: summary.weekLabel,
      completionRate: summary.completionRate,
    });
  }, [summary.weekLabel, summary.completionRate]);

  useEffect(() => {
    if (lastWeekOffsetRef.current === weekOffset) {
      return;
    }

    trackEvent("report_week_change", {
      fromWeekOffset: lastWeekOffsetRef.current,
      toWeekOffset: weekOffset,
      week: summary.weekLabel,
    });
    lastWeekOffsetRef.current = weekOffset;
  }, [weekOffset, summary.weekLabel]);

  return (
    <div className="flex flex-col h-full pb-28">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#f4f6f8]/90 backdrop-blur-md px-4 py-3 flex items-center border-b border-gray-200/50">
        <h1 className="text-[20px] font-bold text-[#101828]">주간 리포트</h1>
      </header>

      <main className="p-4 flex flex-col gap-4">
        {/* Date Navigator */}
        <div className="flex items-center justify-between py-2">
          <button
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
            type="button"
            onClick={() => setWeekOffset((prev) => prev - 1)}
          >
            <Icon name="arrow_back_ios_new" size={20} className="text-gray-500" />
          </button>
          <span className="text-[15px] font-semibold text-gray-700">{summary.weekLabel}</span>
          <button
            className={cn(
              "p-1 rounded-full hover:bg-gray-200 transition-colors",
              weekOffset === 0 && "opacity-30 cursor-not-allowed"
            )}
            type="button"
            disabled={weekOffset === 0}
            onClick={() => setWeekOffset((prev) => Math.min(prev + 1, 0))}
          >
            <Icon name="arrow_forward_ios" size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Overall Stats Card */}
        <section className="bg-white rounded-[20px] p-5 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-[13px] font-medium text-gray-500 mb-1">전체 달성률</div>
              <div className="flex items-baseline gap-2">
                <span className="text-[34px] font-bold text-[#101828] leading-none">
                  {summary.completionRate}%
                </span>
                <span className={cn(
                  "text-[13px] font-semibold px-1.5 py-0.5 rounded",
                  summary.deltaRate >= 0 ? "text-green-700 bg-green-50" : "text-red-700 bg-red-50"
                )}>
                  {summary.deltaRate >= 0 ? "+" : ""}{summary.deltaRate}%
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Icon name="monitoring" />
            </div>
          </div>

          <div className="p-3 bg-[#f9fafb] rounded-xl border border-gray-100">
            <p className="text-[14px] font-medium text-[#101828]">{summary.comment}</p>
            <p className="text-[12px] text-gray-500 mt-1">
              지난주 {summary.previousCompletionRate}% 대비 {summary.deltaRate}%p
            </p>
          </div>

          <div className="flex justify-between items-center text-[13px] text-gray-500 border-t border-gray-100 pt-3 mt-1">
            <span>최고 요일</span>
            <span className="font-semibold text-[#101828]">{summary.bestWeekdayLabel}</span>
          </div>
        </section>

        {/* Routine Breakdown */}
        <section className="flex flex-col gap-3">
          <h2 className="text-[16px] font-bold text-[#101828] px-1 mt-2">루틴별 현황</h2>
          {summary.routines.length === 0 && (
            <div className="bg-white rounded-[20px] p-5 shadow-sm">
              <p className="text-[14px] text-gray-400">생성된 루틴이 없어요.</p>
            </div>
          )}
          {summary.routines.map((routine) => (
            <div key={routine.routineId} className="bg-white rounded-[20px] p-4 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <Icon name="fitness_center" size={20} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-semibold text-[#101828]">{routine.title}</h3>
                    <p className="text-[12px] text-gray-500">주 {routine.target}회 목표</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[14px] font-bold text-[#101828]">{routine.completionRate}%</span>
                  <span className="text-[11px] text-gray-500">
                    {routine.completed}/{routine.target} 완료
                  </span>
                </div>
              </div>
              <div className="w-full bg-[#f2f4f7] rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-orange-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${routine.completionRate}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              {routine.streak > 0 && (
                <div className="flex gap-1 mt-1">
                  <span className="text-[11px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Icon name="local_fire_department" size={12} />
                    {routine.streak}일 연속
                  </span>
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Badges */}
        <section className="mt-2">
          <div className="flex justify-between items-center px-1 mb-3">
            <h2 className="text-[16px] font-bold text-[#101828]">획득 배지</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(BADGE_DISPLAY).map(([type, display]) => {
              const earned = state.badges.find((b) => b.badgeType === type);
              return (
                <div
                  key={type}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 bg-white rounded-xl border border-gray-200 shadow-sm transition-all",
                    !earned && "opacity-50 grayscale"
                  )}
                >
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full border flex items-center justify-center text-[24px]",
                      earned ? display.color : "bg-gray-50 border-gray-200"
                    )}
                  >
                    {display.icon}
                  </div>
                  <span className="text-[12px] font-semibold text-[#101828] text-center">
                    {display.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
