import { IAP } from "@apps-in-toss/web-framework";

// ─── 공개 인터페이스 (기존과 동일) ───

export type IapProductItem = {
  sku: string;
  title: string;
  priceLabel: string;
};

export type IapPendingOrder = {
  orderId: string;
  sku: string;
  createdAt: string;
};

export type IapCompletedOrRefundedOrder = {
  orderId: string;
  sku: string;
  status: "COMPLETED" | "REFUNDED";
  updatedAt: string;
};

type OpenUrlFallback = "none" | "location";

// ─── 환경 감지 ───

function isTossWebView(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof (window as unknown as Record<string, unknown>).ReactNativeWebView === "object" &&
    (window as unknown as Record<string, unknown>).ReactNativeWebView != null
  );
}

// ─── Mini App: openURL / close / share (기존 window 브릿지 유지) ───

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  return value as Record<string, unknown>;
}

function getWindowAny(): Record<string, unknown> | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window as unknown as Record<string, unknown>;
}

interface MaybeMiniAppBridge {
  openURL?: (url: string) => void | Promise<void>;
  close?: () => void | Promise<void>;
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

// ─── IAP: 상품 목록 조회 (공식 SDK) ───

export async function getIapProductItems(): Promise<IapProductItem[]> {
  if (!isTossWebView()) {
    return [];
  }

  try {
    const response = await IAP.getProductItemList();
    if (!response || !Array.isArray(response.products)) {
      return [];
    }
    return response.products.map((product) => ({
      sku: product.sku,
      title: product.displayName,
      priceLabel: product.displayAmount,
    }));
  } catch {
    return [];
  }
}

// ─── IAP: 결제 주문 생성 (공식 SDK 콜백 패턴) ───

export function createIapPurchaseOrder(
  sku: string,
  grantCallback: (orderId: string) => Promise<boolean>
): Promise<IapPendingOrder | null> {
  if (!isTossWebView()) {
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
      const cleanup = IAP.createOneTimePurchaseOrder({
        options: {
          sku,
          processProductGrant: async ({ orderId }) => {
            try {
              const granted = await grantCallback(orderId);
              if (granted) {
                settleAndClear({
                  orderId,
                  sku,
                  createdAt: new Date().toISOString(),
                });
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
          cleanupFn?.();
        },
        onError: () => {
          cleanupFn?.();
          settleAndClear(null);
        },
      });

      cleanupFn = cleanup;
    } catch {
      settleAndClear(null);
    }
  });
}

// ─── IAP: 대기 주문 조회 (공식 SDK) ───

export async function getIapPendingOrders(): Promise<IapPendingOrder[]> {
  if (!isTossWebView()) {
    return [];
  }

  try {
    const response = await IAP.getPendingOrders();
    if (!response || !Array.isArray(response.orders)) {
      return [];
    }
    return response.orders
      .filter((order) => order.orderId && order.sku)
      .map((order) => ({
        orderId: order.orderId,
        sku: order.sku,
        createdAt: order.paymentCompletedDate ?? new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

// ─── IAP: 상품 부여 완료 (공식 SDK) ───

export async function completeIapProductGrant(orderId: string): Promise<boolean> {
  if (!isTossWebView()) {
    return false;
  }

  try {
    const result = await IAP.completeProductGrant({ params: { orderId } });
    return result === true;
  } catch {
    return false;
  }
}

// ─── IAP: 완료/환불 주문 조회 (공식 SDK) ───

export async function getIapCompletedOrRefundedOrders(): Promise<IapCompletedOrRefundedOrder[]> {
  if (!isTossWebView()) {
    return [];
  }

  try {
    const response = await IAP.getCompletedOrRefundedOrders();
    if (!response || !Array.isArray(response.orders)) {
      return [];
    }
    return response.orders
      .filter((order) => order.orderId && order.sku && (order.status === "COMPLETED" || order.status === "REFUNDED"))
      .map((order) => ({
        orderId: order.orderId,
        sku: order.sku,
        status: order.status,
        updatedAt: order.date ?? new Date().toISOString(),
      }));
  } catch {
    return [];
  }
}

// ─── IAP: 브릿지 감지 ───

export function isIapBridgeAvailable(): boolean {
  return isTossWebView();
}

// ─── Identity ───

interface MaybeIdentityBridge {
  getUserKeyHash?: () => Promise<unknown>;
  getUserInfo?: () => Promise<unknown>;
  getUser?: () => Promise<unknown>;
}

function valueToString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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
