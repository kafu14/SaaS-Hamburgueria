// src/lib/supabase.ts
import type { Database } from "@/integrations/supabase/types";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Variáveis de ambiente (defina no .env.local)
const URL = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

// Mensagem padrão quando não configurado
const NOT_CONFIGURED_MSG =
  "Supabase não está configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local";

// Stub que lança erro se o client não estiver configurado
function makeStub(): SupabaseClient<Database> {
  const handler: ProxyHandler<any> = {
    get() {
      throw new Error(NOT_CONFIGURED_MSG);
    },
    apply() {
      throw new Error(NOT_CONFIGURED_MSG);
    },
  };
  return new Proxy({}, handler) as unknown as SupabaseClient<Database>;
}

// Evita múltiplas instâncias com HMR do Vite
const g = globalThis as unknown as {
  __supabase?: SupabaseClient<Database>;
};

// Opções padrão para auth: sessão persistente no localStorage
const defaultOptions = {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    // flowType: "pkce" // opcional; mantenha comentado se usa magic link por hash também
  },
} as const;

// Instância singleton (ou stub, se não configurado)
export const supabase: SupabaseClient<Database> =
  URL && KEY
    ? (g.__supabase ?? (g.__supabase = createClient<Database>(URL, KEY, defaultOptions)))
    : makeStub();

// Garante que o Supabase está pronto (útil para falhar cedo)
export function ensureSupabase(): SupabaseClient<Database> {
  if (!URL || !KEY) {
    throw new Error(
      "Supabase não configurado. Verifique .env.local (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) e reinicie o servidor."
    );
  }
  return supabase;
}

// Cria um client com header por tenant (útil para multi-tenant no backend)
export function createTenantAwareClient(tenantId?: string): SupabaseClient<Database> {
  if (!URL || !KEY) return makeStub();
  return createClient<Database>(URL, KEY, {
    ...defaultOptions,
    global: { headers: tenantId ? { "x-tenant-id": tenantId } : {} },
  });
}

export const supabaseReady = Boolean(URL && KEY);
