import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAppState } from "../state/AppStateProvider";
import { getRoutineRecentCheckins } from "../domain/progress";
import { getRoutineStreak } from "../state/selectors";
import NoteModal from "../components/NoteModal";
import { trackEvent } from "../analytics/analytics";
import { Icon } from "../components/Icon";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-col h-full bg-white">
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 h-[56px] flex items-center border-b border-gray-100">
          <button onClick={() => navigate("/home")} className="w-10 h-10 flex items-center justify-start text-gray-600" type="button">
            <Icon name="arrow_back" size={24} />
          </button>
        </header>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-white rounded-[20px] p-8 shadow-sm flex flex-col items-center gap-4 text-center">
            <Icon name="search_off" size={48} className="text-gray-300" />
            <h1 className="text-[20px] font-bold text-[#101828]">루틴을 찾을 수 없어요</h1>
            <button
              className="h-[44px] px-6 rounded-xl bg-[#f2f4f7] text-[#344054] text-[15px] font-medium hover:bg-gray-200 transition-colors"
              type="button"
              onClick={() => navigate("/home")}
            >
              홈으로
            </button>
          </div>
        </div>
      </div>
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

  const streak = getRoutineStreak(state, routine.id);

  return (
    <>
      <div className="flex flex-col h-full bg-[#f4f6f8]">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 h-[56px] flex items-center justify-between border-b border-gray-100">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-start text-gray-600" type="button">
            <Icon name="arrow_back" size={24} />
          </button>
          <h1 className="text-[17px] font-bold text-[#101828]">루틴 상세</h1>
          <Link to={`/routine/${routine.id}/edit`} className="w-10 h-10 flex items-center justify-end text-gray-600">
            <Icon name="edit" size={22} />
          </Link>
        </header>

        <main className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
          {/* Routine Info Card */}
          <section className="bg-white rounded-[20px] p-5 shadow-sm flex flex-col gap-3">
            <h2 className="text-[20px] font-bold text-[#101828]">{routine.title}</h2>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-gray-500">
                목표 요일: {routine.daysOfWeek.join(", ")}
              </span>
            </div>
            {streak > 0 && (
              <div className="flex items-center gap-1.5 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 self-start">
                <Icon name="local_fire_department" size={16} className="text-orange-600" />
                <span className="text-[13px] font-bold text-orange-700">{streak}일 연속</span>
              </div>
            )}
          </section>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              className="flex-1 h-[46px] rounded-xl bg-[#111827] text-white text-[15px] font-semibold active:scale-95 transition-transform flex items-center justify-center gap-2"
              type="button"
              onClick={openNoteModal}
            >
              <Icon name="edit_note" size={18} />
              메모+완료
            </button>
            <button
              className="flex-1 h-[46px] rounded-xl bg-[#f2f4f7] text-[#344054] text-[15px] font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 active:scale-95"
              type="button"
              onClick={() => {
                const ok = window.confirm("정말 다시 시작할까요? 현재 스트릭이 초기화돼요.");
                if (!ok) {
                  return;
                }
                trackEvent("routine_restart", {
                  routineId: routine.id,
                  prevStreak: streak,
                });
                restartRoutine(routine.id);
                navigate("/home");
              }}
            >
              <Icon name="restart_alt" size={18} />
              다시 시작
            </button>
          </div>

          {/* Recent Records */}
          <section className="bg-white rounded-[20px] p-5 shadow-sm flex flex-col gap-3">
            <h3 className="text-[16px] font-bold text-[#101828]">최근 기록 (최대 14개)</h3>
            {routineCheckins.length === 0 && (
              <p className="text-[14px] text-gray-400">아직 기록이 없어요.</p>
            )}
            {routineCheckins.length > 0 && (
              <div className="flex flex-col gap-2">
                {routineCheckins.map((checkin) => (
                  <div
                    key={checkin.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border",
                      checkin.status === "COMPLETED"
                        ? "bg-green-50 border-green-100"
                        : "bg-gray-50 border-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        name={checkin.status === "COMPLETED" ? "check_circle" : "fast_forward"}
                        size={18}
                        className={checkin.status === "COMPLETED" ? "text-green-600" : "text-gray-400"}
                        filled
                      />
                      <span className="text-[14px] font-medium text-[#101828]">{checkin.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {checkin.note && (
                        <span className="text-[12px] text-gray-500 max-w-[120px] truncate">
                          {checkin.note}
                        </span>
                      )}
                      <span className={cn(
                        "text-[11px] font-bold px-2 py-0.5 rounded-full",
                        checkin.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
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
    </>
  );
}
