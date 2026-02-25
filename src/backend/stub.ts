import type {
  CompletedOrRefundedOrderRecord,
  EntitlementBackend,
  PendingOrderRecord,
  ProductItem,
  PurchaseEntitlementRecord,
  TrialGateRecord,
} from "./contracts";

const nowIso = () => new Date().toISOString();
const BACKEND_STORAGE_KEY = "jaksim-routine.entitlement-backend.stub.v2";

const SKU_MONTHLY = "ait.0000020428.d20afd98.2317931b4d.2010804767";
const SKU_YEARLY = "ait.0000020428.220b7594.0cccd017bf.2010830904";

const PRODUCT_ITEMS: ProductItem[] = [
  { sku: SKU_MONTHLY, title: "월 이용권", priceLabel: "월 1,900원" },
  { sku: SKU_YEARLY, title: "연 이용권", priceLabel: "연 14,900원" },
];

interface BackendStoreShape {
  trialByUser: Record<string, TrialGateRecord>;
  entitlementByUser: Record<string, PurchaseEntitlementRecord>;
  pendingOrdersByUser: Record<string, PendingOrderRecord[]>;
  completedOrdersByUser: Record<string, CompletedOrRefundedOrderRecord[]>;
}

function createInitialStore(): BackendStoreShape {
  return {
    trialByUser: {},
    entitlementByUser: {},
    pendingOrdersByUser: {},
    completedOrdersByUser: {},
  };
}

let fallbackStore = createInitialStore();

function supportsLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readBackendStore(): BackendStoreShape {
  if (!supportsLocalStorage()) {
    return fallbackStore;
  }

  try {
    const raw = window.localStorage.getItem(BACKEND_STORAGE_KEY);
    if (!raw) {
      return createInitialStore();
    }

    const parsed = JSON.parse(raw) as Partial<BackendStoreShape>;
    return {
      trialByUser: parsed.trialByUser ?? {},
      entitlementByUser: parsed.entitlementByUser ?? {},
      pendingOrdersByUser: parsed.pendingOrdersByUser ?? {},
      completedOrdersByUser: parsed.completedOrdersByUser ?? {},
    };
  } catch {
    return createInitialStore();
  }
}

function writeBackendStore(store: BackendStoreShape): void {
  if (!supportsLocalStorage()) {
    fallbackStore = store;
    return;
  }
  window.localStorage.setItem(BACKEND_STORAGE_KEY, JSON.stringify(store));
}

function addDaysFromNowIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function getPremiumUntilBySku(sku: string): string {
  if (sku === SKU_YEARLY) {
    return addDaysFromNowIso(365);
  }
  return addDaysFromNowIso(30);
}

function makeOrderId(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `order_${Date.now()}_${random}`;
}

export class InMemoryEntitlementBackend implements EntitlementBackend {

  async getProductItems(): Promise<ProductItem[]> {
    return PRODUCT_ITEMS;
  }

  async getTrialGate(userKeyHash: string): Promise<TrialGateRecord> {
    const store = readBackendStore();
    return store.trialByUser[userKeyHash] ?? { trialUsed: false };
  }

  async startTrial(userKeyHash: string): Promise<TrialGateRecord> {
    const store = readBackendStore();
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setDate(now.getDate() + 7);

    const record: TrialGateRecord = {
      trialUsed: true,
      trialStartedAt: nowIso(),
      trialExpiresAt: expiresAt.toISOString(),
    };

    store.trialByUser[userKeyHash] = record;
    store.entitlementByUser[userKeyHash] = {
      premiumUntil: record.trialExpiresAt,
      lastSku: "trial",
      updatedAt: nowIso(),
    };
    writeBackendStore(store);

    return record;
  }

  async createOneTimePurchaseOrder(userKeyHash: string, sku: string): Promise<PendingOrderRecord> {
    const store = readBackendStore();
    const nextPending = [...(store.pendingOrdersByUser[userKeyHash] ?? [])];
    const order: PendingOrderRecord = {
      orderId: makeOrderId(),
      sku,
      createdAt: nowIso(),
    };
    nextPending.push(order);
    store.pendingOrdersByUser[userKeyHash] = nextPending;
    writeBackendStore(store);
    return order;
  }

  async registerPendingOrder(
    userKeyHash: string,
    order: PendingOrderRecord
  ): Promise<PendingOrderRecord> {
    const store = readBackendStore();
    const pending = [...(store.pendingOrdersByUser[userKeyHash] ?? [])];
    const existingIndex = pending.findIndex((item) => item.orderId === order.orderId);

    if (existingIndex >= 0) {
      pending[existingIndex] = {
        ...pending[existingIndex],
        sku: order.sku,
        createdAt: order.createdAt || pending[existingIndex].createdAt,
      };
    } else {
      pending.push({
        orderId: order.orderId,
        sku: order.sku,
        createdAt: order.createdAt || nowIso(),
      });
    }

    store.pendingOrdersByUser[userKeyHash] = pending;
    writeBackendStore(store);
    return order;
  }

  async registerCompletedOrRefundedOrder(
    userKeyHash: string,
    order: CompletedOrRefundedOrderRecord
  ): Promise<CompletedOrRefundedOrderRecord> {
    const store = readBackendStore();
    const completedOrders = [...(store.completedOrdersByUser[userKeyHash] ?? [])];
    const existingIndex = completedOrders.findIndex((item) => item.orderId === order.orderId);

    if (existingIndex >= 0) {
      completedOrders[existingIndex] = {
        ...completedOrders[existingIndex],
        sku: order.sku,
        status: order.status,
        updatedAt: order.updatedAt || nowIso(),
      };
    } else {
      completedOrders.push({
        orderId: order.orderId,
        sku: order.sku,
        status: order.status,
        updatedAt: order.updatedAt || nowIso(),
      });
    }

    store.completedOrdersByUser[userKeyHash] = completedOrders;
    writeBackendStore(store);
    return order;
  }

  async getPendingOrders(userKeyHash: string): Promise<PendingOrderRecord[]> {
    const store = readBackendStore();
    return [...(store.pendingOrdersByUser[userKeyHash] ?? [])];
  }

  async processProductGrant(
    userKeyHash: string,
    orderId: string,
    sku: string
  ): Promise<{ granted: boolean }> {
    const store = readBackendStore();
    const pending = store.pendingOrdersByUser[userKeyHash] ?? [];
    const order = pending.find((item) => item.orderId === orderId && item.sku === sku);
    if (!order) {
      return { granted: false };
    }

    store.entitlementByUser[userKeyHash] = {
      premiumUntil: getPremiumUntilBySku(order.sku),
      lastOrderId: order.orderId,
      lastSku: order.sku,
      updatedAt: nowIso(),
    };
    writeBackendStore(store);
    return { granted: true };
  }

  async completeProductGrant(
    userKeyHash: string,
    orderId: string
  ): Promise<{ completed: boolean }> {
    const store = readBackendStore();
    const pending = store.pendingOrdersByUser[userKeyHash] ?? [];
    const targetOrder = pending.find((item) => item.orderId === orderId);
    const nextPending = pending.filter((item) => item.orderId !== orderId);
    const completed = nextPending.length !== pending.length;
    store.pendingOrdersByUser[userKeyHash] = nextPending;

    if (completed && targetOrder) {
      const completedOrders = [...(store.completedOrdersByUser[userKeyHash] ?? [])];
      const alreadyExists = completedOrders.some((item) => item.orderId === orderId);
      if (!alreadyExists) {
        completedOrders.push({
          orderId: targetOrder.orderId,
          sku: targetOrder.sku,
          status: "COMPLETED",
          updatedAt: nowIso(),
        });
      }
      store.completedOrdersByUser[userKeyHash] = completedOrders;
    }

    writeBackendStore(store);
    return { completed };
  }

  async getCompletedOrRefundedOrders(
    userKeyHash: string
  ): Promise<CompletedOrRefundedOrderRecord[]> {
    const store = readBackendStore();
    return [...(store.completedOrdersByUser[userKeyHash] ?? [])];
  }

  async revokePurchaseEntitlement(userKeyHash: string): Promise<void> {
    const store = readBackendStore();
    const prev = store.entitlementByUser[userKeyHash] ?? { updatedAt: nowIso() };
    store.entitlementByUser[userKeyHash] = {
      ...prev,
      premiumUntil: undefined,
      lastOrderId: undefined,
      lastSku: undefined,
      updatedAt: nowIso(),
    };
    writeBackendStore(store);
  }

  async getPurchaseEntitlement(userKeyHash: string): Promise<PurchaseEntitlementRecord> {
    const store = readBackendStore();
    return store.entitlementByUser[userKeyHash] ?? { updatedAt: nowIso() };
  }
}

export const entitlementBackendStub = new InMemoryEntitlementBackend();
