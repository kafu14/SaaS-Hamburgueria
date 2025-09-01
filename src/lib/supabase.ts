import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Leia do .env do Vite */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** (Opcional) avisa no console se estiver faltando */
if (!supabaseUrl || !/^https?:\/\//.test(supabaseUrl) || !supabaseAnonKey) {
  console.warn('[Supabase] Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env(.local)');
}

/** Tipos do banco (alinhados ao schema V2 que criamos) */
export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          plan: 'basic' | 'pro' | 'enterprise' | (string & {}); // plan é text; mantemos union aberta
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          plan?: 'basic' | 'pro' | 'enterprise' | (string & {});
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>;
      };

      stores: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          address: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          address?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['stores']['Insert']>;
      };

      profiles: {
        Row: {
          user_id: string;      // = auth.users.id
          tenant_id: string;
          full_name: string | null;
          role: 'clerk' | 'manager' | 'admin' | (string & {});
        };
        Insert: {
          user_id: string;
          tenant_id: string;
          full_name?: string | null;
          role?: 'clerk' | 'manager' | 'admin' | (string & {});
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      categories: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          sort_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['categories']['Insert']>;
      };

      products: {
        Row: {
          id: string;
          tenant_id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;            // numeric(10,2) -> number
          active: boolean;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          active?: boolean;
          image_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };

      modifiers: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          required: boolean;
          max_selections: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          required?: boolean;
          max_selections?: number | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['modifiers']['Insert']>;
      };

      modifier_options: {
        Row: {
          id: string;
          tenant_id: string;
          modifier_id: string;
          name: string;
          price_diff: number; // numeric(10,2)
        };
        Insert: {
          id?: string;
          tenant_id: string;
          modifier_id: string;
          name: string;
          price_diff?: number;
        };
        Update: Partial<Database['public']['Tables']['modifier_options']['Insert']>;
      };

      product_modifiers: {
        Row: {
          product_id: string;
          modifier_id: string;
          tenant_id: string;
        };
        Insert: {
          product_id: string;
          modifier_id: string;
          tenant_id: string;
        };
        Update: Partial<Database['public']['Tables']['product_modifiers']['Insert']>;
      };

      orders: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string | null;
          channel: 'dine_in' | 'takeout' | 'delivery';
          table_number: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          customer_address: string | null;
          subtotal: number;       // numeric(10,2)
          discount: number;       // numeric(10,2)
          service_fee: number;    // numeric(10,2)
          total: number;          // numeric(10,2)
          status: 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          store_id?: string | null;
          channel?: 'dine_in' | 'takeout' | 'delivery';
          table_number?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_address?: string | null;
          subtotal?: number;
          discount?: number;
          service_fee?: number;
          total?: number;
          status?: 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };

      order_items: {
        Row: {
          id: string;
          tenant_id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          qty: number;
          unit_price: number; // numeric(10,2)
          notes: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          qty?: number;
          unit_price: number;
          notes?: string | null;
        };
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
      };

      order_item_modifiers: {
        Row: {
          id: string;
          tenant_id: string;
          order_item_id: string;
          modifier_name: string;
          option_name: string;
          price_diff: number; // numeric(10,2)
        };
        Insert: {
          id?: string;
          tenant_id: string;
          order_item_id: string;
          modifier_name: string;
          option_name: string;
          price_diff?: number;
        };
        Update: Partial<Database['public']['Tables']['order_item_modifiers']['Insert']>;
      };

      payments: {
        Row: {
          id: string;
          tenant_id: string;
          order_id: string;
          method: 'cash' | 'card' | 'pix' | 'online';
          amount: number; // numeric(10,2)
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          order_id: string;
          method: 'cash' | 'card' | 'pix' | 'online';
          amount: number;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['payments']['Insert']>;
      };
    };
  };
}

/** Exporta o client (ou null se não houver env válido) */
export const supabase: SupabaseClient<Database> | null =
  supabaseUrl && supabaseAnonKey ? createClient<Database>(supabaseUrl, supabaseAnonKey) : null;

/** Utilidades de tenant */
export const getTenantFromSubdomain = (): string | null => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 3) return parts[0];
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('tenant') || localStorage.getItem('current_tenant');
};

/** Client com filtro automático de tenant_id */
export const createTenantAwareClient = (tenantId: string) => {
  if (!supabase) {
    // stub seguro quando não há env configurado
    return {
      from: () => ({
        select: async () => ({ data: [], error: null }),
        insert: async () => ({ data: null, error: 'no-supabase' }),
        update: async () => ({ data: null, error: 'no-supabase' }),
        delete: async () => ({ data: null, error: 'no-supabase' }),
        upsert: async () => ({ data: null, error: 'no-supabase' }),
      }),
    } as any;
  }

  const baseFrom = supabase.from.bind(supabase);
  return {
    ...supabase,
    from: (table: keyof Database['public']['Tables'] | string) => {
      const q = baseFrom(table as string);
      return {
        ...q,
        select: (cols?: string) => q.select(cols ?? '*').eq('tenant_id', tenantId),
        insert: (values: any) =>
          q.insert(
            Array.isArray(values)
              ? values.map(v => ({ ...v, tenant_id: tenantId }))
              : { ...values, tenant_id: tenantId }
          ),
        update: (values: any) => q.update(values).eq('tenant_id', tenantId),
        delete: () => q.delete().eq('tenant_id', tenantId),
        upsert: (values: any) =>
          q.upsert(
            Array.isArray(values)
              ? values.map(v => ({ ...v, tenant_id: tenantId }))
              : { ...values, tenant_id: tenantId }
          ),
      };
    },
  } as SupabaseClient<Database>;
};
