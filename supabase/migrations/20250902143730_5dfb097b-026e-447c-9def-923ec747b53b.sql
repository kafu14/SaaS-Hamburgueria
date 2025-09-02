-- Enable RLS on all public tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modifier_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_item_modifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to get current tenant ID
-- This prevents infinite recursion in RLS policies
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
  -- For now, return NULL - this will be updated when authentication is implemented
  -- In a real implementation, this would get the tenant_id from a user profile
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Tenant isolation policies for categories
CREATE POLICY "Tenant isolation for categories" ON public.categories
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Tenant isolation policies for modifiers
CREATE POLICY "Tenant isolation for modifiers" ON public.modifiers
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Tenant isolation policies for modifier_options
CREATE POLICY "Tenant isolation for modifier_options" ON public.modifier_options
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Tenant isolation policies for products
CREATE POLICY "Tenant isolation for products" ON public.products
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Tenant isolation policies for product_modifiers
CREATE POLICY "Tenant isolation for product_modifiers" ON public.product_modifiers
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Tenant isolation policies for stores
CREATE POLICY "Tenant isolation for stores" ON public.stores
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Critical: Secure orders table with customer PII
CREATE POLICY "Tenant isolation for orders" ON public.orders
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Tenant isolation policies for order_items
CREATE POLICY "Tenant isolation for order_items" ON public.order_items
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Tenant isolation policies for order_item_modifiers
CREATE POLICY "Tenant isolation for order_item_modifiers" ON public.order_item_modifiers
  FOR ALL USING (tenant_id = public.get_current_tenant_id());

-- Basic tenant access policy (for now, allow all authenticated users to see tenants)
CREATE POLICY "Allow authenticated users to view tenants" ON public.tenants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage their tenant" ON public.tenants
  FOR ALL USING (auth.role() = 'authenticated');