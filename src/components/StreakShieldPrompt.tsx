import { useNavigate } from "react-router-dom";
import { Icon } from "./Icon";

interface StreakShieldPromptProps {
  routineTitle: string;
  restoredStreak: number;
  isPremium: boolean;
  shieldsRemaining: number;
  onUseShield: () => void;
  onDismiss: () => void;
}

export default function StreakShieldPrompt({
  routineTitle,
  restoredStreak,
  isPremium,
  shieldsRemaining,
  onUseShield,
  onDismiss,
}: StreakShieldPromptProps) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 bottom-[84px] w-[min(calc(100%-32px),560px)] z-[110]"
      role="status"
      aria-live="polite"
    >
      <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-orange-50 to-purple-50 shadow-[0_8px_24px_rgba(16,24,40,0.14)] p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Icon name="shield" size={20} className="text-purple-600" />
          <p className="text-[14px] font-semibold text-purple-900">
            {routineTitle} 스트릭 {restoredStreak}일을 지킬 수 있어요!
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            className="h-[38px] px-4 rounded-xl bg-white border border-gray-200 text-[#344054] text-[14px] font-medium hover:bg-gray-50 transition-colors"
            type="button"
            onClick={onDismiss}
          >
            괜찮아요
          </button>
          {isPremium ? (
            <button
              className="h-[38px] px-4 rounded-xl bg-purple-600 text-white text-[14px] font-semibold hover:bg-purple-700 transition-colors active:scale-[0.98] flex items-center gap-1.5"
              type="button"
              onClick={onUseShield}
            >
              <Icon name="shield" size={16} />
              보호권 사용 ({shieldsRemaining}/{2} 남음)
            </button>
          ) : (
            <button
              className="h-[38px] px-4 rounded-xl bg-purple-600 text-white text-[14px] font-semibold hover:bg-purple-700 transition-colors active:scale-[0.98] flex items-center gap-1.5"
              type="button"
              onClick={() => navigate("/paywall?trigger=streak_shield")}
            >
              <Icon name="workspace_premium" size={16} />
              프리미엄으로 보호하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
