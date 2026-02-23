import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppStateProvider";
import {
  getRoutineStreak,
  getTodayRoutineStatus,
  getTodayTargetRoutines,
} from "../state/selectors";
import { getKstLongDateLabel } from "../utils/date";
import NoteModal from "../components/NoteModal";
import WarningToast from "../components/WarningToast";
import { trackEvent } from "../analytics/analytics";
import { Icon } from "../components/Icon";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

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
  } = useAppState();
  const hasTrackedHomeViewRef = useRef(false);
  const [noteTarget, setNoteTarget] = useState<RoutineActionTarget | null>(null);
  const [skipTarget, setSkipTarget] = useState<RoutineActionTarget | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const todayRoutines = getTodayTargetRoutines(state);
  const archivedCount = state.routines.filter((routine) => routine.archivedAt).length;
  const topStreak = state.routines.reduce(
    (max, routine) => Math.max(max, getRoutineStreak(state, routine.id)),
    0
  );
  const completedCount = todayRoutines.filter(
    (routine) => getTodayRoutineStatus(state, routine.id) === "COMPLETED"
  ).length;
  const totalCount = todayRoutines.length;
  const progress = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

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
    trackEvent("checkin_complete", {
      routineId: noteTarget.routineId,
      withNote: true,
    });
    checkinRoutine(noteTarget.routineId, "COMPLETED", noteDraft);
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
      <div className="flex flex-col h-full pb-[140px]">
        <main className="flex-1 px-4 flex flex-col gap-5 pt-2">
          {/* Date & Streak */}
          <section className="flex flex-col gap-1 mt-2 px-1">
            <div className="flex items-center justify-between">
              <h1 className="text-[22px] font-bold text-[#101828]">{getKstLongDateLabel()}</h1>
              {topStreak > 0 && (
                <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100">
                  <Icon name="local_fire_department" size={16} className="text-orange-600" />
                  <span className="text-[13px] font-bold text-orange-700">최고 {topStreak}일</span>
                </div>
              )}
            </div>
            <p className="text-[#475467] text-[15px]">오늘도 꾸준함이 답이에요.</p>
          </section>

          {/* Banners */}
          {showRefundRevokedBanner && (
            <div className="bg-white rounded-[20px] p-5 shadow-sm flex flex-col gap-3">
              <h2 className="text-[16px] font-bold text-[#101828]">환불이 확인되어 이용권이 해제됐어요</h2>
              <p className="text-[14px] text-gray-500">프리미엄 기능을 다시 사용하려면 이용권을 다시 구매해 주세요.</p>
              <div className="flex gap-2">
                <button
                  className="flex-1 h-[44px] rounded-xl bg-[#111827] text-white text-[15px] font-semibold active:scale-[0.98] transition-transform"
                  type="button"
                  onClick={() => navigate("/paywall?trigger=refund_revoked")}
                >
                  이용권 다시 구매
                </button>
                <button
                  className="h-[44px] px-4 rounded-xl bg-[#f2f4f7] text-[#344054] text-[15px] font-medium hover:bg-gray-200 transition-colors"
                  type="button"
                  onClick={dismissRefundRevokedBanner}
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {showTrialExpiredBanner && (
            <div className="bg-white rounded-[20px] p-5 shadow-sm flex flex-col gap-3">
              <h2 className="text-[16px] font-bold text-[#101828]">무료 체험이 만료됐어요</h2>
              <p className="text-[14px] text-gray-500">계속 사용하려면 이용권을 구매해 주세요.</p>
              <div className="flex gap-2">
                <button
                  className="flex-1 h-[44px] rounded-xl bg-[#111827] text-white text-[15px] font-semibold active:scale-[0.98] transition-transform"
                  type="button"
                  onClick={() => navigate("/paywall?trigger=trial_expired")}
                >
                  이용권 구매
                </button>
                <button
                  className="h-[44px] px-4 rounded-xl bg-[#f2f4f7] text-[#344054] text-[15px] font-medium hover:bg-gray-200 transition-colors"
                  type="button"
                  onClick={dismissTrialExpiredBanner}
                >
                  닫기
                </button>
              </div>
            </div>
          )}

          {!isPremiumActive && archivedCount > 0 && (
            <div className="bg-white rounded-[20px] p-5 shadow-sm flex flex-col gap-3">
              <h2 className="text-[16px] font-bold text-[#101828]">숨겨진 루틴 {archivedCount}개</h2>
              <p className="text-[14px] text-gray-500">
                3개를 초과한 루틴은 숨김 처리됐어요. 이용권을 구매하면 다시 볼 수 있어요.
              </p>
              <button
                className="h-[44px] rounded-xl bg-[#f2f4f7] text-[#344054] text-[15px] font-medium hover:bg-gray-200 transition-colors"
                type="button"
                onClick={() => navigate("/paywall?trigger=archived_limit")}
              >
                이용권 보기
              </button>
            </div>
          )}

          {/* Progress Card */}
          {totalCount > 0 && (
            <section className="bg-white rounded-[20px] p-5 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-[13px] font-medium text-gray-500">오늘 완료</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-[24px] font-bold text-[#101828]">{completedCount}</span>
                    <span className="text-[16px] font-medium text-gray-400">/ {totalCount}</span>
                  </div>
                </div>
                <div className="text-[13px] font-semibold text-gray-800 bg-gray-100 px-3 py-1 rounded-full">
                  {progress}% 달성
                </div>
              </div>
              <div className="w-full bg-[#f2f4f7] rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-[#111827] h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </section>
          )}

          {/* Empty state */}
          {todayRoutines.length === 0 && (
            <div className="mt-4 flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-200 rounded-2xl gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                <Icon name="add_task" size={32} className="text-gray-400" />
              </div>
              <h2 className="text-[16px] font-bold text-[#101828]">첫 루틴을 만들어볼까요?</h2>
              <p className="text-[14px] text-gray-500 text-center">루틴을 만들면 오늘 체크인을 바로 시작할 수 있어요.</p>
              <button
                className="mt-1 h-[44px] px-6 rounded-xl bg-[#111827] text-white text-[15px] font-semibold active:scale-[0.98] transition-transform"
                type="button"
                onClick={() => navigate("/routine/new")}
              >
                루틴 만들기
              </button>
            </div>
          )}

          {/* Routine Cards */}
          {todayRoutines.length > 0 && (
            <section className="flex flex-col gap-3">
              {todayRoutines.map((routine) => {
                const todayStatus = getTodayRoutineStatus(state, routine.id);
                const currentStreak = getRoutineStreak(state, routine.id);
                const isCompleted = todayStatus === "COMPLETED";

                return (
                  <motion.article
                    key={routine.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "bg-white rounded-[20px] p-5 shadow-sm flex flex-col gap-4 relative overflow-hidden transition-all",
                      isCompleted && "bg-gray-50"
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
                          ) : todayStatus === "SKIPPED" ? (
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
                        <Link
                          to={`/routine/${routine.id}`}
                          className={cn(
                            "text-[18px] font-bold transition-colors hover:underline decoration-2 underline-offset-4",
                            isCompleted
                              ? "text-gray-400 line-through decoration-gray-400 decoration-2"
                              : "text-[#101828]"
                          )}
                        >
                          {routine.title}
                        </Link>
                      </div>
                      {!isCompleted && todayStatus !== "SKIPPED" && (
                        <Link to={`/routine/${routine.id}`} className="text-gray-400 hover:text-gray-600">
                          <Icon name="more_horiz" />
                        </Link>
                      )}
                    </div>

                    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 z-10">
                      {isCompleted || todayStatus === "SKIPPED" ? (
                        <button
                          className="col-span-3 h-[42px] rounded-xl bg-gray-100 text-gray-400 text-[14px] font-medium flex items-center justify-center gap-1.5 hover:bg-gray-200 transition-colors"
                          type="button"
                          disabled
                        >
                          {isCompleted ? "잘했어요!" : "건너뜀 처리됨"}
                        </button>
                      ) : (
                        <>
                          <button
                            className="h-[46px] rounded-xl bg-[#111827] text-white text-[15px] font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center shadow-sm active:scale-95"
                            type="button"
                            onClick={() => {
                              trackEvent("checkin_complete", {
                                routineId: routine.id,
                                withNote: false,
                              });
                              checkinRoutine(routine.id, "COMPLETED");
                            }}
                          >
                            완료
                          </button>
                          <button
                            className="h-[46px] rounded-xl bg-[#f2f4f7] text-[#344054] text-[15px] font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1 active:scale-95"
                            type="button"
                            onClick={() => openNoteModal(routine.id, routine.title)}
                          >
                            <Icon name="edit_note" size={18} />
                            메모
                          </button>
                          <button
                            className="h-[46px] w-[46px] rounded-xl bg-white border border-gray-200 text-[#475467] hover:bg-gray-50 transition-colors flex items-center justify-center active:scale-95"
                            type="button"
                            onClick={() => openSkipWarning(routine.id, routine.title, currentStreak)}
                          >
                            <Icon name="fast_forward" size={20} />
                          </button>
                        </>
                      )}
                    </div>
                  </motion.article>
                );
              })}

              {/* Recommendation CTA */}
              <div className="mt-4 flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-2xl gap-2">
                <p className="text-[14px] text-gray-500 font-medium">새로운 습관을 만들어보세요</p>
                <Link
                  to="/routine/new"
                  className="text-[#111827] text-[14px] font-bold flex items-center gap-1 hover:underline decoration-2 underline-offset-4"
                >
                  추천 루틴 보기 <Icon name="arrow_forward" size={16} />
                </Link>
              </div>
            </section>
          )}
        </main>

        {/* Floating Bottom Bar */}
        <div className="fixed bottom-[80px] w-full max-w-[640px] px-4 pointer-events-none z-40">
          <div className="flex gap-3 pointer-events-auto">
            <button
              className="flex-1 h-[52px] rounded-2xl bg-[#111827] text-white text-[16px] font-bold shadow-lg shadow-gray-900/10 flex items-center justify-center gap-2 active:scale-95 transition-transform"
              type="button"
              onClick={() => navigate("/routine/new")}
            >
              <Icon name="add" size={20} />
              루틴 추가
            </button>
            <button
              className="flex-1 h-[52px] rounded-2xl bg-white border border-gray-200 text-[#344054] text-[16px] font-bold shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
              type="button"
              onClick={() => navigate("/report")}
            >
              <Icon name="bar_chart" size={20} />
              주간 리포트
            </button>
          </div>
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
    </>
  );
}
