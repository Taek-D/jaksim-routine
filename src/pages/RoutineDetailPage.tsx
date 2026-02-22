import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppState } from "../state/AppStateProvider";
import { getRoutineRecentCheckins } from "../domain/progress";
import { getRoutineStreak } from "../state/selectors";
import NoteModal from "../components/NoteModal";
import { trackEvent } from "../analytics/analytics";

export default function RoutineDetailPage() {
  const navigate = useNavigate();
  const { routineId = "" } = useParams();
  const { state, restartRoutine, checkinRoutine } = useAppState();
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
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

  return (
    <>
      <section className="screen">
        <h1 className="heading">{routine.title}</h1>
        <p className="muted">목표 요일: {routine.daysOfWeek.join(", ")}</p>
        <p className="muted">현재 스트릭 {getRoutineStreak(state, routine.id)}일</p>

        <div className="card">
          <h2 className="subheading">최근 기록 (최대 14개)</h2>
          {routineCheckins.length === 0 && <p className="muted">아직 기록이 없어요.</p>}
          <ul className="record-list">
            {routineCheckins.map((checkin) => (
              <li key={checkin.id}>
                {checkin.date} · {checkin.status}
                {checkin.note ? ` · ${checkin.note}` : ""}
              </li>
            ))}
          </ul>
        </div>

        <div className="button-row">
          <button className="secondary-button" type="button" onClick={openNoteModal}>
            오늘 메모+완료
          </button>
          <Link className="secondary-button as-link" to={`/routine/${routine.id}/edit`}>
            편집
          </Link>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              trackEvent("routine_restart", {
                routineId: routine.id,
                prevStreak: getRoutineStreak(state, routine.id),
              });
              restartRoutine(routine.id);
              navigate("/home");
            }}
          >
            다시 시작하기
          </button>
        </div>
      </section>

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
    </>
  );
}
