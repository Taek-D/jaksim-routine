import AppShell from "../components/AppShell";
import BadgeOverlay from "../components/BadgeOverlay";
import { AppStateProvider, useAppState } from "../state/AppStateProvider";
import AppRoutes from "./AppRoutes";

function AppContent() {
  const { hydrated, badgeNotice, dismissBadgeNotice } = useAppState();

  if (!hydrated) {
    return (
      <section className="screen centered">
        <div className="card">
          <p className="muted">데이터를 불러오는 중이에요…</p>
        </div>
      </section>
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
