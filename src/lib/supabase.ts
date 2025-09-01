import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'your-supabase-url';
const supabaseAnonKey = 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para o banco de dados
export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          plan: 'basic' | 'pro' | 'enterprise';
          status: 'active' | 'inactive' | 'trial';
          created_at: string;
          trial_ends_at?: string;
        };
      };
      stores: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          address: any;
          timezone: string;
          created_at: string;
        };
      };
      users: {
        Row: {
          id: string;
          tenant_id: string;
          email: string;
          role: 'owner' | 'manager' | 'cashier' | 'waiter' | 'kitchen';
          created_at: string;
        };
      };
      categories: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          sort_order: number;
          created_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          tenant_id: string;
          category_id: string;
          name: string;
          description: string;
          price_cents: number;
          active: boolean;
          created_at: string;
        };
      };
      modifiers: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          required: boolean;
          multiple: boolean;
          created_at: string;
        };
      };
      modifier_options: {
        Row: {
          id: string;
          tenant_id: string;
          modifier_id: string;
          name: string;
          price_delta_cents: number;
          created_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          tenant_id: string;
          store_id: string;
          channel: 'dine_in' | 'takeout' | 'delivery';
          table_number?: string;
          customer?: any;
          status: 'new' | 'preparing' | 'ready' | 'served' | 'cancelled';
          subtotal_cents: number;
          discount_cents: number;
          service_fee_cents: number;
          total_cents: number;
          created_at: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          tenant_id: string;
          order_id: string;
          product_id: string;
          qty: number;
          unit_price_cents: number;
          notes?: string;
          created_at: string;
        };
      };
      payments: {
        Row: {
          id: string;
          tenant_id: string;
          order_id: string;
          method: 'cash' | 'card' | 'pix' | 'online';
          amount_cents: number;
          status: 'authorized' | 'captured' | 'refunded' | 'failed';
          provider_ref?: string;
          created_at: string;
        };
      };
    };
  };
}

// Helper para tenant context
export const getTenantFromSubdomain = (): string | null => {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Se for subdomínio (ex: tenant1.app.com)
  if (parts.length >= 3) {
    return parts[0];
  }
  
  // Para desenvolvimento local, pode usar query param ou header
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('tenant') || localStorage.getItem('current_tenant');
};

// Middleware para adicionar tenant_id automaticamente
export const createTenantAwareClient = (tenantId: string) => {
  return {
    ...supabase,
    from: (table: string) => {
      const query = supabase.from(table);
      // Adiciona filtro tenant_id automaticamente em todas as queries
      return {
        ...query,
        select: (columns?: string) => query.select(columns).eq('tenant_id', tenantId),
        insert: (values: any) => query.insert({ ...values, tenant_id: tenantId }),
        update: (values: any) => query.update(values).eq('tenant_id', tenantId),
        delete: () => query.delete().eq('tenant_id', tenantId),
        upsert: (values: any) => query.upsert({ ...values, tenant_id: tenantId })
      };
    }
  };
};