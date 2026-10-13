"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase/server";
import { getRole } from "./auth";

type ActionResult = { error?: string; ok?: string };

function revalidateStock(paths: string[] = []) {
  for (const p of ["/produk", "/dashboard", "/laporan", ...paths]) revalidatePath(p);
}

export async function addProduct(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  if ((await getRole()) !== "admin") return { error: "Hanya admin yang boleh menambah produk." };
  const plu = String(form.get("plu_code") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const category = String(form.get("category") ?? "").trim() || null;
  const location = String(form.get("location") ?? "").trim() || "Utama";
  const price = Math.max(0, Math.floor(Number(form.get("price") ?? 0)));
  const minStock = Math.max(0, Math.floor(Number(form.get("min_stock") ?? 5)));
  const qty = Math.max(0, Math.floor(Number(form.get("qty") ?? 0)));

  if (!plu || !name) return { error: "PLU dan nama wajib diisi." };
  if (!Number.isFinite(price) || !Number.isFinite(minStock) || !Number.isFinite(qty))
    return { error: "Harga, min. stok, dan stok awal harus angka." };

  const supabase = await createServerSupabase();
  const { data: prod, error: e1 } = await supabase
    .from("master_products")
    .insert({ plu_code: plu, name, category, price, min_stock: minStock })
    .select("id")
    .single();
  if (e1 || !prod) {
    if (e1?.code === "23505") return { error: "PLU sudah terdaftar." };
    return { error: "Gagal menyimpan produk." };
  }

  const { error: e2 } = await supabase
    .from("inventory")
    .insert({ product_id: prod.id, current_qty: 0, location });
  if (e2) {
    await supabase.from("master_products").delete().eq("id", prod.id);
    return { error: "Gagal menyimpan stok awal." };
  }

  if (qty > 0) {
    const { error: e3 } = await supabase.rpc("adjust_stock", {
      p_id: prod.id,
      delta: qty,
      mtype: "IN",
      reason: "Stok awal",
      p_loc: location,
    });
    if (e3) {
      await supabase.from("master_products").delete().eq("id", prod.id);
      return { error: "Gagal mencatat stok awal." };
    }
  }

  revalidateStock();
  redirect("/produk");
}

export async function updateProduct(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  if ((await getRole()) !== "admin") return { error: "Hanya admin yang boleh mengubah produk." };
  const id = String(form.get("id") ?? "");
  const plu = String(form.get("plu_code") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const category = String(form.get("category") ?? "").trim() || null;
  const price = Math.max(0, Math.floor(Number(form.get("price") ?? 0)));
  const minStock = Math.max(0, Math.floor(Number(form.get("min_stock") ?? 0)));

  if (!id || !plu || !name) return { error: "PLU dan nama wajib diisi." };
  if (!Number.isFinite(price) || !Number.isFinite(minStock)) return { error: "Harga dan min. stok harus angka." };

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("master_products")
    .update({ plu_code: plu, name, category, price, min_stock: minStock })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "PLU sudah dipakai produk lain." };
    return { error: "Gagal menyimpan perubahan." };
  }

  revalidateStock([`/produk/${id}`]);
  redirect(`/produk/${id}`);
}

export async function deleteProduct(form: FormData): Promise<void> {
  if ((await getRole()) !== "admin") throw new Error("Hanya admin.");
  const id = String(form.get("id") ?? "");
  if (!id) throw new Error("Produk tidak valid.");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("master_products").delete().eq("id", id);
  if (error) throw new Error("Gagal menghapus produk.");
  revalidateStock();
  redirect("/produk");
}

export async function adjustStock(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const productId = String(form.get("product_id") ?? "");
  const kind = String(form.get("kind") ?? "");
  const location = String(form.get("location") ?? "").trim() || "Utama";
  const qty = Math.floor(Number(form.get("qty") ?? 0));
  const reason =
    String(form.get("reason") ?? "").trim() || (kind === "IN" ? "Stok masuk" : "Stok keluar");

  if (!productId) return { error: "Produk tidak valid." };
  if (!Number.isFinite(qty) || qty <= 0) return { error: "Jumlah harus lebih dari 0." };
  if (kind !== "IN" && kind !== "OUT") return { error: "Tipe mutasi tidak valid." };

  const supabase = await createServerSupabase();
  if (kind === "OUT") {
    const { data: inv } = await supabase
      .from("inventory")
      .select("current_qty")
      .eq("product_id", productId)
      .eq("location", location)
      .maybeSingle();
    const cur = inv?.current_qty ?? 0;
    if (qty > cur) return { error: `Stok ${location} tidak cukup (sisa ${cur}).` };
  }

  const { error } = await supabase.rpc("adjust_stock", {
    p_id: productId,
    delta: kind === "IN" ? qty : -qty,
    mtype: kind,
    reason,
    p_loc: location,
  });
  if (error) return { error: "Gagal mencatat mutasi." };

  revalidateStock([`/produk/${productId}`]);
  return { ok: `Berhasil: ${kind === "IN" ? "+" : "−"}${qty} @ ${location}.` };
}

export async function transferStock(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const productId = String(form.get("product_id") ?? "");
  const fromLoc = String(form.get("from_loc") ?? "").trim();
  const toLoc = String(form.get("to_loc") ?? "").trim();
  const qty = Math.floor(Number(form.get("qty") ?? 0));
  const reason = String(form.get("reason") ?? "").trim() || "Transfer lokasi";

  if (!productId || !fromLoc || !toLoc) return { error: "Lokasi asal dan tujuan wajib diisi." };
  if (fromLoc === toLoc) return { error: "Lokasi asal dan tujuan harus berbeda." };
  if (!Number.isFinite(qty) || qty <= 0) return { error: "Jumlah harus lebih dari 0." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("transfer_stock", {
    p_id: productId,
    from_loc: fromLoc,
    to_loc: toLoc,
    qty,
    reason,
  });
  if (error) return { error: "Gagal transfer (stok tidak cukup?)." };

  revalidateStock([`/produk/${productId}`]);
  return { ok: `Pindah ${qty} dari ${fromLoc} ke ${toLoc}.` };
}

type OpnameItem = { id: string; loc: string; counted: number };

export async function submitOpname(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  let items: OpnameItem[];
  try {
    items = JSON.parse(String(form.get("items") ?? "[]")) as OpnameItem[];
  } catch {
    return { error: "Data opname tidak valid." };
  }
  const clean = items.filter(
    (it) => it && typeof it.id === "string" && typeof it.loc === "string" && Number.isFinite(it.counted) && it.counted >= 0
  );
  if (clean.length === 0) return { error: "Tidak ada baris opname." };

  const supabase = await createServerSupabase();
  const ids = [...new Set(clean.map((it) => it.id))];
  const { data: inv } = await supabase
    .from("inventory")
    .select("product_id, location, current_qty")
    .in("product_id", ids);
  const current = new Map((inv ?? []).map((r) => [`${r.product_id}::${r.location}`, r.current_qty]));

  let changed = 0;
  for (const it of clean) {
    const sys = current.get(`${it.id}::${it.loc}`) ?? 0;
    const diff = Math.floor(it.counted) - sys;
    if (diff === 0) continue;
    const { error } = await supabase.rpc("adjust_stock", {
      p_id: it.id,
      delta: diff,
      mtype: "ADJUSTMENT",
      reason: "Opname",
      p_loc: it.loc,
    });
    if (error) return { error: `Gagal mencatat selisih (${it.loc}).` };
    changed++;
  }

  revalidateStock();
  return { ok: changed === 0 ? "Tidak ada selisih. Stok akurat!" : `${changed} baris disesuaikan.` };
}
