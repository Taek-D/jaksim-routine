interface MaybeMiniAppBridge {
  openURL?: (url: string) => void | Promise<void>;
  close?: () => void | Promise<void>;
}

interface MaybeIapBridge {
  getProductItemList?: () => Promise<unknown>;
  createOneTimePurchaseOrder?: (payload?: unknown) => unknown;
  getPendingOrders?: () => Promise<unknown>;
  completeProductGrant?: (payload?: unknown) => Promise<unknown>;
  getCompletedOrRefundedOrders?: (payload?: unknown) => Promise<unknown>;
}

interface MaybeIdentityBridge {
  getUserKeyHash?: () => Promise<unknown>;
  getUserInfo?: () => Promise<unknown>;
  getUser?: () => Promise<unknown>;
}

type OpenUrlFallback = "none" | "location";

export interface IapProductItem {
  sku: string;
  title: string;
  priceLabel: string;
}

export interface IapPendingOrder {
  orderId: string;
  sku: string;
  createdAt: string;
}

export interface IapCompletedOrRefundedOrder {
  orderId: string;
  sku: string;
  status: "COMPLETED" | "REFUNDED";
  updatedAt: string;
}

function getWindowAny(): Record<string, unknown> | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window as unknown as Record<string, unknown>;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

/** response가 배열이면 그대로, { products: [...] } / { orders: [...] } 형태면 내부 배열 추출 */
function unwrapArray(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }
  const record = asRecord(response);
  if (!record) {
    return [];
  }
  // 공식 SDK 응답: { products: [...] }, { orders: [...] }
  for (const key of ["products", "orders", "items", "data"]) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }
  return [];
}

function pickMiniAppBridge(): MaybeMiniAppBridge | null {
  const target = getWindowAny();
  if (!target) {
    return null;
  }

  const candidates: unknown[] = [
    target.TossMiniApp,
    target.tossMiniApp,
    target.TossAppBridge,
    target.appsInToss,
  ];

  for (const candidate of candidates) {
    const bridge = asRecord(candidate) as MaybeMiniAppBridge | null;
    if (!bridge) {
      continue;
    }
    if (typeof bridge.openURL === "function" || typeof bridge.close === "function") {
      return bridge;
    }
  }

  return null;
}

function pickIapBridge(): MaybeIapBridge | null {
  const target = getWindowAny();
  if (!target) {
    return null;
  }

  const candidateRoots: Array<Record<string, unknown>> = [target];
  const topCandidates: unknown[] = [target.TossMiniApp, target.tossMiniApp, target.appsInToss];
  for (const candidate of topCandidates) {
    const parsed = asRecord(candidate);
    if (parsed) {
      candidateRoots.push(parsed);
    }
  }

  for (const root of candidateRoots) {
    const bridgeCandidates: unknown[] = [root.IAP, root.iap, root.TossIAP, root];
    for (const candidate of bridgeCandidates) {
      const bridge = asRecord(candidate) as MaybeIapBridge | null;
      if (!bridge) {
        continue;
      }
      if (
        typeof bridge.getProductItemList === "function" ||
        typeof bridge.createOneTimePurchaseOrder === "function" ||
        typeof bridge.getPendingOrders === "function"
      ) {
        return bridge;
      }
    }
  }

  return null;
}

function pickIdentityBridge(): MaybeIdentityBridge | null {
  const target = getWindowAny();
  if (!target) {
    return null;
  }

  const candidates: unknown[] = [target.TossMiniApp, target.tossMiniApp, target.appsInToss, target];
  for (const candidate of candidates) {
    const bridge = asRecord(candidate) as MaybeIdentityBridge | null;
    if (!bridge) {
      continue;
    }
    if (
      typeof bridge.getUserKeyHash === "function" ||
      typeof bridge.getUserInfo === "function" ||
      typeof bridge.getUser === "function"
    ) {
      return bridge;
    }
  }

  return null;
}

function valueToString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizePriceLabel(value: unknown): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value}`;
  }
  if (typeof value === "string") {
    return value;
  }
  return "";
}

function normalizeProductItem(value: unknown): IapProductItem | null {
  const item = asRecord(value);
  if (!item) {
    return null;
  }

  const sku = valueToString(item.sku) ?? valueToString(item.productId) ?? valueToString(item.id);
  if (!sku) {
    return null;
  }

  const title =
    valueToString(item.title) ??
    valueToString(item.displayName) ??
    valueToString(item.name) ??
    valueToString(item.productName) ??
    sku;

  const priceLabel =
    valueToString(item.priceLabel) ??
    valueToString(item.displayAmount) ??
    valueToString(item.displayPrice) ??
    normalizePriceLabel(item.price) ??
    "";

  return {
    sku,
    title,
    priceLabel,
  };
}

function normalizePendingOrder(value: unknown): IapPendingOrder | null {
  const item = asRecord(value);
  if (!item) {
    return null;
  }

  const orderId = valueToString(item.orderId) ?? valueToString(item.orderID) ?? valueToString(item.id);
  const sku = valueToString(item.sku) ?? valueToString(item.productId);
  if (!orderId || !sku) {
    return null;
  }

  return {
    orderId,
    sku,
    createdAt: valueToString(item.createdAt) ?? new Date().toISOString(),
  };
}

function normalizeCompletedOrder(value: unknown): IapCompletedOrRefundedOrder | null {
  const item = asRecord(value);
  if (!item) {
    return null;
  }

  const orderId = valueToString(item.orderId) ?? valueToString(item.orderID) ?? valueToString(item.id);
  const sku = valueToString(item.sku) ?? valueToString(item.productId);
  const statusRaw = valueToString(item.status);
  if (!orderId || !sku || !statusRaw) {
    return null;
  }

  const status = statusRaw.toUpperCase();
  if (status !== "COMPLETED" && status !== "REFUNDED") {
    return null;
  }

  return {
    orderId,
    sku,
    status,
    updatedAt: valueToString(item.updatedAt) ?? valueToString(item.date) ?? new Date().toISOString(),
  };
}

export async function openExternalUrl(
  url: string,
  options: { fallback?: OpenUrlFallback } = {}
): Promise<boolean> {
  const fallback = options.fallback ?? "none";
  const bridge = pickMiniAppBridge();

  if (bridge && typeof bridge.openURL === "function") {
    await bridge.openURL(url);
    return true;
  }

  if (fallback === "location" && typeof window !== "undefined") {
    window.location.assign(url);
    return true;
  }

  return false;
}

export async function closeMiniApp(): Promise<boolean> {
  const bridge = pickMiniAppBridge();
  if (!bridge || typeof bridge.close !== "function") {
    return false;
  }
  await bridge.close();
  return true;
}

export async function shareMiniAppLink(params: {
  title: string;
  text: string;
  url: string;
}): Promise<"shared" | "copied" | "unavailable"> {
  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    await navigator.share({
      title: params.title,
      text: params.text,
      url: params.url,
    });
    return "shared";
  }

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${params.text}\n${params.url}`);
    return "copied";
  }

  return "unavailable";
}

// ─── IAP: 상품 목록 조회 ───

export async function getIapProductItems(): Promise<IapProductItem[]> {
  const bridge = pickIapBridge();
  if (!bridge || typeof bridge.getProductItemList !== "function") {
    return [];
  }

  try {
    const response = await bridge.getProductItemList();
    // 공식 응답: { products: [...] } 또는 직접 배열
    const values = unwrapArray(response);
    return values.map(normalizeProductItem).filter((item): item is IapProductItem => item != null);
  } catch {
    return [];
  }
}

// ─── IAP: 결제 주문 생성 (콜백 패턴 + Promise 패턴 모두 지원) ───

/**
 * 공식 SDK createOneTimePurchaseOrder는 콜백 기반:
 *   bridge.createOneTimePurchaseOrder({
 *     options: { sku, processProductGrant: ({orderId}) => boolean },
 *     onEvent: (event) => void,
 *     onError: (error) => void,
 *   }) → cleanup function
 *
 * grantCallback: 결제 성공 시 서버에 상품 부여를 수행하는 콜백.
 *   orderId를 받아 서버 grant 후 true/false 반환.
 */
export function createIapPurchaseOrder(
  sku: string,
  grantCallback: (orderId: string) => Promise<boolean>
): Promise<IapPendingOrder | null> {
  const bridge = pickIapBridge();
  if (!bridge || typeof bridge.createOneTimePurchaseOrder !== "function") {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    let settled = false;
    let cleanupFn: (() => void) | null = null;

    const settle = (result: IapPendingOrder | null) => {
      if (!settled) {
        settled = true;
        resolve(result);
      }
    };

    // 5분 타임아웃 (결제 UI 대기)
    const timeout = setTimeout(() => {
      cleanupFn?.();
      settle(null);
    }, 300_000);

    const settleAndClear = (result: IapPendingOrder | null) => {
      clearTimeout(timeout);
      settle(result);
    };

    try {
      // 공식 콜백 패턴 시도
      const fn = bridge.createOneTimePurchaseOrder!;
      const maybeResult = fn({
        options: {
          sku,
          processProductGrant: async (params: unknown) => {
            try {
              const p = asRecord(params);
              const orderId = p
                ? (valueToString(p.orderId) ?? valueToString(p.orderID) ?? "")
                : "";
              if (!orderId) return false;
              const granted = await grantCallback(orderId);
              if (granted) {
                settleAndClear({ orderId, sku, createdAt: new Date().toISOString() });
              }
              return granted;
            } catch {
              settleAndClear(null);
              return false;
            }
          },
        },
        onEvent: () => {
          // processProductGrant에서 이미 resolve됨
        },
        onError: () => {
          settleAndClear(null);
        },
      });

      // SDK가 cleanup 함수를 반환하는 경우 저장
      if (typeof maybeResult === "function") {
        cleanupFn = maybeResult as () => void;
      }
      // 브릿지가 Promise를 반환하는 경우 (구형 브릿지 호환)
      else if (maybeResult != null && typeof maybeResult === "object" && "then" in maybeResult) {
        (maybeResult as Promise<unknown>)
          .then((response) => {
            if (settled) return;
            if (typeof response === "string") {
              settleAndClear({ orderId: response, sku, createdAt: new Date().toISOString() });
              return;
            }
            const parsed = asRecord(response);
            const orderId = parsed
              ? (valueToString(parsed.orderId) ?? valueToString(parsed.orderID) ?? valueToString(parsed.id))
              : null;
            if (orderId) {
              settleAndClear({
                orderId,
                sku: valueToString(parsed?.sku) ?? valueToString(parsed?.productId) ?? sku,
                createdAt: new Date().toISOString(),
              });
            }
          })
          .catch(() => {
            settleAndClear(null);
          });
      }
    } catch {
      settleAndClear(null);
    }
  });
}

/** 브릿지 없는 환경에서의 단순 Promise 기반 주문 (개발 모드 전용, 폴백) */
export async function createIapOrderLegacy(sku: string): Promise<IapPendingOrder | null> {
  const bridge = pickIapBridge();
  if (!bridge || typeof bridge.createOneTimePurchaseOrder !== "function") {
    return null;
  }

  const attempts: unknown[] = [
    { sku },
    { productId: sku },
    sku,
  ];

  for (const payload of attempts) {
    try {
      const response = await (bridge.createOneTimePurchaseOrder(payload) as Promise<unknown>);
      if (typeof response === "string") {
        return { orderId: response, sku, createdAt: new Date().toISOString() };
      }

      const parsed = asRecord(response);
      if (!parsed) continue;

      const orderId =
        valueToString(parsed.orderId) ?? valueToString(parsed.orderID) ?? valueToString(parsed.id);
      if (!orderId) continue;

      return {
        orderId,
        sku: valueToString(parsed.sku) ?? valueToString(parsed.productId) ?? sku,
        createdAt: valueToString(parsed.createdAt) ?? new Date().toISOString(),
      };
    } catch {
      continue;
    }
  }

  return null;
}

// ─── IAP: 대기 주문 조회 ───

export async function getIapPendingOrders(): Promise<IapPendingOrder[]> {
  const bridge = pickIapBridge();
  if (!bridge || typeof bridge.getPendingOrders !== "function") {
    return [];
  }

  try {
    const response = await bridge.getPendingOrders();
    // 공식 응답: { orders: [...] } 또는 직접 배열
    const values = unwrapArray(response);
    return values.map(normalizePendingOrder).filter((item): item is IapPendingOrder => item != null);
  } catch {
    return [];
  }
}

// ─── IAP: 상품 부여 완료 ───

export async function completeIapProductGrant(orderId: string): Promise<boolean> {
  const bridge = pickIapBridge();
  if (!bridge || typeof bridge.completeProductGrant !== "function") {
    return false;
  }

  // 공식: { params: { orderId } }, 기타: { orderId }, orderId
  const attempts: unknown[] = [
    { params: { orderId } },
    { orderId },
    orderId,
  ];
  for (const payload of attempts) {
    try {
      await bridge.completeProductGrant(payload);
      return true;
    } catch {
      continue;
    }
  }

  return false;
}

// ─── IAP: 완료/환불 주문 조회 ───

export async function getIapCompletedOrRefundedOrders(): Promise<IapCompletedOrRefundedOrder[]> {
  const bridge = pickIapBridge();
  if (!bridge || typeof bridge.getCompletedOrRefundedOrders !== "function") {
    return [];
  }

  try {
    const response = await bridge.getCompletedOrRefundedOrders();
    // 공식 응답: { orders: [...], hasNext, nextKey } 또는 직접 배열
    const values = unwrapArray(response);
    return values
      .map(normalizeCompletedOrder)
      .filter((item): item is IapCompletedOrRefundedOrder => item != null);
  } catch {
    return [];
  }
}

// ─── IAP: 브릿지 감지 ───

export function isIapBridgeAvailable(): boolean {
  return pickIapBridge() !== null;
}

// ─── Identity ───

export async function getLoginUserKeyHash(): Promise<string | null> {
  const bridge = pickIdentityBridge();
  if (!bridge) {
    return null;
  }

  try {
    if (typeof bridge.getUserKeyHash === "function") {
      const userKeyHash = await bridge.getUserKeyHash();
      return valueToString(userKeyHash);
    }

    const response =
      typeof bridge.getUserInfo === "function"
        ? await bridge.getUserInfo()
        : typeof bridge.getUser === "function"
          ? await bridge.getUser()
          : null;

    const user = asRecord(response);
    if (!user) {
      return null;
    }

    return valueToString(user.userKeyHash) ?? valueToString(user.userKey) ?? null;
  } catch {
    return null;
  }
}
