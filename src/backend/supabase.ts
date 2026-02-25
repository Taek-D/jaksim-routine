import type {
  CompletedOrRefundedOrderRecord,
  EntitlementBackend,
  PendingOrderRecord,
  ProductItem,
  PurchaseEntitlementRecord,
  TrialGateRecord,
} from "./contracts";
import { supabase } from "./supabaseClient";

function toIsoOrUndefined(value: unknown): string | undefined {
  if (typeof value === "string" && value) {
    return value;
  }
  return undefined;
}

export class SupabaseEntitlementBackend implements EntitlementBackend {
  private get client() {
    if (!supabase) {
      throw new Error("Supabase client is not initialized");
    }
    return supabase;
  }

  async getProductItems(): Promise<ProductItem[]> {
    const { data, error } = await this.client.rpc("jaksim_get_product_items");
    if (error) {
      return [
        { sku: "ait.0000020428.d20afd98.2317931b4d.2010804767", title: "월 이용권", priceLabel: "월 1,900원" },
        { sku: "ait.0000020428.220b7594.0cccd017bf.2010830904", title: "연 이용권", priceLabel: "연 14,900원" },
      ];
    }
    return data as ProductItem[];
  }

  async getTrialGate(userKeyHash: string): Promise<TrialGateRecord> {
    const { data, error } = await this.client.rpc("jaksim_get_trial_gate", {
      p_user: userKeyHash,
    });
    if (error || !data) {
      return { trialUsed: false };
    }
    const d = data as Record<string, unknown>;
    return {
      trialUsed: d.trialUsed === true,
      trialStartedAt: toIsoOrUndefined(d.trialStartedAt),
      trialExpiresAt: toIsoOrUndefined(d.trialExpiresAt),
    };
  }

  async startTrial(userKeyHash: string): Promise<TrialGateRecord> {
    const { data, error } = await this.client.rpc("jaksim_start_trial", {
      p_user: userKeyHash,
    });
    if (error || !data) {
      return { trialUsed: false };
    }
    const d = data as Record<string, unknown>;
    return {
      trialUsed: d.trialUsed === true,
      trialStartedAt: toIsoOrUndefined(d.trialStartedAt),
      trialExpiresAt: toIsoOrUndefined(d.trialExpiresAt),
    };
  }

  async createOneTimePurchaseOrder(
    userKeyHash: string,
    sku: string
  ): Promise<PendingOrderRecord> {
    const { data, error } = await this.client.rpc("jaksim_create_order", {
      p_user: userKeyHash,
      p_sku: sku,
    });
    if (error || !data) {
      throw new Error(`createOrder failed: ${error?.message ?? "no data"}`);
    }
    const d = data as Record<string, unknown>;
    return {
      orderId: d.orderId as string,
      sku: d.sku as string,
      createdAt: d.createdAt as string,
    };
  }

  async registerPendingOrder(
    userKeyHash: string,
    order: PendingOrderRecord
  ): Promise<PendingOrderRecord> {
    const { data, error } = await this.client.rpc(
      "jaksim_register_pending_order",
      {
        p_user: userKeyHash,
        p_order_id: order.orderId,
        p_sku: order.sku,
        p_created_at: order.createdAt,
      }
    );
    if (error || !data) {
      return order;
    }
    const d = data as Record<string, unknown>;
    return {
      orderId: d.orderId as string,
      sku: d.sku as string,
      createdAt: d.createdAt as string,
    };
  }

  async registerCompletedOrRefundedOrder(
    userKeyHash: string,
    order: CompletedOrRefundedOrderRecord
  ): Promise<CompletedOrRefundedOrderRecord> {
    const { data, error } = await this.client.rpc(
      "jaksim_register_completed_order",
      {
        p_user: userKeyHash,
        p_order_id: order.orderId,
        p_sku: order.sku,
        p_status: order.status,
        p_updated_at: order.updatedAt,
      }
    );
    if (error || !data) {
      return order;
    }
    const d = data as Record<string, unknown>;
    return {
      orderId: d.orderId as string,
      sku: d.sku as string,
      status: d.status as "COMPLETED" | "REFUNDED",
      updatedAt: d.updatedAt as string,
    };
  }

  async getPendingOrders(userKeyHash: string): Promise<PendingOrderRecord[]> {
    const { data, error } = await this.client.rpc(
      "jaksim_get_pending_orders",
      { p_user: userKeyHash }
    );
    if (error || !data) {
      return [];
    }
    return (data as Record<string, unknown>[]).map((d) => ({
      orderId: d.orderId as string,
      sku: d.sku as string,
      createdAt: d.createdAt as string,
    }));
  }

  async processProductGrant(
    userKeyHash: string,
    orderId: string,
    sku: string
  ): Promise<{ granted: boolean }> {
    const { data, error } = await this.client.rpc(
      "jaksim_process_product_grant",
      {
        p_user: userKeyHash,
        p_order_id: orderId,
        p_sku: sku,
      }
    );
    if (error || !data) {
      return { granted: false };
    }
    const d = data as Record<string, unknown>;
    return { granted: d.granted === true };
  }

  async completeProductGrant(
    userKeyHash: string,
    orderId: string
  ): Promise<{ completed: boolean }> {
    const { data, error } = await this.client.rpc(
      "jaksim_complete_product_grant",
      {
        p_user: userKeyHash,
        p_order_id: orderId,
      }
    );
    if (error || !data) {
      return { completed: false };
    }
    const d = data as Record<string, unknown>;
    return { completed: d.completed === true };
  }

  async getCompletedOrRefundedOrders(
    userKeyHash: string
  ): Promise<CompletedOrRefundedOrderRecord[]> {
    const { data, error } = await this.client.rpc(
      "jaksim_get_completed_orders",
      { p_user: userKeyHash }
    );
    if (error || !data) {
      return [];
    }
    return (data as Record<string, unknown>[]).map((d) => ({
      orderId: d.orderId as string,
      sku: d.sku as string,
      status: d.status as "COMPLETED" | "REFUNDED",
      updatedAt: d.updatedAt as string,
    }));
  }

  async revokePurchaseEntitlement(userKeyHash: string): Promise<void> {
    await this.client.rpc("jaksim_revoke_entitlement", {
      p_user: userKeyHash,
    });
  }

  async getPurchaseEntitlement(
    userKeyHash: string
  ): Promise<PurchaseEntitlementRecord> {
    const { data, error } = await this.client.rpc("jaksim_get_entitlement", {
      p_user: userKeyHash,
    });
    if (error || !data) {
      return { updatedAt: new Date().toISOString() };
    }
    const d = data as Record<string, unknown>;
    return {
      premiumUntil: toIsoOrUndefined(d.premiumUntil),
      lastOrderId: toIsoOrUndefined(d.lastOrderId),
      lastSku: toIsoOrUndefined(d.lastSku),
      updatedAt: (d.updatedAt as string) ?? new Date().toISOString(),
    };
  }
}
