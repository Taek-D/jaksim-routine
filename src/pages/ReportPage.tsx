import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  buildHeatmapData,
  buildMonthlyTrend,
  buildWeeklyReportSummary,
  getRecentNotes,
} from "../domain/progress";
import { useAppState } from "../state/AppStateProvider";
import { trackEvent } from "../analytics/analytics";
import { Icon } from "../components/Icon";
import HeatmapGrid from "../components/HeatmapGrid";
import { getRoutineColor, getRoutineIcon } from "../utils/routineColor";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const BADGE_DISPLAY: Record<string, { icon: string; label: string; color: string }> = {
  FIRST_CHECKIN: { icon: "🏅", label: "첫 체크인", color: "bg-yellow-50 border-yellow-200" },
  STREAK_3: { icon: "🔥", label: "3일 연속", color: "bg-orange-50 border-orange-200" },
  STREAK_7: { icon: "⚡", label: "7일 연속", color: "bg-blue-50 border-blue-200" },
  STREAK_14: { icon: "🏆", label: "14일 완주", color: "bg-purple-50 border-purple-200" },
  COMEBACK: { icon: "💪", label: "다시 시작", color: "bg-green-50 border-green-200" },
};

const FREE_NOTES_LIMIT = 3;

function PremiumBlurOverlay({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[20px] backdrop-blur-[6px] bg-white/60">
      <Icon name="lock" size={28} className="text-gray-400 mb-2" />
      <p className="text-[13px] font-semibold text-gray-600 mb-3">
        프리미엄으로 내 기록 한눈에 보기
      </p>
      <button
        type="button"
        className="px-4 py-2 bg-[#111827] text-white text-[13px] font-semibold rounded-xl active:scale-[0.97] transition-transform"
        onClick={onNavigate}
      >
        프리미엄 시작하기
      </button>
    </div>
  );
}

export default function ReportPage() {
  const { state, isPremiumActive: _isPremiumActive } = useAppState();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPremiumActive = import.meta.env.DEV && searchParams.get("free") === "1" ? false : _isPremiumActive;
  const hasTrackedReportViewRef = useRef(false);
  const lastWeekOffsetRef = useRef(0);
  const [weekOffset, setWeekOffset] = useState(0);
  const summary = useMemo(() => buildWeeklyReportSummary(state, weekOffset), [state, weekOffset]);
  const heatmapCells = useMemo(() => buildHeatmapData(state, 30), [state]);
  const trendData = useMemo(() => buildMonthlyTrend(state, 4), [state]);
  const recentNotes = useMemo(() => getRecentNotes(state, 20), [state]);

  const goToPaywall = () => navigate("/paywall?trigger=report_premium");

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

  const maxTrendRate = Math.max(...trendData.map((p) => p.completionRate), 1);
  const visibleNotes = isPremiumActive ? recentNotes : recentNotes.slice(0, FREE_NOTES_LIMIT);

  return (
    <div className="flex flex-col h-full pb-28">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#f4f6f8]/90 backdrop-blur-md px-4 py-3 flex items-center border-b border-gray-200/50">
        <h1 className="text-[20px] font-bold text-[#101828]">리포트</h1>
      </header>

      <main className="p-4 flex flex-col gap-4">
        {/* Heatmap (30-day) */}
        <section className="bg-white rounded-[20px] p-5 shadow-sm relative overflow-hidden">
          <h2 className="text-[16px] font-bold text-[#101828] mb-3">30일 체크인 히트맵</h2>
          <div className="flex justify-center overflow-x-auto">
            <HeatmapGrid cells={heatmapCells} />
          </div>
          <div className="flex items-center justify-end gap-1 mt-3">
            <span className="text-[10px] text-gray-400 mr-1">적음</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={cn(
                  "w-[10px] h-[10px] rounded-[2px]",
                  level === 0 && "bg-gray-100",
                  level === 1 && "bg-green-200",
                  level === 2 && "bg-green-400",
                  level === 3 && "bg-green-500",
                  level === 4 && "bg-green-700"
                )}
              />
            ))}
            <span className="text-[10px] text-gray-400 ml-1">많음</span>
          </div>
          {!isPremiumActive && <PremiumBlurOverlay onNavigate={goToPaywall} />}
        </section>

        {/* Monthly Trend */}
        <section className="bg-white rounded-[20px] p-5 shadow-sm relative overflow-hidden">
          <h2 className="text-[16px] font-bold text-[#101828] mb-4">주간 달성률 추이</h2>
          <div className="flex items-end gap-2 h-[120px]">
            {trendData.map((point) => (
              <div key={point.weekLabel} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[11px] font-semibold text-[#101828]">
                  {point.completionRate}%
                </span>
                <div className="w-full flex justify-center">
                  <motion.div
                    className="w-8 rounded-t-md bg-blue-400"
                    initial={{ height: 0 }}
                    animate={{
                      height: `${Math.max((point.completionRate / maxTrendRate) * 80, 4)}px`,
                    }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
                <span className="text-[9px] text-gray-400 text-center leading-tight truncate w-full">
                  {point.weekLabel.split("~")[0].trim()}
                </span>
              </div>
            ))}
          </div>
          {!isPremiumActive && <PremiumBlurOverlay onNavigate={goToPaywall} />}
        </section>

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
          {summary.routines.map((routine) => {
            const color = getRoutineColor(routine.routineId);
            return (
            <div key={routine.routineId} className="bg-white rounded-[20px] p-4 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", color.iconBg, color.iconText)}>
                    <Icon name={getRoutineIcon(routine.title, routine.routineId)} size={20} />
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
                  className={cn(color.progressBar, "h-full rounded-full")}
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
            );
          })}
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

        {/* Memo History Timeline */}
        <section className="mt-2">
          <h2 className="text-[16px] font-bold text-[#101828] px-1 mb-3">나의 기록 일지</h2>
          {recentNotes.length === 0 ? (
            <div className="bg-white rounded-[20px] p-5 shadow-sm">
              <p className="text-[14px] text-gray-400">아직 작성한 메모가 없어요.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {visibleNotes.map((entry, i) => (
                <div
                  key={`${entry.date}-${i}`}
                  className="bg-white rounded-[16px] p-4 shadow-sm border-l-4 border-green-400"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[12px] font-semibold text-gray-500">{entry.date}</span>
                    <span className="text-[11px] text-gray-400">|</span>
                    <span className="text-[12px] font-medium text-[#101828]">{entry.routineTitle}</span>
                  </div>
                  <p className="text-[14px] text-gray-700 leading-relaxed">{entry.note}</p>
                </div>
              ))}
              {!isPremiumActive && recentNotes.length > FREE_NOTES_LIMIT && (
                <button
                  type="button"
                  className="bg-white rounded-[16px] p-4 shadow-sm border border-dashed border-gray-300 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                  onClick={goToPaywall}
                >
                  <Icon name="lock" size={16} className="text-gray-400" />
                  <span className="text-[13px] font-semibold text-gray-500">더 보기</span>
                </button>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
