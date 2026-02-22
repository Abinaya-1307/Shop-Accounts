// ============================================================
// SHOPTRACKER DATA MODELS
// ============================================================

/**
 * Item – The Inventory / Product Reference.
 * Stores the catalog of purchasable items and their last known price.
 */
export type Item = {
  id: string;                  // UUID
  name: string;                // e.g. "Ponni Rice"
  unit: string;                // e.g. "kg", "ltr", "packet"
  lastPrice: number;           // Price paid on last purchase
  lastPurchasedDate: string;   // ISO date string "2026-02-20"
  category: string;            // "Provisions", "Dairy", "Vegetables" etc.
};

/**
 * Transaction – The Ledger entry for every purchase made.
 * Links back to an Item and records price, quantity, and trend.
 */
export type Transaction = {
  id: string;
  itemId: string;              // FK → Item.id
  itemName: string;            // Denormalized copy for faster display
  pricePerUnit: number;
  quantity: number;
  totalCost: number;           // pricePerUnit × quantity
  unit: string;
  date: string;                // ISO date string
  priceTrend: 'increase' | 'decrease' | 'stable'; // vs last purchase
  shopId?: string;
  shopName?: string;
};

/**
 * Shop – Optional reference to where the purchase was made.
 */
export type Shop = {
  id: string;
  name: string;
};

/**
 * Payload for the addPurchase action on ShopContext.
 */
export type AddPurchasePayload = {
  id: string;
  date: string;
  item: Partial<Item> & { name: string };
  shop?: { id?: string; name?: string };
  pricePerUnit: number;
  quantity: number;
  totalCost: number;
  unit: string;
  priceTrend: 'increase' | 'decrease' | 'stable';
};
