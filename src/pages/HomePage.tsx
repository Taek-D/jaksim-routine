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
      <section className="screen">
        <h1 className="heading">오늘 체크인</h1>
        <p className="muted">{getKstLongDateLabel()}</p>
        <p className="muted">현재 최고 스트릭 {topStreak}일</p>

        {showRefundRevokedBanner && (
          <div className="card">
            <h2 className="subheading">환불이 확인되어 이용권이 해제됐어요</h2>
            <p className="muted">프리미엄 기능을 다시 사용하려면 이용권을 다시 구매해 주세요.</p>
            <div className="button-row">
              <button
                className="primary-button"
                type="button"
                onClick={() => navigate("/paywall?trigger=refund_revoked")}
              >
                이용권 다시 구매
              </button>
              <button className="secondary-button" type="button" onClick={dismissRefundRevokedBanner}>
                닫기
              </button>
            </div>
          </div>
        )}

        {showTrialExpiredBanner && (
          <div className="card">
            <h2 className="subheading">무료 체험이 만료됐어요</h2>
            <p className="muted">계속 사용하려면 이용권을 구매해 주세요.</p>
            <div className="button-row">
              <button
                className="primary-button"
                type="button"
                onClick={() => navigate("/paywall?trigger=trial_expired")}
              >
                이용권 구매
              </button>
              <button className="secondary-button" type="button" onClick={dismissTrialExpiredBanner}>
                닫기
              </button>
            </div>
          </div>
        )}

        {!isPremiumActive && archivedCount > 0 && (
          <div className="card">
            <h2 className="subheading">숨겨진 루틴 {archivedCount}개</h2>
            <p className="muted">
              3개를 초과한 루틴은 숨김 처리됐어요. 이용권을 구매하면 다시 볼 수 있어요.
            </p>
            <button
              className="secondary-button"
              type="button"
              onClick={() => navigate("/paywall?trigger=archived_limit")}
            >
              이용권 보기
            </button>
          </div>
        )}

        {todayRoutines.length === 0 && (
          <div className="card">
            <h2 className="subheading">첫 루틴을 만들어볼까요?</h2>
            <p className="muted">루틴을 만들면 오늘 체크인을 바로 시작할 수 있어요.</p>
            <button className="primary-button" type="button" onClick={() => navigate("/routine/new")}>
              루틴 만들기
            </button>
          </div>
        )}

        {todayRoutines.length > 0 && (
          <div className="list">
            {todayRoutines.map((routine) => {
              const todayStatus = getTodayRoutineStatus(state, routine.id);
              const currentStreak = getRoutineStreak(state, routine.id);
              return (
                <article className="card" key={routine.id}>
                  <div className="row between">
                    <Link className="link-title" to={`/routine/${routine.id}`}>
                      {routine.title}
                    </Link>
                    <span className="status-chip">{todayStatus ?? "미체크"}</span>
                  </div>
                  <p className="muted">현재 스트릭 {currentStreak}일</p>

                  <div className="button-row">
                    <button
                      className="primary-button"
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
                      className="secondary-button"
                      type="button"
                      onClick={() => openNoteModal(routine.id, routine.title)}
                    >
                      완료+메모
                    </button>
                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() => openSkipWarning(routine.id, routine.title, currentStreak)}
                    >
                      건너뜀
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p className="muted">
          오늘 완료 {completedCount} / {todayRoutines.length}
        </p>

        <div className="button-row sticky-actions">
          <button className="secondary-button" type="button" onClick={() => navigate("/routine/new")}>
            + 루틴 추가
          </button>
          <button className="secondary-button" type="button" onClick={() => navigate("/report")}>
            주간 리포트
          </button>
        </div>
      </section>

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
