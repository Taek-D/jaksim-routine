import { useEffect } from "react";
import type { Badge, BadgeType } from "../domain/models";
import { Icon } from "./Icon";

interface BadgeOverlayProps {
  badge: Badge | null;
  onClose: () => void;
}

const BADGE_LABEL: Record<BadgeType, string> = {
  FIRST_CHECKIN: "첫 체크인",
  STREAK_3: "3일 연속",
  STREAK_7: "7일 연속",
  STREAK_14: "14일 완주",
  COMEBACK: "다시 시작",
};

const BADGE_MESSAGE: Record<BadgeType, string> = {
  FIRST_CHECKIN: "첫 체크인을 기록했어요.",
  STREAK_3: "3일 연속으로 실천했어요.",
  STREAK_7: "7일 연속으로 이어가고 있어요.",
  STREAK_14: "2주 완주를 달성했어요.",
  COMEBACK: "건너뜀 이후 다시 돌아왔어요.",
};

export default function BadgeOverlay({ badge, onClose }: BadgeOverlayProps) {
  useEffect(() => {
    if (!badge) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      onClose();
    }, 2600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [badge, onClose]);

  if (!badge) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[120] bg-black/20 flex items-center justify-center p-5" role="presentation">
      <section
        className="w-[min(100%,360px)] rounded-[18px] border border-amber-200 bg-gradient-to-b from-amber-50 to-white shadow-[0_18px_44px_rgba(16,24,40,0.22)] p-6 flex flex-col items-center text-center"
        role="dialog"
        aria-modal="false"
        aria-live="polite"
      >
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
          <Icon name="emoji_events" size={32} className="text-amber-600" filled />
        </div>
        <p className="text-[12px] font-bold text-amber-700 tracking-wide uppercase mb-1">배지 획득</p>
        <h2 className="text-[22px] font-bold text-[#101828] leading-tight mb-2">
          {BADGE_LABEL[badge.badgeType]}
        </h2>
        <p className="text-[14px] text-gray-500 mb-5">{BADGE_MESSAGE[badge.badgeType]}</p>
        <button
          className="w-full h-[48px] rounded-xl bg-[#111827] text-white text-[15px] font-semibold shadow-sm active:scale-[0.98] transition-transform"
          type="button"
          onClick={onClose}
        >
          확인
        </button>
      </section>
    </div>
  );
}
