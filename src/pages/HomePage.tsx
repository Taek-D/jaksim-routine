import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppStateProvider";
import {
  detectShieldableBreak,
  getRoutineStreak,
  getTodayCheckin,
  getTodayRoutineStatus,
  getTodayTargetRoutines,
} from "../state/selectors";
import { getKstHour, getKstLongDateLabel } from "../utils/date";
import { getGreeting } from "../utils/greeting";
import { getRoutineColor } from "../utils/routineColor";
import NoteModal from "../components/NoteModal";
import WarningToast from "../components/WarningToast";
import StreakShieldPrompt from "../components/StreakShieldPrompt";
import { trackEvent } from "../analytics/analytics";
import { Icon } from "../components/Icon";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
import RoutineCard from "../components/RoutineCard";
import StreakToast from "../components/StreakToast";

interface RoutineActionTarget {
  routineId: string;
  title: string;
  prevStreak?: number;
}

export default function HomePage() {
  const navigate = useNavigate();
  const {
    state,
    isPremiumActive,
    showTrialExpiredBanner,
    showRefundRevokedBanner,
    dismissTrialExpiredBanner,
    dismissRefundRevokedBanner,
    checkinRoutine,
    addNoteToCheckin,
    deleteRoutine,
    applyStreakShield,
    getStreakShieldsRemaining,
  } = useAppState();
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const hasTrackedHomeViewRef = useRef(false);
  const [noteTarget, setNoteTarget] = useState<RoutineActionTarget | null>(null);
  const [skipTarget, setSkipTarget] = useState<RoutineActionTarget | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [inlineMemoId, setInlineMemoId] = useState<string | null>(null);
  const [inlineMemoText, setInlineMemoText] = useState("");
  const inlineMemoTimerRef = useRef<number | null>(null);
  const [shieldPromptDismissed, setShieldPromptDismissed] = useState(false);
  const [streakToast, setStreakToast] = useState<{ routineName: string; streak: number } | null>(null);
  const [justCompletedIds, setJustCompletedIds] = useState<Set<string>>(new Set());
  const todayRoutines = getTodayTargetRoutines(state);
  const archivedCount = state.routines.filter((routine) => routine.archivedAt).length;
  const topStreak = useMemo(
    () => state.routines.reduce(
      (max, routine) => Math.max(max, getRoutineStreak(state, routine.id)),
      0
    ),
    [state]
  );
  const completedCount = todayRoutines.filter(
    (routine) => getTodayRoutineStatus(state, routine.id) === "COMPLETED"
  ).length;
  const totalCount = todayRoutines.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const greeting = getGreeting(getKstHour(), progress, topStreak, totalCount);

  // Trial countdown
  const trialDaysLeft = useMemo(() => {
    if (!isPremiumActive || state.entitlement.lastSku !== "trial" || !state.entitlement.premiumUntil) return null;
    const days = Math.ceil((new Date(state.entitlement.premiumUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : null;
  }, [isPremiumActive, state.entitlement.lastSku, state.entitlement.premiumUntil]);

  // Streak shield detection
  const shieldsRemaining = getStreakShieldsRemaining();
  const shieldCandidate = useMemo(() => {
    if (shieldPromptDismissed) return null;
    if (isPremiumActive && shieldsRemaining <= 0) return null;
    const activeRoutines = state.routines.filter((r) => !r.archivedAt);
    for (const routine of activeRoutines) {
      const result = detectShieldableBreak(state, routine);
      if (result) {
        return { routine, ...result };
      }
    }
    return null;
  }, [shieldPromptDismissed, isPremiumActive, shieldsRemaining, state]);

  const handleUseShield = () => {
    if (!shieldCandidate) return;
    applyStreakShield(shieldCandidate.routine.id, shieldCandidate.missedDate);
    setShieldPromptDismissed(true);
  };

  const enterSelectMode = () => {
    setIsSelectMode(true);
    setSelectedIds(new Set());
  };

  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === todayRoutines.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(todayRoutines.map((r) => r.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    const confirmed = window.confirm(`${selectedIds.size}개 루틴을 삭제할까요? 삭제하면 되돌릴 수 없어요.`);
    if (!confirmed) return;
    for (const id of selectedIds) {
      deleteRoutine(id);
    }
    exitSelectMode();
  };

  useEffect(() => {
    if (hasTrackedHomeViewRef.current) {
      return;
    }
    hasTrackedHomeViewRef.current = true;
    trackEvent("home_view", {
      activeRoutineCount: todayRoutines.length,
      archivedRoutineCount: archivedCount,
    });
  }, [todayRoutines.length, archivedCount]);

  const clearInlineMemoTimer = () => {
    if (inlineMemoTimerRef.current != null) {
      window.clearTimeout(inlineMemoTimerRef.current);
      inlineMemoTimerRef.current = null;
    }
  };

  const startInlineMemo = (routineId: string) => {
    clearInlineMemoTimer();
    setInlineMemoId(routineId);
    setInlineMemoText("");
    inlineMemoTimerRef.current = window.setTimeout(() => {
      setInlineMemoId((prev) => (prev === routineId ? null : prev));
    }, 5000);
  };

  const submitInlineMemo = (routineId: string) => {
    clearInlineMemoTimer();
    if (inlineMemoText.trim()) {
      addNoteToCheckin(routineId, inlineMemoText);
    }
    setInlineMemoId(null);
    setInlineMemoText("");
  };

  const dismissInlineMemo = () => {
    clearInlineMemoTimer();
    setInlineMemoId(null);
    setInlineMemoText("");
  };

  const handleComplete = (routineId: string) => {
    const routine = state.routines.find((r) => r.id === routineId);
    const currentStreak = getRoutineStreak(state, routineId);
    trackEvent("checkin_complete", {
      routineId,
      withNote: false,
    });
    checkinRoutine(routineId, "COMPLETED");
    setJustCompletedIds((prev) => new Set(prev).add(routineId));
    setStreakToast({
      routineName: routine?.title ?? "",
      streak: currentStreak + 1,
    });
    startInlineMemo(routineId);
  };

  const openNoteModal = (routineId: string, title: string) => {
    setNoteTarget({ routineId, title });
    setNoteDraft("");
  };

  const closeNoteModal = () => {
    setNoteTarget(null);
    setNoteDraft("");
  };

  const submitNoteModal = () => {
    if (!noteTarget) {
      return;
    }
    const currentStreak = getRoutineStreak(state, noteTarget.routineId);
    trackEvent("checkin_complete", {
      routineId: noteTarget.routineId,
      withNote: true,
    });
    checkinRoutine(noteTarget.routineId, "COMPLETED", noteDraft);
    setJustCompletedIds((prev) => new Set(prev).add(noteTarget.routineId));
    setStreakToast({
      routineName: noteTarget.title,
      streak: currentStreak + 1,
    });
    closeNoteModal();
  };

  const openSkipWarning = (routineId: string, title: string, prevStreak: number) => {
    setSkipTarget({ routineId, title, prevStreak });
  };

  const dismissSkipWarning = () => {
    setSkipTarget(null);
  };

  const confirmSkip = () => {
    if (!skipTarget) {
      return;
    }
    trackEvent("checkin_skip", {
      routineId: skipTarget.routineId,
      prevStreak: skipTarget.prevStreak,
    });
    checkinRoutine(skipTarget.routineId, "SKIPPED");
    setSkipTarget(null);
  };

  return (
    <>
      <div className="flex flex-col h-full pb-[160px]">
        <main className="flex-1 px-4 flex flex-col gap-6 pt-2">
          {/* Date & Streak */}
          <section className="flex flex-col gap-2 mt-4 px-1">
            <div className="flex items-center justify-between">
              <h1 className="text-[26px] font-bold text-text tracking-tight">{getKstLongDateLabel()}</h1>
              <div className="flex items-center gap-2">
                {topStreak > 0 && !isSelectMode && (
                  <div className="flex items-center gap-1.5 bg-streak-light px-3 py-1.5 rounded-badge border border-orange-100">
                    <Icon name="local_fire_department" size={16} className="text-streak" />
                    <span className="text-[13px] font-bold text-orange-700">최고 {topStreak}일</span>
                  </div>
                )}
                {todayRoutines.length > 0 && (
                  <button
                    className="text-[14px] font-medium text-text-secondary hover:text-text transition-colors px-2 py-1"
                    type="button"
                    onClick={isSelectMode ? exitSelectMode : enterSelectMode}
                  >
                    {isSelectMode ? "취소" : "편집"}
                  </button>
                )}
              </div>
            </div>
            <p className="text-text-secondary text-[15px]">{greeting}</p>
          </section>

          {/* Banner — priority-based, show only the top one */}
          {showRefundRevokedBanner ? (
            <div className="bg-surface rounded-card p-5 shadow-card flex flex-col gap-3">
              <h2 className="text-[16px] font-bold text-text">환불이 확인되어 이용권이 해제됐어요</h2>
              <p className="text-[14px] text-text-secondary">프리미엄 기능을 다시 사용하려면 이용권을 다시 구매해 주세요.</p>
              <div className="flex gap-2">
                <button
                  className="flex-1 h-[44px] rounded-button bg-primary text-white text-[15px] font-semibold active:scale-[0.98] transition-transform"
                  type="button"
                  onClick={() => navigate("/paywall?trigger=refund_revoked")}
                >
                  이용권 다시 구매
                </button>
                <button
                  className="h-[44px] px-4 rounded-button bg-muted text-text-secondary text-[15px] font-medium hover:bg-border transition-colors"
                  type="button"
                  onClick={dismissRefundRevokedBanner}
                >
                  닫기
                </button>
              </div>
            </div>
          ) : showTrialExpiredBanner ? (
            <div className="bg-surface rounded-card p-5 shadow-card flex flex-col gap-3">
              <h2 className="text-[16px] font-bold text-text">무료 체험이 만료됐어요</h2>
              <p className="text-[14px] text-text-secondary">계속 사용하려면 이용권을 구매해 주세요.</p>
              <div className="flex gap-2">
                <button
                  className="flex-1 h-[44px] rounded-button bg-primary text-white text-[15px] font-semibold active:scale-[0.98] transition-transform"
                  type="button"
                  onClick={() => navigate("/paywall?trigger=trial_expired")}
                >
                  이용권 구매
                </button>
                <button
                  className="h-[44px] px-4 rounded-button bg-muted text-text-secondary text-[15px] font-medium hover:bg-border transition-colors"
                  type="button"
                  onClick={dismissTrialExpiredBanner}
                >
                  닫기
                </button>
              </div>
            </div>
          ) : trialDaysLeft != null ? (
            <div className="bg-surface rounded-card p-5 shadow-card flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-premium-light flex items-center justify-center shrink-0">
                <Icon name="timer" size={20} className="text-premium" />
              </div>
              <div className="flex-1">
                <h2 className="text-[15px] font-bold text-text">무료 체험 종료까지 {trialDaysLeft}일 남았어요</h2>
                <p className="text-[13px] text-text-secondary mt-0.5">이용권을 구매하면 끊김 없이 계속할 수 있어요.</p>
              </div>
              <button
                className="text-[13px] font-bold text-accent shrink-0"
                type="button"
                onClick={() => navigate("/paywall?trigger=trial_countdown")}
              >
                보기
              </button>
            </div>
          ) : !isPremiumActive && archivedCount > 0 ? (
            <div className="bg-surface rounded-card p-5 shadow-card flex flex-col gap-3">
              <h2 className="text-[16px] font-bold text-text">숨겨진 루틴 {archivedCount}개</h2>
              <p className="text-[14px] text-text-secondary">
                3개를 초과한 루틴은 숨김 처리됐어요. 이용권을 구매하면 다시 볼 수 있어요.
              </p>
              <button
                className="h-[44px] rounded-button bg-muted text-text-secondary text-[15px] font-medium hover:bg-border transition-colors"
                type="button"
                onClick={() => navigate("/paywall?trigger=archived_limit")}
              >
                이용권 보기
              </button>
            </div>
          ) : null}

          {/* Progress Card */}
          {totalCount > 0 && (
            <section className="bg-surface rounded-card p-6 shadow-card flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[13px] font-medium text-text-tertiary">오늘 달성률</span>
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-[36px] font-bold text-text leading-none">{completedCount}</span>
                    <span className="text-[18px] font-medium text-text-tertiary">/ {totalCount}</span>
                  </div>
                </div>
                <div className={cn(
                  "text-[14px] font-bold px-4 py-1.5 rounded-badge",
                  progress === 100
                    ? "text-emerald-700 bg-accent-light"
                    : progress > 0
                      ? "text-text bg-muted"
                      : "text-text-tertiary bg-muted"
                )}>
                  {progress}%
                </div>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                <motion.div
                  className="bg-primary h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </section>
          )}

          {/* Empty state */}
          {todayRoutines.length === 0 && (
            <div className="mt-6 flex flex-col items-center justify-center py-16 px-8 bg-surface rounded-card shadow-card gap-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                <Icon name="add_task" size={36} className="text-text-tertiary" />
              </div>
              <div className="text-center">
                <h2 className="text-[18px] font-bold text-text mb-1">첫 루틴을 만들어볼까요?</h2>
                <p className="text-[14px] text-text-secondary">루틴을 만들면 오늘 체크인을 바로 시작할 수 있어요.</p>
              </div>
              <button
                className="mt-2 h-[48px] px-8 rounded-button bg-primary text-white text-[15px] font-semibold active:scale-[0.98] transition-transform"
                type="button"
                onClick={() => navigate("/routine/new")}
              >
                루틴 만들기
              </button>
            </div>
          )}

          {/* Routine Cards */}
          {todayRoutines.length > 0 && (
            <section className="flex flex-col gap-3.5">
              {todayRoutines.map((routine) => {
                const todayCheckin = getTodayCheckin(state, routine.id);
                const todayStatus = todayCheckin?.status ?? null;
                const currentStreak = getRoutineStreak(state, routine.id);
                const isCompleted = todayStatus === "COMPLETED";
                const isSkipped = todayStatus === "SKIPPED";
                const note = todayCheckin?.note;
                const color = getRoutineColor(routine.id);
                const canSwipe = !isCompleted && !isSkipped;
                const showInlineMemo = isCompleted && inlineMemoId === routine.id;

                return (
                  <RoutineCard
                    key={routine.id}
                    routineId={routine.id}
                    title={routine.title}
                    isCompleted={isCompleted}
                    isSkipped={isSkipped}
                    justCompleted={justCompletedIds.has(routine.id)}
                    note={note}
                    currentStreak={currentStreak}
                    color={color}
                    canSwipe={canSwipe}
                    showInlineMemo={showInlineMemo}
                    inlineMemoText={inlineMemoText}
                    isSelectMode={isSelectMode}
                    isSelected={selectedIds.has(routine.id)}
                    onToggleSelect={() => toggleSelect(routine.id)}
                    onInlineMemoChange={setInlineMemoText}
                    onInlineMemoSubmit={() => submitInlineMemo(routine.id)}
                    onInlineMemoDismiss={dismissInlineMemo}
                    onComplete={() => handleComplete(routine.id)}
                    onOpenNote={() => openNoteModal(routine.id, routine.title)}
                    onSkip={() => openSkipWarning(routine.id, routine.title, currentStreak)}
                  />
                );
              })}

              {/* Recommendation CTA */}
              <div className="mt-4 flex items-center justify-between p-5 bg-surface rounded-card shadow-card">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
                    <Icon name="add" size={20} className="text-accent" />
                  </div>
                  <p className="text-[14px] text-text-secondary font-medium">새로운 습관을 만들어보세요</p>
                </div>
                <Link
                  to="/routine/new"
                  className="text-accent text-[14px] font-bold flex items-center gap-1"
                >
                  추가 <Icon name="arrow_forward" size={16} />
                </Link>
              </div>
            </section>
          )}
        </main>

        {/* Floating Bottom Bar */}
        <div className="fixed bottom-[76px] w-full max-w-[640px] px-4 pointer-events-none z-40">
          {isSelectMode ? (
            <div className="flex items-center gap-3 pointer-events-auto">
              <button
                className="flex items-center gap-1.5 h-[52px] px-4 rounded-card bg-surface border border-border text-[14px] font-medium text-text-secondary shadow-card active:scale-95 transition-transform shrink-0"
                type="button"
                onClick={toggleSelectAll}
              >
                <Icon
                  name={selectedIds.size === todayRoutines.length ? "check_box" : "check_box_outline_blank"}
                  size={18}
                  className={selectedIds.size === todayRoutines.length ? "text-primary" : "text-text-tertiary"}
                />
                전체 선택
              </button>
              <button
                className={cn(
                  "flex-1 h-[52px] rounded-card text-white text-[16px] font-bold shadow-lg flex items-center justify-center gap-2 transition-all",
                  selectedIds.size > 0
                    ? "bg-danger shadow-danger/20 active:scale-95"
                    : "bg-gray-300 cursor-not-allowed"
                )}
                type="button"
                disabled={selectedIds.size === 0}
                onClick={handleBatchDelete}
              >
                <Icon name="delete" size={20} />
                {selectedIds.size}개 삭제
              </button>
            </div>
          ) : (
            <div className="flex gap-3 pointer-events-auto">
              <button
                className="flex-1 h-[52px] rounded-card bg-primary text-white text-[16px] font-bold shadow-lg shadow-gray-900/10 flex items-center justify-center gap-2 active:scale-95 transition-transform"
                type="button"
                onClick={() => navigate("/routine/new")}
              >
                <Icon name="add" size={20} />
                루틴 추가
              </button>
              <button
                className="flex-1 h-[52px] rounded-card bg-surface border border-border text-text-secondary text-[16px] font-bold shadow-card flex items-center justify-center gap-2 active:scale-95 transition-transform"
                type="button"
                onClick={() => navigate("/report")}
              >
                <Icon name="bar_chart" size={20} />
                주간 리포트
              </button>
            </div>
          )}
        </div>
      </div>

      <NoteModal
        open={noteTarget != null}
        title="완료 메모 남기기"
        description={noteTarget ? `${noteTarget.title} 기록에 메모를 추가해요.` : ""}
        note={noteDraft}
        onChangeNote={setNoteDraft}
        onCancel={closeNoteModal}
        onConfirm={submitNoteModal}
        confirmLabel="완료로 저장"
      />

      {shieldCandidate && (
        <StreakShieldPrompt
          routineTitle={shieldCandidate.routine.title}
          restoredStreak={shieldCandidate.restoredStreak}
          isPremium={isPremiumActive}
          shieldsRemaining={shieldsRemaining}
          onUseShield={handleUseShield}
          onDismiss={() => setShieldPromptDismissed(true)}
        />
      )}

      <WarningToast
        open={skipTarget != null}
        message={
          skipTarget
            ? `${skipTarget.title} 루틴을 건너뜀으로 기록하면 스트릭이 초기화돼요.`
            : ""
        }
        onDismiss={dismissSkipWarning}
        onAction={confirmSkip}
        actionLabel="건너뜀 기록"
      />

      <StreakToast
        open={streakToast != null}
        routineName={streakToast?.routineName ?? ""}
        streak={streakToast?.streak ?? 0}
        onDismiss={() => setStreakToast(null)}
      />
    </>
  );
}
