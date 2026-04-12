import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppState } from "../state/AppStateProvider";
import { getRoutineRecentCheckins } from "../domain/progress";
import { getRoutineStreak } from "../state/selectors";
import NoteModal from "../components/NoteModal";
import ConfirmDialog from "../components/ConfirmDialog";
import RoutineNotFound from "../components/RoutineNotFound";
import { trackEvent } from "../analytics/analytics";
import { Icon } from "../components/Icon";
import { cn } from "@/lib/utils";

export default function RoutineDetailPage() {
  const navigate = useNavigate();
  const { routineId = "" } = useParams();
  const { state, restartRoutine, checkinRoutine } = useAppState();
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [restartConfirmOpen, setRestartConfirmOpen] = useState(false);
  const hasTrackedViewRef = useRef(false);

  const routine = state.routines.find((item) => item.id === routineId);
  const routineCheckins = getRoutineRecentCheckins(state, routineId);

  useEffect(() => {
    if (!routine || hasTrackedViewRef.current) {
      return;
    }
    hasTrackedViewRef.current = true;
    trackEvent("routine_detail_view", { routineId: routine.id });
  }, [routine]);

  if (!routine) {
    return <RoutineNotFound />;
  }

  const openNoteModal = () => {
    setNoteDraft("");
    setNoteModalOpen(true);
  };

  const closeNoteModal = () => {
    setNoteModalOpen(false);
    setNoteDraft("");
  };

  const submitNoteModal = () => {
    trackEvent("checkin_complete", {
      routineId: routine.id,
      withNote: true,
      source: "routine_detail",
    });
    checkinRoutine(routine.id, "COMPLETED", noteDraft);
    closeNoteModal();
  };

  const streak = getRoutineStreak(state, routine.id);

  return (
    <>
      <div className="flex flex-col h-full bg-background">
        <main className="flex-1 p-4 pt-6 overflow-y-auto flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h1 className="text-[24px] font-bold text-text tracking-tight">루틴 상세</h1>
            <Link
              to={`/routine/${routine.id}/edit`}
              className="w-10 h-10 flex items-center justify-center rounded-full text-text-secondary hover:bg-muted active:bg-border transition-colors"
              aria-label="편집"
            >
              <Icon name="edit" size={22} />
            </Link>
          </div>

          {/* Routine Info Card */}
          <section className="bg-surface rounded-card p-5 shadow-card flex flex-col gap-3">
            <h2 className="text-[20px] font-bold text-text">{routine.title}</h2>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-text-secondary">
                목표 요일: {routine.daysOfWeek.join(", ")}
              </span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-streak-light px-3 py-1.5 rounded-badge border border-orange-100 self-start">
                <Icon name="local_fire_department" size={16} className="text-streak" />
                <span className="text-[13px] font-bold text-orange-700">{streak}일 연속</span>
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              className="flex-1 h-[46px] rounded-button bg-primary text-white text-[15px] font-semibold active:scale-95 transition-transform flex items-center justify-center gap-2"
              type="button"
              onClick={openNoteModal}
            >
              <Icon name="edit_note" size={18} />
              메모+완료
            </button>
            <button
              className="flex-1 h-[46px] rounded-button bg-muted text-text-secondary text-[15px] font-semibold hover:bg-border transition-colors flex items-center justify-center gap-2 active:scale-95"
              type="button"
              onClick={() => setRestartConfirmOpen(true)}
            >
              <Icon name="restart_alt" size={18} />
              다시 시작
            </button>
          </div>

          {/* Recent Records */}
          <section className="bg-surface rounded-card p-5 shadow-card flex flex-col gap-3">
            <h3 className="text-[16px] font-bold text-text">최근 기록 (최대 14개)</h3>
            {routineCheckins.length === 0 && (
              <p className="text-[14px] text-text-tertiary">아직 기록이 없어요.</p>
            )}
            {routineCheckins.length > 0 && (
              <div className="flex flex-col gap-2">
                {routineCheckins.map((checkin) => (
                  <div
                    key={checkin.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-input border",
                      checkin.status === "COMPLETED"
                        ? "bg-accent-light/40 border-emerald-100"
                        : "bg-muted border-border"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        name={checkin.status === "COMPLETED" ? "check_circle" : "fast_forward"}
                        size={18}
                        className={checkin.status === "COMPLETED" ? "text-accent" : "text-text-tertiary"}
                        filled
                      />
                      <span className="text-[14px] font-medium text-text">{checkin.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {checkin.note && (
                        <span className="text-[12px] text-text-secondary max-w-[120px] truncate">
                          {checkin.note}
                        </span>
                      )}
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-badge",
                        checkin.status === "COMPLETED"
                          ? "bg-accent-light text-emerald-700"
                          : "bg-muted text-text-tertiary"
                      )}>
                        {checkin.status === "COMPLETED" ? "완료" : "건너뜀"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      <NoteModal
        open={noteModalOpen}
        title="완료 메모 남기기"
        description={`${routine.title} 기록에 메모를 추가해요.`}
        note={noteDraft}
        onChangeNote={setNoteDraft}
        onCancel={closeNoteModal}
        onConfirm={submitNoteModal}
        confirmLabel="완료로 저장"
      />

      <ConfirmDialog
        open={restartConfirmOpen}
        title="다시 시작할까요?"
        description="현재 스트릭이 초기화돼요. 지난 체크인 기록은 유지되지만 연속 달성 일수는 0일부터 다시 카운트돼요."
        confirmLabel="다시 시작"
        destructive
        onConfirm={() => {
          setRestartConfirmOpen(false);
          trackEvent("routine_restart", {
            routineId: routine.id,
            prevStreak: streak,
          });
          restartRoutine(routine.id);
          navigate("/home");
        }}
        onCancel={() => setRestartConfirmOpen(false)}
      />
    </>
  );
}
