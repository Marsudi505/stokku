export type ProductRow = {
  id: string;
  plu_code: string;
  name: string;
  category: string | null;
  price: number;
  min_stock: number;
  current_qty: number;
  location: string | null;
};

export type MovementRow = {
  id: string;
  movement_type: "IN" | "OUT" | "ADJUSTMENT";
  qty_change: number;
  reason: string | null;
  created_at: string;
  product_name: string;
};

export type StoreRow = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  is_active: boolean;
};

export type ProfileRow = {
  user_id: string;
  username: string;
  full_name: string | null;
  role: "owner" | "kasir";
  store_id: string | null;
  is_active: boolean;
};

export type StockRequestRow = {
  id: string;
  product_id: string;
  store_id: string;
  request_type: string;
  requested_delta: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  requested_by: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
};

type RawStore = { name: string } | { name: string }[] | null;

type RawInventory = {
  current_qty: number;
  store_id: string | null;
  stores: RawStore;
} | null;

type RawProduct = {
  id: string;
  plu_code: string;
  name: string;
  category: string | null;
  price: number | string;
  min_stock: number;
  inventory: RawInventory | RawInventory[] | null;
};

type RawMovement = {
  id: string;
  movement_type: string | null;
  qty_change: number;
  reason: string | null;
  created_at: string | null;
  master_products: { name: string } | { name: string }[] | null;
};

const asArray = <T>(v: T | T[] | null | undefined): T[] =>
  v === null || v === undefined ? [] : Array.isArray(v) ? v : [v];

const storeName = (s: RawStore): string | null => asArray(s)[0]?.name ?? null;

export function toProductRow(p: RawProduct): ProductRow {
  const rows = asArray(p.inventory).filter(
    (r): r is Exclude<RawInventory, null> => r !== null
  );
  const locs = [...new Set(rows.map((r) => storeName(r.stores)).filter((n): n is string => n !== null))];
  return {
    id: p.id,
    plu_code: p.plu_code,
    name: p.name,
    category: p.category,
    price: Number(p.price),
    min_stock: p.min_stock,
    current_qty: rows.reduce((s, r) => s + r.current_qty, 0),
    location: locs.length > 0 ? locs.join(", ") : null,
  };
}

export function inventoryRows(p: RawProduct): {
  location: string;
  storeId: string | null;
  current_qty: number;
}[] {
  const rows = asArray(p.inventory).filter(
    (r): r is Exclude<RawInventory, null> => r !== null
  );
  return rows.map((r) => ({
    location: storeName(r.stores) ?? "-",
    storeId: r.store_id,
    current_qty: r.current_qty,
  }));
}

export function toMovementRow(m: RawMovement): MovementRow | null {
  if (m.movement_type !== "IN" && m.movement_type !== "OUT" && m.movement_type !== "ADJUSTMENT")
    return null;
  if (!m.created_at) return null;
  const prod = Array.isArray(m.master_products) ? m.master_products[0] : m.master_products;
  return {
    id: m.id,
    movement_type: m.movement_type,
    qty_change: m.qty_change,
    reason: m.reason,
    created_at: m.created_at,
    product_name: prod?.name ?? "-",
  };
}

export function validMovements(rows: RawMovement[]): MovementRow[] {
  const out: MovementRow[] = [];
  for (const r of rows) {
    const m = toMovementRow(r);
    if (m) out.push(m);
  }
  return out;
}

export const idr = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} mnt lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}
