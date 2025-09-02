// src/lib/supabase.ts
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

function makeStub(): SupabaseClient {
  const msg =
    "Supabase não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local";
  const handler: ProxyHandler<any> = {
    get() {
      throw new Error(msg);
    },
    apply() {
      throw new Error(msg);
    },
  };
  return new Proxy({}, handler);
}

export const supabase: SupabaseClient =
  URL && KEY ? createClient(URL, KEY) : makeStub();

export function ensureSupabase(): SupabaseClient {
  if (!URL || !KEY) {
    throw new Error(
      "Supabase não configurado. Verifique .env.local (URL e ANON KEY) e reinicie o servidor."
    );
  }
  return supabase;
}

export function createTenantAwareClient(tenantId?: string): SupabaseClient {
  if (!URL || !KEY) return makeStub();
  return createClient(URL, KEY, {
    global: {
      headers: tenantId ? { "x-tenant-id": tenantId } : {},
    },
  });
}

export const supabaseReady = Boolean(URL && KEY);
