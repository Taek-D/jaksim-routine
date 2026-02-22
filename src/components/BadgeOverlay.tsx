import { useEffect } from "react";
import type { Badge, BadgeType } from "../domain/models";

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
    <div className="badge-overlay-backdrop" role="presentation">
      <section className="badge-overlay-card" role="dialog" aria-modal="false" aria-live="polite">
        <p className="badge-overlay-eyebrow">배지 획득</p>
        <h2 className="badge-overlay-title">🏅 {BADGE_LABEL[badge.badgeType]}</h2>
        <p className="badge-overlay-message">{BADGE_MESSAGE[badge.badgeType]}</p>
        <button className="primary-button full" type="button" onClick={onClose}>
          확인
        </button>
      </section>
    </div>
  );
}
