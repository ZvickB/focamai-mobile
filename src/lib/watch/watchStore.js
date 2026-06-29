import { getSupabaseClient } from "../supabase";

export const MAX_PRICE_WATCHES = 5;

function normalizeText(value, maxLength = 1000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizePositiveNumber(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : null;
}

export function mapRowToWatch(row = {}) {
  return {
    activeCounted: true,
    amazonDomain: row.amazon_domain || "amazon.com",
    asin: row.asin || "",
    baselinePrice: Number(row.baseline_price),
    createdAt: row.created_at || "",
    id: row.id || "",
    imageUrl: row.image_url || "",
    lastCheckedAt: row.last_checked_at || null,
    lastNotifiedAt: row.last_notified_at || null,
    lastNotifiedPrice: row.last_notified_price == null ? null : Number(row.last_notified_price),
    lastSeenPrice: row.last_seen_price == null ? null : Number(row.last_seen_price),
    paused: Boolean(row.paused),
    productTitle: row.product_title || "",
    productUrl: row.product_url || "",
    targetPrice: row.target_price == null ? null : Number(row.target_price),
    thresholdPct: Number(row.threshold_pct),
    updatedAt: row.updated_at || "",
  };
}

export function mapWatchInputToRow(input = {}, userId) {
  const asin = normalizeText(input.asin, 200);
  const amazonDomain = normalizeText(input.amazonDomain || "amazon.com", 80) || "amazon.com";
  const baselinePrice = normalizePositiveNumber(input.baselinePrice);
  const thresholdPct = normalizePositiveNumber(input.thresholdPct ?? 5);
  const targetPrice = normalizePositiveNumber(input.targetPrice);

  if (!asin) throw new Error("This product cannot be watched because it is missing an ASIN.");
  if (!baselinePrice) throw new Error("This product needs a current price before Focamai can watch it.");
  if (!thresholdPct || thresholdPct > 100) {
    throw new Error("Price drop percentage must be between 1 and 100.");
  }

  return {
    amazon_domain: amazonDomain,
    asin,
    baseline_price: baselinePrice,
    image_url: normalizeText(input.imageUrl, 1000),
    product_title: normalizeText(input.productTitle, 300),
    product_url: normalizeText(input.productUrl, 1000),
    target_price: targetPrice,
    threshold_pct: thresholdPct,
    updated_at: new Date().toISOString(),
    user_id: userId,
  };
}

export function mapWatchPatchToRow(patch = {}) {
  const row = { updated_at: new Date().toISOString() };

  if (Object.prototype.hasOwnProperty.call(patch, "thresholdPct")) {
    const thresholdPct = normalizePositiveNumber(patch.thresholdPct);
    if (!thresholdPct || thresholdPct > 100) {
      throw new Error("Price drop percentage must be between 1 and 100.");
    }
    row.threshold_pct = thresholdPct;
  }

  if (Object.prototype.hasOwnProperty.call(patch, "targetPrice")) {
    row.target_price = normalizePositiveNumber(patch.targetPrice);
  }

  if (Object.prototype.hasOwnProperty.call(patch, "paused")) {
    row.paused = Boolean(patch.paused);
  }

  return row;
}

export function createPriceWatchStore({ client, userId }) {
  if (!client || !userId) throw new Error("A Supabase client and user id are required.");

  return {
    async list() {
      const { data, error } = await client
        .from("price_watches")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapRowToWatch);
    },

    async create(watchInput) {
      const row = mapWatchInputToRow(watchInput, userId);
      const existingQuery = await client
        .from("price_watches")
        .select("*")
        .eq("user_id", userId)
        .eq("asin", row.asin)
        .eq("amazon_domain", row.amazon_domain)
        .maybeSingle();
      if (existingQuery.error) throw existingQuery.error;
      if (existingQuery.data) return mapRowToWatch(existingQuery.data);

      const countQuery = await client
        .from("price_watches")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);
      if (countQuery.error) throw countQuery.error;
      if ((countQuery.count || 0) >= MAX_PRICE_WATCHES) {
        throw new Error(`You can watch up to ${MAX_PRICE_WATCHES} products for now.`);
      }

      const { data, error } = await client.from("price_watches").insert(row).select("*").single();
      if (error?.code === "23505") {
        const fallback = await client
          .from("price_watches")
          .select("*")
          .eq("user_id", userId)
          .eq("asin", row.asin)
          .eq("amazon_domain", row.amazon_domain)
          .single();
        if (fallback.error) throw fallback.error;
        return mapRowToWatch(fallback.data);
      }
      if (error) throw error;
      return mapRowToWatch(data);
    },

    async update(id, patch) {
      const normalizedId = normalizeText(id, 120);
      if (!normalizedId) throw new Error("Watch id is required.");
      const { data, error } = await client
        .from("price_watches")
        .update(mapWatchPatchToRow(patch))
        .eq("user_id", userId)
        .eq("id", normalizedId)
        .select("*")
        .single();
      if (error) throw error;
      return mapRowToWatch(data);
    },

    async remove(id) {
      const normalizedId = normalizeText(id, 120);
      if (!normalizedId) return;
      const { error } = await client
        .from("price_watches")
        .delete()
        .eq("user_id", userId)
        .eq("id", normalizedId);
      if (error) throw error;
    },
  };
}

async function getStore() {
  const client = getSupabaseClient();
  if (!client) throw new Error("Supabase auth is not configured.");
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data?.user?.id) throw new Error("Sign in to watch prices.");
  return createPriceWatchStore({ client, userId: data.user.id });
}

export const watchStore = {
  async list() { return (await getStore()).list(); },
  async create(watch) { return (await getStore()).create(watch); },
  async update(id, patch) { return (await getStore()).update(id, patch); },
  async remove(id) { return (await getStore()).remove(id); },
};
