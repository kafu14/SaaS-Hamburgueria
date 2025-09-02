-- Enable Row Level Security on all tables to protect sensitive data
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create a function to get current user's tenant_id
-- This will need to be updated once authentication and user-tenant association is implemented
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- For now, this returns null since no authentication is implemented
  -- TODO: Implement proper tenant association with authenticated users
  SELECT null::uuid;
$$;

-- CRITICAL: Orders table policies (contains sensitive customer PII)
-- Orders can only be accessed by authenticated users of the same tenant
CREATE POLICY "orders_tenant_isolation" ON public.orders
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = public.get_current_tenant_id()
  );

-- Order items follow the same tenant isolation as orders
CREATE POLICY "order_items_tenant_isolation" ON public.order_items
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = public.get_current_tenant_id()
  );

-- Order item modifiers follow the same tenant isolation
CREATE POLICY "order_item_modifiers_tenant_isolation" ON public.order_item_modifiers
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = public.get_current_tenant_id()
  );

-- Products can only be accessed by same tenant
CREATE POLICY "products_tenant_isolation" ON public.products
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = public.get_current_tenant_id()
  );

-- Categories can only be accessed by same tenant
CREATE POLICY "categories_tenant_isolation" ON public.categories
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = public.get_current_tenant_id()
  );

-- Stores can only be accessed by same tenant
CREATE POLICY "stores_tenant_isolation" ON public.stores
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = public.get_current_tenant_id()
  );

-- Modifiers can only be accessed by same tenant
CREATE POLICY "modifiers_tenant_isolation" ON public.modifiers
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = public.get_current_tenant_id()
  );

-- Modifier options can only be accessed by same tenant
CREATE POLICY "modifier_options_tenant_isolation" ON public.modifier_options
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = public.get_current_tenant_id()
  );

-- Product modifiers can only be accessed by same tenant
CREATE POLICY "product_modifiers_tenant_isolation" ON public.product_modifiers
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    tenant_id = public.get_current_tenant_id()
  );

-- Tenants table - users can only see their own tenant
CREATE POLICY "tenants_own_tenant_only" ON public.tenants
  FOR ALL USING (
    auth.role() = 'authenticated' AND 
    id = public.get_current_tenant_id()
  );