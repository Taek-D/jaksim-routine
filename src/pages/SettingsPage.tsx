import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppStateProvider";
import { openExternalUrl } from "../integrations/tossSdk";
import { trackEvent } from "../analytics/analytics";
import { appConfig, buildSupportMailto } from "../config/appConfig";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { state, restorePurchases, resetAllData } = useAppState();
  const hasTrackedSettingsViewRef = useRef(false);

  const premiumUntil = state.entitlement.premiumUntil;
  const entitlementLabel = premiumUntil ? `${premiumUntil}까지 활성` : "미구매";

  useEffect(() => {
    if (hasTrackedSettingsViewRef.current) {
      return;
    }
    hasTrackedSettingsViewRef.current = true;
    trackEvent("settings_view", { premiumActive: Boolean(premiumUntil) });
  }, [premiumUntil]);

  return (
    <section className="screen">
      <h1 className="heading">설정</h1>

      <div className="card">
        <h2 className="subheading">이용권 상태</h2>
        <p className="muted">{entitlementLabel}</p>
        <div className="button-row">
          <button
            className="secondary-button"
            type="button"
            onClick={async () => {
              const result = await restorePurchases();
              if (result.restoredCount > 0) {
                window.alert(`이용권 ${result.restoredCount}건을 복원했어요.`);
                return;
              }
              window.alert("복원할 이용권이 없어요.");
            }}
          >
            이용권 복원하기
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => navigate("/settings/entitlements")}
          >
            이용권 이력 보기
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="subheading">고객센터/약관</h2>
        <div className="button-row">
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              void openExternalUrl(buildSupportMailto("[작심루틴] 문의"), { fallback: "none" });
            }}
          >
            고객센터 메일
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              void openExternalUrl(appConfig.termsUrl, { fallback: "none" });
            }}
          >
            이용약관
          </button>
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              void openExternalUrl(appConfig.privacyUrl, { fallback: "none" });
            }}
          >
            개인정보처리방침
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="subheading">데이터 관리</h2>
        <p className="muted">초기화하면 루틴, 체크인, 배지, 온보딩 플래그가 모두 삭제돼요.</p>
        <div className="button-row">
          <button
            className="secondary-button"
            type="button"
            onClick={() => navigate("/paywall?trigger=settings")}
          >
            이용권 보기
          </button>
          <button
            className="secondary-button danger"
            type="button"
            onClick={async () => {
              const ok = window.confirm("정말 초기화할까요? 모든 루틴과 체크인 기록이 삭제돼요.");
              if (!ok) {
                return;
              }
              trackEvent("data_reset");
              await resetAllData();
              navigate("/onboarding", { replace: true });
            }}
          >
            데이터 초기화
          </button>
        </div>
      </div>
    </section>
  );
}
