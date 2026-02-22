import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "../analytics/analytics";
import type { CompletedOrRefundedOrderRecord } from "../backend/contracts";
import { entitlementBackend } from "../backend";
import { useAppState } from "../state/AppStateProvider";

const DEFAULT_USER_KEY_HASH = "local-user";

export default function EntitlementHistoryPage() {
  const navigate = useNavigate();
  const { state } = useAppState();
  const [records, setRecords] = useState<CompletedOrRefundedOrderRecord[]>([]);

  useEffect(() => {
    const userKeyHash = state.entitlement.lastKnownUserKeyHash ?? DEFAULT_USER_KEY_HASH;
    entitlementBackend.getCompletedOrRefundedOrders(userKeyHash).then((items) => {
      const sorted = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      setRecords(sorted);
      trackEvent("entitlement_history_view", { count: sorted.length });
    });
  }, [state.entitlement.lastKnownUserKeyHash]);

  return (
    <section className="screen">
      <h1 className="heading">이용권 내역</h1>
      <p className="muted">최근 결제 완료/환불 이력을 확인할 수 있어요.</p>

      <div className="card">
        {records.length === 0 && <p className="muted">아직 이용권 내역이 없어요.</p>}
        {records.length > 0 && (
          <ul className="record-list">
            {records.map((item) => (
              <li key={`${item.orderId}-${item.updatedAt}`} className="history-row">
                <strong>{item.sku}</strong> · {item.status} · {item.updatedAt}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className="secondary-button" type="button" onClick={() => navigate("/settings")}>
        설정으로 돌아가기
      </button>
    </section>
  );
}
