export function getGreeting(
  hour: number,
  progress: number,
  topStreak: number,
  totalCount: number
): string {
  if (totalCount === 0) {
    return "첫 루틴을 만들어 보세요!";
  }

  if (progress >= 100) {
    return "오늘 루틴을 모두 완료했어요!";
  }

  if (progress >= 50) {
    return "절반 이상 해냈어요, 조금만 더!";
  }

  if (hour < 12) {
    return "좋은 아침이에요, 오늘도 힘내봐요!";
  }

  if (hour < 18) {
    return "오후도 파이팅! 루틴을 이어가요.";
  }

  if (topStreak >= 7) {
    return `${topStreak}일 연속 대단해요, 계속 가볼까요?`;
  }

  return "오늘도 꾸준함이 답이에요.";
}
