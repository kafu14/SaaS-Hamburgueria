// src/integrations/supabase/client.ts
// Unifica o client: reexporta o client central do projeto.
// Assim, todo import de "@/integrations/supabase/client" usa o MESMO Supabase.

export { createTenantAwareClient, ensureSupabase, supabase, supabaseReady } from "../../lib/supabase";



