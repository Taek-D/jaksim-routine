import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import OnboardingPage from "../pages/OnboardingPage";
import HomePage from "../pages/HomePage";
import ReportPage from "../pages/ReportPage";
import SettingsPage from "../pages/SettingsPage";
import RoutineNewPage from "../pages/RoutineNewPage";
import RoutineDetailPage from "../pages/RoutineDetailPage";
import RoutineEditPage from "../pages/RoutineEditPage";
import PaywallPage from "../pages/PaywallPage";
import NotFoundPage from "../pages/NotFoundPage";
import EntitlementHistoryPage from "../pages/EntitlementHistoryPage";
import WebViewPage from "../pages/WebViewPage";
import { useAppState } from "../state/AppStateProvider";
import { resolveDeepLinkTargetFromLocation } from "./deeplink";

function RootRedirect() {
  const { state } = useAppState();
  const location = useLocation();
  const deepLinkTarget = resolveDeepLinkTargetFromLocation(location);

  if (!state.onboardingCompleted) {
    if (!deepLinkTarget) {
      return <Navigate replace to="/onboarding" />;
    }
    return <Navigate replace to={`/onboarding?next=${encodeURIComponent(deepLinkTarget)}`} />;
  }

  return <Navigate replace to={deepLinkTarget ?? "/home"} />;
}

function OnboardingGuard() {
  const { state } = useAppState();
  const location = useLocation();

  if (state.onboardingCompleted || location.pathname === "/onboarding") {
    return null;
  }

  const target = resolveDeepLinkTargetFromLocation(location);
  if (target) {
    return <Navigate replace to={`/onboarding?next=${encodeURIComponent(target)}`} />;
  }

  return <Navigate replace to="/onboarding" />;
}

export default function AppRoutes() {
  return (
    <>
      <OnboardingGuard />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/entitlements" element={<EntitlementHistoryPage />} />
        <Route path="/routine/new" element={<RoutineNewPage />} />
        <Route path="/jaksim-routine/home" element={<Navigate replace to="/home" />} />
        <Route path="/jaksim-routine/report" element={<Navigate replace to="/report" />} />
        <Route path="/jaksim-routine/routine/new" element={<Navigate replace to="/routine/new" />} />
        <Route path="/routine/:routineId" element={<RoutineDetailPage />} />
        <Route path="/routine/:routineId/edit" element={<RoutineEditPage />} />
        <Route path="/webview" element={<WebViewPage />} />
        <Route path="/paywall" element={<PaywallPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
