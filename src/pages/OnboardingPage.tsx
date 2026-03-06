import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAppState } from "../state/AppStateProvider";
import { resolveNextPathFromSearch } from "../app/deeplink";
import { trackEvent } from "../analytics/analytics";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

const onboardingSlides = [
  {
    emoji: "\u{1F9ED}",
    title: "작심삼일도 괜찮아요",
    description:
      "중요한 건 완벽함보다 다시 시작하는 힘이에요. 작은 루틴을 꾸준히 이어가볼게요.",
  },
  {
    emoji: "\u2705",
    title: "오늘 할 일 하나만 체크해요",
    description: "매일 원탭으로 기록하고, 주간 리포트에서 나의 흐름을 확인할 수 있어요.",
  },
  {
    emoji: "\u{1F4C8}",
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
    <div className="flex flex-col h-full bg-surface relative overflow-hidden">
      {/* Indicators */}
      <div className="absolute top-12 left-0 right-0 flex justify-center gap-2 z-20">
        {onboardingSlides.map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 rounded-full transition-all duration-300",
              i === index ? "w-5 bg-accent" : "w-2 bg-border"
            )}
          />
        ))}
      </div>

      {/* Slides */}
      <div className="flex-1 relative flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center px-8"
          >
            <div className="w-[140px] h-[140px] bg-muted rounded-full flex items-center justify-center mb-10 shadow-sm">
              <span className="text-[72px] select-none leading-none">{slide.emoji}</span>
            </div>
            <h1 className="text-[24px] font-bold text-text mb-4 leading-tight">
              {slide.title}
            </h1>
            <p className="text-[15px] text-text-secondary leading-relaxed max-w-[280px]">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Action */}
      <div className="w-full px-6 pb-12 pt-4 z-20">
        {!isLast ? (
          <button
            className="w-full h-[56px] rounded-[18px] bg-primary text-white text-[16px] font-bold shadow-lg shadow-gray-900/10 active:scale-[0.98] transition-transform flex items-center justify-center"
            type="button"
            onClick={() => setIndex((prev) => prev + 1)}
          >
            다음
          </button>
        ) : (
          <>
            <button
              className="w-full h-[56px] rounded-[18px] bg-primary text-white text-[16px] font-bold shadow-lg shadow-gray-900/10 active:scale-[0.98] transition-transform flex items-center justify-center"
              type="button"
              onClick={() => completeAndNavigate(nextPath ?? "/routine/new")}
            >
              루틴 시작하기
            </button>
            <button
              className="w-full mt-3 text-text-tertiary text-[14px] font-medium h-[40px] hover:text-text-secondary transition-colors"
              type="button"
              onClick={goHome}
            >
              나중에
            </button>
          </>
        )}
      </div>
    </div>
  );
}
