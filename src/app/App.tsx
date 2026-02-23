import AppShell from "../components/AppShell";
import BadgeOverlay from "../components/BadgeOverlay";
import { AppStateProvider, useAppState } from "../state/AppStateProvider";
import AppRoutes from "./AppRoutes";

function AppContent() {
  const { hydrated, badgeNotice, dismissBadgeNotice } = useAppState();

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-[14px] text-gray-400">데이터를 불러오는 중이에요…</p>
      </div>
    );
  }

  return (
    <>
      <AppRoutes />
      <BadgeOverlay badge={badgeNotice} onClose={dismissBadgeNotice} />
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
