import { useEffect, useMemo, useRef, useState } from "react";
import { buildWeeklyReportSummary } from "../domain/progress";
import { useAppState } from "../state/AppStateProvider";
import { trackEvent } from "../analytics/analytics";

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
    <section className="screen">
      <h1 className="heading">주간 리포트</h1>

      <div className="card">
        <div className="row between">
          <button className="secondary-button" type="button" onClick={() => setWeekOffset((prev) => prev - 1)}>
            이전 주
          </button>
          <p className="muted">{summary.weekLabel} (KST)</p>
          <button
            className="secondary-button"
            type="button"
            disabled={weekOffset === 0}
            onClick={() => setWeekOffset((prev) => Math.min(prev + 1, 0))}
          >
            다음 주
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="subheading">완료율</h2>
        <p className="metric">{summary.completionRate}%</p>
        <p className="muted">지난주 {summary.previousCompletionRate}% 대비 {summary.deltaRate}%p</p>
        <p className="muted">{summary.comment}</p>
        <p className="muted">이번 주 최고 요일: {summary.bestWeekdayLabel}</p>
      </div>

      <div className="card">
        <h2 className="subheading">루틴별 달성률</h2>
        {summary.routines.length === 0 && <p className="muted">생성된 루틴이 없어요.</p>}
        {summary.routines.length > 0 && (
          <ul className="record-list">
            {summary.routines.map((routine) => (
              <li key={routine.routineId}>
                {routine.title} · {routine.completed}/{routine.target} · {routine.completionRate}% · 스트릭 {routine.streak}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card">
        <h2 className="subheading">배지 현황</h2>
        {state.badges.length === 0 && <p className="muted">아직 획득한 배지가 없어요.</p>}
        {state.badges.length > 0 && (
          <ul className="record-list">
            {state.badges.map((badge) => (
              <li key={`${badge.badgeType}-${badge.earnedAt}`}>
                {badge.badgeType} · {badge.earnedAt}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
