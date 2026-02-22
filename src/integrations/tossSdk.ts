interface MaybeMiniAppBridge {
  openURL?: (url: string) => void | Promise<void>;
  close?: () => void | Promise<void>;
}

interface MaybeIapBridge {
  getProductItemList?: () => Promise<unknown>;
  createOneTimePurchaseOrder?: (payload?: unknown) => Promise<unknown>;
  getPendingOrders?: () => Promise<unknown>;
  completeProductGrant?: (payload?: unknown) => Promise<unknown>;
  getCompletedOrRefundedOrders?: () => Promise<unknown>;
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
    valueToString(item.name) ??
    valueToString(item.productName) ??
    sku;

  const priceLabel =
    valueToString(item.priceLabel) ??
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
    updatedAt: valueToString(item.updatedAt) ?? new Date().toISOString(),
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

export async function getIapProductItems(): Promise<IapProductItem[]> {
  const bridge = pickIapBridge();
  if (!bridge || typeof bridge.getProductItemList !== "function") {
    return [];
  }

  try {
    const response = await bridge.getProductItemList();
    const values = Array.isArray(response) ? response : [];
    return values.map(normalizeProductItem).filter((item): item is IapProductItem => item != null);
  } catch {
    return [];
  }
}

export async function createIapOrder(sku: string): Promise<IapPendingOrder | null> {
  const bridge = pickIapBridge();
  if (!bridge || typeof bridge.createOneTimePurchaseOrder !== "function") {
    return null;
  }

  const attempts: unknown[] = [
    sku,
    { sku },
    { productId: sku },
  ];

  for (const payload of attempts) {
    try {
      const response = await bridge.createOneTimePurchaseOrder(payload);
      if (typeof response === "string") {
        return {
          orderId: response,
          sku,
          createdAt: new Date().toISOString(),
        };
      }

      const parsed = asRecord(response);
      if (!parsed) {
        continue;
      }

      const orderId =
        valueToString(parsed.orderId) ?? valueToString(parsed.orderID) ?? valueToString(parsed.id);
      if (!orderId) {
        continue;
      }

      const resolvedSku = valueToString(parsed.sku) ?? valueToString(parsed.productId) ?? sku;
      return {
        orderId,
        sku: resolvedSku,
        createdAt: valueToString(parsed.createdAt) ?? new Date().toISOString(),
      };
    } catch {
      continue;
    }
  }

  return null;
}

export async function getIapPendingOrders(): Promise<IapPendingOrder[]> {
  const bridge = pickIapBridge();
  if (!bridge || typeof bridge.getPendingOrders !== "function") {
    return [];
  }

  try {
    const response = await bridge.getPendingOrders();
    const values = Array.isArray(response) ? response : [];
    return values.map(normalizePendingOrder).filter((item): item is IapPendingOrder => item != null);
  } catch {
    return [];
  }
}

export async function completeIapProductGrant(orderId: string): Promise<boolean> {
  const bridge = pickIapBridge();
  if (!bridge || typeof bridge.completeProductGrant !== "function") {
    return false;
  }

  const attempts: unknown[] = [orderId, { orderId }];
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

export async function getIapCompletedOrRefundedOrders(): Promise<IapCompletedOrRefundedOrder[]> {
  const bridge = pickIapBridge();
  if (!bridge || typeof bridge.getCompletedOrRefundedOrders !== "function") {
    return [];
  }

  try {
    const response = await bridge.getCompletedOrRefundedOrders();
    const values = Array.isArray(response) ? response : [];
    return values
      .map(normalizeCompletedOrder)
      .filter((item): item is IapCompletedOrRefundedOrder => item != null);
  } catch {
    return [];
  }
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
