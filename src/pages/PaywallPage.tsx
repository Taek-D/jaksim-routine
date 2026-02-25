import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { entitlementBackend } from "../backend";
import type { ProductItem } from "../backend/contracts";
import { useAppState } from "../state/AppStateProvider";
import { trackEvent } from "../analytics/analytics";
import { getIapProductItems } from "../integrations/tossSdk";
import { Icon } from "../components/Icon";
import { cn } from "@/lib/utils";
import { formatKstDate } from "../utils/date";

function resolveTrigger(search: string): string {
  const value = new URLSearchParams(search).get("trigger");
  return value ?? "unknown";
}

export default function PaywallPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, isPremiumActive, startFreeTrial, purchasePremium } = useAppState();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [busySku, setBusySku] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const hasTrackedViewRef = useRef(false);
  const trigger = resolveTrigger(location.search);

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      const runtimeProducts = await getIapProductItems();
      if (cancelled) {
        return;
      }

      if (runtimeProducts.length > 0) {
        setProducts(runtimeProducts);
        if (runtimeProducts.length > 0) {
          setSelectedSku(runtimeProducts[runtimeProducts.length - 1].sku);
        }
        return;
      }

      const stubProducts = await entitlementBackend.getProductItems();
      if (cancelled) {
        return;
      }
      setProducts(stubProducts);
      if (stubProducts.length > 0) {
        setSelectedSku(stubProducts[stubProducts.length - 1].sku);
      }
    };

    void loadProducts();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (hasTrackedViewRef.current) {
      return;
    }
    hasTrackedViewRef.current = true;
    trackEvent("paywall_view", { trigger });
  }, [trigger]);

  const handleStartTrial = async () => {
    setBusySku("trial");
    trackEvent("paywall_start_trial", { trigger });

    const result = await startFreeTrial();
    if (!result.ok && result.reason === "ALREADY_USED") {
      setNotice("무료 체험은 1회만 사용할 수 있어요.");
      setBusySku(null);
      return;
    }

    setNotice("7일 무료 체험이 시작됐어요.");
    setBusySku(null);
    navigate("/home");
  };

  const handlePurchase = async (sku: string) => {
    setBusySku(sku);
    trackEvent("iap_purchase_start", { sku });

    try {
      const result = await purchasePremium(sku);
      if (!result.ok) {
        trackEvent("iap_grant_fail", {
          orderId: result.orderId,
          sku: result.sku ?? sku,
          errorCode: result.errorCode ?? "UNKNOWN",
        });
        setNotice("결제를 완료하지 못했어요. 잠시 후 다시 시도해 주세요.");
        setBusySku(null);
        return;
      }

      trackEvent("iap_grant_success", {
        orderId: result.orderId,
        sku: result.sku ?? sku,
      });
      setNotice("이용권이 활성화됐어요.");
      setBusySku(null);
      navigate("/home");
    } catch {
      trackEvent("iap_grant_fail", {
        sku,
        errorCode: "UNEXPECTED",
      });
      setNotice("결제 중 오류가 발생했어요. 다시 시도해 주세요.");
      setBusySku(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md px-4 py-3 flex items-center justify-center">
        <h1 className="text-[17px] font-bold text-transparent select-none">Premium</h1>
      </header>

      <main className="flex-1 px-5 pt-4 pb-40 overflow-y-auto">
        {/* Hero */}
        <div className="flex flex-col items-center text-center mb-10 mt-4">
          <div className="w-16 h-16 bg-blue-50 rounded-[22px] flex items-center justify-center mb-5 shadow-sm">
            <Icon name="workspace_premium" size={32} className="text-blue-500" />
          </div>
          <h2 className="text-[24px] font-bold leading-tight text-[#101828] mb-2">
            프리미엄 이용권으로
            <br />
            한계를 뛰어넘으세요
          </h2>
          <p className="text-[15px] text-gray-500 leading-relaxed">
            현재 <span className="font-semibold text-[#101828]">{isPremiumActive ? "프리미엄 이용" : "무료 이용"} 중</span>입니다.
            <br />
            루틴 개수 제한 없이 더 나은 나를 만나보세요.
          </p>
          {state.entitlement.premiumUntil && (
            <p className="text-[13px] text-gray-400 mt-2">만료 예정: {formatKstDate(state.entitlement.premiumUntil)}</p>
          )}
        </div>

        {/* Features */}
        <div className="space-y-6 mb-10 px-2">
          {[
            {
              icon: "all_inclusive",
              title: "루틴 개수 제한 없음",
              desc: "3개 제한 없이 원하는 만큼 루틴을 만드세요",
            },
            {
              icon: "bar_chart",
              title: "캘린더 히트맵 & 월간 트렌드",
              desc: "30일 체크인 히트맵과 주간 달성률 추이를 확인하세요",
            },
            {
              icon: "shield",
              title: "스트릭 보호권 (월 2회)",
              desc: "놓친 하루를 보호해서 소중한 스트릭을 지키세요",
            },
            {
              icon: "folder_special",
              title: "프리미엄 템플릿 (출시 예정)",
              desc: "성공한 사람들의 루틴 팩을 바로 적용할 수 있어요",
            },
          ].map((feature, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon name={feature.icon} size={20} className="text-[#101828]" />
              </div>
              <div className="text-left">
                <h3 className="text-[16px] font-bold text-[#101828]">{feature.title}</h3>
                <p className="text-[13px] text-gray-500">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Product Plans */}
        <div className="flex flex-col gap-5 mb-8">
          {products.map((product, i) => {
            const isSelected = selectedSku === product.sku;
            const isLast = i === products.length - 1;
            return (
              <label
                key={product.sku}
                className={cn(
                  "block border rounded-2xl p-6 cursor-pointer relative transition-all",
                  isSelected
                    ? "border-[#111827] bg-gray-50 ring-1 ring-[#111827]"
                    : "border-gray-200 hover:bg-gray-50"
                )}
              >
                <input
                  type="radio"
                  name="plan"
                  value={product.sku}
                  checked={isSelected}
                  onChange={() => setSelectedSku(product.sku)}
                  className="hidden"
                />
                {isLast && products.length > 1 && (
                  <div className="absolute -top-3 left-4 bg-[#111827] text-white text-[11px] font-bold px-2 py-1 rounded-md shadow-sm">
                    BEST VALUE
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[14px] font-medium text-gray-500">{product.title}</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-[18px] font-bold text-[#101828]">{product.priceLabel}</span>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                      isSelected
                        ? "bg-[#111827] border-[#111827]"
                        : "border-gray-300"
                    )}
                  >
                    {isSelected && (
                      <Icon name="check" size={16} className="text-white" />
                    )}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <p className="text-center text-[12px] text-gray-400 mb-6 px-4 leading-normal">
          7일 무료 체험 종료 후 이용권이 자동 만료돼요. 유료 이용권은 기간 내 설정에서
          해지할 수 있습니다.
        </p>

        {notice && (
          <div className="bg-gray-50 rounded-xl p-3 mb-4 text-center">
            <p className="text-[14px] text-gray-600">{notice}</p>
          </div>
        )}
      </main>

      {/* Footer Action */}
      <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.04)] z-20">
        <button
          className="w-full bg-[#111827] text-white font-bold text-[16px] h-[52px] rounded-[14px] flex items-center justify-center shadow-lg active:scale-[0.98] transition-transform mb-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
          type="button"
          disabled={busySku != null}
          onClick={() => {
            if (selectedSku) {
              void handlePurchase(selectedSku);
            } else {
              void handleStartTrial();
            }
          }}
        >
          {busySku === "trial"
            ? "시작 중..."
            : busySku
              ? "처리 중..."
              : selectedSku
                ? `${products.find((p) => p.sku === selectedSku)?.priceLabel ?? ""} 구매하기`
                : "7일 무료 체험 시작하기"}
        </button>
        <button
          className="w-full text-gray-500 text-[14px] font-medium h-[32px] flex items-center justify-center hover:text-[#101828] transition-colors"
          type="button"
          onClick={() => navigate(-1)}
        >
          괜찮아요, 무료로 계속할게요
        </button>
      </div>
    </div>
  );
}
