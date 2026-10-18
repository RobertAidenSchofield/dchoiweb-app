-- =========================================================================
-- DCHOI DESIGNS — PostgreSQL Database Schema for Supabase
-- Run this in the Supabase SQL Editor to provision all tables & buckets.
-- =========================================================================

-- 1. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  reserved INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'Published',
  image TEXT,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  description TEXT,
  wood_type TEXT,
  dimensions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer TEXT NOT NULL,
  email TEXT NOT NULL,
  item TEXT,
  items JSONB NOT NULL DEFAULT '[]'::JSONB,
  subtotal NUMERIC(10, 2),
  shipping_method TEXT,
  shipping_cost NUMERIC(10, 2) DEFAULT 0,
  shipping_zone TEXT,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  tax_rate NUMERIC(6, 4) DEFAULT 0,
  tax_jurisdiction TEXT,
  amount NUMERIC(10, 2) NOT NULL,
  carrier TEXT,
  tracking_number TEXT,
  status TEXT NOT NULL DEFAULT 'Paid',
  date TEXT,
  shipping_address JSONB DEFAULT '{}'::JSONB,
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Inventory Audit Logs
CREATE TABLE IF NOT EXISTS public.inventory_audit_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  product_name TEXT,
  sku TEXT,
  change INTEGER NOT NULL,
  previous_stock INTEGER,
  new_stock INTEGER,
  reason TEXT,
  reference_id TEXT,
  admin_name TEXT DEFAULT 'Studio System',
  note TEXT,
  timestamp TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Custom Commissions Table
CREATE TABLE IF NOT EXISTS public.commissions (
  id TEXT PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  knife_maker TEXT,
  blade_type TEXT,
  blade_steel TEXT,
  spine_heel_thickness TEXT,
  heel_height TEXT,
  requested_wood TEXT,
  stage TEXT DEFAULT 'Inquiry',
  quoted_amount NUMERIC(10, 2),
  deposit_paid BOOLEAN DEFAULT FALSE,
  final_paid BOOLEAN DEFAULT FALSE,
  deposit_amount NUMERIC(10, 2),
  submitted_at TEXT,
  target_completion TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Studio Settings Table
CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Row-Level Security (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Public can read published products
CREATE POLICY "Public read products" ON public.products
  FOR SELECT USING (status = 'Published');

-- Service role has full access to all tables
CREATE POLICY "Service role full access products" ON public.products
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access orders" ON public.orders
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access audit" ON public.inventory_audit_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access commissions" ON public.commissions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access settings" ON public.store_settings
  FOR ALL USING (auth.role() = 'service_role');

-- 7. Storage Bucket for Product Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public image bucket access" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Service role image uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images');

