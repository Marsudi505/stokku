"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase/server";
import { getProfile, requireAuth } from "./auth";
import { assertOwner } from "./permissions";

type ActionResult = { error?: string; ok?: string };

function revalidateStock(paths: string[] = []) {
  for (const p of ["/produk", "/dashboard", "/laporan", ...paths]) revalidatePath(p);
}

export async function addProduct(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const profile = await getProfile();
  const guard = assertOwner(profile);
  if (guard) return { error: guard };

  const supabase = await createServerSupabase();
  const plu = String(form.get("plu_code") ?? "").trim();
  const name = String(form.get("name") ?? "").trim();
  const category = String(form.get("category") ?? "").trim() || null;
  const storeId = String(form.get("store_id") ?? "").trim();
  const price = Math.max(0, Math.floor(Number(form.get("price") ?? 0)));
  const minStock = Math.max(0, Math.floor(Number(form.get("min_stock") ?? 5)));
  const qty = Math.max(0, Math.floor(Number(form.get("qty") ?? 0)));

  if (!plu || !name) return { error: "PLU dan nama wajib diisi." };
  if (!storeId) return { error: "Cabang wajib dipilih." };
  if (!Number.isFinite(price) || !Number.isFinite(minStock) || !Number.isFinite(qty))
    return { error: "Harga, min. stok, dan stok awal harus angka." };

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
    .insert({ product_id: prod.id, current_qty: 0, store_id: storeId });
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
      p_store: storeId,
    });
    if (e3) {
      await supabase.from("master_products").delete().eq("id", prod.id);
      return { error: `Gagal mencatat stok awal: ${e3.message}` };
    }
  }

  revalidateStock();
  redirect("/produk");
}

export async function updateProduct(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const profile = await getProfile();
  const guard = assertOwner(profile);
  if (guard) return { error: guard };

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
  const profile = await getProfile();
  if (assertOwner(profile)) throw new Error("Hanya owner.");
  const id = String(form.get("id") ?? "");
  if (!id) throw new Error("Produk tidak valid.");
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("master_products").delete().eq("id", id);
  if (error) throw new Error("Gagal menghapus produk.");
  revalidateStock();
  redirect("/produk");
}

export async function adjustStock(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAuth();
  const profile = await getProfile();
  const product_id = String(form.get("product_id") ?? "");
  const p_store = String(form.get("store_id") ?? "");
  const kind = String(form.get("kind") ?? "");
  const qty = Math.floor(Number(form.get("qty") ?? 0));
  const reason =
    String(form.get("reason") ?? "").trim() || (kind === "IN" ? "Stok masuk" : "Stok keluar");

  if (!product_id || !p_store) return { error: "Produk dan cabang wajib diisi." };
  if (!Number.isFinite(qty) || qty <= 0) return { error: "Jumlah harus lebih dari 0." };
  if (kind !== "IN" && kind !== "OUT") return { error: "Tipe mutasi tidak valid." };
  if (profile.role !== "owner" && profile.storeId !== p_store)
    return { error: "Hanya bisa di cabang Anda sendiri." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("adjust_stock", {
    p_id: product_id,
    delta: kind === "IN" ? qty : -qty,
    mtype: kind,
    reason,
    p_store,
  });
  if (error) return { error: error.message };

  revalidateStock([`/produk/${product_id}`]);
  return { ok: `Berhasil: ${kind === "IN" ? "+" : "−"}${qty}.` };
}

export async function requestStockChange(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAuth();
  const profile = await getProfile();
  const product_id = String(form.get("product_id") ?? "");
  const p_store = String(form.get("store_id") ?? profile.storeId ?? "");
  const delta = Math.floor(Number(form.get("delta") ?? 0));
  const reason = String(form.get("reason") ?? "").trim();

  if (!product_id || !p_store) return { error: "Produk dan cabang wajib diisi." };
  if (!delta || !Number.isFinite(delta)) return { error: "Selisih harus angka selain 0." };
  if (!reason) return { error: "Alasan wajib diisi." };
  if (profile.role !== "owner" && profile.storeId !== p_store)
    return { error: "Hanya bisa di cabang Anda sendiri." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("request_stock_change", {
    p_id: product_id,
    delta,
    p_type: "ADJUSTMENT",
    reason,
    p_store,
  });
  if (error) return { error: error.message };

  revalidatePath("/permintaan");
  return { ok: "Pengajuan terkirim. Menunggu persetujuan owner." };
}

export async function approveRequest(reqId: string): Promise<ActionResult> {
  const profile = await getProfile();
  if (assertOwner(profile)) return { error: "Hanya owner." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("review_stock_request", {
    req_id: reqId,
    approve: true,
    note: null,
  });
  if (error) return { error: error.message };

  revalidatePath("/permintaan");
  revalidateStock();
  return { ok: "Disetujui. Stok sudah diperbarui." };
}

export async function rejectRequest(reqId: string, note?: string): Promise<ActionResult> {
  const profile = await getProfile();
  if (assertOwner(profile)) return { error: "Hanya owner." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("review_stock_request", {
    req_id: reqId,
    approve: false,
    note: note ?? null,
  });
  if (error) return { error: error.message };

  revalidatePath("/permintaan");
  return { ok: "Ditolak." };
}

export async function transferStock(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const profile = await getProfile();
  if (assertOwner(profile)) return { error: "Hanya owner." };

  const product_id = String(form.get("product_id") ?? "");
  const from_loc = String(form.get("from_loc") ?? "");
  const to_loc = String(form.get("to_loc") ?? "");
  const qty = Math.floor(Number(form.get("qty") ?? 0));
  const reason = String(form.get("reason") ?? "").trim() || "Transfer antar cabang";

  if (!product_id || !from_loc || !to_loc) return { error: "Cabang asal dan tujuan wajib diisi." };
  if (from_loc === to_loc) return { error: "Cabang asal dan tujuan harus berbeda." };
  if (!Number.isFinite(qty) || qty <= 0) return { error: "Jumlah harus lebih dari 0." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("transfer_stock", {
    p_id: product_id,
    from_loc,
    to_loc,
    qty,
    reason,
  });
  if (error) return { error: error.message };

  revalidateStock([`/produk/${product_id}`]);
  return { ok: `Pindah ${qty} unit antar cabang.` };
}

export async function submitOpname(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  await requireAuth();
  const profile = await getProfile();
  const p_store = String(form.get("store_id") ?? profile.storeId ?? "");

  let items: { id: string; counted: number }[];
  try {
    items = JSON.parse(String(form.get("items") ?? "[]")) as { id: string; counted: number }[];
  } catch {
    return { error: "Data opname tidak valid." };
  }
  const clean = items.filter(
    (it) => it && typeof it.id === "string" && Number.isFinite(it.counted) && it.counted >= 0
  );
  if (clean.length === 0) return { error: "Tidak ada baris opname." };
  if (!p_store) return { error: "Cabang belum ditentukan." };
  if (profile.role !== "owner" && profile.storeId !== p_store)
    return { error: "Hanya bisa di cabang Anda sendiri." };

  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("submit_opname_batch", {
    items: clean,
    p_store,
  });
  if (error) return { error: error.message };

  revalidateStock();
  return profile.role === "owner"
    ? { ok: "Opname diterapkan ke stok." }
    : { ok: "Opname dikirim. Menunggu persetujuan owner." };
}
