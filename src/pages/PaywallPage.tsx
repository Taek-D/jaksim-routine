import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { entitlementBackend } from "../backend";
import type { ProductItem } from "../backend/contracts";
import { useAppState } from "../state/AppStateProvider";
import { trackEvent } from "../analytics/analytics";
import { getIapProductItems } from "../integrations/tossSdk";

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
        return;
      }

      const stubProducts = await entitlementBackend.getProductItems();
      if (cancelled) {
        return;
      }
      setProducts(stubProducts);
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
    <section className="screen">
      <h1 className="heading">프리미엄 이용권</h1>
      <p className="muted">루틴 개수 제한을 해제하고 더 많은 통계를 확인해 보세요.</p>
      <p className="muted">현재 상태: {isPremiumActive ? "활성" : "비활성"}</p>
      {state.entitlement.premiumUntil && <p className="muted">만료 예정: {state.entitlement.premiumUntil}</p>}

      <div className="card">
        <ul className="record-list">
          <li>루틴 개수 제한 없음</li>
          <li>주간/월간 통계 확장(후속 단계)</li>
          <li>템플릿 확장(후속 단계)</li>
        </ul>
      </div>

      <div className="card">
        <h2 className="subheading">상품</h2>
        <ul className="record-list">
          {products.map((product) => (
            <li key={product.sku} className="product-row">
              <div>
                {product.title} · {product.priceLabel}
              </div>
              <button
                className="secondary-button"
                type="button"
                disabled={busySku != null}
                onClick={() => {
                  void handlePurchase(product.sku);
                }}
              >
                {busySku === product.sku ? "처리 중..." : "구매"}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="button-row">
        <button
          className="primary-button"
          type="button"
          disabled={busySku != null}
          onClick={() => {
            void handleStartTrial();
          }}
        >
          {busySku === "trial" ? "시작 중..." : "7일 무료 체험 시작하기"}
        </button>
        <button className="secondary-button" type="button" onClick={() => navigate(-1)}>
          무료로 계속하기
        </button>
      </div>

      {notice && (
        <div className="card">
          <p className="muted">{notice}</p>
        </div>
      )}
    </section>
  );
}
