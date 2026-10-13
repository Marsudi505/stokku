CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.master_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plu_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(12, 2) NOT NULL DEFAULT 0,
  min_stock INT NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_products_plu ON public.master_products(plu_code);
CREATE INDEX idx_products_name ON public.master_products(name);

-- Multi-lokasi: satu produk bisa punya banyak baris stok (PK komposit).
CREATE TABLE public.inventory (
  product_id UUID REFERENCES public.master_products(id) ON DELETE CASCADE,
  current_qty INT NOT NULL DEFAULT 0,
  location VARCHAR(100) NOT NULL DEFAULT 'Utama',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_id, location)
);

CREATE TABLE public.stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES public.master_products(id) ON DELETE CASCADE,
  movement_type VARCHAR(20) CHECK (movement_type IN ('IN', 'OUT', 'ADJUSTMENT')),
  qty_change INT NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_movements_product ON public.stock_movements(product_id);
CREATE INDEX idx_movements_created ON public.stock_movements(created_at DESC);

CREATE OR REPLACE FUNCTION public.touch_inventory_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_inventory_updated ON public.inventory;
CREATE TRIGGER trg_inventory_updated
BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.touch_inventory_updated_at();

ALTER TABLE public.master_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated full access" ON public.master_products;
CREATE POLICY "authenticated full access" ON public.master_products
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated full access" ON public.inventory;
CREATE POLICY "authenticated full access" ON public.inventory
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated append read" ON public.stock_movements;
CREATE POLICY "authenticated append read" ON public.stock_movements
FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated append insert" ON public.stock_movements;
CREATE POLICY "authenticated append insert" ON public.stock_movements
FOR INSERT TO authenticated WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.master_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory TO authenticated;
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;

CREATE OR REPLACE FUNCTION public.adjust_stock(p_id UUID, delta INT, mtype TEXT, reason TEXT, p_loc TEXT DEFAULT 'Utama')
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.inventory (product_id, location, current_qty)
  VALUES (p_id, p_loc, 0)
  ON CONFLICT (product_id, location) DO NOTHING;
  UPDATE public.inventory
  SET current_qty = current_qty + delta
  WHERE product_id = p_id AND location = p_loc;
  INSERT INTO public.stock_movements (product_id, movement_type, qty_change, reason)
  VALUES (p_id, mtype, delta, reason);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;

CREATE OR REPLACE FUNCTION public.transfer_stock(p_id UUID, from_loc TEXT, to_loc TEXT, qty INT, reason TEXT)
RETURNS VOID AS $$
DECLARE cur INT;
BEGIN
  IF qty IS NULL OR qty <= 0 THEN RAISE EXCEPTION 'qty harus lebih dari 0'; END IF;
  IF from_loc IS NULL OR to_loc IS NULL OR from_loc = to_loc THEN RAISE EXCEPTION 'lokasi asal dan tujuan harus berbeda'; END IF;
  SELECT current_qty INTO cur FROM public.inventory WHERE product_id = p_id AND location = from_loc;
  IF cur IS NULL OR cur < qty THEN RAISE EXCEPTION 'stok tidak cukup'; END IF;
  INSERT INTO public.inventory (product_id, location, current_qty)
  VALUES (p_id, to_loc, 0)
  ON CONFLICT (product_id, location) DO NOTHING;
  UPDATE public.inventory SET current_qty = current_qty - qty WHERE product_id = p_id AND location = from_loc;
  UPDATE public.inventory SET current_qty = current_qty + qty WHERE product_id = p_id AND location = to_loc;
  INSERT INTO public.stock_movements (product_id, movement_type, qty_change, reason) VALUES
    (p_id, 'OUT', -qty, reason || ' (ke ' || to_loc || ')'),
    (p_id, 'IN', qty, reason || ' (dari ' || from_loc || ')');
END;
$$ LANGUAGE plpgsql SECURITY INVOKER SET search_path = public;
