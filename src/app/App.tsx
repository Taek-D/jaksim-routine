import AppShell from "../components/AppShell";
import BadgeOverlay from "../components/BadgeOverlay";
import { AppStateProvider, useAppState } from "../state/AppStateProvider";
import AppRoutes from "./AppRoutes";
import { AnimatePresence } from "motion/react";
import { Icon } from "../components/Icon";

function AppContent() {
  const { hydrated, badgeNotice, dismissBadgeNotice, isPremiumActive } = useAppState();

  if (!hydrated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 gap-4">
        <div className="w-12 h-12 rounded-full bg-accent-light flex items-center justify-center animate-pulse">
          <Icon name="check_circle" size={24} className="text-accent" />
        </div>
        <p className="text-[14px] text-text-tertiary">불러오는 중...</p>
      </div>
    );
  }

  return (
    <>
      <AppRoutes />
      <AnimatePresence>
        {badgeNotice && (
          <BadgeOverlay
            key={badgeNotice.badgeType}
            badge={badgeNotice}
            isPremium={isPremiumActive}
            onClose={dismissBadgeNotice}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppShell>
        <AppContent />
      </AppShell>
    </AppStateProvider>
  );
}
