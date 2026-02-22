import type { EntitlementBackend } from "./contracts";
import { supabase } from "./supabaseClient";
import { InMemoryEntitlementBackend } from "./stub";
import { SupabaseEntitlementBackend } from "./supabase";

function createBackend(): EntitlementBackend {
  if (supabase) {
    return new SupabaseEntitlementBackend();
  }
  return new InMemoryEntitlementBackend();
}

export const entitlementBackend: EntitlementBackend = createBackend();
