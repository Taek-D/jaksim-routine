import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "../state/AppStateProvider";
import { resolveNextPathFromSearch } from "../app/deeplink";
import { trackEvent } from "../analytics/analytics";

const onboardingSlides = [
  {
    emoji: "🧭",
    title: "작심삼일도 괜찮아요",
    description:
      "중요한 건 완벽함보다 다시 시작하는 힘이에요. 작은 루틴을 꾸준히 이어가볼게요.",
  },
  {
    emoji: "✅",
    title: "오늘 할 일 하나만 체크해요",
    description: "매일 원탭으로 기록하고, 주간 리포트에서 나의 흐름을 확인할 수 있어요.",
  },
  {
    emoji: "📈",
    title: "실패해도 기록은 남아요",
    description: "끊겨도 괜찮아요. 다시 시작 버튼으로 언제든 재도전할 수 있어요.",
  },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeOnboarding } = useAppState();
  const [index, setIndex] = useState(0);
  const trackedScreenSetRef = useRef<Set<number>>(new Set());

  const slide = useMemo(() => onboardingSlides[index], [index]);
  const isLast = index === onboardingSlides.length - 1;
  const nextPath = resolveNextPathFromSearch(`?${searchParams.toString()}`);

  useEffect(() => {
    const screen = index + 1;
    if (trackedScreenSetRef.current.has(screen)) {
      return;
    }
    trackedScreenSetRef.current.add(screen);
    trackEvent("onboarding_view", { screen });
  }, [index]);

  const completeAndNavigate = (path: string) => {
    trackEvent("onboarding_complete");
    completeOnboarding();
    navigate(path, { replace: true });
  };

  const goHome = () => {
    completeAndNavigate(nextPath ?? "/home");
  };

  return (
    <section className="screen centered">
      <div className="card">
        <p className="hero-emoji">{slide.emoji}</p>
        <h1 className="heading">{slide.title}</h1>
        <p className="muted">{slide.description}</p>

        {!isLast && (
          <button className="primary-button" type="button" onClick={() => setIndex((prev) => prev + 1)}>
            다음
          </button>
        )}

        {isLast && (
          <div className="button-row">
            <button
              className="primary-button"
              type="button"
              onClick={() => completeAndNavigate(nextPath ?? "/routine/new")}
            >
              루틴 시작하기
            </button>
            <button className="secondary-button" type="button" onClick={goHome}>
              나중에
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
