import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { trackEvent } from "../analytics/analytics";
import type { CompletedOrRefundedOrderRecord } from "../backend/contracts";
import { entitlementBackend } from "../backend";
import { useAppState } from "../state/AppStateProvider";
import { Icon } from "../components/Icon";
import { cn } from "@/lib/utils";

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
    <div className="flex flex-col h-full bg-[#f4f6f8]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md px-4 h-[56px] flex items-center justify-between border-b border-gray-100">
        <button onClick={() => navigate("/settings")} className="w-10 h-10 flex items-center justify-start text-gray-600" type="button">
          <Icon name="arrow_back" size={24} />
        </button>
        <h1 className="text-[17px] font-bold text-[#101828]">이용권 내역</h1>
        <div className="w-10" />
      </header>

      <main className="flex-1 p-4 flex flex-col gap-4">
        <p className="text-[14px] text-gray-500 px-1">최근 결제 완료/환불 이력을 확인할 수 있어요.</p>

        <section>
          <div className="bg-white rounded-[14px] border border-gray-200 overflow-hidden shadow-sm">
            {records.length === 0 && (
              <div className="p-6 flex flex-col items-center gap-3">
                <Icon name="receipt_long" size={40} className="text-gray-300" />
                <p className="text-[14px] text-gray-400">아직 이용권 내역이 없어요.</p>
              </div>
            )}
            {records.map((item) => (
              <div
                key={`${item.orderId}-${item.updatedAt}`}
                className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center",
                    item.status === "REFUNDED" ? "bg-red-50" : "bg-green-50"
                  )}>
                    <Icon
                      name={item.status === "REFUNDED" ? "undo" : "check_circle"}
                      size={20}
                      className={item.status === "REFUNDED" ? "text-red-500" : "text-green-600"}
                      filled
                    />
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-[#101828]">{item.sku}</p>
                    <p className="text-[12px] text-gray-500">{item.updatedAt}</p>
                  </div>
                </div>
                <span className={cn(
                  "text-[12px] font-bold px-2.5 py-1 rounded-full",
                  item.status === "REFUNDED"
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-700"
                )}>
                  {item.status === "REFUNDED" ? "환불" : "완료"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
