import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppState } from "../state/AppStateProvider";
import { openExternalUrl } from "../integrations/tossSdk";
import { trackEvent } from "../analytics/analytics";
import { appConfig, buildSupportMailto } from "../config/appConfig";
import { Icon } from "../components/Icon";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { state, restorePurchases, resetAllData } = useAppState();
  const hasTrackedSettingsViewRef = useRef(false);

  const premiumUntil = state.entitlement.premiumUntil;
  const isPremium = Boolean(premiumUntil);
  const entitlementLabel = premiumUntil ? `${premiumUntil}까지 활성` : "무료 이용 중";

  useEffect(() => {
    if (hasTrackedSettingsViewRef.current) {
      return;
    }
    hasTrackedSettingsViewRef.current = true;
    trackEvent("settings_view", { premiumActive: isPremium });
  }, [isPremium]);

  return (
    <div className="flex flex-col h-full bg-[#f4f6f8]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 py-3 flex items-center border-b border-gray-200">
        <h1 className="text-[20px] font-bold text-[#101828]">설정</h1>
      </header>

      <main className="p-4 flex flex-col gap-6 pb-28">
        {/* Membership */}
        <section>
          <h2 className="text-[13px] font-semibold text-gray-500 mb-2 px-1">멤버십</h2>
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100">
              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full mb-2 ${
                    isPremium ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                  }`}>
                    {isPremium ? "Premium" : "Basic"}
                  </span>
                  <h3 className="font-bold text-[16px] text-[#101828]">{entitlementLabel}</h3>
                </div>
              </div>
              <p className="text-[14px] text-gray-500 mt-1">
                {isPremium
                  ? "프리미엄 기능을 이용 중이에요."
                  : "프리미엄으로 업그레이드하고 무제한 루틴과 상세 리포트를 받아보세요."}
              </p>
              {!isPremium && (
                <Link
                  to="/paywall?trigger=settings"
                  className="mt-3 inline-block text-[14px] font-semibold text-blue-600 hover:underline"
                >
                  프리미엄 알아보기 →
                </Link>
              )}
            </div>
            <div className="flex divide-x divide-gray-100">
              <button
                className="flex-1 p-3 text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors text-center"
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
                이용권 복원
              </button>
              <button
                className="flex-1 p-3 text-[14px] font-medium text-[#344054] hover:bg-gray-50 transition-colors text-center"
                type="button"
                onClick={() => navigate("/settings/entitlements")}
              >
                이용권 이력
              </button>
            </div>
          </div>
        </section>

        {/* Support */}
        <section>
          <h2 className="text-[13px] font-semibold text-gray-500 mb-2 px-1">고객 지원</h2>
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden shadow-sm">
            {[
              { icon: "mail", label: "이메일 문의", onClick: () => { void openExternalUrl(buildSupportMailto("[작심루틴] 문의"), { fallback: "none" }); } },
              { icon: "description", label: "이용약관", onClick: () => { void openExternalUrl(appConfig.termsUrl, { fallback: "none" }); } },
              { icon: "lock", label: "개인정보 처리방침", onClick: () => { void openExternalUrl(appConfig.privacyUrl, { fallback: "none" }); } },
            ].map((item, i) => (
              <button
                key={i}
                type="button"
                className="w-full flex items-center justify-between p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                onClick={item.onClick}
              >
                <div className="flex items-center gap-3">
                  <Icon name={item.icon} size={22} className="text-gray-500" />
                  <span className="text-[15px] font-medium text-[#101828]">{item.label}</span>
                </div>
                <Icon name="chevron_right" size={20} className="text-gray-400" />
              </button>
            ))}
          </div>
        </section>

        {/* App Info */}
        <section>
          <h2 className="text-[13px] font-semibold text-gray-500 mb-2 px-1">앱 정보</h2>
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <Icon name="info" size={22} className="text-gray-500" />
                <span className="text-[15px] font-medium text-[#101828]">버전 정보</span>
              </div>
              <span className="text-[14px] text-gray-500">v0.1.0</span>
            </div>
            <Link
              to="/onboarding"
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Icon name="help" size={22} className="text-gray-500" />
                <span className="text-[15px] font-medium text-[#101828]">온보딩 다시보기</span>
              </div>
              <Icon name="chevron_right" size={20} className="text-gray-400" />
            </Link>
          </div>
        </section>

        {/* Data Management */}
        <section>
          <h2 className="text-[13px] font-semibold text-gray-500 mb-2 px-1">데이터 관리</h2>
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden shadow-sm">
            <button
              className="w-full flex items-center gap-3 p-4 hover:bg-red-50 transition-colors text-red-600"
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
              <Icon name="delete" size={22} />
              <span className="text-[15px] font-medium">데이터 초기화</span>
            </button>
          </div>
          <p className="mt-2 text-[13px] text-gray-400 px-1">
            데이터 초기화 시 모든 루틴 기록과 설정이 영구적으로 삭제되며, 복구할 수 없습니다.
          </p>
        </section>
      </main>
    </div>
  );
}
