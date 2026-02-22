export interface TrialGateRecord {
  trialUsed: boolean;
  trialStartedAt?: string;
  trialExpiresAt?: string;
}

export interface PurchaseEntitlementRecord {
  premiumUntil?: string;
  lastOrderId?: string;
  lastSku?: string;
  updatedAt: string;
}

export interface ProductItem {
  sku: string;
  title: string;
  priceLabel: string;
}

export interface PendingOrderRecord {
  orderId: string;
  sku: string;
  createdAt: string;
}

export interface CompletedOrRefundedOrderRecord {
  orderId: string;
  sku: string;
  status: "COMPLETED" | "REFUNDED";
  updatedAt: string;
}

export interface EntitlementBackend {
  getProductItems(): Promise<ProductItem[]>;
  getTrialGate(userKeyHash: string): Promise<TrialGateRecord>;
  startTrial(userKeyHash: string): Promise<TrialGateRecord>;
  createOneTimePurchaseOrder(userKeyHash: string, sku: string): Promise<PendingOrderRecord>;
  registerPendingOrder(userKeyHash: string, order: PendingOrderRecord): Promise<PendingOrderRecord>;
  registerCompletedOrRefundedOrder(
    userKeyHash: string,
    order: CompletedOrRefundedOrderRecord
  ): Promise<CompletedOrRefundedOrderRecord>;
  getPendingOrders(userKeyHash: string): Promise<PendingOrderRecord[]>;
  processProductGrant(userKeyHash: string, orderId: string, sku: string): Promise<{ granted: boolean }>;
  completeProductGrant(userKeyHash: string, orderId: string): Promise<{ completed: boolean }>;
  getCompletedOrRefundedOrders(userKeyHash: string): Promise<CompletedOrRefundedOrderRecord[]>;
  revokePurchaseEntitlement(userKeyHash: string): Promise<void>;
  getPurchaseEntitlement(userKeyHash: string): Promise<PurchaseEntitlementRecord>;
}
